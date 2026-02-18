'use client';

import { Leaf } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { cn } from '@/lib/utils';
import { useEffect, useState, useRef } from 'react';

interface Stat {
    value: string;
    label: string;
}

interface AboutProps {
    content: {
        title?: string;
        description?: string;
        features?: { title: string; description: string }[];
        stats?: Stat[];
        image?: string;
    };
}

function AnimatedStat({ value, label, isVisible }: { value: string; label: string; isVisible: boolean }) {
    const [displayValue, setDisplayValue] = useState(value);
    const hasAnimated = useRef(false);

    useEffect(() => {
        if (!isVisible || hasAnimated.current) return;
        hasAnimated.current = true;

        const numericMatch = value.match(/^([\d,]+)/);
        if (!numericMatch) {
            setDisplayValue(value);
            return;
        }

        const targetNum = parseInt(numericMatch[1].replace(/,/g, ''), 10);
        const suffix = value.slice(numericMatch[1].length);
        const duration = 1800;
        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(targetNum * eased);
            setDisplayValue(`${current.toLocaleString()}${suffix}`);
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [isVisible, value]);

    return (
        <div className="text-center">
            <p className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold text-forest-700 tracking-tight">
                {displayValue}
            </p>
            <p className="text-forest-500/50 text-xs sm:text-sm font-medium tracking-wider uppercase mt-2">
                {label}
            </p>
        </div>
    );
}

export function About({ content }: AboutProps) {
    const textReveal = useScrollReveal<HTMLDivElement>();
    const imageReveal = useScrollReveal<HTMLDivElement>({ threshold: 0.2 });
    const statsReveal = useScrollReveal<HTMLDivElement>({ threshold: 0.3 });
    const para2Reveal = useScrollReveal<HTMLDivElement>({ threshold: 0.2 });

    const defaultStats: Stat[] = [
        { value: '4,000 ft', label: 'Elevation' },
        { value: '15-20°C', label: 'Temperature' },
        { value: '2020', label: 'Since' },
        { value: '91K+', label: 'Followers' },
    ];

    const stats = content.stats && content.stats.length > 0 ? content.stats : defaultStats;

    // Reference site content for Our Story
    const paragraph1 = content.description ||
        'Opened in 2020 as a strawberry farm turned glamping site during the pandemic, Taglucop Strawberry Hills blends luxury with rural charm. What started as a simple strawberry farm in the highlands of Bukidnon has grown into one of Mindanao\'s most sought-after glamping destinations.';

    const paragraph2 =
        'Owned and operated by Taglucop Farms, we promote a \'glamping not camping\' vibe — modern comforts wrapped in nature\'s embrace. Nestled on hill slopes with pine groves, strawberry fields, and mountain views including breathtaking sea of clouds at dawn.';

    const paragraph3 =
        'By 2025, we\'ve expanded with Cocoon Suites and Tiny Houses, earned 91K+ Facebook followers, and continue to be the go-to destination for family getaways, romantic escapes, and group retreats in Central Mindanao.';

    return (
        <section id="about" className="py-20 md:py-28 bg-cream-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Text content */}
                    <div
                        ref={textReveal.ref}
                        className={cn('reveal-left', textReveal.isVisible && 'visible')}
                    >
                        <p className="text-accent font-body font-medium tracking-[0.2em] uppercase text-xs mb-4">
                            About Us
                        </p>
                        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold text-forest-700 leading-tight tracking-tight accent-line">
                            {content.title || 'Our Story'}
                        </h2>
                        <p className="mt-8 text-forest-500/70 leading-relaxed text-base sm:text-lg">
                            {paragraph1}
                        </p>
                        <p className="mt-4 text-forest-500/70 leading-relaxed text-base sm:text-lg">
                            {paragraph2}
                        </p>
                    </div>

                    {/* Image */}
                    <div
                        ref={imageReveal.ref}
                        className={cn('relative reveal-right', imageReveal.isVisible && 'visible')}
                    >
                        {/* Decorative offset border */}
                        <div className="absolute -bottom-3 -right-3 w-full h-full rounded-2xl border-2 border-amber-300/30" />
                        {content.image ? (
                            <img
                                src={content.image}
                                alt={content.title || 'Our Story'}
                                className="relative z-10 rounded-2xl shadow-xl w-full h-[400px] object-cover"
                            />
                        ) : (
                            <div className="relative z-10 rounded-2xl bg-forest-100 w-full h-[400px] flex items-center justify-center">
                                <Leaf className="w-16 h-16 text-forest-300" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Second paragraph - full width */}
                <div
                    ref={para2Reveal.ref}
                    className={cn('mt-10 max-w-3xl reveal', para2Reveal.isVisible && 'visible')}
                >
                    <p className="text-forest-500/60 leading-relaxed text-base sm:text-lg">
                        {paragraph3}
                    </p>
                </div>

                {/* Stat counters */}
                <div
                    ref={statsReveal.ref}
                    className={cn(
                        'mt-16 md:mt-20 pt-12 border-t border-forest-200/30',
                        'grid grid-cols-2 lg:grid-cols-4 gap-8',
                        'reveal',
                        statsReveal.isVisible && 'visible'
                    )}
                >
                    {stats.map((stat, i) => (
                        <AnimatedStat key={i} value={stat.value} label={stat.label} isVisible={statsReveal.isVisible} />
                    ))}
                </div>
            </div>
        </section>
    );
}
