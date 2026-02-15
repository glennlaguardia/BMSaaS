import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight } from 'lucide-react';
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
    <section id="pricing" className="py-24 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-amber-300 font-body font-semibold tracking-[0.2em] uppercase text-xs mb-4">
            Pricing
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-forest-500 leading-[1.15] tracking-tight">
            {content.heading || 'Rates & Pricing'}
          </h2>
          <p className="text-forest-500/50 mt-4 text-[15px]">
            {content.subtitle || 'Transparent pricing'}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 stagger-children">
          {types.map((type) => {
            const inclusions = (type.inclusions as string[]) || [];
            const hasWeekendDiff = type.base_rate_weekday !== type.base_rate_weekend;
            return (
              <div
                key={type.id}
                className="group rounded-2xl border border-forest-100/40 p-6 hover:border-forest-500/20 flex flex-col bg-white card-lift"
              >
                <h3 className="font-display font-semibold text-forest-500 text-lg">{type.name}</h3>
                <div className="mt-4">
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-3xl font-semibold text-forest-700">
                      {formatPHP(type.base_rate_weekday)}
                    </span>
                    <span className="text-sm text-forest-500/40 font-medium">/night</span>
                  </div>
                  {hasWeekendDiff && (
                    <p className="text-xs text-forest-500/35 mt-1 font-medium">
                      Weekend: {formatPHP(type.base_rate_weekend)}/night
                    </p>
                  )}
                </div>

                <p className="text-sm text-forest-500/45 mt-3 font-medium">
                  Base {type.base_pax} guests &middot; Max {type.max_pax} guests
                </p>
                {type.additional_pax_fee > 0 && (
                  <p className="text-xs text-forest-500/35">
                    +{formatPHP(type.additional_pax_fee)} per extra guest
                  </p>
                )}

                <div className="mt-5 space-y-2.5 flex-1">
                  {inclusions.slice(0, 5).map((item) => (
                    <div key={item} className="flex items-start gap-2.5 text-sm text-forest-500/60">
                      <div className="w-4 h-4 rounded-full bg-forest-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 text-forest-500" />
                      </div>
                      <span>{item}</span>
                    </div>
                  ))}
                  {inclusions.length > 5 && (
                    <p className="text-xs text-forest-500/30 pl-6 font-medium">
                      +{inclusions.length - 5} more inclusions
                    </p>
                  )}
                </div>

                <Button
                  asChild
                  variant="outline"
                  className="w-full mt-6 rounded-full font-semibold group/btn hover:bg-forest-500 hover:text-white hover:border-forest-500 transition-all duration-300"
                >
                  <Link href="/book" className="flex items-center justify-center gap-2">
                    Reserve
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>

        {content.day_tour_note && (
          <div className="mt-12 text-center">
            <p className="inline-block bg-cream-100 text-forest-500 px-7 py-3.5 rounded-full text-sm font-medium border border-forest-100/20">
              {content.day_tour_note}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
