'use client';

import React from 'react';
import { ProductDTO } from '../lib/api';
import { SupportedLanguage, TRANSLATIONS } from '../lib/i18n';
import { Lock, Sparkles, Tag, Barcode, EyeOff } from 'lucide-react';

interface ProductCardProps {
  product: ProductDTO;
  lang: SupportedLanguage;
  onUnlockClick: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  lang,
  onUnlockClick,
}) => {
  const t = TRANSLATIONS[lang];

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      {/* Top Banner: Product Thumbnail & Basic Information */}
      <div className="flex flex-col sm:flex-row gap-4 p-5">
        <div className="relative flex h-32 w-full sm:h-32 sm:w-32 shrink-0 items-center justify-center rounded-xl bg-zinc-100 p-2 dark:bg-zinc-800">
          {product.imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-contain"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-zinc-400">
              <EyeOff className="h-8 w-8" />
              <span className="mt-1 text-[10px]">No image</span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <Tag className="h-3.5 w-3.5" />
              <span>{product.brand || t.brandUnknown}</span>
            </div>
            <h3 className="mt-1 text-base font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2">
              {product.name}
            </h3>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1 rounded bg-zinc-100 px-2 py-0.5 font-mono dark:bg-zinc-800">
              <Barcode className="h-3 w-3" />
              {product.barcode}
            </span>
            {product.categories.slice(0, 3).map((cat, idx) => (
              <span
                key={idx}
                className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Ingredients Section */}
      <div className="border-t border-zinc-100 px-5 py-3 text-xs dark:border-zinc-800/80">
        <span className="font-semibold text-zinc-700 dark:text-zinc-300">
          {t.ingredientsLabel}:{' '}
        </span>
        <span className="text-zinc-500 dark:text-zinc-400 line-clamp-2">
          {product.ingredientsText || t.noIngredients}
        </span>
      </div>

      {/* Gating Boundary: Nutritional Facts or Paywalled Lock */}
      <div className="mt-auto border-t border-zinc-100 bg-zinc-50/50 p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            {t.nutritionTitle}
          </span>
          <span className="text-[11px] text-zinc-400">
            {t.nutritionPer100g}
          </span>
        </div>

        {product.isNutritionLocked || !product.nutriments ? (
          // Paywalled Lock View (Article IV Zero Nutritional Leaks: Payload is stripped on wire)
          <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-zinc-300 bg-zinc-100/70 p-5 text-center dark:border-zinc-700 dark:bg-zinc-800/40">
            {/* Blurred Mock Placeholders */}
            <div className="grid w-full grid-cols-4 gap-2 opacity-25 filter blur-xs select-none pointer-events-none">
              <div className="rounded bg-zinc-400 h-10"></div>
              <div className="rounded bg-zinc-400 h-10"></div>
              <div className="rounded bg-zinc-400 h-10"></div>
              <div className="rounded bg-zinc-400 h-10"></div>
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
              <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm">
                <Lock className="h-4 w-4" />
              </div>
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                {t.nutritionLockedTitle}
              </p>
              <button
                onClick={onUnlockClick}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-medium text-white shadow transition hover:bg-emerald-500"
              >
                <Sparkles className="h-3 w-3" />
                <span>{t.upgradeToPro}</span>
              </button>
            </div>
          </div>
        ) : (
          // Subscribed View (Delivers full unredacted nutritional facts)
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-lg border border-zinc-200 bg-white p-2 text-center dark:border-zinc-800 dark:bg-zinc-800/60">
              <span className="block text-[10px] uppercase font-medium text-zinc-400">{t.calories}</span>
              <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                {product.nutriments.calories !== null ? `${product.nutriments.calories} kcal` : '—'}
              </span>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-2 text-center dark:border-zinc-800 dark:bg-zinc-800/60">
              <span className="block text-[10px] uppercase font-medium text-zinc-400">{t.fat}</span>
              <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                {product.nutriments.fat !== null ? `${product.nutriments.fat}g` : '—'}
              </span>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-2 text-center dark:border-zinc-800 dark:bg-zinc-800/60">
              <span className="block text-[10px] uppercase font-medium text-zinc-400">{t.sugars}</span>
              <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                {product.nutriments.sugars !== null ? `${product.nutriments.sugars}g` : '—'}
              </span>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-2 text-center dark:border-zinc-800 dark:bg-zinc-800/60">
              <span className="block text-[10px] uppercase font-medium text-zinc-400">{t.proteins}</span>
              <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                {product.nutriments.proteins !== null ? `${product.nutriments.proteins}g` : '—'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};