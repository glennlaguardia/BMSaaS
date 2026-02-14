'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  Sun,
  Users,
  Bed,
  Package,
  Percent,
  PanelLeft,
  FileText,
  Globe,
  Palette,
  Eye,
  BarChart3,
  ClipboardList,
  Settings,
  LogOut,
} from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const navSections = [
  {
    label: 'Overview',
    items: [
      { href: '/goat/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Bookings',
    items: [
      { href: '/goat/bookings', label: 'Bookings', icon: BookOpen },
      { href: '/goat/calendar', label: 'Calendar', icon: CalendarDays },
      { href: '/goat/day-tours', label: 'Day Tours', icon: Sun },
    ],
  },
  {
    label: 'Guests',
    items: [
      { href: '/goat/guests', label: 'Guest Database', icon: Users },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { href: '/goat/accommodations', label: 'Accommodations', icon: Bed },
      { href: '/goat/addons', label: 'Add-ons', icon: Package },
      { href: '/goat/rates', label: 'Rate Adjustments', icon: Percent },
    ],
  },
  {
    label: 'Website',
    items: [
      { href: '/goat/site/sections', label: 'Sections', icon: PanelLeft },
      { href: '/goat/site/branding', label: 'Branding', icon: Palette },
      { href: '/goat/site/preview', label: 'Preview', icon: Eye },
    ],
  },
  {
    label: 'Reports',
    items: [
      { href: '/goat/reports', label: 'Reports', icon: BarChart3 },
      { href: '/goat/audit-log', label: 'Audit Log', icon: ClipboardList },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/goat/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/goat');
    router.refresh();
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-md bg-white shadow-md border border-zinc-200"
      >
        <FileText className="w-5 h-5 text-zinc-600" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-64 bg-white border-r border-zinc-200 z-40 flex flex-col transition-transform duration-200',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-zinc-200">
          <Link href="/goat/dashboard" className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-700" />
            <span className="font-semibold text-zinc-900">BudaBook</span>
            <span className="text-xs text-zinc-400 font-normal">Admin</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          {navSections.map((section) => (
            <div key={section.label} className="mb-4">
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-2 mb-1">
                {section.label}
              </p>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors',
                      isActive
                        ? 'bg-emerald-50 text-emerald-800 font-medium'
                        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                    )}
                  >
                    <Icon className={cn('w-4 h-4', isActive ? 'text-emerald-700' : 'text-zinc-400')} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-zinc-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 w-full transition-colors"
          >
            <LogOut className="w-4 h-4 text-zinc-400" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
