interface AboutProps {
  content: {
    heading?: string;
    body?: string;
    highlights?: { label: string; value: string }[];
  };
}

export function About({ content }: AboutProps) {
  return (
    <section id="about" className="py-24 md:py-32 bg-cream-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-24 items-center">
          {/* Text */}
          <div>
            <p className="text-amber-300 font-body font-semibold tracking-[0.2em] uppercase text-xs mb-4">
              Discover
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-semibold text-forest-500 leading-[1.15] tracking-tight">
              {content.heading || 'Our Story'}
            </h2>
            <div className="mt-7 space-y-5">
              {(content.body || '').split('\n\n').map((para, i) => (
                <p key={i} className="text-forest-500/60 leading-[1.8] text-[15px]">
                  {para}
                </p>
              ))}
            </div>
          </div>

          {/* Highlights */}
          <div className="grid grid-cols-2 gap-4 stagger-children">
            {content.highlights?.map((item, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-7 text-center shadow-sm hover:shadow-md transition-shadow duration-300 border border-forest-100/30"
              >
                <p className="font-display text-4xl md:text-5xl font-semibold text-forest-500">
                  {item.value}
                </p>
                <p className="text-sm text-forest-500/50 mt-2 font-medium tracking-wide">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
