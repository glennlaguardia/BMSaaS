'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Phone, Mail, Facebook, Send, Loader2 } from 'lucide-react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      const res = await fetch('/api/public/inquiry', {
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
    <section id="contact" className="py-20 md:py-28 bg-[#2D5016]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-[#D4A574] font-medium tracking-[0.15em] uppercase text-xs mb-3">
            Contact
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            {content.heading || 'Get in Touch'}
          </h2>
          <p className="text-white/60 mt-3">
            {content.subtitle || ''}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-6">
            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex items-center gap-4 text-white/80 hover:text-white transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-[#D4A574]" />
                </div>
                <div>
                  <p className="text-sm text-white/50">Primary Phone</p>
                  <p className="font-medium">{phone}</p>
                </div>
              </a>
            )}

            {phone2 && (
              <a
                href={`tel:${phone2}`}
                className="flex items-center gap-4 text-white/80 hover:text-white transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-[#D4A574]" />
                </div>
                <div>
                  <p className="text-sm text-white/50">Secondary Phone</p>
                  <p className="font-medium">{phone2}</p>
                </div>
              </a>
            )}

            {email && (
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-4 text-white/80 hover:text-white transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-[#D4A574]" />
                </div>
                <div>
                  <p className="text-sm text-white/50">Email</p>
                  <p className="font-medium">{email}</p>
                </div>
              </a>
            )}

            {facebookUrl && (
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 text-white/80 hover:text-white transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <Facebook className="w-5 h-5 text-[#D4A574]" />
                </div>
                <div>
                  <p className="text-sm text-white/50">Facebook</p>
                  <p className="font-medium">Visit our page</p>
                </div>
              </a>
            )}
          </div>

          {/* Inquiry Form */}
          {content.show_inquiry_form !== false && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="contact-name" className="text-white/70 text-sm">
                  Name
                </Label>
                <Input
                  id="contact-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  placeholder="Your full name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="contact-email" className="text-white/70 text-sm">
                  Email
                </Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="contact-message" className="text-white/70 text-sm">
                  Message
                </Label>
                <Textarea
                  id="contact-message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/40 min-h-[120px]"
                  placeholder="How can we help you?"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={sending}
                className="w-full bg-[#D4A574] hover:bg-[#c49464] text-[#1a3409] font-semibold rounded-full"
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
