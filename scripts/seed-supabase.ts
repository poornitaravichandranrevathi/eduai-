import 'dotenv/config';
import { getSupabaseStatus, seedSupabaseFromSnapshot, readLocalDb } from '../src/server/store.ts';

async function main() {
  console.log('====================================================');
  console.log(' EduSphere AI - Supabase PostgreSQL Seed & Test');
  console.log('====================================================\n');

  console.log('Checking Supabase connection...');
  const status = await getSupabaseStatus();

  console.log(`Configured: ${status.configured}`);
  console.log(`Target URL: ${status.url || 'Not set'}`);
  console.log(`Auth Mode:  ${status.authMode || 'None'}`);

  if (!status.configured) {
    console.error('\n[ERROR] Supabase credentials are missing in .env');
    console.error('Please configure SUPABASE_URL and SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY) in .env file.');
    process.exit(1);
  }

  if (!status.connected) {
    console.error('\n[ERROR] Unable to connect to Supabase database:');
    console.error(status.error);
    console.error('\nMake sure you have executed the SQL script in `supabase/schema.sql` in your Supabase SQL Editor.');
    process.exit(1);
  }

  console.log('\n[SUCCESS] Supabase is connected!');
  console.log('Current table counts:', status.tables);

  console.log('\nSeeding workspace dataset into Supabase...');
  const localData = readLocalDb();
  const seedResult = await seedSupabaseFromSnapshot(localData);

  console.log('\n[SUCCESS]', seedResult.message);
  console.log('Seeded records:');
  for (const [table, count] of Object.entries(seedResult.seeded)) {
    console.log(`  - ${table}: ${count}`);
  }

  console.log('\nSupabase backend integration is fully configured and ready!');
}

main().catch((err) => {
  console.error('\nUnexpected error during Supabase seed:', err);
  process.exit(1);
});
