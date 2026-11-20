import readline from 'readline';
import 'dotenv/config';
import { getSupabaseStatus, seedSupabaseFromSnapshot, updateSupabaseConfig, readLocalDb } from '../src/server/store.ts';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question: string, defaultValue: string = ''): Promise<string> {
  const prompt = defaultValue ? `${question} [${defaultValue}]: ` : `${question}: `;
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

async function runSetup() {
  console.log('\n======================================================');
  console.log('   EduSphere AI — Interactive Supabase Setup Wizard');
  console.log('======================================================\n');
  console.log('Follow these 3 simple steps to connect Supabase:\n');
  console.log('1. Go to your Supabase project: https://supabase.com/dashboard');
  console.log('2. In your project, go to: Project Settings (gear icon) ➔ API');
  console.log('3. Copy your Project URL, anon public key, and service_role key.\n');

  const currentUrl = (process.env.SUPABASE_URL || '').trim();
  const currentAnon = (process.env.SUPABASE_ANON_KEY || '').trim();
  const currentService = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  const url = await ask('1. Enter your Supabase Project URL', currentUrl);
  const anonKey = await ask('2. Enter your Supabase anon/public API Key', currentAnon === 'your-anon-key' ? '' : currentAnon);
  const serviceRoleKey = await ask('3. Enter your Supabase service_role Key (optional)', currentService === 'your-service-role-key' ? '' : currentService);

  console.log('\nSaving credentials to .env...');
  const status = await updateSupabaseConfig({
    url,
    anonKey,
    serviceRoleKey,
  });

  console.log('\nTesting connection to Supabase...');
  if (!status.connected) {
    console.error('\n❌ Connection check failed:');
    console.error(status.error || 'Unable to connect.');
    console.log('\n💡 Tip: If tables are missing, copy `supabase/schema.sql` and run it in the Supabase SQL Editor.');
    rl.close();
    return;
  }

  console.log('\n✅ Successfully connected to Supabase PostgreSQL!');
  console.log('Current table row counts:', status.tables);

  const shouldSeed = await ask('\nWould you like to seed the initial academic courses, notes, and flashcards now? (Y/n)', 'Y');
  if (shouldSeed.toLowerCase() === 'y' || shouldSeed.toLowerCase() === 'yes') {
    console.log('\nSeeding database...');
    const local = readLocalDb();
    const result = await seedSupabaseFromSnapshot(local);
    console.log('✅', result.message);
    for (const [table, count] of Object.entries(result.seeded)) {
      console.log(`   - ${table}: ${count} rows`);
    }
  }

  console.log('\n🎉 Supabase backend setup is complete! Run `npm run dev` to start the app.\n');
  rl.close();
}

runSetup().catch((err) => {
  console.error('\nSetup error:', err);
  rl.close();
  process.exit(1);
});
