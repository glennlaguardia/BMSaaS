'use client';

import { Sparkles } from 'lucide-react';

type PublicRateAdjustment = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  adjustment_type: string;
  adjustment_value: number;
  applies_to: string;
};

interface PromoBannerProps {
  adjustments: PublicRateAdjustment[];
}

export function PromoBanner({ adjustments }: PromoBannerProps) {
  if (!adjustments || adjustments.length === 0) return null;

  const primary = adjustments[0];

  const dateRange =
    primary.start_date && primary.end_date
      ? `${primary.start_date} – ${primary.end_date}`
      : undefined;

  const label =
    primary.adjustment_type === 'percentage_discount'
      ? `${primary.adjustment_value}% off selected stays`
      : primary.adjustment_type === 'fixed_override'
      ? 'Special promo rates available'
      : 'Special rates available';

  return (
    <section className="bg-terracotta-600/95 text-cream-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-cream-100/15 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-amber-200" />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] uppercase text-amber-200">
              Limited Offer
            </p>
            <p className="text-sm sm:text-base font-medium">
              {primary.name || 'Exclusive Promo'} &mdash; {label}
            </p>
            {dateRange && (
              <p className="text-xs text-cream-200/80 mt-0.5">
                {dateRange}
              </p>
            )}
          </div>
        </div>
        <p className="text-xs sm:text-sm text-cream-100/90">
          Secure your dates now to enjoy these special rates.
        </p>
      </div>
    </section>
  );
}

