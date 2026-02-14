'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { formatPHP } from '@/lib/pricing';

interface Guest {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  total_bookings: number;
  total_spent: number;
  first_visit: string | null;
  last_visit: string | null;
  created_at: string;
}

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchGuests = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);

    const res = await fetch(`/api/admin/guests?${params}`);
    const data = await res.json();
    if (data.success) {
      setGuests(data.data);
      setTotal(data.pagination.total);
    }
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchGuests(); }, [fetchGuests]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Guest Database</h1>
        <p className="text-sm text-zinc-500 mt-1">{total} total guests</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Guests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
            </div>
          ) : guests.length === 0 ? (
            <p className="text-center text-zinc-500 py-12">No guests found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium text-zinc-500">Name</th>
                    <th className="text-left py-3 px-2 font-medium text-zinc-500">Email</th>
                    <th className="text-left py-3 px-2 font-medium text-zinc-500 hidden md:table-cell">Phone</th>
                    <th className="text-center py-3 px-2 font-medium text-zinc-500">Bookings</th>
                    <th className="text-right py-3 px-2 font-medium text-zinc-500 hidden lg:table-cell">Total Spent</th>
                    <th className="text-left py-3 px-2 font-medium text-zinc-500 hidden lg:table-cell">Last Visit</th>
                  </tr>
                </thead>
                <tbody>
                  {guests.map((guest) => (
                    <tr key={guest.id} className="border-b last:border-0 hover:bg-zinc-50">
                      <td className="py-3 px-2 font-medium text-zinc-900">
                        {guest.first_name} {guest.last_name}
                      </td>
                      <td className="py-3 px-2 text-zinc-600">{guest.email}</td>
                      <td className="py-3 px-2 text-zinc-600 hidden md:table-cell">{guest.phone || '—'}</td>
                      <td className="py-3 px-2 text-center">{guest.total_bookings}</td>
                      <td className="py-3 px-2 text-right hidden lg:table-cell">
                        {formatPHP(guest.total_spent)}
                      </td>
                      <td className="py-3 px-2 text-zinc-600 hidden lg:table-cell">
                        {guest.last_visit ? formatDate(guest.last_visit) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-zinc-500">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
