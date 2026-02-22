'use client';

import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Search, Eye, ChevronLeft, ChevronRight, Loader2, Sun, CalendarDays } from 'lucide-react';
import { formatDate, statusLabel, statusColor } from '@/lib/utils';
import { formatPHP } from '@/lib/pricing';
import Link from 'next/link';

interface DayTourBooking {
    id: string;
    reference_number: string;
    guest_first_name: string;
    guest_last_name: string;
    guest_email: string;
    guest_phone: string;
    tour_date: string;
    num_adults: number;
    num_children: number;
    status: string;
    payment_status: string;
    total_amount: number;
    created_at: string;
}

export default function DayToursPage() {
    const [bookings, setBookings] = useState<DayTourBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 20;

    const fetchBookings = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({
            page: String(page),
            limit: String(limit),
        });
        if (search) params.set('search', search);
        if (status !== 'all') params.set('status', status);
        if (fromDate) params.set('from_date', fromDate);
        if (toDate) params.set('to_date', toDate);

        try {
            const res = await fetch(`/api/admin/day-tours?${params}`);
            const data = await res.json();
            if (data.success) {
                setBookings(data.data);
                setTotal(data.pagination.total);
            }
        } finally {
            setLoading(false);
        }
    }, [page, search, status, fromDate, toDate]);

    useEffect(() => { fetchBookings(); }, [fetchBookings]);

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-forest-700 flex items-center gap-2">
                        <Sun className="w-6 h-6 text-amber-500" />
                        Day Tours
                    </h1>
                    <p className="text-sm text-forest-500/45 mt-1">{total} total day tour bookings</p>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6 space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-500/35" />
                            <Input
                                placeholder="Search by reference, name, or email..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                className="pl-9"
                            />
                        </div>
                        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 items-end">
                        <div className="flex items-center gap-2">
                            <CalendarDays className="w-4 h-4 text-forest-500/35 flex-shrink-0" />
                            <div>
                                <Label className="text-xs text-forest-500/45">Tour date from</Label>
                                <Input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                                    className="w-[160px]"
                                />
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs text-forest-500/45">Tour date to</Label>
                            <Input
                                type="date"
                                value={toDate}
                                onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                                className="w-[160px]"
                            />
                        </div>
                        {(fromDate || toDate) && (
                            <Button variant="ghost" size="sm" onClick={() => { setFromDate(''); setToDate(''); setPage(1); }}>
                                Clear dates
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Day Tour Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-forest-500/35" />
                        </div>
                    ) : bookings.length === 0 ? (
                        <p className="text-center text-forest-500/45 py-12">No day tour bookings found.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-2 font-medium text-forest-500/45">Ref</th>
                                        <th className="text-left py-3 px-2 font-medium text-forest-500/45">Guest</th>
                                        <th className="text-left py-3 px-2 font-medium text-forest-500/45 hidden md:table-cell">Tour Date</th>
                                        <th className="text-left py-3 px-2 font-medium text-forest-500/45 hidden lg:table-cell">Guests</th>
                                        <th className="text-left py-3 px-2 font-medium text-forest-500/45">Status</th>
                                        <th className="text-left py-3 px-2 font-medium text-forest-500/45">Payment</th>
                                        <th className="text-right py-3 px-2 font-medium text-forest-500/45">Amount</th>
                                        <th className="text-right py-3 px-2 font-medium text-forest-500/45"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.map((b) => (
                                        <tr key={b.id} className="border-b last:border-0 hover:bg-forest-50">
                                            <td className="py-3 px-2">
                                                <span className="font-mono text-xs text-forest-700">{b.reference_number}</span>
                                            </td>
                                            <td className="py-3 px-2">
                                                <p className="font-medium text-forest-700">{b.guest_first_name} {b.guest_last_name}</p>
                                                <p className="text-xs text-forest-500/35">{b.guest_email}</p>
                                            </td>
                                            <td className="py-3 px-2 hidden md:table-cell text-forest-500/60">
                                                {formatDate(b.tour_date)}
                                            </td>
                                            <td className="py-3 px-2 hidden lg:table-cell text-forest-500/60 text-xs">
                                                {b.num_adults} adult{b.num_adults !== 1 ? 's' : ''}
                                                {b.num_children > 0 && `, ${b.num_children} child${b.num_children !== 1 ? 'ren' : ''}`}
                                            </td>
                                            <td className="py-3 px-2">
                                                <Badge variant={statusColor(b.status)}>{statusLabel(b.status)}</Badge>
                                            </td>
                                            <td className="py-3 px-2">
                                                <Badge variant={statusColor(b.payment_status)}>{statusLabel(b.payment_status)}</Badge>
                                            </td>
                                            <td className="py-3 px-2 text-right font-medium text-forest-700">
                                                {formatPHP(b.total_amount)}
                                            </td>
                                            <td className="py-3 px-2 text-right">
                                                <Button asChild variant="ghost" size="sm">
                                                    <Link href={`/dashboard/day-tours/${b.id}`}>
                                                        <Eye className="w-4 h-4" />
                                                    </Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <p className="text-sm text-forest-500/45">
                                Page {page} of {totalPages}
                            </p>
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
