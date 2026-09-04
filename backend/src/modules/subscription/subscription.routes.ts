import { Router } from 'express';
import { SubscriptionController } from './subscription.controller';

const router = Router();
const controller = new SubscriptionController();

// GET /api/subscription/status - Check demo user subscription state
router.get('/status', (req, res, next) => controller.getStatus(req, res, next));

// POST /api/subscription/checkout - Create checkout session
router.post('/checkout', (req, res, next) => controller.createCheckout(req, res, next));

export const subscriptionRouter = router;