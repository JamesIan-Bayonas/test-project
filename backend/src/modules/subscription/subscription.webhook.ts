// backend/src/modules/subscription/subscription.webhook.ts

import { Request, Response } from 'express';
import Stripe from 'stripe';
import { stripe } from '../../lib/stripe';
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';
import { SubscriptionService } from './subscription.service';

const subscriptionService = new SubscriptionService();

interface StripeInvoicePayload {
  subscription?: string | Stripe.Subscription | null;
  parent?: {
    subscription?: string | null;
  };
  lines?: {
    data?: Array<{
      subscription?: string | Stripe.Subscription | null;
    }>;
  };
}

function extractSubscriptionId(invoice: Stripe.Invoice): string | null {
  const payload = invoice as unknown as StripeInvoicePayload;

  if (typeof payload.subscription === 'string' && payload.subscription.length > 0) {
    return payload.subscription;
  }

  if (payload.subscription && typeof payload.subscription === 'object' && 'id' in payload.subscription) {
    return payload.subscription.id;
  }

  const lineSubscription = payload.lines?.data?.[0]?.subscription;
  if (typeof lineSubscription === 'string' && lineSubscription.length > 0) {
    return lineSubscription;
  }

  if (lineSubscription && typeof lineSubscription === 'object' && 'id' in lineSubscription) {
    return lineSubscription.id;
  }

  if (typeof payload.parent?.subscription === 'string' && payload.parent.subscription.length > 0) {
    return payload.parent.subscription;
  }

  return null;
}

export class SubscriptionWebhookHandler {
  public async handleWebhook(req: Request, res: Response): Promise<void> {
    const signature = req.headers['stripe-signature'];

    if (!signature || typeof signature !== 'string') {
      res.status(400).json({ error: 'Missing stripe-signature header' });
      return;
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, signature, env.STRIPE_WEBHOOK_SECRET);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown webhook verification error';
      console.error(`[AEGIS WEBHOOK ERROR] Signature verification failed: ${message}`);
      res.status(400).send(`Webhook Signature Verification Failed: ${message}`);
      return;
    }

    const existingEvent = await prisma.stripeEvent.findUnique({
      where: { id: event.id },
    });

    if (existingEvent) {
      res.status(200).json({ received: true, idempotent: true });
      return;
    }

    try {
      let resolvedSubscription: Stripe.Subscription | null = null;
      let targetUserId: string | null = null;

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        targetUserId = session.client_reference_id || (session.metadata?.userId ?? null);
        if (session.subscription && typeof session.subscription === 'string') {
          resolvedSubscription = await stripe.subscriptions.retrieve(session.subscription);
        }
      } else if (
        event.type === 'customer.subscription.created' ||
        event.type === 'customer.subscription.updated' ||
        event.type === 'customer.subscription.deleted'
      ) {
        resolvedSubscription = event.data.object as Stripe.Subscription;
        targetUserId = resolvedSubscription.metadata?.userId ?? null;
      } else if (event.type === 'invoice.payment_failed') {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = extractSubscriptionId(invoice);
        if (subscriptionId) {
          resolvedSubscription = await stripe.subscriptions.retrieve(subscriptionId);
          targetUserId = resolvedSubscription.metadata?.userId ?? null;
        }
      }

      await prisma.$transaction(async (tx) => {
        const txPrisma = tx as typeof prisma;

        if (event.type === 'customer.subscription.deleted') {
          if (resolvedSubscription) {
            await subscriptionService.handleSubscriptionDeleted(resolvedSubscription, txPrisma);
          }
        } else if (resolvedSubscription) {
          await subscriptionService.syncSubscriptionStatus(resolvedSubscription, txPrisma);
        }

        await tx.stripeEvent.create({
          data: {
            id: event.id,
            type: event.type,
            userId: targetUserId,
          },
        });
      });

      res.status(200).json({ received: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown processing error';
      console.error(`[AEGIS WEBHOOK ERROR] Failed processing ${event.type}:`, message);
      res.status(500).json({ error: 'Webhook processing failed', details: message });
    }
  }
}