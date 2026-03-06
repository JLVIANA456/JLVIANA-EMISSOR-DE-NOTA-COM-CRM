import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runMigrations() {
  const sqlFile = path.join(process.cwd(), 'migration_accounts_payable.sql');
  if (!fs.existsSync(sqlFile)) {
    console.error('Migration file not found:', sqlFile);
    return;
  }

  const sql = fs.readFileSync(sqlFile, 'utf8');

  console.log('Attempting to run migration...');

  // Try to use a common RPC function if it exists, otherwise instruct
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error('Error running migration via RPC:', error.message);
    console.log('\n--- MANUAL ACTION REQUIRED ---');
    console.log('Please copy the contents of migration_accounts_payable.sql and run it in your Supabase SQL Editor.');
    console.log('-------------------------------\n');
  } else {
    console.log('Migration completed successfully!');
  }
}

runMigrations();

