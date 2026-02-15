import { Camera } from 'lucide-react';

interface GalleryProps {
  content: {
    heading?: string;
    subtitle?: string;
    images?: string[];
  };
}

export function Gallery({ content }: GalleryProps) {
  const images = content.images || [];

  return (
    <section id="gallery" className="py-24 md:py-32 bg-cream-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-amber-300 font-body font-semibold tracking-[0.2em] uppercase text-xs mb-4">
            Gallery
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-forest-500 leading-[1.15] tracking-tight">
            {content.heading || 'Gallery'}
          </h2>
          <p className="text-forest-500/50 mt-4 text-[15px]">
            {content.subtitle || 'A glimpse of paradise'}
          </p>
        </div>

        {images.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 stagger-children">
            {images.map((url, i) => (
              <div
                key={i}
                className="aspect-square rounded-xl overflow-hidden shadow-sm group cursor-pointer"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Gallery photo ${i + 1}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-xl bg-white/70 border border-forest-100/20 flex items-center justify-center group hover:bg-white transition-colors duration-300"
                >
                  <div className="text-center">
                    <Camera className="w-8 h-8 text-forest-500/15 mx-auto group-hover:text-forest-500/25 transition-colors" />
                    <p className="text-xs text-forest-500/25 mt-2 font-medium">Photo {i + 1}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-forest-500/30 mt-8">
              Upload photos from the admin dashboard to populate the gallery.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
