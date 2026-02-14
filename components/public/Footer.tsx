import Link from 'next/link';

interface FooterProps {
  tenantName: string;
  phone?: string | null;
  email?: string | null;
  facebookUrl?: string | null;
}

export function Footer({ tenantName, phone, email, facebookUrl }: FooterProps) {
  return (
    <footer className="bg-[#1a3409] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-lg font-bold text-white">{tenantName}</h3>
            <p className="text-white/50 text-sm mt-2">
              Luxury glamping and agri-tourism in the highlands.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <p className="text-white/70 font-medium text-sm mb-3">Quick Links</p>
            <div className="space-y-2">
              <a href="#accommodations" className="block text-white/50 hover:text-white text-sm transition-colors">
                Accommodations
              </a>
              <a href="#pricing" className="block text-white/50 hover:text-white text-sm transition-colors">
                Rates
              </a>
              <Link href="/book" className="block text-white/50 hover:text-white text-sm transition-colors">
                Book Now
              </Link>
              <Link href="/day-tour" className="block text-white/50 hover:text-white text-sm transition-colors">
                Day Tour
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="text-white/70 font-medium text-sm mb-3">Contact</p>
            <div className="space-y-2 text-sm text-white/50">
              {phone && <p>{phone}</p>}
              {email && <p>{email}</p>}
              {facebookUrl && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors block"
                >
                  Facebook Page
                </a>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <p className="text-white/70 font-medium text-sm mb-3">Booking</p>
            <div className="space-y-2 text-sm text-white/50">
              <Link href="/book/status" className="hover:text-white transition-colors block">
                Check Booking Status
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/30">
            &copy; {new Date().getFullYear()} {tenantName}. All rights reserved.
          </p>
          <p className="text-xs text-white/30">
            Powered by BudaBook
          </p>
        </div>
      </div>
    </footer>
  );
}
