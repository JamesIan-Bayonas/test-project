import { Request, Response, NextFunction } from 'express';
import { SubscriptionService } from './subscription.service';
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';

const subscriptionService = new SubscriptionService();

export class SubscriptionController {
  /**
   * Initiates Checkout Session for the default seeded Demo User.
   */
  public async createCheckout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { email: env.DEMO_USER_EMAIL },
      });

      if (!user) {
        res.status(404).json({
          error: 'UserNotFound',
          message: `Demo user '${env.DEMO_USER_EMAIL}' is not seeded.`,
        });
        return;
      }

      const checkoutUrl = await subscriptionService.createCheckoutSession(user.id, user.email);

      res.status(200).json({
        url: checkoutUrl,
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * Fetches current subscription status for the demo user.
   */
  public async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = await subscriptionService.getSubscriptionStatus(env.DEMO_USER_EMAIL);
      res.status(200).json(status);
    } catch (error: unknown) {
      next(error);
    }
  }
}