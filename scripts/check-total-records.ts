import dotenv from 'dotenv';
import { resolve } from 'path';
import { fetchMgnregaData } from '../lib/dataGovApi';

// Load environment variables
const envLocalPath = resolve(process.cwd(), '.env.local');
const envPath = resolve(process.cwd(), '.env');
dotenv.config({ path: envLocalPath });
dotenv.config({ path: envPath });

async function checkTotalRecords() {
  try {
    console.log('📊 Checking total number of records in API...\n');
    
    // Fetch first batch to get total count
    const response = await fetchMgnregaData(undefined, undefined, undefined, undefined, 0, 10);
    
    if (!response.success || response.records.length === 0) {
      console.log('❌ Could not fetch records from API');
      process.exit(1);
    }
    
    // The API might return total in response.data.total
    // If not, we'll estimate based on pagination
    console.log(`✅ API is accessible`);
    console.log(`📦 Sample records found: ${response.records.length}`);
    
    if (response.total) {
      console.log(`\n📊 Total records in API: ${response.total.toLocaleString()}`);
      
      // Calculate estimated time
      const totalRecords = response.total;
      const recordsPerMinute = 30; // Approximate (with 1.5s delay between requests)
      const estimatedMinutes = Math.ceil(totalRecords / 500 / recordsPerMinute);
      
      console.log(`\n⏱️  Estimated time to fetch:`);
      console.log(`   - Fetching: ~${estimatedMinutes} minutes (for ${totalRecords.toLocaleString()} records)`);
      console.log(`   - Processing/Saving: ~${Math.ceil(totalRecords / 10000)} minutes`);
      console.log(`   - Total: ~${estimatedMinutes + Math.ceil(totalRecords / 10000)} minutes`);
      
      // Estimate batches
      const batches = Math.ceil(totalRecords / 500);
      console.log(`\n📦 Will need to fetch ${batches} batches (500 records per batch)`);
      
    } else {
      console.log(`\n⚠️  API doesn't return total count.`);
      console.log(`📊 We'll fetch until no more records are returned.`);
      console.log(`💡 Estimated: Could be 10,000 - 50,000+ records`);
    }
    
    console.log(`\n💡 Tip: You can filter by state or financial year to fetch less data:`);
    console.log(`   - Filter by state: More manageable chunks`);
    console.log(`   - Filter by financial year: Latest data only`);
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkTotalRecords();
