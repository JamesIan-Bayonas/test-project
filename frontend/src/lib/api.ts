// frontend/src/lib/api.ts

import { SupportedLanguage } from './i18n';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000/api';

export interface NutritionalValues {
  calories: number | null;
  energyKj: number | null;
  fat: number | null;
  saturatedFat: number | null;
  carbohydrates: number | null;
  sugars: number | null;
  fiber: number | null;
  proteins: number | null;
  salt: number | null;
  sodium: number | null;
}

export interface ProductDTO {
  id: string;
  name: string;
  brand: string;
  imageUrl: string | null;
  barcode: string;
  categories: string[];
  ingredientsText: string | null;
  nutriments: NutritionalValues | null;
  isNutritionLocked: boolean;
}

export interface SearchResultResponse {
  query: string;
  language: SupportedLanguage;
  page: number;
  pageSize: number;
  totalCount: number;
  products: ProductDTO[];
}

export interface SubscriptionStatusResponse {
  userId: string;
  email: string;
  status: 'INACTIVE' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED';
  isActive: boolean;
  currentPeriodEnd: string | null;
}

export interface CheckoutResponse {
  url: string;
}

export async function searchProducts(
  query: string,
  lang: SupportedLanguage,
  page = 1,
  pageSize = 20
): Promise<SearchResultResponse> {
  const url = new URL(`${API_BASE_URL}/search`);
  url.searchParams.set('q', query);
  url.searchParams.set('lang', lang);
  url.searchParams.set('page', String(page));
  url.searchParams.set('pageSize', String(pageSize));

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || `Search request failed with HTTP ${res.status}`);
  }

  return res.json();
}

export async function fetchRecentSearches(): Promise<string[]> {
  const res = await fetch(`${API_BASE_URL}/search/history`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  return Array.isArray(data.history) ? data.history : [];
}

export async function fetchSubscriptionStatus(): Promise<SubscriptionStatusResponse> {
  const res = await fetch(`${API_BASE_URL}/subscription/status`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || `Failed to fetch subscription status: HTTP ${res.status}`);
  }

  return res.json();
}

export async function createCheckoutSession(): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/subscription/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || `Failed to create checkout session: HTTP ${res.status}`);
  }

  const data: CheckoutResponse = await res.json();
  return data.url;
}