'use client';

import { Star } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { cn } from '@/lib/utils';
import type { Testimonial } from '@budabook/types';

interface TestimonialsProps {
    content: {
        title?: string;
        subtitle?: string;
    };
    testimonials: Testimonial[];
}

export function Testimonials({ content, testimonials }: TestimonialsProps) {
    const headerReveal = useScrollReveal<HTMLDivElement>();
    const cardsReveal = useScrollReveal<HTMLDivElement>({ threshold: 0.1 });

    if (testimonials.length === 0) {
        return null;
    }

    return (
        <section id="testimonials" className="py-20 md:py-28 bg-cream-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div
                    ref={headerReveal.ref}
                    className={cn('text-center mb-14 reveal', headerReveal.isVisible && 'visible')}
                >
                    <p className="text-accent font-body font-medium tracking-[0.2em] uppercase text-xs mb-4">
                        Testimonials
                    </p>
                    <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold text-forest-700 leading-tight tracking-tight accent-line-center">
                        {content.title || 'Guest Reviews'}
                    </h2>
                    {content.subtitle && (
                        <p className="mt-6 text-forest-500/60 max-w-2xl mx-auto text-base sm:text-lg">
                            {content.subtitle}
                        </p>
                    )}
                </div>

                {/* Testimonial cards */}
                <div
                    ref={cardsReveal.ref}
                    className={cn(
                        'grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 stagger-reveal',
                        cardsReveal.isVisible && 'visible'
                    )}
                >
                    {testimonials.map((t) => (
                        <div
                            key={t.id}
                            className="card-lift bg-white rounded-2xl p-6 border border-cream-300/50 shadow-sm"
                        >
                            {/* Stars */}
                            {t.rating && (
                                <div className="flex gap-1 mb-3">
                                    {Array.from({ length: t.rating }, (_, i) => (
                                        <Star key={i} className="w-4 h-4 fill-amber-300 text-amber-300" />
                                    ))}
                                </div>
                            )}

                            <p className="text-forest-600 text-sm leading-relaxed italic">
                                &ldquo;{t.content}&rdquo;
                            </p>

                            <div className="mt-4 pt-4 border-t border-cream-200">
                                <p className="font-semibold text-sm text-forest-700">{t.guest_name}</p>
                                <p className="text-xs text-forest-500/40 mt-0.5">{t.source}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
