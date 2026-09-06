'use client';

import React from 'react';
import {
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  TRANSLATIONS,
} from '../lib/i18n';
import { SubscriptionStatusResponse } from '../lib/api';
import { Sparkles, Globe, ShieldCheck, Loader2 } from 'lucide-react';

interface HeaderProps {
  currentLang: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  subscription: SubscriptionStatusResponse | null;
  onUpgradeClick: () => void;
  isUpgrading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentLang,
  onLanguageChange,
  subscription,
  onUpgradeClick,
  isUpgrading,
}) => {
  const t = TRANSLATIONS[currentLang];
  const isPro = subscription?.isActive ?? false;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 font-bold text-white shadow-sm">
            FP
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {t.appTitle}
            </h1>
            <p className="hidden text-xs text-zinc-500 sm:block dark:text-zinc-400">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Controls: Language Switcher & Subscription State */}
        <div className="flex items-center gap-3">
          {/* 4-Language Selector */}
          <div className="relative flex items-center rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 dark:border-zinc-800 dark:bg-zinc-900">
            <Globe className="mr-1.5 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            <select
              value={currentLang}
              onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
              aria-label="Select Language"
              className="cursor-pointer bg-transparent text-sm font-medium text-zinc-800 outline-none dark:text-zinc-200"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="dark:bg-zinc-900">
                  {lang.flag} {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* Subscription Action Badge */}
          {isPro ? (
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/50 dark:text-emerald-400 dark:ring-emerald-500/30">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{t.statusPro}</span>
            </div>
          ) : (
            <button
              onClick={onUpgradeClick}
              disabled={isUpgrading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {isUpgrading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{t.subscribing}</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>{t.upgradeToPro}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};