import { Star, Quote } from 'lucide-react';
import type { Testimonial } from '@/types';

interface TestimonialsProps {
  content: {
    heading?: string;
    subtitle?: string;
  };
  testimonials: Testimonial[];
}

export function Testimonials({ content, testimonials }: TestimonialsProps) {
  if (testimonials.length === 0) return null;

  return (
    <section id="testimonials" className="py-24 md:py-32 bg-cream-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-amber-300 font-body font-semibold tracking-[0.2em] uppercase text-xs mb-4">
            Reviews
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-forest-500 leading-[1.15] tracking-tight">
            {content.heading || 'What Our Guests Say'}
          </h2>
          <p className="text-forest-500/50 mt-4 text-[15px]">
            {content.subtitle || ''}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white rounded-2xl p-7 shadow-sm hover:shadow-md transition-shadow duration-300 border border-forest-100/20"
            >
              <Quote className="w-8 h-8 text-amber-300/30 mb-4" />
              <p className="text-forest-500/60 text-sm leading-[1.8]">
                &ldquo;{testimonial.content}&rdquo;
              </p>
              <div className="mt-5 pt-5 border-t border-forest-100/20 flex items-center justify-between">
                <div>
                  <p className="font-display font-semibold text-forest-500 text-sm">
                    {testimonial.guest_name}
                  </p>
                  <p className="text-xs text-forest-500/35 mt-0.5 font-medium">{testimonial.source}</p>
                </div>
                {testimonial.rating && (
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-3.5 h-3.5 text-amber-400 fill-amber-400"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
