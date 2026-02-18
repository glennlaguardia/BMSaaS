'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { cn } from '@/lib/utils';
import { Users, Plus } from 'lucide-react';
import type { AccommodationType } from '@/types';

interface PricingProps {
    content: {
        title?: string;
        subtitle?: string;
    };
    types: AccommodationType[];
    adjustments?: unknown[];
}

export function Pricing({ content, types }: PricingProps) {
    const headerReveal = useScrollReveal<HTMLDivElement>();
    const cardsReveal = useScrollReveal<HTMLDivElement>({ threshold: 0.1 });

    return (
        <section id="pricing" className="py-20 md:py-28 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div
                    ref={headerReveal.ref}
                    className={cn('text-center mb-14 reveal', headerReveal.isVisible && 'visible')}
                >
                    <p className="text-accent font-body font-medium tracking-[0.2em] uppercase text-xs mb-4">
                        Pricing
                    </p>
                    <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold text-forest-700 leading-tight tracking-tight accent-line-center">
                        {content.title || 'Rates & Pricing'}
                    </h2>
                    {content.subtitle && (
                        <p className="mt-6 text-forest-500/60 max-w-2xl mx-auto text-base sm:text-lg">
                            {content.subtitle}
                        </p>
                    )}
                </div>

                {/* Pricing cards */}
                <div
                    ref={cardsReveal.ref}
                    className={cn(
                        'grid sm:grid-cols-2 lg:grid-cols-4 gap-5 stagger-reveal',
                        cardsReveal.isVisible && 'visible'
                    )}
                >
                    {types.map((type) => (
                        <div
                            key={type.id}
                            className="card-lift bg-cream-50 rounded-2xl border border-cream-300/50 p-6 flex flex-col"
                        >
                            <h3 className="font-display text-xl font-semibold text-forest-700 tracking-tight">
                                {type.name}
                            </h3>

                            {/* Rates */}
                            <div className="mt-5 space-y-2">
                                <div className="flex items-baseline justify-between">
                                    <span className="text-xs font-medium text-forest-500/45 uppercase tracking-wider">Weekday</span>
                                    <span className="text-lg font-bold text-forest-700">
                                        ₱{type.base_rate_weekday.toLocaleString()}
                                        <span className="text-xs font-normal text-forest-500/40 ml-1">/night</span>
                                    </span>
                                </div>
                                <div className="flex items-baseline justify-between">
                                    <span className="text-xs font-medium text-forest-500/45 uppercase tracking-wider">Weekend</span>
                                    <span className="text-lg font-bold text-terracotta-500">
                                        ₱{type.base_rate_weekend.toLocaleString()}
                                        <span className="text-xs font-normal text-forest-500/40 ml-1">/night</span>
                                    </span>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="my-5 border-t border-cream-300/50" />

                            {/* Capacity */}
                            <div className="flex items-center gap-2 text-sm text-forest-500/60">
                                <Users className="w-4 h-4 text-forest-400" />
                                <span>Base {type.base_pax} guests · Max {type.max_pax} guests</span>
                            </div>

                            {/* Extra pax */}
                            {type.additional_pax_fee > 0 && (
                                <div className="flex items-center gap-2 text-sm text-forest-500/50 mt-2">
                                    <Plus className="w-4 h-4 text-forest-400" />
                                    <span>₱{type.additional_pax_fee.toLocaleString()} per extra guest</span>
                                </div>
                            )}

                            {/* Inclusions preview */}
                            {type.inclusions && type.inclusions.length > 0 && (
                                <div className="mt-4">
                                    <p className="text-xs text-forest-500/40 font-medium">Includes:</p>
                                    <p className="text-xs text-forest-500/60 mt-1 line-clamp-2">
                                        {type.inclusions.slice(0, 3).join(', ')}
                                        {type.inclusions.length > 3 && ` +${type.inclusions.length - 3} more`}
                                    </p>
                                </div>
                            )}

                            {/* CTA */}
                            <div className="mt-auto pt-5">
                                <Button asChild variant="terracotta" className="w-full rounded-full" size="sm">
                                    <Link href="/book">Reserve</Link>
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Day tour note */}
                <p className="text-center text-forest-500/40 text-sm mt-8">
                    Day Tour: PHP 200-350 per person (2-5 PM, includes welcome juice and platter)
                </p>
            </div>
        </section>
    );
}
