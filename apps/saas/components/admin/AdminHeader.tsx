'use client';

import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

interface AdminInfo {
  full_name: string | null;
  username: string;
  role: string;
}

export function AdminHeader() {
  const [admin, setAdmin] = useState<AdminInfo | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAdmin(data.data);
        }
      })
      .catch(() => {});
  }, []);

  const displayName = admin?.full_name || admin?.username || 'Admin';

  return (
    <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-forest-100/20 flex items-center justify-between px-4 md:px-6 lg:px-8 sticky top-0 z-30">
      <div className="lg:hidden w-10" />
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-forest-700">{displayName}</p>
          <p className="text-[11px] text-forest-500/40 capitalize font-medium">{admin?.role?.replace('_', ' ') || ''}</p>
        </div>
        <Avatar className="w-9 h-9 shadow-sm">
          <AvatarFallback className="bg-forest-50 text-forest-600 text-xs font-bold border border-forest-100/30">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
