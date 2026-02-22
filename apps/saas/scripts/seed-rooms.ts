/**
 * Room Name Seeding Script
 *
 * Usage:
 *   npx tsx scripts/seed-rooms.ts
 *
 * This script upserts room records for a given tenant. Before running,
 * update the ROOM_DATA array below with your actual room names grouped
 * by accommodation type slug.
 *
 * Prerequisites:
 *   - Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env
 *   - Set TARGET_TENANT_SLUG to the tenant you want to seed rooms for
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

// ============================================================
// CONFIGURE THIS: your tenant slug and room data
// ============================================================
const TARGET_TENANT_SLUG = 'taglucop'; // Change to your tenant slug

/**
 * Map of accommodation_type slug → array of room names.
 * Update these with your actual room names.
 */
const ROOM_DATA: Record<string, string[]> = {
    // Example:
    // 'standard-cabin': ['Cabin A', 'Cabin B', 'Cabin C'],
    // 'deluxe-villa': ['Villa 1', 'Villa 2'],
    // 'family-suite': ['Suite 101', 'Suite 102'],
};

async function main() {
    console.log('🌱 BudaBook Room Seeding Script');
    console.log('================================\n');

    if (Object.keys(ROOM_DATA).length === 0) {
        console.log('⚠️  ROOM_DATA is empty. Please update the script with your room names.');
        console.log('   Edit scripts/seed-rooms.ts and fill in the ROOM_DATA object.\n');
        process.exit(1);
    }

    // 1. Get tenant
    const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('id, name')
        .eq('slug', TARGET_TENANT_SLUG)
        .single();

    if (tenantError || !tenant) {
        console.error(`❌ Tenant "${TARGET_TENANT_SLUG}" not found.`, tenantError?.message);
        process.exit(1);
    }
    console.log(`✅ Tenant: ${tenant.name} (${tenant.id})\n`);

    // 2. Get accommodation types for this tenant
    const { data: types, error: typesError } = await supabase
        .from('accommodation_types')
        .select('id, slug, name')
        .eq('tenant_id', tenant.id);

    if (typesError || !types) {
        console.error('❌ Failed to fetch accommodation types.', typesError?.message);
        process.exit(1);
    }

    const typeMap = new Map(types.map(t => [t.slug, t]));
    let created = 0;
    let skipped = 0;

    for (const [typeSlug, roomNames] of Object.entries(ROOM_DATA)) {
        const acType = typeMap.get(typeSlug);
        if (!acType) {
            console.log(`⚠️  Skipping type "${typeSlug}" — not found in database.`);
            continue;
        }

        console.log(`📦 ${acType.name} (${typeSlug}):`);

        for (let i = 0; i < roomNames.length; i++) {
            const name = roomNames[i];

            // Check if room already exists
            const { data: existing } = await supabase
                .from('rooms')
                .select('id')
                .eq('tenant_id', tenant.id)
                .eq('accommodation_type_id', acType.id)
                .eq('name', name)
                .single();

            if (existing) {
                console.log(`   ✓ "${name}" already exists, skipping.`);
                skipped++;
                continue;
            }

            const { error: insertError } = await supabase
                .from('rooms')
                .insert({
                    tenant_id: tenant.id,
                    accommodation_type_id: acType.id,
                    name,
                    sort_order: i + 1,
                    is_active: true,
                });

            if (insertError) {
                console.error(`   ❌ Failed to create "${name}":`, insertError.message);
            } else {
                console.log(`   ✅ Created "${name}"`);
                created++;
            }
        }
    }

    console.log(`\n🏁 Done! Created ${created} room(s), skipped ${skipped} existing.`);
}

main().catch(console.error);
