import {
  Flame,
  Waves,
  Trees,
  Cloud,
  Tractor,
  Cherry,
} from 'lucide-react';

interface Activity {
  name: string;
  description: string;
  icon: string;
}

interface ActivitiesProps {
  content: {
    heading?: string;
    subtitle?: string;
    activities?: Activity[];
  };
}

const iconMap: Record<string, React.ElementType> = {
  strawberry: Cherry,
  cloud: Cloud,
  flame: Flame,
  waves: Waves,
  trees: Trees,
  tractor: Tractor,
};

export function Activities({ content }: ActivitiesProps) {
  const activities = content.activities || [];

  return (
    <section id="activities" className="py-20 md:py-28 bg-[#2D5016]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-[#D4A574] font-medium tracking-[0.15em] uppercase text-xs mb-3">
            Things to Do
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            {content.heading || 'Experiences Await'}
          </h2>
          <p className="text-white/60 mt-3">
            {content.subtitle || ''}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((activity, i) => {
            const Icon = iconMap[activity.icon] || Cherry;
            return (
              <div
                key={i}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/15 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-[#D4A574]/20 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-[#D4A574]" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {activity.name}
                </h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  {activity.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
