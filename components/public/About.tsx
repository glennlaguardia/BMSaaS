interface AboutProps {
  content: {
    heading?: string;
    body?: string;
    highlights?: { label: string; value: string }[];
  };
}

export function About({ content }: AboutProps) {
  return (
    <section id="about" className="py-20 md:py-28 bg-[#F5F0E8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Text */}
          <div>
            <p className="text-[#D4A574] font-medium tracking-[0.15em] uppercase text-xs mb-3">
              Discover
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#2D5016] leading-tight">
              {content.heading || 'Our Story'}
            </h2>
            <div className="mt-6 space-y-4">
              {(content.body || '').split('\n\n').map((para, i) => (
                <p key={i} className="text-stone-600 leading-relaxed">
                  {para}
                </p>
              ))}
            </div>
          </div>

          {/* Highlights */}
          <div className="grid grid-cols-2 gap-4">
            {content.highlights?.map((item, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 text-center shadow-sm"
              >
                <p className="text-3xl md:text-4xl font-bold text-[#2D5016]">
                  {item.value}
                </p>
                <p className="text-sm text-stone-500 mt-1 font-medium">
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
