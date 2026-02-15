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
  };
  tenantName: string;
}

export function Hero({ content, tenantName }: HeroProps) {
  const hasImage = !!content.hero_image;

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      {hasImage ? (
        <>
          <img
            src={content.hero_image}
            alt={tenantName}
            className="absolute inset-0 w-full h-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-forest-700/60 via-forest-700/30 to-forest-700/70" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-forest-700 via-forest-500 to-forest-700" />
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
        <p className="animate-fade-up text-amber-400 font-body font-medium tracking-[0.25em] uppercase text-xs sm:text-sm mb-5">
          {tenantName}
        </p>
        <h1
          className="animate-fade-up font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-white leading-[1.1] tracking-tight"
          style={{ animationDelay: '100ms' }}
        >
          {content.tagline || 'Welcome'}
        </h1>
        <p
          className="animate-fade-up mt-5 sm:mt-7 text-base sm:text-lg md:text-xl text-white/75 max-w-2xl mx-auto leading-relaxed font-light"
          style={{ animationDelay: '200ms' }}
        >
          {content.subtitle || ''}
        </p>
        <div
          className="animate-fade-up mt-9 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
          style={{ animationDelay: '350ms' }}
        >
          <Button
            asChild
            size="lg"
            variant="terracotta"
            className="w-full sm:w-auto px-10 py-6 text-base rounded-full shadow-lg shadow-terracotta-500/20"
          >
            <Link href={content.cta_link || '/book'}>
              {content.cta_text || 'Reserve Your Stay'}
            </Link>
          </Button>
          <Button
            asChild
            variant="outline-light"
            size="lg"
            className="w-full sm:w-auto px-10 py-6 text-base rounded-full border-2"
          >
            <a href="#accommodations">View Accommodations</a>
          </Button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
        <a href="#about" className="text-white/40 hover:text-white/70 transition-colors duration-300">
          <ChevronDown className="w-6 h-6" />
        </a>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cream-100 to-transparent" />
    </section>
  );
}
