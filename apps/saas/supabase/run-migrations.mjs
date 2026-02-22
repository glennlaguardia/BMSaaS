/**
 * BudaBook — Database Migration Runner
 * 
 * Connects directly to the Supabase PostgreSQL database and runs all SQL migrations.
 * Also handles bcrypt hashing for the admin user seed.
 * 
 * Usage: node supabase/run-migrations.mjs [database_password]
 * 
 * The database password is the one set during Supabase project creation.
 * You can find it in: Supabase Dashboard > Settings > Database > Connection string
 */

import pg from 'pg';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { hash } from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Supabase project ref
const PROJECT_REF = 'cpypizusvegzigtibzty';

// Database password — passed via CLI arg or env var
const DB_PASSWORD = process.argv[2] || process.env.SUPABASE_DB_PASSWORD || '';

if (!DB_PASSWORD) {
  console.error('ERROR: Database password required.');
  console.error('Usage: node supabase/run-migrations.mjs YOUR_DATABASE_PASSWORD');
  console.error('');
  console.error('Find it in: Supabase Dashboard > Project Settings > Database > Connection string');
  console.error('The password is the one you set when creating the Supabase project.');
  process.exit(1);
}

// Connection string — provide your FULL connection string via DATABASE_URL env var
// Find it in: Supabase Dashboard > Project Settings > Database > Connection string (URI)
// Copy the Session Mode (port 5432) connection string and set it as DATABASE_URL
const connectionString = process.env.DATABASE_URL || `postgresql://postgres.${PROJECT_REF}:${encodeURIComponent(DB_PASSWORD)}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`;

console.log(`Using connection: ${connectionString.replace(/:[^@]+@/, ':***@')}`);
console.log('If this fails, set DATABASE_URL env var to your exact Supabase connection string.');

const migrations = [
  '001_create_tables.sql',
  '002_rls_policies.sql',
  '003_functions.sql',
  '004_seed_taglucop.sql',
];

async function main() {
  console.log('BudaBook — Database Migration Runner');
  console.log('=====================================');
  
  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
  
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('  Connected!\n');
    
    // Run each migration file
    for (const migration of migrations) {
      const filePath = resolve(__dirname, 'migrations', migration);
      const sql = readFileSync(filePath, 'utf-8');
      
      console.log(`--- Running: ${migration} ---`);
      try {
        await client.query(sql);
        console.log(`  Done.\n`);
      } catch (err) {
        console.error(`  ERROR in ${migration}: ${err.message}`);
        // Continue with remaining migrations
        console.log(`  (Continuing...)\n`);
      }
    }
    
    // Seed admin user with bcrypt-hashed password
    console.log('--- Seeding admin user with hashed password ---');
    const passwordHash = await hash('T@gluc0p@dm1n!', 12);
    console.log(`  Hash generated.`);
    
    try {
      await client.query(`
        INSERT INTO admin_users (id, tenant_id, username, email, password_hash, full_name, role, is_active)
        VALUES (
          'a1b2c3d4-e5f6-7890-abcd-000000000002',
          'a1b2c3d4-e5f6-7890-abcd-000000000001',
          'TaglucopAdmin',
          'taglucopfarms@gmail.com',
          $1,
          'Resort Admin',
          'resort_admin',
          true
        )
        ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, password_hash = EXCLUDED.password_hash;
      `, [passwordHash]);
      console.log(`  Admin user seeded.\n`);
    } catch (err) {
      console.error(`  ERROR seeding admin: ${err.message}\n`);
    }
    
    // Verify
    console.log('--- Verifying seed data ---');
    
    const tables = [
      ['tenants', 'SELECT COUNT(*) as count FROM tenants'],
      ['admin_users', 'SELECT COUNT(*) as count FROM admin_users'],
      ['accommodation_types', 'SELECT COUNT(*) as count FROM accommodation_types'],
      ['rooms', 'SELECT COUNT(*) as count FROM rooms'],
      ['addons', 'SELECT COUNT(*) as count FROM addons'],
      ['website_sections', 'SELECT COUNT(*) as count FROM website_sections'],
      ['testimonials', 'SELECT COUNT(*) as count FROM testimonials'],
    ];
    
    for (const [name, query] of tables) {
      try {
        const result = await client.query(query);
        console.log(`  ${name}: ${result.rows[0].count} rows`);
      } catch (err) {
        console.log(`  ${name}: ERROR - ${err.message}`);
      }
    }
    
    console.log('\n=====================================');
    console.log('Migration complete!');
    
  } catch (err) {
    console.error(`Connection failed: ${err.message}`);
    console.error('');
    console.error('Common issues:');
    console.error('  1. Wrong database password');
    console.error('  2. Wrong region (currently using ap-southeast-1)');
    console.error('  3. Network/firewall blocking the connection');
    console.error('');
    console.error('To find the correct connection string:');
    console.error('  Supabase Dashboard > Settings > Database > Connection string');
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
