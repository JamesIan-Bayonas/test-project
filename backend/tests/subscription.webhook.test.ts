// backend/tests/subscription.webhook.test.ts

import request from 'supertest';
import { app } from '../src/app';
import { stripe } from '../src/lib/stripe';
import { prisma } from '../src/lib/prisma';
import { SubscriptionStatus } from '@prisma/client';

jest.mock('../src/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: jest.fn(),
    },
    subscriptions: {
      retrieve: jest.fn(),
    },
  },
}));

type MockPrismaClient = { 
  stripeEvent: {
    findUnique: jest.Mock;
    create: jest.Mock;
  };
  user: {
    findFirst: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
  };
  $transaction: jest.Mock;
};

jest.mock('../src/lib/prisma', () => {
  const mockPrisma: MockPrismaClient = {
    stripeEvent: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    // Execute callback immediately and pass mockPrisma as the transaction client (tx)
    $transaction: jest.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb(mockPrisma)),
  };

  return { prisma: mockPrisma };
});

describe('Stripe Webhook Handler Boundary (Article IV Security)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects requests missing stripe-signature header with HTTP 400', async () => {
    const response = await request(app)
      .post('/api/webhook')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ id: 'evt_test' }));

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Missing stripe-signature header');
  });

  it('rejects requests with invalid cryptographic signature with HTTP 400', async () => {
    (stripe.webhooks.constructEvent as jest.Mock).mockImplementation(() => {
      throw new Error('Signature verification failed');
    });

    const response = await request(app)
      .post('/api/webhook')
      .set('stripe-signature', 'invalid_sig')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ id: 'evt_test' }));

    expect(response.status).toBe(400);
    expect(response.text).toContain('Webhook Signature Verification Failed');
  });

  it('drops duplicate webhook deliveries idempotently without updating state', async () => {
    (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
      id: 'evt_duplicate_123',
      type: 'customer.subscription.updated',
      data: { object: {} },
    });

    (prisma.stripeEvent.findUnique as jest.Mock).mockResolvedValue({
      id: 'evt_duplicate_123',
      type: 'customer.subscription.updated',
      processedAt: new Date(),
    });

    const response = await request(app)
      .post('/api/webhook')
      .set('stripe-signature', 'valid_test_sig')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ id: 'evt_duplicate_123' }));

    expect(response.status).toBe(200);
    expect(response.body.idempotent).toBe(true);
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.stripeEvent.create).not.toHaveBeenCalled();
  });

  it('processes customer.subscription.updated and sets user status to ACTIVE', async () => {
    (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
      id: 'evt_new_456',
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_12345',
          customer: 'cus_67890',
          status: 'active',
          current_period_end: 1735689600,
        },
      },
    });

    (prisma.stripeEvent.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.findFirst as jest.Mock).mockResolvedValue({
      id: 'usr_abc',
      email: 'demo@foodsearch.io',
    });

    const response = await request(app)
      .post('/api/webhook')
      .set('stripe-signature', 'valid_test_sig')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ id: 'evt_new_456' }));

    expect(response.status).toBe(200);
    expect(response.body.received).toBe(true);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'usr_abc' },
      data: expect.objectContaining({
        stripeSubscriptionId: 'sub_12345',
        subscriptionStatus: SubscriptionStatus.ACTIVE,
      }),
    });

    expect(prisma.stripeEvent.create).toHaveBeenCalledWith({
      data: {
        id: 'evt_new_456',
        type: 'customer.subscription.updated',
        userId: null,
      },
    });
  });
});