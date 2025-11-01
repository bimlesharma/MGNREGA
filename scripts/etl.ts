import dotenv from 'dotenv';
import { resolve } from 'path';
import { runETL } from '../lib/etl';

// Load environment variables from .env first, then .env.local (Next.js convention - .env.local overrides .env)
const envPath = resolve(process.cwd(), '.env');
const envLocalPath = resolve(process.cwd(), '.env.local');

// Load .env first (base values)
const envLoaded = dotenv.config({ path: envPath });

// Load .env.local second (overrides .env values - Next.js convention)
const envLocalLoaded = dotenv.config({ path: envLocalPath });

if (envLocalLoaded.error && envLoaded.error) {
  console.warn('Warning: No .env or .env.local file found. Make sure environment variables are set.');
} else if (!envLocalLoaded.error) {
  console.log('Environment variables loaded from: .env.local (overrides .env)');
} else if (!envLoaded.error) {
  console.log('Environment variables loaded from: .env');
}

// Verify required environment variables
if (!process.env.DATA_GOV_API_KEY) {
  console.error('ERROR: DATA_GOV_API_KEY is not set in environment variables');
  console.error('Please set it in .env.local or .env file');
  process.exit(1);
}

async function main() {
  try {
    console.log('Starting ETL process...');
    const result = await runETL();
    console.log('ETL completed:', result);
    process.exit(0);
  } catch (error) {
    console.error('ETL failed:', error);
    process.exit(1);
  }
}

main();
