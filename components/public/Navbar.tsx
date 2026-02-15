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
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        isScrolled
          ? 'bg-white/90 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border-b border-forest-100/50'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span
              className={cn(
                'text-lg md:text-xl font-body font-semibold tracking-tight transition-colors duration-300',
                isScrolled ? 'text-forest-500' : 'text-white'
              )}
            >
              {tenantName}
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-2 text-[13px] font-body font-medium tracking-wide uppercase rounded-md transition-all duration-200',
                  isScrolled
                    ? 'text-forest-500/70 hover:text-forest-500 hover:bg-forest-50'
                    : 'text-white/75 hover:text-white hover:bg-white/10'
                )}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA + Phone */}
          <div className="hidden lg:flex items-center gap-4">
            {phone && (
              <a
                href={`tel:${phone}`}
                className={cn(
                  'flex items-center gap-1.5 text-sm font-body font-medium transition-colors duration-200',
                  isScrolled ? 'text-forest-500/60 hover:text-forest-500' : 'text-white/70 hover:text-white'
                )}
              >
                <Phone className="w-3.5 h-3.5" />
                {phone}
              </a>
            )}
            <Button
              asChild
              variant="terracotta"
              className="rounded-full px-6 transition-all duration-300"
            >
              <Link href="/book">Book Now</Link>
            </Button>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={cn(
              'lg:hidden p-2 rounded-lg transition-all duration-200',
              isScrolled
                ? 'text-forest-500 hover:bg-forest-50'
                : 'text-white hover:bg-white/10'
            )}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          'lg:hidden overflow-hidden transition-all duration-300',
          mobileOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="bg-white/95 backdrop-blur-xl border-t border-forest-100/30 shadow-xl">
          <div className="px-4 py-5 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 text-sm font-body font-medium text-forest-500/80 hover:text-forest-500 hover:bg-forest-50 rounded-lg transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-4 border-t border-forest-100/30 mt-3">
              <Button asChild variant="terracotta" className="w-full rounded-full">
                <Link href="/book" onClick={() => setMobileOpen(false)}>
                  Book Your Stay
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
