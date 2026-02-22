'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ChevronLeft, ChevronRight, Bed, Sun, CalendarCheck } from 'lucide-react';
import { cn, statusColor, statusLabel } from '@/lib/utils';
import Link from 'next/link';

interface CalendarBooking {
  id: string;
  reference_number: string;
  status: string;
  check_in_date: string;
  check_out_date: string;
  guest_first_name: string;
  guest_last_name: string;
  rooms: { name: string } | null;
  accommodation_types: { name: string } | null;
}

interface CalendarDayTour {
  id: string;
  reference_number: string;
  status: string;
  tour_date: string;
  num_adults: number;
  num_children: number;
  guest_first_name: string;
  guest_last_name: string;
}

export default function CalendarPage() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [dayTours, setDayTours] = useState<CalendarDayTour[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'bookings' | 'day_tours'

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/calendar?month=${month}&year=${year}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setBookings(data.data.bookings);
          setDayTours(data.data.dayTours);
        }
      })
      .finally(() => setLoading(false));
  }, [month, year]);

  const navigate = (dir: -1 | 1) => {
    let newMonth = month + dir;
    let newYear = year;
    if (newMonth < 1) { newMonth = 12; newYear--; }
    if (newMonth > 12) { newMonth = 1; newYear++; }
    setMonth(newMonth);
    setYear(newYear);
    setSelectedDate(null);
  };

  const goToToday = useCallback(() => {
    const now = new Date();
    setMonth(now.getMonth() + 1);
    setYear(now.getFullYear());
    setSelectedDate(now.toISOString().split('T')[0]);
  }, []);

  const monthLabel = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Apply filters
  const filteredBookings = useMemo(() => {
    let result = bookings;
    if (statusFilter !== 'all') {
      result = result.filter(b => b.status === statusFilter);
    }
    return result;
  }, [bookings, statusFilter]);

  const filteredDayTours = useMemo(() => {
    let result = dayTours;
    if (statusFilter !== 'all') {
      result = result.filter(dt => dt.status === statusFilter);
    }
    return result;
  }, [dayTours, statusFilter]);

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [month, year]);

  // Map date strings to events
  const eventsByDate = useMemo(() => {
    const map: Record<string, { bookings: CalendarBooking[]; dayTours: CalendarDayTour[] }> = {};

    if (typeFilter !== 'day_tours') {
      for (const b of filteredBookings) {
        const checkIn = new Date(b.check_in_date);
        const checkOut = new Date(b.check_out_date);
        const cursor = new Date(checkIn);
        while (cursor < checkOut) {
          const key = cursor.toISOString().split('T')[0];
          if (!map[key]) map[key] = { bookings: [], dayTours: [] };
          map[key].bookings.push(b);
          cursor.setDate(cursor.getDate() + 1);
        }
      }
    }

    if (typeFilter !== 'bookings') {
      for (const dt of filteredDayTours) {
        const key = dt.tour_date;
        if (!map[key]) map[key] = { bookings: [], dayTours: [] };
        map[key].dayTours.push(dt);
      }
    }

    return map;
  }, [filteredBookings, filteredDayTours, typeFilter]);

  const selectedEvents = selectedDate ? eventsByDate[selectedDate] : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-forest-700">Booking Calendar</h1>
          <p className="text-sm text-forest-500/45 mt-1">Visual overview of reservations and day tours</p>
        </div>
        <Button variant="outline" size="sm" onClick={goToToday}>
          <CalendarCheck className="w-4 h-4 mr-2" />
          Today
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="flex flex-wrap gap-3 items-center">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="bookings">Overnight Only</SelectItem>
                <SelectItem value="day_tours">Day Tours Only</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="checked_in">Checked In</SelectItem>
                <SelectItem value="checked_out">Checked Out</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 ml-auto text-xs text-forest-500/50">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-forest-50 border border-forest-200" />
                <span>Overnight</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-amber-50 border border-amber-200" />
                <span>Day Tour</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <CardTitle className="text-lg">{monthLabel}</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate(1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-forest-500/35" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-px bg-forest-100/30 rounded-lg overflow-hidden">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="bg-cream-50 px-2 py-1.5 text-center text-xs font-semibold text-forest-500/45">
                  {d}
                </div>
              ))}

              {/* Calendar cells */}
              {calendarDays.map((day, i) => {
                if (day === null) {
                  return <div key={`empty-${i}`} className="bg-white min-h-[80px]" />;
                }
                const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const events = eventsByDate[dateStr];
                const hasEvents = events && (events.bookings.length > 0 || events.dayTours.length > 0);
                const isToday = dateStr === new Date().toISOString().split('T')[0];
                const isSelected = dateStr === selectedDate;

                return (
                  <div
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                    className={cn(
                      'bg-white min-h-[80px] p-1.5 cursor-pointer hover:bg-cream-50 transition-colors',
                      isSelected && 'ring-2 ring-forest-500 ring-inset',
                    )}
                  >
                    <span className={cn(
                      'text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full',
                      isToday && 'bg-forest-500 text-white',
                      !isToday && 'text-forest-700',
                    )}>
                      {day}
                    </span>
                    {hasEvents && (
                      <div className="mt-0.5 space-y-0.5">
                        {events.bookings.slice(0, 2).map(b => (
                          <div key={b.id} className="text-[10px] px-1 py-0.5 rounded bg-forest-50 text-forest-700 truncate">
                            <Bed className="w-2.5 h-2.5 inline mr-0.5" />
                            {b.rooms?.name ? `${b.rooms.name}-${b.guest_last_name}` : b.guest_last_name}
                          </div>
                        ))}
                        {events.bookings.length > 2 && (
                          <div className="text-[10px] text-forest-500/35 px-1">
                            +{events.bookings.length - 2} more
                          </div>
                        )}
                        {events.dayTours.slice(0, 1).map(dt => (
                          <div key={dt.id} className="text-[10px] px-1 py-0.5 rounded bg-amber-50 text-amber-800 truncate">
                            <Sun className="w-2.5 h-2.5 inline mr-0.5" />
                            {dt.num_adults + dt.num_children} pax
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected day detail panel */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedEvents || (selectedEvents.bookings.length === 0 && selectedEvents.dayTours.length === 0) ? (
              <p className="text-sm text-forest-500/35">No events on this day.</p>
            ) : (
              <div className="space-y-3">
                {selectedEvents.bookings.map(b => (
                  <Link
                    key={b.id}
                    href={`/dashboard/bookings/${b.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-cream-50 border hover:bg-cream-100 transition-colors cursor-pointer"
                  >
                    <div>
                      <p className="font-medium text-forest-700 text-sm">
                        {b.guest_first_name} {b.guest_last_name}
                      </p>
                      <p className="text-xs text-forest-500/45">
                        {b.rooms?.name ? `${b.rooms.name} · ` : ''}{b.accommodation_types?.name || ''}
                      </p>
                      <p className="text-xs text-forest-500/35 font-mono">{b.reference_number}</p>
                    </div>
                    <Badge variant={statusColor(b.status)} className="text-xs">
                      {statusLabel(b.status)}
                    </Badge>
                  </Link>
                ))}
                {selectedEvents.dayTours.map(dt => (
                  <Link
                    key={dt.id}
                    href={`/dashboard/day-tours/${dt.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                  >
                    <div>
                      <p className="font-medium text-amber-900 text-sm flex items-center gap-1">
                        <Sun className="w-3.5 h-3.5" />
                        Day Tour · {dt.guest_first_name} {dt.guest_last_name}
                      </p>
                      <p className="text-xs text-amber-700">
                        {dt.num_adults} adults, {dt.num_children} children
                      </p>
                    </div>
                    <Badge variant={statusColor(dt.status)} className="text-xs">
                      {statusLabel(dt.status)}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
