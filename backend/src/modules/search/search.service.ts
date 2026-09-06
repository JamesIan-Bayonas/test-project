// backend/src/modules/search/search.service.ts

import axios, { AxiosError } from 'axios';
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';
import {
  SupportedLanguage,
  ProductDTO,
  SearchResultResponse,
  extractLocalizedField,
  extractNutriments,
} from './search.dto';

interface OffProductRaw extends Record<string, unknown> {
  code?: string;
  id?: string;
  product_name?: string;
  product_name_en?: string;
  product_name_nl?: string;
  product_name_de?: string;
  product_name_fr?: string;
  brands?: string;
  image_url?: string;
  image_front_url?: string;
  categories?: string;
  ingredients_text?: string;
  ingredients_text_en?: string;
  ingredients_text_nl?: string;
  ingredients_text_de?: string;
  ingredients_text_fr?: string;
  nutriments?: Record<string, unknown>;
}

interface OffApiResponse {
  count?: number;
  products?: OffProductRaw[];
}

const OPEN_FOOD_FACTS_BASE_URL = 'https://world.openfoodfacts.org/cgi/search.pl';

export class SearchService {
  public async searchProducts(
    userId: string,
    query: string,
    lang: SupportedLanguage,
    page: number,
    pageSize: number,
    isSubscribed: boolean
  ): Promise<SearchResultResponse> {
    await this.recordSearchHistory(userId, query, lang);

    const rawProductsData = await this.fetchWithRetry(query, lang, page, pageSize);

    const rawProducts: OffProductRaw[] = Array.isArray(rawProductsData.products)
      ? rawProductsData.products
      : [];
    const totalCount: number =
      typeof rawProductsData.count === 'number' ? rawProductsData.count : rawProducts.length;

    const products: ProductDTO[] = rawProducts.map((p, index) => {
      const barcode = String(p.code || p.id || `UNKNOWN_${index}`);
      const name = extractLocalizedField(p, 'product_name', lang, 'Unnamed Product');
      const brand =
        typeof p.brands === 'string' && p.brands.trim().length > 0 ? p.brands.trim() : 'Unknown Brand';
      const imageUrl =
        typeof p.image_url === 'string'
          ? p.image_url
          : typeof p.image_front_url === 'string'
          ? p.image_front_url
          : null;

      const ingredientsText = extractLocalizedField(p, 'ingredients_text', lang, '') || null;
      const categories =
        typeof p.categories === 'string'
          ? p.categories
              .split(',')
              .map((c) => c.trim())
              .filter((c) => c.length > 0)
          : [];

      // Wire Gating: Strips macro metrics completely if user is unverified/inactive
      const rawNutriments = extractNutriments(p.nutriments);
      const nutriments = isSubscribed ? rawNutriments : null;

      return {
        id: barcode,
        name,
        brand,
        imageUrl,
        barcode,
        categories,
        ingredientsText,
        nutriments,
        isNutritionLocked: !isSubscribed,
      };
    });

    return {
      query,
      language: lang,
      page,
      pageSize,
      totalCount,
      products,
    };
  }

  /**
   * Retrieves unique recent search queries ordered by timestamp
   */
  public async getRecentSearches(userId: string, limit = 6): Promise<string[]> {
    const records = await prisma.searchQuery.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit * 2,
      select: { query: true },
    });

    const unique: string[] = [];
    for (const record of records) {
      const normalized = record.query.trim();
      if (!unique.some((q) => q.toLowerCase() === normalized.toLowerCase())) {
        unique.push(normalized);
      }
      if (unique.length >= limit) break;
    }

    return unique;
  }

  private async fetchWithRetry(
    query: string,
    lang: SupportedLanguage,
    page: number,
    pageSize: number
  ): Promise<OffApiResponse> {
    const fields = [
      'code',
      'id',
      'product_name',
      'product_name_en',
      'product_name_nl',
      'product_name_de',
      'product_name_fr',
      'brands',
      'image_url',
      'image_front_url',
      'categories',
      'ingredients_text',
      'ingredients_text_en',
      'ingredients_text_nl',
      'ingredients_text_de',
      'ingredients_text_fr',
      'nutriments',
    ].join(',');

    const headers = {
      'User-Agent': `FoodSearchApp/1.0 (${env.DEMO_USER_EMAIL}; https://foodsearch.local)`,
      Accept: 'application/json',
    };

    const params = {
      search_terms: query,
      search_simple: 1,
      action: 'process',
      json: 1,
      page,
      page_size: pageSize,
      fields,
      lc: lang, // Prioritizes language-specific metadata from upstream index
    };

    try {
      const response = await axios.get<OffApiResponse>(OPEN_FOOD_FACTS_BASE_URL, {
        params,
        headers,
        timeout: 8000,
      });
      return response.data;
    } catch (err: unknown) {
      const axiosErr = err as AxiosError;
      console.warn(
        `[AEGIS SEARCH] Upstream error (${axiosErr.response?.status ?? axiosErr.message}). Retrying...`
      );

      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const retryResponse = await axios.get<OffApiResponse>(OPEN_FOOD_FACTS_BASE_URL, {
          params,
          headers,
          timeout: 10000,
        });
        return retryResponse.data;
      } catch (retryErr: unknown) {
        console.error(
          '[AEGIS SEARCH] Open Food Facts unavailable:',
          retryErr instanceof Error ? retryErr.message : retryErr
        );
        return { products: [], count: 0 };
      }
    }
  }

  private async recordSearchHistory(userId: string, query: string, language: string): Promise<void> {
    try {
      await prisma.searchQuery.create({
        data: {
          userId,
          query: query.slice(0, 255),
          language: language.slice(0, 5),
        },
      });
    } catch (error: unknown) {
      console.error(
        '[AEGIS SEARCH DB] Failed to record search history:',
        error instanceof Error ? error.message : error
      );
    }
  }
}