import Link from 'next/link';

interface FooterProps {
  tenantName: string;
  phone?: string | null;
  email?: string | null;
  facebookUrl?: string | null;
}

export function Footer({ tenantName, phone, email, facebookUrl }: FooterProps) {
  return (
    <footer className="relative bg-forest-700 py-16 overflow-hidden">
      {/* Subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-forest-700 to-forest-900/90" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <h3 className="font-display text-xl font-semibold text-white tracking-tight">{tenantName}</h3>
            <p className="text-white/35 text-sm mt-3 leading-relaxed">
              Luxury glamping and agri-tourism in the highlands.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <p className="text-white/50 font-semibold text-xs tracking-[0.15em] uppercase mb-4">Quick Links</p>
            <div className="space-y-2.5">
              <a href="#accommodations" className="block text-white/40 hover:text-white text-sm transition-colors duration-200">
                Accommodations
              </a>
              <a href="#pricing" className="block text-white/40 hover:text-white text-sm transition-colors duration-200">
                Rates
              </a>
              <Link href="/book" className="block text-white/40 hover:text-white text-sm transition-colors duration-200">
                Book Now
              </Link>
              <Link href="/day-tour" className="block text-white/40 hover:text-white text-sm transition-colors duration-200">
                Day Tour
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="text-white/50 font-semibold text-xs tracking-[0.15em] uppercase mb-4">Contact</p>
            <div className="space-y-2.5 text-sm text-white/40">
              {phone && <p>{phone}</p>}
              {email && <p>{email}</p>}
              {facebookUrl && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors duration-200 block"
                >
                  Facebook Page
                </a>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <p className="text-white/50 font-semibold text-xs tracking-[0.15em] uppercase mb-4">Booking</p>
            <div className="space-y-2.5 text-sm text-white/40">
              <Link href="/book/status" className="hover:text-white transition-colors duration-200 block">
                Check Booking Status
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-14 pt-7 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/20 font-medium">
            &copy; {new Date().getFullYear()} {tenantName}. All rights reserved.
          </p>
          <p className="text-xs text-white/20 font-medium">
            Powered by Nexus Solutions
          </p>
        </div>
      </div>
    </footer>
  );
}
