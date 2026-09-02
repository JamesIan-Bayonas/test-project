import { z } from 'zod';

export type SupportedLanguage = 'en' | 'nl' | 'de' | 'fr';

export const SearchQuerySchema = z.object({
  q: z.string().trim().min(1, 'Search term cannot be empty'),
  lang: z.enum(['en', 'nl', 'de', 'fr']).default('en'),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(20),
});

export type SearchQueryParams = z.infer<typeof SearchQuerySchema>;

export interface NutritionalValues {
  calories: number | null; // kcal per 100g
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

/**
 * Executes a deterministic 4-language fallback cascade (Article V):
 * 1. Target locale field (e.g. product_name_nl)
 * 2. English canonical field (product_name_en)
 * 3. Root generic field (product_name)
 * 4. Fallback default string
 */
export function extractLocalizedField(
  rawProduct: Record<string, unknown>,
  baseFieldName: string,
  lang: SupportedLanguage,
  fallback = ''
): string {
  const localizedKey = `${baseFieldName}_${lang}`;
  const englishKey = `${baseFieldName}_en`;

  const localizedVal = rawProduct[localizedKey];
  if (typeof localizedVal === 'string' && localizedVal.trim().length > 0) {
    return localizedVal.trim();
  }

  const englishVal = rawProduct[englishKey];
  if (typeof englishVal === 'string' && englishVal.trim().length > 0) {
    return englishVal.trim();
  }

  const baseVal = rawProduct[baseFieldName];
  if (typeof baseVal === 'string' && baseVal.trim().length > 0) {
    return baseVal.trim();
  }

  return fallback;
}

/**
 * Defensive parsing for Open Food Facts nutriments dictionary.
 * Sanitizes null, string numbers, or absent values into clean numbers or null.
 */
export function extractNutriments(rawNutriments: Record<string, unknown> | undefined): NutritionalValues {
  if (!rawNutriments || typeof rawNutriments !== 'object') {
    return {
      calories: null,
      energyKj: null,
      fat: null,
      saturatedFat: null,
      carbohydrates: null,
      sugars: null,
      fiber: null,
      proteins: null,
      salt: null,
      sodium: null,
    };
  }

  const parseNum = (val: unknown): number | null => {
    if (val === undefined || val === null || val === '') return null;
    const n = Number(val);
    return isNaN(n) ? null : Math.round(n * 100) / 100;
  };

  const calories =
    parseNum(rawNutriments['energy-kcal_100g']) ??
    parseNum(rawNutriments['energy-kcal_value']) ??
    parseNum(rawNutriments['energy-kcal']);

  return {
    calories,
    energyKj: parseNum(rawNutriments['energy-kj_100g']) ?? parseNum(rawNutriments['energy_100g']),
    fat: parseNum(rawNutriments['fat_100g']),
    saturatedFat: parseNum(rawNutriments['saturated-fat_100g']),
    carbohydrates: parseNum(rawNutriments['carbohydrates_100g']),
    sugars: parseNum(rawNutriments['sugars_100g']),
    fiber: parseNum(rawNutriments['fiber_100g']),
    proteins: parseNum(rawNutriments['proteins_100g']),
    salt: parseNum(rawNutriments['salt_100g']),
    sodium: parseNum(rawNutriments['sodium_100g']),
  };
}