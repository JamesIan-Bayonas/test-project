import { Request, Response, NextFunction } from 'express';
import { SearchService } from './search.service';
import { SearchQuerySchema } from './search.dto';
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';
import { SubscriptionStatus } from '@prisma/client';

const searchService = new SearchService();

export class SearchController {
  public async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedQuery = SearchQuerySchema.parse(req.query);

      // Resolve demo user state from database
      const user = await prisma.user.findUnique({
        where: { email: env.DEMO_USER_EMAIL },
      });

      if (!user) {
        res.status(404).json({
          error: 'UserNotFound',
          message: `Demo user with email '${env.DEMO_USER_EMAIL}' is not initialized. Run 'npm run prisma:seed'.`,
        });
        return;
      }

      // Check subscription canonical status
      const isSubscribed = user.subscriptionStatus === SubscriptionStatus.ACTIVE;

      const result = await searchService.searchProducts(
        user.id,
        validatedQuery.q,
        validatedQuery.lang,
        validatedQuery.page,
        validatedQuery.pageSize,
        isSubscribed
      );

      res.status(200).json(result);
    } catch (error: unknown) {
      next(error);
    }
  }
}