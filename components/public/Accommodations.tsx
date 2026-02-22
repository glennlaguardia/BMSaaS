'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { cn } from '@/lib/utils';
import type { AccommodationType } from '@/types';

interface AccommodationsProps {
    content: {
        title?: string;
        subtitle?: string;
    };
    types: AccommodationType[];
    adjustments?: unknown[];
}

export function Accommodations({ content, types }: AccommodationsProps) {
    const headerReveal = useScrollReveal<HTMLDivElement>();
    const cardsReveal = useScrollReveal<HTMLDivElement>({ threshold: 0.1 });

    return (
        <section id="accommodations" className="py-20 md:py-28 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div
                    ref={headerReveal.ref}
                    className={cn('text-center mb-14 reveal', headerReveal.isVisible && 'visible')}
                >
                    <p className="text-accent font-body font-medium tracking-[0.2em] uppercase text-xs mb-4">
                        Accommodations
                    </p>
                    <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold text-forest-700 leading-tight tracking-tight accent-line-center">
                        {content.title || 'Our Accommodations'}
                    </h2>
                    {content.subtitle && (
                        <p className="mt-6 text-forest-500/60 max-w-2xl mx-auto text-base sm:text-lg">
                            {content.subtitle}
                        </p>
                    )}
                </div>

                {/* Accommodation cards — 2 per row */}
                <div
                    ref={cardsReveal.ref}
                    className={cn(
                        'grid sm:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto stagger-reveal',
                        cardsReveal.isVisible && 'visible'
                    )}
                >
                    {types.map((type) => {
                        const thumbnail = type.thumbnail_url || type.images?.[0]?.url;
                        return (
                            <div
                                key={type.id}
                                className="group card-lift bg-white border border-cream-300/50 rounded-2xl overflow-hidden shadow-sm"
                            >
                                {/* Image with hover overlay */}
                                <div className="relative h-64 overflow-hidden">
                                    {thumbnail ? (
                                        <img
                                            src={thumbnail}
                                            alt={type.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-forest-100 flex items-center justify-center">
                                            <span className="text-forest-300 text-sm">No image</span>
                                        </div>
                                    )}
                                    {/* Hover gradient overlay with CTA */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-forest-900/80 via-forest-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end justify-center pb-6">
                                        <Button
                                            asChild
                                            variant="outline-light"
                                            size="sm"
                                            className="rounded-full border-2 px-6 translate-y-3 group-hover:translate-y-0 transition-transform duration-500"
                                        >
                                            <Link href="/book">Book This Room</Link>
                                        </Button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    <h3 className="font-display text-xl font-semibold text-forest-700 tracking-tight">
                                        {type.name}
                                    </h3>
                                    <p className="text-forest-500/60 text-sm mt-2 line-clamp-2 leading-relaxed">
                                        {type.short_description || type.description || ''}
                                    </p>

                                    <div className="mt-5 flex items-end justify-between">
                                        <div>
                                            <div className="flex items-baseline gap-1.5">
                                                <span className="text-2xl font-bold text-terracotta-500">
                                                    ₱{type.base_rate_weekday.toLocaleString()}
                                                </span>
                                                <span className="text-forest-500/40 text-sm">/ night</span>
                                            </div>
                                            <div className="mt-1.5 text-xs text-forest-500/45">
                                                Base {type.base_pax} guests · Max {type.max_pax} guests
                                            </div>
                                        </div>
                                        <Button asChild variant="terracotta" className="rounded-full" size="sm">
                                            <Link href="/book">Reserve</Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
