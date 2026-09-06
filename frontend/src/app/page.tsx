'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  searchProducts,
  fetchSubscriptionStatus,
  createCheckoutSession,
  ProductDTO,
  SubscriptionStatusResponse,
} from '../lib/api';
import { SupportedLanguage, TRANSLATIONS } from '../lib/i18n';
import { Header } from '../components/Header';
import { ProductCard } from '../components/ProductCard';
import { PaywallModal } from '../components/PaywallModal';
import { Search, Loader2, History, AlertCircle, CheckCircle2, X } from 'lucide-react';

function SearchAppContent() {
  const searchParams = useSearchParams();

  // State Containers
  const [lang, setLang] = useState<SupportedLanguage>('en');
  const [query, setQuery] = useState<string>('');
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Subscription State
  const [subscription, setSubscription] = useState<SubscriptionStatusResponse | null>(null);
  const [isUpgrading, setIsUpgrading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [dismissedStatus, setDismissedStatus] = useState<string | null>(null);

  const t = TRANSLATIONS[lang];

  // Derive Toast Notification from URL params (Zero synchronous setState inside useEffect)
  const urlStatus = searchParams.get('status');
  const activeToast =
    urlStatus && urlStatus !== dismissedStatus
      ? urlStatus === 'success'
        ? {
            title: t.paymentSuccessTitle,
            desc: t.paymentSuccessDesc,
            type: 'success' as const,
          }
        : urlStatus === 'cancelled'
        ? {
            title: t.paymentCancelTitle,
            desc: t.paymentCancelDesc,
            type: 'info' as const,
          }
        : null
      : null;

  // Asynchronous external data synchronization with cleanup
  useEffect(() => {
    let isSubscribed = true;

    fetchSubscriptionStatus()
      .then((data) => {
        if (isSubscribed) {
          setSubscription(data);
        }
      })
      .catch((err: unknown) => {
        console.error('[AEGIS CLIENT] Failed to fetch subscription status:', err);
      });

    return () => {
      isSubscribed = false;
    };
  }, [urlStatus]);

  // Execute Search
  const handleSearch = async (searchTerm: string, activeLang: SupportedLanguage) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const res = await searchProducts(trimmed, activeLang);
      setProducts(res.products);

      setRecentSearches((prev) => {
        const filtered = prev.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
        return [trimmed, ...filtered].slice(0, 6);
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error executing search';
      setError(msg);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query, lang);
  };

  // Trigger Stripe Checkout
  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const checkoutUrl = await createCheckoutSession();
      window.location.href = checkoutUrl;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to redirect to Stripe';
      alert(msg);
      setIsUpgrading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 flex flex-col">
      <Header
        currentLang={lang}
        onLanguageChange={(newLang) => {
          setLang(newLang);
          if (query.trim()) {
            handleSearch(query, newLang);
          }
        }}
        subscription={subscription}
        onUpgradeClick={() => setIsModalOpen(true)}
        isUpgrading={isUpgrading}
      />

      {/* Checkout Notification Toast */}
      {activeToast && (
        <div className="mx-auto mt-4 w-full max-w-xl px-4">
          <div
            className={`flex items-start justify-between rounded-xl border p-4 shadow-sm ${
              activeToast.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200'
                : 'border-zinc-200 bg-white text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <h4 className="text-sm font-semibold">{activeToast.title}</h4>
                <p className="text-xs opacity-90">{activeToast.desc}</p>
              </div>
            </div>
            <button
              onClick={() => setDismissedStatus(urlStatus)}
              className="rounded p-1 opacity-60 hover:opacity-100"
              aria-label="Dismiss toast"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Search Experience */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {/* Search Bar Container */}
        <section className="mx-auto max-w-2xl text-center">
          <form onSubmit={onSubmit} className="relative mt-4 flex items-center">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full rounded-2xl border border-zinc-200 bg-white py-4 pl-12 pr-28 text-sm shadow-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t.searchButton}
            </button>
          </form>

          {/* Recent Searches Tags */}
          {recentSearches.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <span className="flex items-center gap-1 text-xs text-zinc-400">
                <History className="h-3 w-3" />
                {t.recentSearches}:
              </span>
              {recentSearches.map((term, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(term);
                    handleSearch(term, lang);
                  }}
                  className="rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-xs text-zinc-600 transition hover:border-emerald-600 hover:text-emerald-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                >
                  {term}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Error Notification */}
        {error && (
          <div className="mx-auto mt-8 flex max-w-md items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="mt-16 flex flex-col items-center justify-center text-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            <p className="mt-2 text-xs text-zinc-500">{t.searching}</p>
          </div>
        )}

        {/* Results Grid */}
        {!isLoading && products.length > 0 && (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                lang={lang}
                onUnlockClick={() => setIsModalOpen(true)}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && hasSearched && products.length === 0 && !error && (
          <div className="mt-16 flex flex-col items-center justify-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {t.noProductsFound}
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              {t.noProductsFoundDesc}
            </p>
          </div>
        )}
      </main>

      <PaywallModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpgrade={handleUpgrade}
        isUpgrading={isUpgrading}
        lang={lang}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading FoodSearch...</div>}>
      <SearchAppContent />
    </Suspense>
  );
}