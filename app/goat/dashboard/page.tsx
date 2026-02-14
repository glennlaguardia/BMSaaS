import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CalendarDays,
  BookOpen,
  DollarSign,
  Users,
  TrendingUp,
  BedDouble,
} from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Welcome back. Here&apos;s an overview of your resort.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Today's Check-ins"
          value="—"
          subtitle="No data yet"
          icon={CalendarDays}
          color="blue"
        />
        <MetricCard
          title="Active Bookings"
          value="—"
          subtitle="No data yet"
          icon={BookOpen}
          color="emerald"
        />
        <MetricCard
          title="Monthly Revenue"
          value="—"
          subtitle="No data yet"
          icon={DollarSign}
          color="amber"
        />
        <MetricCard
          title="Total Guests"
          value="—"
          subtitle="No data yet"
          icon={Users}
          color="purple"
        />
        <MetricCard
          title="Occupancy Rate"
          value="—"
          subtitle="No data yet"
          icon={BedDouble}
          color="rose"
        />
        <MetricCard
          title="Pending Payments"
          value="—"
          subtitle="No data yet"
          icon={TrendingUp}
          color="orange"
        />
      </div>

      {/* Placeholder sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-500">
              Booking data will appear here once the database is connected and seeded.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming Check-ins</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-500">
              Upcoming check-ins will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
    rose: 'bg-rose-50 text-rose-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">{title}</p>
            <p className="text-2xl font-bold text-zinc-900 mt-1">{value}</p>
            <p className="text-xs text-zinc-400 mt-1">{subtitle}</p>
          </div>
          <div className={`p-2.5 rounded-lg ${colorMap[color] || colorMap.blue}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
