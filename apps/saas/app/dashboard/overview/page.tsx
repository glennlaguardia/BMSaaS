'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CalendarDays, BookOpen, DollarSign, Users, BedDouble, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { formatPHP } from '@/lib/pricing';
import { statusLabel, statusColor, formatDate } from '@/lib/utils';

interface DashboardData {
  todayCheckins: number;
  activeBookings: number;
  monthlyRevenue: number;
  totalGuests: number;
  occupancyRate: number;
  pendingPayments: number;
  recentBookings: Array<{
    id: string;
    reference_number: string;
    guest_first_name: string;
    guest_last_name: string;
    status: string;
    total_amount: number;
    created_at: string;
    accommodation_types: { name: string } | null;
  }>;
  upcomingCheckins: Array<{
    id: string;
    reference_number: string;
    guest_first_name: string;
    guest_last_name: string;
    check_in_date: string;
    check_out_date: string;
    status: string;
    rooms: { name: string } | null;
    accommodation_types: { name: string } | null;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-forest-500/35" />
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-bold text-forest-700">Dashboard</h1>
        <p className="text-sm text-forest-500/45 mt-1 font-medium">
          Welcome back. Here&apos;s an overview of your resort.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Today's Check-ins"
          value={data?.todayCheckins?.toString() ?? '0'}
          subtitle="Guests arriving today"
          icon={CalendarDays}
          color="forest"
        />
        <MetricCard
          title="Active Bookings"
          value={data?.activeBookings?.toString() ?? '0'}
          subtitle="Confirmed, paid, or checked in"
          icon={BookOpen}
          color="amber"
        />
        <MetricCard
          title="Monthly Revenue"
          value={data ? formatPHP(data.monthlyRevenue) : '₱0'}
          subtitle="Revenue this month"
          icon={DollarSign}
          color="forest"
        />
        <MetricCard
          title="Total Guests"
          value={data?.totalGuests?.toString() ?? '0'}
          subtitle="Unique guests all-time"
          icon={Users}
          color="amber"
        />
        <MetricCard
          title="Occupancy Rate"
          value={data ? `${data.occupancyRate}%` : '0%'}
          subtitle="Next 7 days"
          icon={BedDouble}
          color="forest"
        />
        <MetricCard
          title="Pending Payments"
          value={data?.pendingPayments?.toString() ?? '0'}
          subtitle="Unpaid or awaiting verification"
          icon={TrendingUp}
          color="amber"
        />
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <Card className="border-forest-100/30 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold text-forest-700">Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.recentBookings && data.recentBookings.length > 0 ? (
              <div className="space-y-3">
                {data.recentBookings.map((booking) => (
                  <Link
                    key={booking.id}
                    href={`/dashboard/bookings/${booking.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-forest-50/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-semibold text-forest-700">
                        {booking.guest_first_name} {booking.guest_last_name}
                      </p>
                      <p className="text-xs text-forest-500/40">
                        {booking.reference_number} &middot; {booking.accommodation_types?.name || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={statusColor(booking.status)} className="text-[10px]">
                        {statusLabel(booking.status)}
                      </Badge>
                      <p className="text-xs font-medium text-forest-700 mt-1">
                        {formatPHP(booking.total_amount)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-forest-500/40">No bookings yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Check-ins */}
        <Card className="border-forest-100/30 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold text-forest-700">Upcoming Check-ins</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.upcomingCheckins && data.upcomingCheckins.length > 0 ? (
              <div className="space-y-3">
                {data.upcomingCheckins.map((booking) => (
                  <Link
                    key={booking.id}
                    href={`/dashboard/bookings/${booking.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-forest-50/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-semibold text-forest-700">
                        {booking.guest_first_name} {booking.guest_last_name}
                      </p>
                      <p className="text-xs text-forest-500/40">
                        {booking.rooms?.name || 'TBD'} &middot; {booking.accommodation_types?.name || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-forest-700">
                        {formatDate(booking.check_in_date, 'MMM d')}
                      </p>
                      <Badge variant={statusColor(booking.status)} className="text-[10px]">
                        {statusLabel(booking.status)}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-forest-500/40">No upcoming check-ins.</p>
            )}
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
    forest: 'bg-forest-50 text-forest-500',
    amber: 'bg-amber-50 text-amber-500',
  };

  return (
    <Card className="border-forest-100/30 shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-forest-500/50">{title}</p>
            <p className="text-3xl font-bold text-forest-700 mt-1">{value}</p>
            <p className="text-xs text-forest-500/30 mt-1 font-medium">{subtitle}</p>
          </div>
          <div className={`p-2.5 rounded-xl ${colorMap[color] || colorMap.forest}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
