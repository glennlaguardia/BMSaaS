import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Users, Maximize, ArrowRight } from 'lucide-react';
import { formatPHP } from '@/lib/pricing';
import type { AccommodationType } from '@/types';

interface AccommodationsProps {
  content: {
    heading?: string;
    subtitle?: string;
  };
  types: AccommodationType[];
}

export function Accommodations({ content, types }: AccommodationsProps) {
  return (
    <section id="accommodations" className="py-24 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-amber-300 font-body font-semibold tracking-[0.2em] uppercase text-xs mb-4">
            Accommodations
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-forest-500 leading-[1.15] tracking-tight">
            {content.heading || 'Our Accommodations'}
          </h2>
          <p className="text-forest-500/50 mt-4 text-[15px] leading-relaxed">
            {content.subtitle || 'Choose your highland retreat'}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 stagger-children">
          {types.map((type) => {
            const amenities = (type.amenities as string[]) || [];
            return (
              <div
                key={type.id}
                className="group rounded-2xl overflow-hidden bg-white border border-forest-100/40 shadow-sm hover:shadow-lg hover:border-forest-100/60 transition-all duration-500"
              >
                {/* Image placeholder */}
                <div className="h-60 bg-gradient-to-br from-forest-500/10 via-forest-500/5 to-amber-300/10 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,_var(--tw-gradient-stops))] from-amber-300/5 to-transparent" />
                  <div className="text-center relative z-10">
                    <div className="w-16 h-16 rounded-full bg-forest-500/10 flex items-center justify-center mx-auto mb-3">
                      <span className="font-display text-2xl text-forest-500/40">
                        {type.name.charAt(0)}
                      </span>
                    </div>
                    <p className="text-xs text-forest-500/30 font-medium tracking-wider uppercase">Photos coming soon</p>
                  </div>
                </div>

                <div className="p-6 lg:p-7">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-xl font-semibold text-forest-500">
                      {type.name}
                    </h3>
                    <span className="text-sm font-semibold text-amber-400 whitespace-nowrap bg-amber-50/80 px-3 py-1 rounded-full">
                      {formatPHP(Math.min(type.base_rate_weekday, type.base_rate_weekend))}
                    </span>
                  </div>

                  <p className="text-forest-500/50 text-sm mt-3 line-clamp-2 leading-relaxed">
                    {type.short_description || type.description || ''}
                  </p>

                  <div className="flex items-center gap-5 mt-5 text-sm text-forest-500/50">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-amber-400" />
                      {type.base_pax}&ndash;{type.max_pax} guests
                    </span>
                    {type.size_sqm && (
                      <span className="flex items-center gap-1.5">
                        <Maximize className="w-4 h-4 text-amber-400" />
                        {type.size_sqm} sqm
                      </span>
                    )}
                  </div>

                  {/* Amenity tags */}
                  <div className="flex flex-wrap gap-1.5 mt-5">
                    {amenities.slice(0, 5).map((amenity) => (
                      <span
                        key={amenity}
                        className="px-2.5 py-1 bg-cream-100 text-forest-500/60 text-xs rounded-full font-medium"
                      >
                        {amenity}
                      </span>
                    ))}
                    {amenities.length > 5 && (
                      <span className="px-2.5 py-1 bg-forest-50 text-forest-500/40 text-xs rounded-full">
                        +{amenities.length - 5} more
                      </span>
                    )}
                  </div>

                  <Button
                    asChild
                    className="w-full mt-6 rounded-full font-semibold group/btn"
                  >
                    <Link href="/book" className="flex items-center justify-center gap-2">
                      Book This Room
                      <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
