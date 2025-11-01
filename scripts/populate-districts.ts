import dotenv from 'dotenv';
import { resolve } from 'path';
import connectDB from '../lib/mongodb';
import District from '../models/District';
import { fetchMgnregaData } from '../lib/dataGovApi';

// Load environment variables
const envLocalPath = resolve(process.cwd(), '.env.local');
const envPath = resolve(process.cwd(), '.env');
dotenv.config({ path: envLocalPath });
dotenv.config({ path: envPath });

async function populateDistricts() {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Fetch just a few batches to get unique districts
    console.log('📥 Fetching sample data to extract districts...');
    
    const districtsMap = new Map<string, {
      districtCode: string;
      districtName: string;
      stateCode: string;
      stateName: string;
    }>();

    let offset = 0;
    const limit = 500;
    const maxBatches = 5; // Just fetch 5 batches (2500 records) to get districts
    let batchesFetched = 0;

    while (batchesFetched < maxBatches) {
      try {
        console.log(`Fetching batch ${batchesFetched + 1}/${maxBatches} (offset: ${offset})...`);
        const response = await fetchMgnregaData(undefined, undefined, undefined, undefined, offset, limit);
        
        if (response.records.length === 0) {
          console.log('No more records to fetch');
          break;
        }

        // Process records to extract districts
        for (const record of response.records) {
          const districtCode = String(record.district_code || '').trim();
          const districtName = String(record.district_name || '').trim();
          const stateCode = String(record.state_code || '').trim();
          const stateName = String(record.state_name || '').trim();

          if (!districtCode || !districtName || !stateCode || !stateName) {
            continue;
          }

          if (!districtsMap.has(districtCode)) {
            districtsMap.set(districtCode, {
              districtCode,
              districtName,
              stateCode,
              stateName,
            });
          }
        }

        if (response.records.length < limit) {
          break; // No more records
        }

        offset += limit;
        batchesFetched++;
        
        // Wait between requests
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch (error: any) {
        console.error(`Error fetching batch at offset ${offset}:`, error.message);
        // Continue to next batch
        offset += limit;
        batchesFetched++;
      }
    }

    console.log(`\n📊 Found ${districtsMap.size} unique districts`);

    if (districtsMap.size === 0) {
      console.log('❌ No districts found. Check API connection and data availability.');
      process.exit(1);
    }

    // Save districts to database
    console.log('\n💾 Saving districts to database...');
    let saved = 0;
    let updated = 0;
    let errors = 0;

    for (const district of districtsMap.values()) {
      try {
        const result = await District.updateOne(
          { districtCode: district.districtCode },
          {
            $set: {
              districtCode: district.districtCode,
              districtName: district.districtName,
              stateCode: district.stateCode,
              stateName: district.stateName,
            },
          },
          { upsert: true }
        );

        if (result.upsertedCount && result.upsertedCount > 0) {
          saved++;
        } else if (result.matchedCount > 0) {
          updated++;
        }
      } catch (error: any) {
        console.error(`Error saving district ${district.districtCode}:`, error.message);
        errors++;
      }
    }

    console.log(`\n✅ Districts saved: ${saved} new, ${updated} updated, ${errors} errors`);

    // Show summary
    const stateCounts = new Map<string, number>();
    for (const district of districtsMap.values()) {
      const count = stateCounts.get(district.stateName) || 0;
      stateCounts.set(district.stateName, count + 1);
    }

    console.log('\n📈 Districts by State:');
    const sortedStates = Array.from(stateCounts.entries()).sort((a, b) => b[1] - a[1]);
    sortedStates.slice(0, 10).forEach(([state, count]) => {
      console.log(`   ${state}: ${count} districts`);
    });
    if (sortedStates.length > 10) {
      console.log(`   ... and ${sortedStates.length - 10} more states`);
    }

    console.log('\n✨ District population complete!');
    console.log('💡 Next step: Run "npm run etl" to fetch full MGNREGA data');

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

populateDistricts();
