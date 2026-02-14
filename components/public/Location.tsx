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
    <section id="location" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-[#D4A574] font-medium tracking-[0.15em] uppercase text-xs mb-3">
            Location
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#2D5016]">
            {content.heading || 'Getting Here'}
          </h2>
          <p className="text-stone-500 mt-3">
            {content.description || ''}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Directions */}
          <div className="space-y-4">
            {directions.map((dir, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-4 rounded-xl bg-[#F5F0E8]"
              >
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Car className="w-5 h-5 text-[#2D5016]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[#2D5016]">{dir.from}</p>
                    <span className="flex items-center gap-1 text-xs text-stone-500">
                      <Clock className="w-3 h-3" />
                      {dir.duration}
                    </span>
                  </div>
                  <p className="text-sm text-stone-500 mt-0.5">{dir.description}</p>
                </div>
              </div>
            ))}

            {content.travel_tips && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">{content.travel_tips}</p>
              </div>
            )}

            {address && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-[#2D5016] hover:underline"
              >
                <MapPin className="w-4 h-4" />
                {address}
              </a>
            )}
          </div>

          {/* Map placeholder */}
          <div className="rounded-2xl overflow-hidden bg-stone-100 h-80 lg:h-auto flex items-center justify-center">
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
                <MapPin className="w-10 h-10 text-stone-300 mx-auto" />
                <p className="text-sm text-stone-400 mt-2">Map will appear when GPS coordinates are set</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
