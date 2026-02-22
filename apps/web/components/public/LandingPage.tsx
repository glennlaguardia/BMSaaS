'use client';

import React from 'react';
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
import { PromoBanner } from '@/components/public/PromoBanner';
import { TenantBranding } from '@/components/public/TenantBranding';
import type { Tenant, WebsiteSection, AccommodationType, Testimonial } from '@budabook/types';

type PublicRateAdjustment = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  adjustment_type: string;
  adjustment_value: number;
  applies_to: string;
};

interface LandingPageProps {
  tenant: Tenant;
  sections: WebsiteSection[];
  types: AccommodationType[];
  testimonials: Testimonial[];
  adjustments?: PublicRateAdjustment[];
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function LandingPage({ tenant, sections, types, testimonials, adjustments = [] }: LandingPageProps) {

  const sectionMap = new Map<string, { content: Record<string, unknown>; settings: WebsiteSection['settings'] }>();
  for (const section of sections) {
    sectionMap.set(section.section_type, { content: section.content, settings: section.settings });
  }

  const orderedTypes = sections.map((s) => s.section_type);

  return (
    <div className="min-h-screen">
      <TenantBranding tenant={tenant} />
      <Navbar tenantName={tenant.name} />

      {orderedTypes.map((type) => {
        const entry = sectionMap.get(type);
        const content = (entry?.content || {}) as any;
        const settings = entry?.settings || null;

        // Build per-section inline style from settings
        const sectionStyle: React.CSSProperties = {};
        if (settings?.background_color) sectionStyle.backgroundColor = settings.background_color;
        if (settings?.text_color) sectionStyle.color = settings.text_color;
        const paddingClass = settings?.padding === 'compact' ? 'py-12 md:py-16' : settings?.padding === 'spacious' ? 'py-32 md:py-44' : '';

        const wrapSection = (node: React.ReactNode) => {
          if (!settings?.background_color && !settings?.text_color && !paddingClass) return node;
          return <div style={sectionStyle} className={paddingClass || undefined}>{node}</div>;
        };

        switch (type) {
          case 'hero':
            return (
              <div key="hero-with-promo">
                {wrapSection(<Hero content={content} tenantName={tenant.name} />)}
                {adjustments.length > 0 && <PromoBanner adjustments={adjustments} />}
              </div>
            );
          case 'about':
            return <React.Fragment key={type}>{wrapSection(<About content={content} />)}</React.Fragment>;
          case 'accommodations':
            return <React.Fragment key={type}>{wrapSection(<Accommodations content={content} types={types} adjustments={adjustments} />)}</React.Fragment>;
          case 'activities':
            return <React.Fragment key={type}>{wrapSection(<Activities content={content} />)}</React.Fragment>;
          case 'gallery':
            return <React.Fragment key={type}>{wrapSection(<Gallery content={content} />)}</React.Fragment>;
          case 'pricing':
            return <React.Fragment key={type}>{wrapSection(<Pricing content={content} types={types} adjustments={adjustments} />)}</React.Fragment>;
          case 'testimonials':
            return <React.Fragment key={type}>{wrapSection(<Testimonials content={content} testimonials={testimonials} />)}</React.Fragment>;
          case 'location':
            return (
              <React.Fragment key={type}>
                {wrapSection(
                  <Location
                    content={content}
                    address={tenant.address}
                    latitude={tenant.gps_latitude}
                    longitude={tenant.gps_longitude}
                  />
                )}
              </React.Fragment>
            );
          case 'contact':
            return (
              <React.Fragment key={type}>
                {wrapSection(
                  <Contact
                    content={content}
                    phone={tenant.contact_phone}
                    phone2={tenant.contact_phone_2}
                    email={tenant.contact_email}
                    facebookUrl={tenant.facebook_url}
                  />
                )}
              </React.Fragment>
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
