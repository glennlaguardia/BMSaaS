import { MapPin, Clock, Car, AlertTriangle } from 'lucide-react';

interface Direction {
  from: string;
  duration: string;
  description: string;
}

interface LocationProps {
  content: {
    heading?: string;
    description?: string;
    directions?: Direction[];
    travel_tips?: string;
  };
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export function Location({ content, address, latitude, longitude }: LocationProps) {
  const directions = content.directions || [];
  const mapsUrl = latitude && longitude
    ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    : '#';

  return (
    <section id="location" className="py-24 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-amber-300 font-body font-semibold tracking-[0.2em] uppercase text-xs mb-4">
            Location
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-forest-500 leading-[1.15] tracking-tight">
            {content.heading || 'Getting Here'}
          </h2>
          <p className="text-forest-500/50 mt-4 text-[15px]">
            {content.description || ''}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Directions */}
          <div className="space-y-4 stagger-children">
            {directions.map((dir, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-5 rounded-xl bg-cream-100 border border-forest-100/20 hover:border-forest-100/40 transition-colors duration-300"
              >
                <div className="p-2.5 bg-white rounded-lg shadow-sm border border-forest-100/10">
                  <Car className="w-5 h-5 text-forest-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <p className="font-display font-semibold text-forest-500">{dir.from}</p>
                    <span className="flex items-center gap-1 text-xs text-forest-500/40 bg-forest-50 px-2 py-0.5 rounded-full font-medium">
                      <Clock className="w-3 h-3" />
                      {dir.duration}
                    </span>
                  </div>
                  <p className="text-sm text-forest-500/50 mt-1 leading-relaxed">{dir.description}</p>
                </div>
              </div>
            ))}

            {content.travel_tips && (
              <div className="flex items-start gap-3 p-5 rounded-xl bg-amber-50 border border-amber-200/50">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 leading-relaxed">{content.travel_tips}</p>
              </div>
            )}

            {address && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-forest-500 hover:text-forest-600 font-medium transition-colors"
              >
                <MapPin className="w-4 h-4" />
                {address}
              </a>
            )}
          </div>

          {/* Map */}
          <div className="rounded-2xl overflow-hidden bg-cream-100 h-80 lg:h-auto flex items-center justify-center border border-forest-100/20 shadow-sm">
            {latitude && longitude ? (
              <iframe
                title="Resort Location"
                src={`https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d5000!2d${longitude}!3d${latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sph!4v1`}
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="text-center">
                <MapPin className="w-10 h-10 text-forest-500/15 mx-auto" />
                <p className="text-sm text-forest-500/30 mt-3 font-medium">Map will appear when GPS coordinates are set</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
