'use client';

import React from 'react';
import { SupportedLanguage, TRANSLATIONS } from '../lib/i18n';
import { Lock, Sparkles, Check, X, Loader2 } from 'lucide-react';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  isUpgrading: boolean;
  lang: SupportedLanguage;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  onUpgrade,
  isUpgrading,
  lang,
}) => {
  if (!isOpen) return null;

  const t = TRANSLATIONS[lang];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
            <Lock className="h-7 w-7" />
          </div>

          <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t.nutritionLockedTitle}
          </h3>

          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {t.nutritionLockedDesc}
          </p>

          <div className="my-6 w-full space-y-2 rounded-xl bg-zinc-50 p-4 text-left text-xs font-medium text-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-300">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600" />
              <span>Unredacted macro metrics (Calories, Fats, Sugars)</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600" />
              <span>Full sodium, dietary fiber, and protein data</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600" />
              <span>Direct Open Food Facts synchronization</span>
            </div>
          </div>

          <button
            onClick={onUpgrade}
            disabled={isUpgrading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-500 disabled:opacity-60"
          >
            {isUpgrading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t.subscribing}</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>{t.upgradeToPro}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};