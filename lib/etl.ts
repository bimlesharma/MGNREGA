import connectDB from './mongodb';
import District from '@/models/District';
import MgnregaData from '@/models/MgnregaData';
import { fetchMgnregaData } from './dataGovApi';
import { normalizeRecord } from './dataNormalizer';
import { invalidateCache } from './redis';
import { getAppConfig } from '@/config/appConfig';

const STATE_NAME_BY_CODE: Record<string, string> = {
  UP: 'UTTAR PRADESH',
  MP: 'MADHYA PRADESH',
  BR: 'BIHAR',
  AS: 'ASSAM',
  MH: 'MAHARASHTRA',
  GJ: 'GUJARAT',
  RJ: 'RAJASTHAN',
  TN: 'TAMIL NADU',
  CG: 'CHHATTISGARH',
  KA: 'KARNATAKA',
  TS: 'TELANGANA',
  OR: 'ODISHA',
  AP: 'ANDHRA PRADESH',
  PB: 'PUNJAB',
  JH: 'JHARKHAND',
  HR: 'HARYANA',
  AR: 'ARUNACHAL PRADESH',
  JK: 'JAMMU AND KASHMIR',
  MN: 'MANIPUR',
  UK: 'UTTARAKHAND',
  KL: 'KERALA',
  HP: 'HIMACHAL PRADESH',
  ML: 'MEGHALAYA',
  WB: 'WEST BENGAL',
  MZ: 'MIZORAM',
  NL: 'NAGALAND',
  TR: 'TRIPURA',
  SK: 'SIKKIM',
  AN: 'ANDAMAN AND NICOBAR',
  LA: 'LADAKH',
  PY: 'PUDUCHERRY',
  GA: 'GOA',
  DD: 'DN HAVELI AND DD',
  LD: 'LAKSHADWEEP',
};

function resolveStateName(stateCode?: string): string | undefined {
  if (!stateCode) {
    return undefined;
  }

  const trimmed = stateCode.trim();
  if (!trimmed) {
    return undefined;
  }

  const upper = trimmed.toUpperCase();
  if (STATE_NAME_BY_CODE[upper]) {
    return STATE_NAME_BY_CODE[upper];
  }

  return trimmed;
}

async function saveBatch(records: any[], seenDistricts: Set<string>) {
  const operations: any[] = [];
  const districtsToUpsert: Array<{
    districtCode: string;
    districtName: string;
    stateCode: string;
    stateName: string;
  }> = [];

  for (const apiRecord of records) {
    const normalized = normalizeRecord(apiRecord);
    if (!normalized) {
      continue;
    }

    const districtKey = `${normalized.districtCode}:${normalized.stateCode}`;
    if (!seenDistricts.has(districtKey)) {
      seenDistricts.add(districtKey);
      districtsToUpsert.push({
        districtCode: normalized.districtCode,
        districtName: String(apiRecord.district_name || '').trim(),
        stateCode: normalized.stateCode,
        stateName: String(apiRecord.state_name || '').trim() || normalized.stateCode,
      });
    }

    operations.push({
      updateOne: {
        filter: {
          districtCode: normalized.districtCode,
          financialYear: normalized.financialYear,
          month: normalized.month,
        },
        update: { $set: normalized },
        upsert: true,
      },
    });
  }

  if (districtsToUpsert.length > 0) {
    await Promise.all(
      districtsToUpsert.map((district) =>
        District.findOneAndUpdate(
          { districtCode: district.districtCode },
          district,
          { new: true, upsert: true }
        )
      )
    );
  }

  if (operations.length > 0) {
    const batchSize = 500;
    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      await MgnregaData.bulkWrite(batch, { ordered: false });
    }
  }

  return {
    saved: operations.length,
    districts: districtsToUpsert.length,
  };
}

export async function runETL(stateCode?: string, financialYear?: string, month?: number) {
  await connectDB();
  console.log('ETL: Connected to MongoDB\n');

  const cfg = getAppConfig();
  const stateName = resolveStateName(stateCode) || cfg.defaultStateName;

  console.log('🚀 Starting ETL');
  if (stateName) console.log(`📍 State filter: ${stateName}`);
  if (financialYear) console.log(`📅 Financial year: ${financialYear}`);
  if (month) console.log(`🗓️  Month: ${month}`);
  console.log('');

  const limit = cfg.dataGov.pageLimit;
  let offset = 0;
  let hasMore = true;
  let consecutiveErrors = 0;
  const maxErrors = 3;
  let retryAttempt = 0;
  const maxRetries = 3;
  let totalFromAPI: number | null = null;
  const start = Date.now();

  const seenDistricts = new Set<string>();
  let totalSaved = 0;
  let errors = 0;

  while (hasMore) {
    try {
      const response = await fetchMgnregaData(stateName, undefined, financialYear, month, offset, limit);

      if (totalFromAPI === null && response.total) {
  totalFromAPI = response.total;
        console.log(`📊 API total: ${totalFromAPI.toLocaleString()} records\n`);
      }

      if (response.records.length === 0) {
        hasMore = false;
        break;
      }

      const result = await saveBatch(response.records, seenDistricts);
      totalSaved += result.saved;

      consecutiveErrors = 0;
      retryAttempt = 0;

      if (totalFromAPI) {
        const percentage = Math.min(100, Math.round((totalSaved / totalFromAPI) * 100));
        const elapsedSeconds = (Date.now() - start) / 1000;
        const rate = totalSaved / Math.max(elapsedSeconds, 1);
        const remaining = Math.max(totalFromAPI - totalSaved, 0);
        const remainingMinutes = rate > 0 ? Math.ceil((remaining / rate) / 60) : '∞';

        console.log(
          `💾 Saved ${result.saved} records (total ${totalSaved.toLocaleString()} / ${totalFromAPI.toLocaleString()} | ${percentage}%) | ~${remainingMinutes} min left`
        );
      } else {
        console.log(`💾 Saved ${result.saved} records (total ${totalSaved.toLocaleString()})`);
      }

      hasMore = response.records.length === limit;
      offset += limit;

      if (hasMore) {
        await new Promise((resolve) => setTimeout(resolve, cfg.dataGov.pageBackoffMs));
      }
    } catch (error: any) {
      const isTimeout = error?.code === 'ECONNABORTED' || error?.message?.includes('timeout');

      if (isTimeout && retryAttempt < maxRetries) {
        retryAttempt += 1;
        const delay = Math.min(2000 * Math.pow(2, retryAttempt), 10000);
        console.warn(`⏳ Timeout at offset ${offset}. Retrying in ${delay}ms (attempt ${retryAttempt}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      consecutiveErrors += 1;
      errors += 1;
      console.error(`❌ Error at offset ${offset}:`, error?.message || error);

      if (consecutiveErrors >= maxErrors) {
        console.error('⚠️  Too many consecutive errors. Stopping ETL early.');
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));
      retryAttempt = 0;
    }
  }

  console.log('\n✅ ETL complete');
  console.log(`   Records saved: ${totalSaved.toLocaleString()}`);
  console.log(`   Districts processed: ${seenDistricts.size}`);
  console.log(`   Errors: ${errors}`);

  await invalidateCache('dashboard:*');
  await invalidateCache('map:*');

  return {
    success: true,
    processed: totalSaved,
    districts: seenDistricts.size,
    errors,
  };
}
