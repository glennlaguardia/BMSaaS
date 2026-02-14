import { Camera } from 'lucide-react';

interface GalleryProps {
  content: {
    heading?: string;
    subtitle?: string;
  };
}

export function Gallery({ content }: GalleryProps) {
  return (
    <section id="gallery" className="py-20 md:py-28 bg-[#F5F0E8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-[#D4A574] font-medium tracking-[0.15em] uppercase text-xs mb-3">
            Gallery
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#2D5016]">
            {content.heading || 'Gallery'}
          </h2>
          <p className="text-stone-500 mt-3">
            {content.subtitle || 'A glimpse of paradise'}
          </p>
        </div>

        {/* Placeholder grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-xl bg-white shadow-sm flex items-center justify-center"
            >
              <div className="text-center">
                <Camera className="w-8 h-8 text-stone-300 mx-auto" />
                <p className="text-xs text-stone-400 mt-1">Photo {i + 1}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-stone-400 mt-6">
          Upload photos from the admin dashboard to populate the gallery.
        </p>
      </div>
    </section>
  );
}
