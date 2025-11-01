import dotenv from 'dotenv';
import { resolve } from 'path';
import connectDB from '../lib/mongodb';
import District from '../models/District';
import MgnregaData, { IMgnregaData } from '../models/MgnregaData';

// Load environment variables
const envLocalPath = resolve(process.cwd(), '.env.local');
const envPath = resolve(process.cwd(), '.env');
dotenv.config({ path: envLocalPath });
dotenv.config({ path: envPath });

async function checkData() {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Check districts
    const districtCount = await District.countDocuments({});
    console.log(`📊 Districts in database: ${districtCount}`);
    
    let districtsWithCoords = 0;
    if (districtCount > 0) {
      const sampleDistrict = await District.findOne({});
      console.log(`   Sample: ${sampleDistrict?.districtName} (${sampleDistrict?.districtCode})`);
      
      districtsWithCoords = await District.countDocuments({
        coordinates: { $exists: true, $ne: null },
      });
      console.log(`   Districts with coordinates: ${districtsWithCoords}`);
      if (districtsWithCoords === 0) {
        console.log('   ⚠️  Warning: No districts have coordinates. Geolocation will not work accurately.');
      }
    }

    // Check stored MGNREGA data
    const dataCount = await MgnregaData.countDocuments({});
    console.log(`\n📅 MGNREGA monthly records: ${dataCount}`);

    if (dataCount > 0) {
      const latestRecord = await MgnregaData.findOne({})
        .sort({ financialYearStart: -1, month: -1 })
        .lean<IMgnregaData | null>();

      if (latestRecord) {
        console.log(`   Latest record: FY ${latestRecord.financialYear} - Month ${latestRecord.month}`);
        const district = await District.findOne({ districtCode: latestRecord.districtCode });
        console.log(`   District: ${district?.districtName || latestRecord.districtCode}`);
        console.log(`   Workdays: ${Math.round(latestRecord.workdaysGenerated).toLocaleString()}`);
      }

      const districtsWithData = await MgnregaData.distinct('districtCode');
      console.log(`   Districts with data: ${districtsWithData.length}`);
      const financialYears = await MgnregaData.distinct('financialYear');
      console.log(`   Financial years covered: ${financialYears.join(', ')}`);
    }

    // Overall status
    console.log('\n' + '='.repeat(50));
    if (districtCount === 0) {
      console.log('❌ No districts found. Run ETL to populate data.');
    } else if (dataCount === 0) {
      console.log('❌ Districts exist but no MGNREGA data. Run ETL to fetch data.');
    } else {
      console.log('✅ Data is available! Frontend should work.');
      if (districtsWithCoords === 0) {
        console.log('⚠️  Geolocation will use fallback (not accurate).');
      }
    }
    console.log('='.repeat(50));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkData();
