import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Maximize, Star } from 'lucide-react';
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
    <section id="accommodations" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-[#D4A574] font-medium tracking-[0.15em] uppercase text-xs mb-3">
            Accommodations
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#2D5016]">
            {content.heading || 'Our Accommodations'}
          </h2>
          <p className="text-stone-500 mt-3">
            {content.subtitle || 'Choose your highland retreat'}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {types.map((type) => {
            const amenities = (type.amenities as string[]) || [];
            return (
              <div
                key={type.id}
                className="group rounded-2xl overflow-hidden border border-stone-200 bg-white shadow-sm hover:shadow-md transition-all"
              >
                {/* Image placeholder */}
                <div className="h-56 bg-gradient-to-br from-[#2D5016]/20 to-[#D4A574]/20 flex items-center justify-center">
                  <div className="text-center">
                    <Star className="w-8 h-8 text-[#D4A574] mx-auto mb-2" />
                    <p className="text-sm text-stone-400">Photos coming soon</p>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-xl font-bold text-[#2D5016]">
                      {type.name}
                    </h3>
                    <Badge variant="outline" className="text-[#2D5016] border-[#2D5016]/30 whitespace-nowrap">
                      From {formatPHP(Math.min(type.base_rate_weekday, type.base_rate_weekend))}
                    </Badge>
                  </div>

                  <p className="text-stone-500 text-sm mt-2 line-clamp-2">
                    {type.short_description || type.description || ''}
                  </p>

                  <div className="flex items-center gap-4 mt-4 text-sm text-stone-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {type.base_pax}–{type.max_pax} guests
                    </span>
                    {type.size_sqm && (
                      <span className="flex items-center gap-1">
                        <Maximize className="w-4 h-4" />
                        {type.size_sqm} sqm
                      </span>
                    )}
                  </div>

                  {/* Amenity tags */}
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {amenities.slice(0, 5).map((amenity) => (
                      <span
                        key={amenity}
                        className="px-2 py-0.5 bg-[#F5F0E8] text-[#2D5016] text-xs rounded-full"
                      >
                        {amenity}
                      </span>
                    ))}
                    {amenities.length > 5 && (
                      <span className="px-2 py-0.5 bg-stone-100 text-stone-500 text-xs rounded-full">
                        +{amenities.length - 5} more
                      </span>
                    )}
                  </div>

                  <Button
                    asChild
                    className="w-full mt-5 bg-[#2D5016] hover:bg-[#1e3a0f] text-white rounded-full"
                  >
                    <Link href="/book">Book This Room</Link>
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
