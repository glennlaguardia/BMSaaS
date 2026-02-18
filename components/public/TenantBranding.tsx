'use client';

import { useEffect, useState } from 'react';
import type { Tenant } from '@/types';

interface TenantBrandingProps {
    tenant: Tenant;
}

/**
 * Injects dynamic CSS custom properties from the tenant's branding settings.
 * Renders nothing visible — purely a style injector.
 */
export function TenantBranding({ tenant }: TenantBrandingProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        // Apply tenant custom fonts if configured
        const root = document.documentElement;
        if (tenant.font_heading) {
            root.style.setProperty('--tenant-font-heading', tenant.font_heading);
        }
        if (tenant.font_body) {
            root.style.setProperty('--tenant-font-body', tenant.font_body);
        }

        return () => {
            root.style.removeProperty('--tenant-font-heading');
            root.style.removeProperty('--tenant-font-body');
        };
    }, [tenant]);

    if (!mounted) return null;
    return null;
}
