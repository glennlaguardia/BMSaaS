'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, ChevronLeft, ChevronRight, Loader2, ArrowUpDown, X } from 'lucide-react';
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

  // Sort & filter state
  const [sortBy, setSortBy] = useState('last_visit');
  const [sortOrder, setSortOrder] = useState('desc');
  const [minBookings, setMinBookings] = useState('');

  const fetchGuests = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      sort_by: sortBy,
      sort_order: sortOrder,
    });
    if (search) params.set('search', search);
    if (minBookings) params.set('min_bookings', minBookings);

    try {
      const res = await fetch(`/api/admin/guests?${params}`);
      const data = await res.json();
      if (data.success) {
        setGuests(data.data);
        setTotal(data.pagination.total);
      }
    } catch {
      // Network error — leave state as-is
    } finally {
      setLoading(false);
    }
  }, [page, search, sortBy, sortOrder, minBookings]);

  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  const totalPages = Math.ceil(total / limit);

  const hasFilters = search !== '' || minBookings !== '' || sortBy !== 'last_visit' || sortOrder !== 'desc';

  const clearFilters = () => {
    setSearch('');
    setMinBookings('');
    setSortBy('last_visit');
    setSortOrder('desc');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-forest-700">Guest Database</h1>
        <p className="text-sm text-forest-500/45 mt-1">{total} total guests</p>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-forest-500/45 mb-1 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-500/35" />
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-forest-500/45 mb-1 block">Sort By</label>
              <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setPage(1); }}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="total_bookings">Bookings</SelectItem>
                  <SelectItem value="total_spent">Spent</SelectItem>
                  <SelectItem value="last_visit">Last Visit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-forest-500/45 mb-1 block">Order</label>
              <Button
                variant="outline"
                className="w-full justify-between text-sm"
                onClick={() => { setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc')); setPage(1); }}
              >
                {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                <ArrowUpDown className="w-3.5 h-3.5 ml-2 text-forest-500/45" />
              </Button>
            </div>
            <div>
              <label className="text-xs font-medium text-forest-500/45 mb-1 block">Min Bookings</label>
              <Input
                type="number"
                min="0"
                placeholder="e.g. 2"
                value={minBookings}
                onChange={(e) => { setMinBookings(e.target.value); setPage(1); }}
                className="text-sm"
              />
            </div>
          </div>
          {hasFilters && (
            <div className="mt-3 flex justify-end">
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-forest-500/60 hover:text-forest-700">
                <X className="w-3 h-3 mr-1" />
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Guest Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Guests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-forest-500/35" />
            </div>
          ) : guests.length === 0 ? (
            <p className="text-center text-forest-500/45 py-12">No guests found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-forest-100/30">
                    <th className="text-left py-3 px-2 font-medium text-forest-500/45">Name</th>
                    <th className="text-left py-3 px-2 font-medium text-forest-500/45">Email</th>
                    <th className="text-left py-3 px-2 font-medium text-forest-500/45 hidden md:table-cell">Phone</th>
                    <th className="text-center py-3 px-2 font-medium text-forest-500/45">Bookings</th>
                    <th className="text-right py-3 px-2 font-medium text-forest-500/45 hidden lg:table-cell">Total Spent</th>
                    <th className="text-left py-3 px-2 font-medium text-forest-500/45 hidden lg:table-cell">Last Visit</th>
                  </tr>
                </thead>
                <tbody>
                  {guests.map((guest) => (
                    <tr key={guest.id} className="border-b border-forest-100/30 last:border-0 hover:bg-forest-50">
                      <td className="py-3 px-2 font-medium text-forest-700">
                        {guest.first_name} {guest.last_name}
                      </td>
                      <td className="py-3 px-2 text-forest-500/60">{guest.email}</td>
                      <td className="py-3 px-2 text-forest-500/60 hidden md:table-cell">{guest.phone || '—'}</td>
                      <td className="py-3 px-2 text-center">{guest.total_bookings}</td>
                      <td className="py-3 px-2 text-right hidden lg:table-cell">
                        {formatPHP(guest.total_spent)}
                      </td>
                      <td className="py-3 px-2 text-forest-500/60 hidden lg:table-cell">
                        {guest.last_visit ? formatDate(guest.last_visit) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-forest-100/30">
              <p className="text-sm text-forest-500/45">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
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
