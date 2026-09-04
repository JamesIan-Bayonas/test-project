// backend/src/app.ts

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { ZodError } from 'zod';
import { env } from './config/env';
import { searchRouter } from './modules/search/search.routes';
import { subscriptionRouter } from './modules/subscription/subscription.routes';
import { SubscriptionWebhookHandler } from './modules/subscription/subscription.webhook';

export const app: Express = express();

const webhookHandler = new SubscriptionWebhookHandler();

// 1. CORS Configuration
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature'],
  })
);

// 2. Health Check
app.get('/api/health', (_req: Request, res: Response): void => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// 3. Raw Webhook Boundary (Article IV Requirement: Must intercept before express.json())
app.post(
  '/api/webhook',
  express.raw({ type: 'application/json' }),
  (req: Request, res: Response) => {
    void webhookHandler.handleWebhook(req, res);
  }
);

// 4. Standard Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 5. Application Routers
app.use('/api/search', searchRouter);
app.use('/api/subscription', subscriptionRouter);

// 6. Global Strict Error Handler (Article IX Type-Safe Narrowing)
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'ValidationError',
      details: err.issues,
    });
    return;
  }

  const message = err instanceof Error ? err.message : 'An unexpected server error occurred.';
  const stack = err instanceof Error ? err.stack : undefined;

  console.error('[AEGIS ERROR HANDLER]', stack || message);
  res.status(500).json({
    error: 'InternalServerError',
    message: env.NODE_ENV === 'production' ? 'An unexpected server error occurred.' : message,
  });
});