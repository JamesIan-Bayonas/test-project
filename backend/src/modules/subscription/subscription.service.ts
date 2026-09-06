// backend/src/modules/subscription/subscription.service.ts

import Stripe from 'stripe';
import { prisma } from '../../lib/prisma';
import { stripe } from '../../lib/stripe';
import { env } from '../../config/env';
import { SubscriptionStatus } from '@prisma/client';

interface StripePeriodContainer {
  current_period_end?: number;
  billing_cycle_anchor?: number;
  items?: {
    data?: Array<{
      current_period_end?: number;
    }>;
  };
}

export class SubscriptionService {
  public async getOrCreateStripeCustomer(userId: string, email: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error(`User with ID ${userId} does not exist.`);
    }

    if (user.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    const customer = await stripe.customers.create({
      email,
      metadata: {
        userId,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    });

    return customer.id;
  }

  public async createCheckoutSession(userId: string, email: string): Promise<string> {
    const customerId = await this.getOrCreateStripeCustomer(userId, email);

    const lineItem: Stripe.Checkout.SessionCreateParams.LineItem =
      env.STRIPE_PRICE_ID && env.STRIPE_PRICE_ID !== 'price_monthly_dummy'
        ? {
            price: env.STRIPE_PRICE_ID,
            quantity: 1,
          }
        : {
            price_data: {
              currency: 'eur',
              product_data: {
                name: 'FoodSearch Pro (Nutritional Access)',
                description: 'Full unredacted access to nutritional data and macro metrics.',
              },
              unit_amount: 499,
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          };

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      client_reference_id: userId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [lineItem],
      success_url: `${env.FRONTEND_URL}/?session_id={CHECKOUT_SESSION_ID}&status=success`,
      cancel_url: `${env.FRONTEND_URL}/?status=cancelled`,
      metadata: {
        userId,
      },
      subscription_data: {
        metadata: {
          userId,
        },
      },
    });

    if (!session.url) {
      throw new Error('Failed to generate Stripe Checkout URL.');
    }

    return session.url;
  }

  public async getSubscriptionStatus(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        subscriptionStatus: true,
        subscriptionCurrentEnd: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
      },
    });

    if (!user) {
      throw new Error(`Demo user '${email}' not found. Ensure the database is seeded.`);
    }

    return {
      userId: user.id,
      email: user.email,
      status: user.subscriptionStatus,
      isActive: user.subscriptionStatus === SubscriptionStatus.ACTIVE,
      currentPeriodEnd: user.subscriptionCurrentEnd,
    };
  }

  public async syncSubscriptionStatus(
    subscription: Stripe.Subscription,
    txPrisma: typeof prisma = prisma
  ): Promise<void> {
    const customerId =
      typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer.id;

    const user = await txPrisma.user.findFirst({
      where: {
        OR: [{ stripeCustomerId: customerId }, { stripeSubscriptionId: subscription.id }],
      },
    });

    if (!user) {
      console.warn(`[AEGIS STRIPE SYNC] No user record matching customer ID ${customerId}`);
      return;
    }

    let status: SubscriptionStatus;

    switch (subscription.status) {
      case 'active':
        status = SubscriptionStatus.ACTIVE;
        break;
      case 'past_due':
        status = SubscriptionStatus.PAST_DUE;
        break;
      case 'canceled':
      case 'unpaid':
        status = SubscriptionStatus.CANCELED;
        break;
      default:
        status = SubscriptionStatus.INACTIVE;
        break;
    }

    const periodData = subscription as unknown as StripePeriodContainer;
    const periodEndTimestamp =
      periodData.current_period_end ??
      periodData.items?.data?.[0]?.current_period_end ??
      periodData.billing_cycle_anchor;

    const currentPeriodEnd = periodEndTimestamp ? new Date(periodEndTimestamp * 1000) : null;

    await txPrisma.user.update({
      where: { id: user.id },
      data: {
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: status,
        subscriptionCurrentEnd: currentPeriodEnd,
      },
    });
  }

  public async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
    txPrisma: typeof prisma = prisma
  ): Promise<void> {
    const customerId =
      typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer.id;

    await txPrisma.user.updateMany({
      where: {
        OR: [{ stripeCustomerId: customerId }, { stripeSubscriptionId: subscription.id }],
      },
      data: {
        subscriptionStatus: SubscriptionStatus.INACTIVE,
        stripeSubscriptionId: null,
        subscriptionCurrentEnd: null,
      },
    });
  }
}