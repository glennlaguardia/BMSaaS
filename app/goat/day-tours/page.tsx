'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sun, Users } from 'lucide-react';
import { formatPHP } from '@/lib/pricing';
import { formatDate, statusLabel, statusColor } from '@/lib/utils';

interface DayTourBooking {
  id: string;
  reference_number: string;
  tour_date: string;
  status: string;
  payment_status: string;
  total_amount: number;
  num_adults: number;
  num_children: number;
  guest_first_name: string;
  guest_last_name: string;
  guest_email: string;
  guest_phone: string;
  created_at: string;
}

export default function DayToursPage() {
  const [tours, setTours] = useState<DayTourBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/day-tours')
      .then(r => r.json())
      .then(data => { if (data.success) setTours(data.data); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-forest-700">Day Tours</h1>
        <p className="text-sm text-forest-500/45 mt-1">Manage day tour bookings and capacity</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-forest-500/35" />
        </div>
      ) : tours.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-forest-500/45">
            <Sun className="w-8 h-8 mx-auto mb-2 text-forest-500/25" />
            No day tour bookings yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tours.map((tour) => (
            <Card key={tour.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-50">
                      <Sun className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium text-forest-700">
                        {tour.guest_first_name} {tour.guest_last_name}
                      </p>
                      <p className="text-xs text-forest-500/35 font-mono">{tour.reference_number}</p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-forest-500/45">
                        <span>{formatDate(tour.tour_date)}</span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {tour.num_adults}A + {tour.num_children}C
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold text-forest-700">{formatPHP(tour.total_amount)}</p>
                      <div className="flex gap-1.5 mt-1">
                        <Badge variant={statusColor(tour.status)} className="text-xs">
                          {statusLabel(tour.status)}
                        </Badge>
                        <Badge variant={statusColor(tour.payment_status)} className="text-xs">
                          {statusLabel(tour.payment_status)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
