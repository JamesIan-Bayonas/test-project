import request from 'supertest';
import axios from 'axios';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { SubscriptionStatus } from '@prisma/client';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('../src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    searchQuery: {
      create: jest.fn(),
    },
  },
}));

describe('Search Paywall & Nutritional Gating (Article IV Mandate)', () => {
  const mockOFFResponse = {
    data: {
      count: 1,
      products: [
        {
          code: '3017620422003',
          product_name_en: 'Hazelnut Spread',
          brands: 'Nutella',
          image_url: 'https://images.openfoodfacts.org/nutella.jpg',
          categories: 'Spreads, Sweet spreads',
          ingredients_text_en: 'Sugar, palm oil, hazelnuts (13%)',
          nutriments: {
            'energy-kcal_100g': 539,
            fat_100g: 30.9,
            carbohydrates_100g: 57.5,
            proteins_100g: 6.3,
            salt_100g: 0.107,
          },
        },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.get.mockResolvedValue(mockOFFResponse);
  });

  it('STRIPS nutriments and sets isNutritionLocked to true when user subscription is INACTIVE', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'demo-user-id-1',
      email: 'demo@foodsearch.io',
      subscriptionStatus: SubscriptionStatus.INACTIVE,
    });

    const response = await request(app).get('/api/search?q=hazelnut&lang=en');

    expect(response.status).toBe(200);
    expect(response.body.products).toHaveLength(1);

    const product = response.body.products[0];
    expect(product.name).toBe('Hazelnut Spread');
    expect(product.isNutritionLocked).toBe(true);
    // Zero Nutritional Leaks Assertion: Nutriments must be null on the network wire
    expect(product.nutriments).toBeNull();
  });

  it('EXPOSES nutriments and sets isNutritionLocked to false when user subscription is ACTIVE', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'demo-user-id-1',
      email: 'demo@foodsearch.io',
      subscriptionStatus: SubscriptionStatus.ACTIVE,
    });

    const response = await request(app).get('/api/search?q=hazelnut&lang=en');

    expect(response.status).toBe(200);
    expect(response.body.products).toHaveLength(1);

    const product = response.body.products[0];
    expect(product.name).toBe('Hazelnut Spread');
    expect(product.isNutritionLocked).toBe(false);
    expect(product.nutriments).not.toBeNull();
    expect(product.nutriments.calories).toBe(539);
    expect(product.nutriments.fat).toBe(30.9);
  });

  it('records search query asynchronously in MySQL', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'demo-user-id-1',
      email: 'demo@foodsearch.io',
      subscriptionStatus: SubscriptionStatus.INACTIVE,
    });

    await request(app).get('/api/search?q=almond&lang=nl');

    expect(prisma.searchQuery.create).toHaveBeenCalledWith({
      data: {
        userId: 'demo-user-id-1',
        query: 'almond',
        language: 'nl',
      },
    });
  });
});