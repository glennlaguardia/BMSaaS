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
    <header className="h-14 bg-white border-b border-zinc-200 flex items-center justify-between px-4 md:px-6 lg:px-8">
      <div className="lg:hidden w-8" /> {/* Spacer for mobile menu button */}
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-zinc-900">{displayName}</p>
          <p className="text-xs text-zinc-500 capitalize">{admin?.role?.replace('_', ' ') || ''}</p>
        </div>
        <Avatar className="w-8 h-8">
          <AvatarFallback className="bg-emerald-100 text-emerald-800 text-xs font-medium">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
