'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
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

  useEffect(() => {
    fetch('/api/admin/audit-log')
      .then(r => r.json())
      .then(data => {
        if (data.success) setLogs(data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Audit Log</h1>
        <p className="text-sm text-zinc-500 mt-1">Complete history of booking status changes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-center text-zinc-500 py-12">No activity recorded yet.</p>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-zinc-50">
                  <div className="w-2 h-2 rounded-full bg-zinc-300 mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-zinc-700">
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
                    <p className="text-xs text-zinc-400 mt-1">
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
        </CardContent>
      </Card>
    </div>
  );
}
