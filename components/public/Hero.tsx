import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface HeroProps {
  content: {
    tagline?: string;
    subtitle?: string;
    cta_text?: string;
    cta_link?: string;
  };
  tenantName: string;
}

export function Hero({ content, tenantName }: HeroProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient (placeholder for image) */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a3409] via-[#2D5016] to-[#1a3409]" />

      {/* Atmospheric overlay pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto">
        <p className="text-[#D4A574] font-medium tracking-[0.2em] uppercase text-xs sm:text-sm mb-4">
          {tenantName}
        </p>
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
          {content.tagline || 'Welcome'}
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
          {content.subtitle || ''}
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            asChild
            size="lg"
            className="bg-[#D4A574] hover:bg-[#c49464] text-[#1a3409] font-semibold px-8 py-6 text-base rounded-full shadow-lg shadow-[#D4A574]/20"
          >
            <Link href={content.cta_link || '/book'}>
              {content.cta_text || 'Book Your Stay'}
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-base rounded-full"
          >
            <a href="#accommodations">Explore Rooms</a>
          </Button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <a href="#about" className="text-white/50 hover:text-white/80 transition-colors">
          <ChevronDown className="w-6 h-6" />
        </a>
      </div>
    </section>
  );
}
