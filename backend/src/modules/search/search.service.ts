import axios from 'axios';
import { prisma } from '../../lib/prisma';
import {
  SupportedLanguage,
  ProductDTO,
  SearchResultResponse,
  extractLocalizedField,
  extractNutriments,
} from './search.dto';

const OPEN_FOOD_FACTS_BASE_URL = 'https://world.openfoodfacts.org/cgi/search.pl';

export class SearchService {
  /**
   * Fetches packaged products from Open Food Facts, maps them through defensive DTOs,
   * enforces server-side nutrition gating based on subscription status,
   * and records the search term in MySQL.
   */
  public async searchProducts(
    userId: string,
    query: string,
    lang: SupportedLanguage,
    page: number,
    pageSize: number,
    isSubscribed: boolean
  ): Promise<SearchResultResponse> {
    // 1. Persist search query per assignment specification
    await this.recordSearchHistory(userId, query, lang);

    // 2. Query Open Food Facts Search API
    const response = await axios.get(OPEN_FOOD_FACTS_BASE_URL, {
      params: {
        search_terms: query,
        search_simple: 1,
        action: 'process',
        json: 1,
        page,
        page_size: pageSize,
        // Restrict fields to minimize payload overhead
        fields: [
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
        ].join(','),
      },
      headers: {
        'User-Agent': 'FoodSearchApp - AssignmentTechnicalTest - Version 1.0',
      },
      timeout: 10000,
    });

    const rawData = response.data;
    const rawProducts: Record<string, unknown>[] = Array.isArray(rawData.products) ? rawData.products : [];
    const totalCount: number = typeof rawData.count === 'number' ? rawData.count : rawProducts.length;

    // 3. Map, localize, and apply server-side gating (Article IV)
    const products: ProductDTO[] = rawProducts.map((p, index) => {
      const barcode = String(p.code || p.id || `UNKNOWN_${index}`);
      const name = extractLocalizedField(p, 'product_name', lang, 'Unnamed Product');
      const brand = typeof p.brands === 'string' && p.brands.trim().length > 0 ? p.brands.trim() : 'Unknown Brand';
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

      // Article IV Zero Nutritional Leaks:
      // Strip detailed nutrition values if user is not actively subscribed.
      const rawNutriments = extractNutriments(p.nutriments as Record<string, unknown> | undefined);
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
      // Non-blocking logger: failed search recording must not fail product delivery to the user
      console.error('[AEGIS SEARCH DB] Failed to record search history:', error);
    }
  }
}