'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface HeroProps {
  content: {
    tagline?: string;
    subtitle?: string;
    cta_text?: string;
    cta_link?: string;
    hero_image?: string;
    background_image?: string;
  };
  tenantName: string;
}

export function Hero({ content, tenantName }: HeroProps) {
  const heroImage = content.hero_image || content.background_image;
  const hasImage = !!heroImage;
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const parallaxScale = 1.05 + scrollY * 0.0003;
  const parallaxOpacity = Math.max(0, 1 - scrollY * 0.001);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with parallax */}
      {hasImage ? (
        <>
          <div
            className="absolute inset-0 will-change-transform"
            style={{ transform: `scale(${parallaxScale})`, opacity: parallaxOpacity }}
          >
            <img
              src={heroImage}
              alt={tenantName}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-forest-900/50 via-forest-800/25 to-forest-900/70" />
          <div className="absolute inset-0 bg-gradient-to-r from-forest-900/30 via-transparent to-forest-900/30" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-forest-800 via-forest-600 to-forest-800" />
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-300/10 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-forest-500/30 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
        </>
      )}

      {/* Grain overlay */}
      <div className="absolute inset-0 grain pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto">
        {/* Frosted glass tenant badge */}
        <div
          className="animate-fade-up inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/[0.08] backdrop-blur-md border border-white/[0.12] mb-7"
        >
          <span className="text-amber-300 font-body font-semibold tracking-[0.25em] uppercase text-[11px] sm:text-xs">
            {tenantName}
          </span>
        </div>

        <h1
          className="animate-fade-up font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-white leading-[1.08] tracking-tight"
          style={{ animationDelay: '120ms' }}
        >
          {content.tagline || 'Welcome'}
        </h1>

        <p
          className="animate-fade-up mt-5 sm:mt-7 text-base sm:text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed font-light"
          style={{ animationDelay: '240ms' }}
        >
          {content.subtitle || ''}
        </p>

        <div
          className="animate-fade-up mt-9 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
          style={{ animationDelay: '400ms' }}
        >
          <Button
            asChild
            size="lg"
            variant="terracotta"
            className="w-full sm:w-auto px-10 py-6 text-base rounded-full shadow-lg shadow-terracotta-500/25 hover:shadow-xl hover:shadow-terracotta-500/30 transition-shadow duration-300"
          >
            <Link href={content.cta_link || '/book/taglucop'}>
              {content.cta_text || 'Book Your Stay'}
            </Link>
          </Button>
          <Button
            asChild
            variant="outline-light"
            size="lg"
            className="w-full sm:w-auto px-10 py-6 text-base rounded-full border-2 hover:bg-white/10 transition-all duration-300"
          >
            <a href="#accommodations">View Accommodations</a>
          </Button>
        </div>
      </div>

      {/* Discover scroll indicator */}
      <div className="absolute bottom-8 sm:bottom-12 left-1/2" style={{ animation: 'discover-bounce 2.5s ease infinite' }}>
        <a
          href="#about"
          className="flex flex-col items-center gap-2 text-white/40 hover:text-white/70 transition-colors duration-300"
        >
          <span className="text-[10px] font-body font-semibold tracking-[0.3em] uppercase">Discover</span>
          <ChevronDown className="w-5 h-5" />
        </a>
      </div>

      {/* Bottom gradient fade into next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cream-100 to-transparent" />
    </section>
  );
}
