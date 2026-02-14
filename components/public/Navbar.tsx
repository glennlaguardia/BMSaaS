'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Menu, X, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  tenantName: string;
  phone?: string | null;
}

const navLinks = [
  { href: '#about', label: 'About' },
  { href: '#accommodations', label: 'Stay' },
  { href: '#activities', label: 'Experience' },
  { href: '#pricing', label: 'Rates' },
  { href: '#gallery', label: 'Gallery' },
  { href: '#location', label: 'Getting Here' },
  { href: '#contact', label: 'Contact' },
];

export function Navbar({ tenantName, phone }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-stone-200'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span
              className={cn(
                'text-lg md:text-xl font-bold tracking-tight transition-colors',
                isScrolled ? 'text-[#2D5016]' : 'text-white'
              )}
            >
              {tenantName}
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isScrolled
                    ? 'text-stone-600 hover:text-[#2D5016] hover:bg-stone-50'
                    : 'text-white/90 hover:text-white hover:bg-white/10'
                )}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA + Phone */}
          <div className="hidden lg:flex items-center gap-3">
            {phone && (
              <a
                href={`tel:${phone}`}
                className={cn(
                  'flex items-center gap-1.5 text-sm transition-colors',
                  isScrolled ? 'text-stone-500 hover:text-[#2D5016]' : 'text-white/80 hover:text-white'
                )}
              >
                <Phone className="w-3.5 h-3.5" />
                {phone}
              </a>
            )}
            <Button
              asChild
              className="bg-[#2D5016] hover:bg-[#1e3a0f] text-white rounded-full px-6"
            >
              <Link href="/book">Book Now</Link>
            </Button>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={cn(
              'lg:hidden p-2 rounded-md transition-colors',
              isScrolled ? 'text-stone-600' : 'text-white'
            )}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-stone-200 shadow-lg">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium text-stone-700 hover:text-[#2D5016] hover:bg-stone-50 rounded-md"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 border-t border-stone-100 mt-2">
              <Button asChild className="w-full bg-[#2D5016] hover:bg-[#1e3a0f] text-white">
                <Link href="/book" onClick={() => setMobileOpen(false)}>
                  Book Your Stay
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
