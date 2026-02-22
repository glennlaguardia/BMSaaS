'use client';

import { useState } from 'react';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface GalleryImage {
    url: string;
    alt?: string;
    category?: string;
}

interface GalleryProps {
    content: {
        title?: string;
        heading?: string;
        subtitle?: string;
        images?: (string | GalleryImage)[];
    };
}

function normalizeImages(raw?: (string | GalleryImage)[]): GalleryImage[] {
    if (!raw) return [];
    return raw.map((item, i) => {
        if (typeof item === 'string') return { url: item, alt: `Gallery image ${i + 1}` };
        return { url: item.url, alt: item.alt || `Gallery image ${i + 1}`, category: item.category };
    });
}

export function Gallery({ content }: GalleryProps) {
    const images = normalizeImages(content.images);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const headerReveal = useScrollReveal<HTMLDivElement>();
    const gridReveal = useScrollReveal<HTMLDivElement>({ threshold: 0.05 });

    if (images.length === 0) {
        return null;
    }

    return (
        <section id="gallery" className="py-20 md:py-28 bg-cream-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div
                    ref={headerReveal.ref}
                    className={cn('text-center mb-14 reveal', headerReveal.isVisible && 'visible')}
                >
                    <p className="text-accent font-body font-medium tracking-[0.2em] uppercase text-xs mb-4">
                        Gallery
                    </p>
                    <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold text-forest-700 leading-tight tracking-tight accent-line-center">
                        {content.title || content.heading || 'A Glimpse of Paradise'}
                    </h2>
                    {content.subtitle && (
                        <p className="mt-6 text-forest-500/60 max-w-2xl mx-auto text-base sm:text-lg">
                            {content.subtitle}
                        </p>
                    )}
                </div>

                {/* Masonry image grid */}
                <div
                    ref={gridReveal.ref}
                    className={cn('masonry-gallery reveal-scale', gridReveal.isVisible && 'visible')}
                >
                    {images.map((img, i) => (
                        <button
                            key={i}
                            onClick={() => setSelectedImage(img.url)}
                            className="relative group w-full overflow-hidden rounded-xl cursor-pointer block"
                        >
                            <img
                                src={img.url}
                                alt={img.alt || `Gallery image ${i + 1}`}
                                className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-forest-900/0 group-hover:bg-forest-900/20 transition-colors duration-300 rounded-xl" />
                        </button>
                    ))}
                </div>
            </div>

            {/* Lightbox */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-4 right-4 z-10 p-2 text-white/60 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <img
                        src={selectedImage}
                        alt="Gallery"
                        className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl animate-scale-in"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </section>
    );
}
