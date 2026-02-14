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
    <section id="testimonials" className="py-20 md:py-28 bg-[#F5F0E8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-[#D4A574] font-medium tracking-[0.15em] uppercase text-xs mb-3">
            Reviews
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#2D5016]">
            {content.heading || 'What Our Guests Say'}
          </h2>
          <p className="text-stone-500 mt-3">
            {content.subtitle || ''}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white rounded-2xl p-6 shadow-sm"
            >
              <Quote className="w-8 h-8 text-[#D4A574]/30 mb-3" />
              <p className="text-stone-600 text-sm leading-relaxed">
                &ldquo;{testimonial.content}&rdquo;
              </p>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[#2D5016] text-sm">
                    {testimonial.guest_name}
                  </p>
                  <p className="text-xs text-stone-400">{testimonial.source}</p>
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
