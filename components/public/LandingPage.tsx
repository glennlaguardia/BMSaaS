'use client';

import { Navbar } from '@/components/public/Navbar';
import { Hero } from '@/components/public/Hero';
import { About } from '@/components/public/About';
import { Accommodations } from '@/components/public/Accommodations';
import { Activities } from '@/components/public/Activities';
import { Gallery } from '@/components/public/Gallery';
import { Pricing } from '@/components/public/Pricing';
import { Testimonials } from '@/components/public/Testimonials';
import { Location } from '@/components/public/Location';
import { Contact } from '@/components/public/Contact';
import { Footer } from '@/components/public/Footer';
import type { Tenant, WebsiteSection, AccommodationType, Testimonial } from '@/types';

interface LandingPageProps {
  tenant: Tenant;
  sections: WebsiteSection[];
  types: AccommodationType[];
  testimonials: Testimonial[];
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function LandingPage({ tenant, sections, types, testimonials }: LandingPageProps) {
  const sectionMap = new Map<string, Record<string, unknown>>();
  for (const section of sections) {
    sectionMap.set(section.section_type, section.content);
  }

  const orderedTypes = sections.map((s) => s.section_type);

  return (
    <div className="min-h-screen">
      <Navbar tenantName={tenant.name} phone={tenant.contact_phone} />

      {orderedTypes.map((type) => {
        const content = (sectionMap.get(type) || {}) as any;

        switch (type) {
          case 'hero':
            return <Hero key={type} content={content} tenantName={tenant.name} />;
          case 'about':
            return <About key={type} content={content} />;
          case 'accommodations':
            return <Accommodations key={type} content={content} types={types} />;
          case 'activities':
            return <Activities key={type} content={content} />;
          case 'gallery':
            return <Gallery key={type} content={content} />;
          case 'pricing':
            return <Pricing key={type} content={content} types={types} />;
          case 'testimonials':
            return <Testimonials key={type} content={content} testimonials={testimonials} />;
          case 'location':
            return (
              <Location
                key={type}
                content={content}
                address={tenant.address}
                latitude={tenant.gps_latitude}
                longitude={tenant.gps_longitude}
              />
            );
          case 'contact':
            return (
              <Contact
                key={type}
                content={content}
                phone={tenant.contact_phone}
                phone2={tenant.contact_phone_2}
                email={tenant.contact_email}
                facebookUrl={tenant.facebook_url}
              />
            );
          default:
            return null;
        }
      })}

      <Footer
        tenantName={tenant.name}
        phone={tenant.contact_phone}
        email={tenant.contact_email}
        facebookUrl={tenant.facebook_url}
      />
    </div>
  );
}
