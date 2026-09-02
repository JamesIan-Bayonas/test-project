import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { searchRouter } from './modules/search/search.routes';

export const app: Express = express();

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature'],
  })
);

app.get('/api/health', (_req: Request, res: Response): void => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// Stripe raw webhook boundary (to be wired to subscription.routes)
app.use(
  '/api/webhook',
  express.raw({ type: 'application/json' }),
  (req: Request, res: Response, next: NextFunction): void => {
    next();
  }
);

// Standard JSON parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount Application Routes
app.use('/api/search', searchRouter);

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction): void => {
  if (err.name === 'ZodError') {
    res.status(400).json({
      error: 'ValidationError',
      details: err.errors,
    });
    return;
  }

  console.error('[AEGIS ERROR HANDLER]', err.stack || err.message);
  res.status(500).json({
    error: 'InternalServerError',
    message: env.NODE_ENV === 'production' ? 'An unexpected server error occurred.' : err.message,
  });
});