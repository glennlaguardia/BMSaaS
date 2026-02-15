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
    <section id="activities" className="relative py-24 md:py-32 bg-forest-500 overflow-hidden">
      {/* Atmospheric overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-forest-400/30 via-transparent to-transparent" />
      <div className="absolute inset-0 grain pointer-events-none opacity-30" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-amber-300 font-body font-semibold tracking-[0.2em] uppercase text-xs mb-4">
            Things to Do
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-white leading-[1.15] tracking-tight">
            {content.heading || 'Experiences Await'}
          </h2>
          <p className="text-white/50 mt-4 text-[15px]">
            {content.subtitle || ''}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
          {activities.map((activity, i) => {
            const Icon = iconMap[activity.icon] || Cherry;
            return (
              <div
                key={i}
                className="group bg-white/[0.07] backdrop-blur-sm rounded-2xl p-7 hover:bg-white/[0.12] transition-all duration-500 border border-white/[0.06]"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-300/15 flex items-center justify-center mb-5 group-hover:bg-amber-300/20 transition-colors duration-300">
                  <Icon className="w-6 h-6 text-amber-300" />
                </div>
                <h3 className="font-display text-lg font-semibold text-white mb-2">
                  {activity.name}
                </h3>
                <p className="text-white/45 text-sm leading-relaxed">
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
