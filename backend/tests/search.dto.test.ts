import {
  extractLocalizedField,
  extractNutriments,
  SearchQuerySchema,
  SupportedLanguage,
} from '../src/modules/search/search.dto';

describe('Search DTO & Localization Logic (Article V Resilience)', () => {
  describe('extractLocalizedField', () => {
    const mockProduct = {
      product_name_en: 'Organic Almond Milk',
      product_name_nl: 'Biologische Amandelmelk',
      product_name_de: 'Bio Mandelmilch',
      product_name: 'Generic Almond Milk',
    };

    it('returns requested language when present', () => {
      const result = extractLocalizedField(mockProduct, 'product_name', 'de');
      expect(result).toBe('Bio Mandelmilch');
    });

    it('falls back to English when the requested language is missing', () => {
      const productWithoutFrench = { ...mockProduct };
      const result = extractLocalizedField(productWithoutFrench, 'product_name', 'fr');
      expect(result).toBe('Organic Almond Milk');
    });

    it('falls back to root generic field when both target language and English are missing', () => {
      const productRootOnly = { product_name: 'Base Nut Milk' };
      const result = extractLocalizedField(productRootOnly, 'product_name', 'nl');
      expect(result).toBe('Base Nut Milk');
    });

    it('falls back to default fallback parameter when no field candidates exist', () => {
      const emptyProduct = {};
      const result = extractLocalizedField(emptyProduct, 'product_name', 'en', 'Fallback Name');
      expect(result).toBe('Fallback Name');
    });
  });

  describe('extractNutriments', () => {
    it('defensively extracts and sanitizes valid nutritional metrics', () => {
      const rawNutriments = {
        'energy-kcal_100g': 45.2,
        'energy-kj_100g': 188,
        fat_100g: 2.5,
        'saturated-fat_100g': 0.3,
        carbohydrates_100g: 3.8,
        sugars_100g: '2.4',
        fiber_100g: 0.5,
        proteins_100g: 1.1,
        salt_100g: 0.12,
        sodium_100g: 0.048,
      };

      const parsed = extractNutriments(rawNutriments);

      expect(parsed.calories).toBe(45.2);
      expect(parsed.energyKj).toBe(188);
      expect(parsed.sugars).toBe(2.4);
      expect(parsed.fat).toBe(2.5);
      expect(parsed.salt).toBe(0.12);
    });

    it('returns null fields without throwing when given an empty or malformed object', () => {
      const parsed = extractNutriments(undefined);

      expect(parsed.calories).toBeNull();
      expect(parsed.fat).toBeNull();
      expect(parsed.carbohydrates).toBeNull();
      expect(parsed.proteins).toBeNull();
    });

    it('handles non-numeric or blank strings gracefully', () => {
      const rawNutriments = {
        'energy-kcal_100g': 'invalid_num',
        fat_100g: '',
      };

      const parsed = extractNutriments(rawNutriments);

      expect(parsed.calories).toBeNull();
      expect(parsed.fat).toBeNull();
    });
  });

  describe('SearchQuerySchema (Zod Input Validation)', () => {
    it('parses valid search parameters and applies defaults', () => {
      const parsed = SearchQuerySchema.parse({ q: 'oat milk' });

      expect(parsed.q).toBe('oat milk');
      expect(parsed.lang).toBe('en');
      expect(parsed.page).toBe(1);
      expect(parsed.pageSize).toBe(20);
    });

    it('rejects queries with empty strings', () => {
      expect(() => SearchQuerySchema.parse({ q: '   ' })).toThrow();
    });

    it('rejects unsupported language identifiers', () => {
      expect(() =>
        SearchQuerySchema.parse({ q: 'oat milk', lang: 'es' as SupportedLanguage })
      ).toThrow();
    });
  });
});