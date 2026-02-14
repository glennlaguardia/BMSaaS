import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { formatPHP } from '@/lib/pricing';
import type { AccommodationType } from '@/types';

interface PricingProps {
  content: {
    heading?: string;
    subtitle?: string;
    day_tour_note?: string;
  };
  types: AccommodationType[];
}

export function Pricing({ content, types }: PricingProps) {
  return (
    <section id="pricing" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-[#D4A574] font-medium tracking-[0.15em] uppercase text-xs mb-3">
            Pricing
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#2D5016]">
            {content.heading || 'Rates & Pricing'}
          </h2>
          <p className="text-stone-500 mt-3">
            {content.subtitle || 'Transparent pricing'}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {types.map((type) => {
            const inclusions = (type.inclusions as string[]) || [];
            const hasWeekendDiff = type.base_rate_weekday !== type.base_rate_weekend;
            return (
              <div
                key={type.id}
                className="rounded-2xl border border-stone-200 p-6 hover:border-[#2D5016]/30 transition-colors flex flex-col"
              >
                <h3 className="font-bold text-[#2D5016] text-lg">{type.name}</h3>
                <div className="mt-3">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-zinc-900">
                      {formatPHP(type.base_rate_weekday)}
                    </span>
                    <span className="text-sm text-stone-500">/night</span>
                  </div>
                  {hasWeekendDiff && (
                    <p className="text-xs text-stone-400 mt-0.5">
                      Weekend: {formatPHP(type.base_rate_weekend)}/night
                    </p>
                  )}
                </div>

                <p className="text-sm text-stone-500 mt-2">
                  Base {type.base_pax} guests · Max {type.max_pax} guests
                </p>
                {type.additional_pax_fee > 0 && (
                  <p className="text-xs text-stone-400">
                    +{formatPHP(type.additional_pax_fee)} per extra guest
                  </p>
                )}

                <div className="mt-4 space-y-2 flex-1">
                  {inclusions.slice(0, 5).map((item) => (
                    <div key={item} className="flex items-start gap-2 text-sm text-stone-600">
                      <Check className="w-4 h-4 text-[#2D5016] mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                  {inclusions.length > 5 && (
                    <p className="text-xs text-stone-400 pl-6">
                      +{inclusions.length - 5} more inclusions
                    </p>
                  )}
                </div>

                <Button
                  asChild
                  variant="outline"
                  className="w-full mt-5 border-[#2D5016] text-[#2D5016] hover:bg-[#2D5016] hover:text-white rounded-full"
                >
                  <Link href="/book">Book Now</Link>
                </Button>
              </div>
            );
          })}
        </div>

        {content.day_tour_note && (
          <div className="mt-10 text-center">
            <p className="inline-block bg-[#F5F0E8] text-[#2D5016] px-6 py-3 rounded-full text-sm font-medium">
              {content.day_tour_note}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
