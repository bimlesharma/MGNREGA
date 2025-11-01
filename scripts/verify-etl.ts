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

async function verifyETL() {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Check districts
    const districtCount = await District.countDocuments({});
    console.log(`📊 Districts: ${districtCount}`);
    
    // Check stored monthly data
    const recordCount = await MgnregaData.countDocuments({});
    console.log(`📅 Monthly Records: ${recordCount}`);

    if (recordCount > 0) {
      // Sample records
      const samples = await MgnregaData.find({})
        .sort({ financialYearStart: -1, month: -1 })
        .limit(3)
        .lean<IMgnregaData[]>();

      console.log('\n📋 Sample Records:');
      for (let i = 0; i < samples.length; i++) {
        const sample = samples[i];
        const district = await District.findOne({ districtCode: sample.districtCode })
          .select('districtName')
          .lean<{ districtName: string } | null>();
        console.log(`  ${i + 1}. ${district?.districtName || sample.districtCode}`);
        console.log(`     FY: ${sample.financialYear}, Month: ${sample.month}`);
        console.log(`     Workdays: ${Math.round(sample.workdaysGenerated).toLocaleString()}, Persons: ${Math.round(sample.personsWorked).toLocaleString()}`);
      }

      // Latest record timestamp
      const recent = await MgnregaData.findOne({})
        .sort({ updatedAt: -1 })
        .select('financialYear month updatedAt')
        .lean<IMgnregaData | null>();

      if (recent) {
        console.log(`\n🕐 Most Recent Update: ${recent.updatedAt}`);
      }

      // Financial years
      const finYears = await MgnregaData.distinct('financialYear');
      console.log(`\n📆 Financial Years: ${finYears.join(', ')}`);

      // District coverage
      const districtsWithData = await MgnregaData.distinct('districtCode');
      console.log(`\n🏛️  Districts with Data: ${districtsWithData.length}`);

      if (districtsWithData.length > 0 && districtsWithData.length <= 10) {
        const districtNames = await District.find({
          districtCode: { $in: districtsWithData },
        })
          .select('districtName')
          .limit(10);
        console.log(`   Examples: ${districtNames.map((d) => d.districtName).join(', ')}`);
      }
    } else {
      console.log('\n⚠️  No MGNREGA records found in database!');
      console.log('   This means ETL fetched data but failed to save it.');
      console.log('   Check ETL logs for errors.');
    }

    console.log('\n' + '='.repeat(50));
    if (recordCount === 0 && districtCount === 0) {
      console.log('❌ No data saved. ETL may have failed during save process.');
    } else if (recordCount === 0 && districtCount > 0) {
      console.log('⚠️  Districts saved but no MGNREGA data. ETL may have failed.');
    } else {
      console.log('✅ Data is in database!');
    }
    console.log('='.repeat(50));

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyETL();
