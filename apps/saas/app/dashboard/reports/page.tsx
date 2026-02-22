/* Recharts callbacks use generic types */
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Download, DollarSign, CalendarCheck, XCircle, TrendingUp } from 'lucide-react';
import { formatPHP } from '@/lib/pricing';
import { statusLabel } from '@/lib/utils';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const COLORS = ['#059669', '#0284c7', '#d97706', '#e11d48', '#7c3aed', '#64748b'];

interface ReportData {
  summary: {
    totalRevenue: number;
    confirmedBookings: number;
    cancelledBookings: number;
    paidBookings: number;
    avgBookingValue: number;
    totalDayTours: number;
  };
  charts: {
    revenueOverTime: { date: string; revenue: number; bookings: number }[];
    revenueByType: { name: string; value: number }[];
    statusDistribution: { name: string; value: number }[];
  };
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/reports?period=${period}`)
      .then(r => r.json())
      .then(res => { if (res.success) setData(res.data); })
      .finally(() => setLoading(false));
  }, [period]);

  const handleExport = (type: string) => {
    window.open(`/api/admin/reports/export?type=${type}&period=${period}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-forest-500/35" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-forest-500/45">
        Failed to load reports data.
      </div>
    );
  }

  const { summary, charts } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-forest-700">Reports</h1>
          <p className="text-sm text-forest-500/45 mt-1">Revenue, booking trends, and performance insights</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => handleExport('bookings')}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-forest-100">
                <DollarSign className="w-5 h-5 text-forest-600" />
              </div>
              <div>
                <p className="text-xs text-forest-500/45 font-medium">Total Revenue</p>
                <p className="text-xl font-bold text-forest-700">{formatPHP(summary.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <CalendarCheck className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <p className="text-xs text-forest-500/45 font-medium">Confirmed Bookings</p>
                <p className="text-xl font-bold text-forest-700">{summary.confirmedBookings}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <TrendingUp className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <p className="text-xs text-forest-500/45 font-medium">Avg. Booking Value</p>
                <p className="text-xl font-bold text-forest-700">{formatPHP(summary.avgBookingValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-100">
                <XCircle className="w-5 h-5 text-rose-700" />
              </div>
              <div>
                <p className="text-xs text-forest-500/45 font-medium">Cancelled</p>
                <p className="text-xl font-bold text-forest-700">{summary.cancelledBookings}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue over time chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {charts.revenueOverTime.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={charts.revenueOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#71717a' }}
                  tickFormatter={(v: string) => {
                    const d = new Date(v);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                <YAxis tick={{ fontSize: 11, fill: '#71717a' }} />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => formatPHP(Number(value) || 0)}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  labelFormatter={(label: any) => new Date(String(label)).toLocaleDateString()}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#059669"
                  fill="#d1fae5"
                  name="Revenue"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-forest-500/35 py-12">No data for this period</p>
          )}
        </CardContent>
      </Card>

      {/* Two column: Revenue by type + Status distribution */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue by Accommodation Type</CardTitle>
          </CardHeader>
          <CardContent>
            {charts.revenueByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={charts.revenueByType}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#71717a' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#71717a' }} />
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <Tooltip formatter={(value: any) => formatPHP(Number(value) || 0)} />
                  <Bar dataKey="value" name="Revenue">
                    {charts.revenueByType.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-forest-500/35 py-12">No data</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Booking Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {charts.statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={charts.statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    label={({ name, percent }: any) => `${statusLabel(name || '')} ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {charts.statusDistribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <Legend formatter={(value: any) => statusLabel(String(value))} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-forest-500/35 py-12">No data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Export section */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-medium text-forest-700">Data Exports</h3>
              <p className="text-sm text-forest-500/45">Download CSV files for analysis</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExport('bookings')}>
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Bookings CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('guests')}>
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Guests CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
