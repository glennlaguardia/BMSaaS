'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { formatDateTime, statusLabel, statusColor } from '@/lib/utils';

interface LogEntry {
  id: string;
  booking_id: string | null;
  day_tour_booking_id: string | null;
  booking_type: string;
  field_changed: string;
  old_value: string | null;
  new_value: string;
  change_source: string;
  notes: string | null;
  created_at: string;
  admin_users: { full_name: string | null; username: string } | null;
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Filter state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bookingType, setBookingType] = useState('all');
  const [fieldChanged, setFieldChanged] = useState('all');
  const [changeSource, setChangeSource] = useState('all');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });

    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);
    if (bookingType !== 'all') params.set('booking_type', bookingType);
    if (fieldChanged !== 'all') params.set('field_changed', fieldChanged);
    if (changeSource !== 'all') params.set('change_source', changeSource);

    try {
      const res = await fetch(`/api/admin/audit-log?${params}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
        setTotal(data.pagination.total);
      }
    } catch {
      // Network error — leave state as-is
    } finally {
      setLoading(false);
    }
  }, [page, startDate, endDate, bookingType, fieldChanged, changeSource]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const totalPages = Math.ceil(total / limit);

  const hasFilters =
    startDate !== '' ||
    endDate !== '' ||
    bookingType !== 'all' ||
    fieldChanged !== 'all' ||
    changeSource !== 'all';

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setBookingType('all');
    setFieldChanged('all');
    setChangeSource('all');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-forest-700">Audit Log</h1>
        <p className="text-sm text-forest-500/45 mt-1">
          Complete history of booking status changes
          {total > 0 && ` · ${total} total entries`}
        </p>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-xs font-medium text-forest-500/45 mb-1 block">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-forest-500/45 mb-1 block">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-forest-500/45 mb-1 block">Booking Type</label>
              <Select value={bookingType} onValueChange={(v) => { setBookingType(v); setPage(1); }}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="overnight">Overnight</SelectItem>
                  <SelectItem value="day_tour">Day Tour</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-forest-500/45 mb-1 block">Field Changed</label>
              <Select value={fieldChanged} onValueChange={(v) => { setFieldChanged(v); setPage(1); }}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fields</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="payment_status">Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-forest-500/45 mb-1 block">Source</label>
              <Select value={changeSource} onValueChange={(v) => { setChangeSource(v); setPage(1); }}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="guest">Guest</SelectItem>
                  <SelectItem value="cron">Cron</SelectItem>
                </SelectContent>
              </Select>
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

      {/* Activity List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-forest-500/35" />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-center text-forest-500/45 py-12">No activity recorded yet.</p>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-forest-50">
                  <div className="w-2 h-2 rounded-full bg-forest-100/30 mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-forest-700">
                      <span className="font-medium capitalize">{log.booking_type.replace('_', ' ')}</span>
                      {' · '}
                      <span className="font-medium">{statusLabel(log.field_changed)}</span>
                      {log.old_value && (
                        <>
                          {' '}from <Badge variant="outline" className="text-xs">{statusLabel(log.old_value)}</Badge>
                        </>
                      )}
                      {' '}to <Badge variant={statusColor(log.new_value)} className="text-xs">{statusLabel(log.new_value)}</Badge>
                    </p>
                    <p className="text-xs text-forest-500/35 mt-1">
                      {formatDateTime(log.created_at)}
                      {' · '}
                      {log.change_source === 'admin' && log.admin_users
                        ? `by ${log.admin_users.full_name || log.admin_users.username}`
                        : log.change_source}
                      {log.notes && ` · ${log.notes}`}
                    </p>
                  </div>
                </div>
              ))}
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
