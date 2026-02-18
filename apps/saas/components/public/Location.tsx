'use client';

import { MapPin, AlertTriangle, Navigation } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { cn } from '@/lib/utils';

interface LocationProps {
    content: {
        title?: string;
        description?: string;
        map_embed?: string;
    };
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
}

const directions = [
    { from: 'Davao City', route: 'Via Sayre Highway, heading north' },
    { from: 'Cagayan de Oro', route: 'Via Malaybalay, heading south' },
    { from: 'Malaybalay', route: 'Direct route via Kitaotao' },
    { from: 'Tagum City', route: 'Via Sayre Highway, heading north' },
];

export function Location({ content, address, latitude, longitude }: LocationProps) {
    const hasCoords = latitude && longitude;
    const mapUrl = hasCoords
        ? `https://www.google.com/maps?q=${latitude},${longitude}`
        : null;

    const headerReveal = useScrollReveal<HTMLDivElement>();
    const mapReveal = useScrollReveal<HTMLDivElement>({ threshold: 0.1 });
    const directionsReveal = useScrollReveal<HTMLDivElement>({ threshold: 0.1 });

    return (
        <section id="location" className="py-20 md:py-28 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div
                    ref={headerReveal.ref}
                    className={cn('text-center mb-14 reveal', headerReveal.isVisible && 'visible')}
                >
                    <p className="text-accent font-body font-medium tracking-[0.2em] uppercase text-xs mb-4">
                        Location
                    </p>
                    <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold text-forest-700 leading-tight tracking-tight accent-line-center">
                        {content.title || 'Getting Here'}
                    </h2>
                    {content.description && (
                        <p className="mt-6 text-forest-500/60 max-w-2xl mx-auto text-base sm:text-lg">
                            {content.description}
                        </p>
                    )}
                </div>

                {/* Direction cards */}
                <div
                    ref={directionsReveal.ref}
                    className={cn(
                        'grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10 stagger-reveal',
                        directionsReveal.isVisible && 'visible'
                    )}
                >
                    {directions.map((d, i) => (
                        <div
                            key={i}
                            className="group bg-cream-50 rounded-xl p-5 border border-cream-300/50 hover:border-amber-300/40 transition-colors duration-300"
                        >
                            <div className="w-9 h-9 rounded-lg bg-forest-100 flex items-center justify-center mb-3 group-hover:bg-amber-100 transition-colors duration-300">
                                <Navigation className="w-4 h-4 text-forest-500 group-hover:text-amber-600 transition-colors duration-300" />
                            </div>
                            <p className="font-semibold text-forest-700 text-sm">{d.from}</p>
                            <p className="text-forest-500/50 text-xs mt-1 leading-relaxed">{d.route}</p>
                        </div>
                    ))}
                </div>

                {/* Road condition warning */}
                <div className="max-w-4xl mx-auto mb-8">
                    <div className="flex items-start gap-3 bg-amber-50 rounded-xl p-4 border border-amber-200/50">
                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-800/80 leading-relaxed">
                            The last 5-10 km have rough roads. 4x4 vehicles are recommended especially during rainy season.
                        </p>
                    </div>
                </div>

                {/* Map */}
                <div
                    ref={mapReveal.ref}
                    className={cn('max-w-4xl mx-auto reveal-scale', mapReveal.isVisible && 'visible')}
                >
                    {content.map_embed ? (
                        <div
                            className="rounded-2xl overflow-hidden border border-cream-300/50 shadow-lg aspect-video"
                            dangerouslySetInnerHTML={{ __html: content.map_embed }}
                        />
                    ) : hasCoords ? (
                        <div className="rounded-2xl overflow-hidden border border-cream-300/50 shadow-lg aspect-video">
                            <iframe
                                src={`https://maps.google.com/maps?q=${latitude},${longitude}&z=14&output=embed`}
                                className="w-full h-full"
                                loading="lazy"
                                title="Location map"
                            />
                        </div>
                    ) : (
                        <div className="rounded-2xl bg-cream-50 border border-cream-300/50 aspect-video flex items-center justify-center">
                            <div className="text-center">
                                <MapPin className="w-12 h-12 text-forest-300 mx-auto mb-3" />
                                <p className="text-forest-500/50 text-sm">Map not available</p>
                            </div>
                        </div>
                    )}

                    {/* Address */}
                    {address && (
                        <div className="mt-6 text-center">
                            <div className="inline-flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-terracotta-500" />
                                <p className="text-forest-600 text-sm font-medium">{address}</p>
                            </div>
                            {mapUrl && (
                                <p className="mt-2">
                                    <a
                                        href={mapUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-terracotta-500 hover:text-terracotta-600 text-sm underline underline-offset-2 transition-colors"
                                    >
                                        Open in Google Maps
                                    </a>
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
