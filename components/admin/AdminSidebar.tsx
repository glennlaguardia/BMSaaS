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
  BarChart3,
  ClipboardList,
  Settings,
  LogOut,
  Menu,
  X,
  Leaf,
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
        className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-lg bg-white shadow-md border border-forest-100/30 hover:bg-forest-50 transition-colors"
        aria-label="Toggle navigation"
      >
        {isOpen ? (
          <X className="w-5 h-5 text-forest-500" />
        ) : (
          <Menu className="w-5 h-5 text-forest-500" />
        )}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-forest-700/30 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-64 bg-white border-r border-forest-100/30 z-40 flex flex-col transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-forest-100/20">
          <Link href="/goat/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-forest-500 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <span className="font-semibold text-forest-700 text-[15px]">BudaBook</span>
              <span className="text-[10px] text-forest-500/35 font-semibold tracking-wider uppercase ml-1.5">Admin</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {navSections.map((section) => (
            <div key={section.label} className="mb-5">
              <p className="text-[10px] font-bold text-forest-500/30 uppercase tracking-[0.15em] px-2.5 mb-1.5">
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
                      'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-all duration-200',
                      isActive
                        ? 'bg-forest-50 text-forest-600 font-semibold shadow-sm'
                        : 'text-forest-500/55 hover:bg-forest-50/50 hover:text-forest-500'
                    )}
                  >
                    <Icon className={cn('w-4 h-4', isActive ? 'text-forest-500' : 'text-forest-500/35')} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-forest-100/20">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] text-forest-500/50 hover:bg-red-50 hover:text-red-600 w-full transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
