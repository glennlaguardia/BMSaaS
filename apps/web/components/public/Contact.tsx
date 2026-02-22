'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Phone, Mail, Facebook, Send, Loader2 } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ContactProps {
  content: {
    heading?: string;
    subtitle?: string;
    show_inquiry_form?: boolean;
  };
  phone?: string | null;
  phone2?: string | null;
  email?: string | null;
  facebookUrl?: string | null;
}

export function Contact({ content, phone, phone2, email, facebookUrl }: ContactProps) {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);
  const headerReveal = useScrollReveal<HTMLDivElement>();
  const contentReveal = useScrollReveal<HTMLDivElement>({ threshold: 0.1 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      const apiBase = process.env.NEXT_PUBLIC_SAAS_API_URL || 'http://localhost:3000';
      const res = await fetch(`${apiBase}/api/public/inquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success('Message sent! We\'ll get back to you soon.');
        setFormData({ name: '', email: '', message: '' });
      } else {
        toast.error('Failed to send message. Please try again.');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contact" className="relative py-24 md:py-32 bg-primary overflow-hidden">
      {/* Atmospheric overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-forest-400/30 via-transparent to-transparent" />
      <div className="absolute inset-0 grain pointer-events-none opacity-30" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={headerReveal.ref}
          className={cn('text-center max-w-2xl mx-auto mb-16 reveal', headerReveal.isVisible && 'visible')}
        >
          <p className="text-accent font-body font-semibold tracking-[0.2em] uppercase text-xs mb-4">
            Contact
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-white leading-[1.15] tracking-tight">
            {content.heading || 'Get in Touch'}
          </h2>
          <p className="text-white/45 mt-4 text-[15px]">
            {content.subtitle || 'For inquiries and reservations'}
          </p>
        </div>

        <div
          ref={contentReveal.ref}
          className={cn(
            'grid lg:grid-cols-2 gap-12 lg:gap-16 reveal',
            contentReveal.isVisible && 'visible'
          )}
        >
          {/* Contact Info */}
          <div className="space-y-5">
            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex items-center gap-4 text-white/70 hover:text-white transition-colors duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-white/[0.07] flex items-center justify-center group-hover:bg-white/[0.12] transition-colors border border-white/[0.06]">
                  <Phone className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <p className="text-xs text-white/35 font-medium tracking-wider uppercase">Primary Phone</p>
                  <p className="font-medium mt-0.5">{phone}</p>
                </div>
              </a>
            )}

            {phone2 && (
              <a
                href={`tel:${phone2}`}
                className="flex items-center gap-4 text-white/70 hover:text-white transition-colors duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-white/[0.07] flex items-center justify-center group-hover:bg-white/[0.12] transition-colors border border-white/[0.06]">
                  <Phone className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <p className="text-xs text-white/35 font-medium tracking-wider uppercase">Secondary Phone</p>
                  <p className="font-medium mt-0.5">{phone2}</p>
                </div>
              </a>
            )}

            {email && (
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-4 text-white/70 hover:text-white transition-colors duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-white/[0.07] flex items-center justify-center group-hover:bg-white/[0.12] transition-colors border border-white/[0.06]">
                  <Mail className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <p className="text-xs text-white/35 font-medium tracking-wider uppercase">Email</p>
                  <p className="font-medium mt-0.5">{email}</p>
                </div>
              </a>
            )}

            {facebookUrl && (
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 text-white/70 hover:text-white transition-colors duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-white/[0.07] flex items-center justify-center group-hover:bg-white/[0.12] transition-colors border border-white/[0.06]">
                  <Facebook className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <p className="text-xs text-white/35 font-medium tracking-wider uppercase">Facebook</p>
                  <p className="font-medium mt-0.5">Visit our page</p>
                </div>
              </a>
            )}
          </div>

          {/* Inquiry Form */}
          {content.show_inquiry_form !== false && (
            <form onSubmit={handleSubmit} className="space-y-5 bg-white/[0.05] backdrop-blur-sm rounded-2xl p-7 border border-white/[0.08]">
              <div>
                <Label htmlFor="contact-name" className="text-white/60 text-xs font-medium tracking-wider uppercase">
                  Name
                </Label>
                <Input
                  id="contact-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-2 bg-white/[0.06] border-white/[0.1] text-white placeholder:text-white/25 focus:border-amber-300/40 focus:ring-amber-300/20 rounded-lg"
                  placeholder="Your full name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="contact-email" className="text-white/60 text-xs font-medium tracking-wider uppercase">
                  Email
                </Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-2 bg-white/[0.06] border-white/[0.1] text-white placeholder:text-white/25 focus:border-amber-300/40 focus:ring-amber-300/20 rounded-lg"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="contact-message" className="text-white/60 text-xs font-medium tracking-wider uppercase">
                  Message
                </Label>
                <Textarea
                  id="contact-message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="mt-2 bg-white/[0.06] border-white/[0.1] text-white placeholder:text-white/25 focus:border-amber-300/40 focus:ring-amber-300/20 rounded-lg min-h-[120px]"
                  placeholder="How can we help you?"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={sending}
                variant="amber"
                className="w-full rounded-full transition-all duration-300"
              >
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
