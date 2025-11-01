import axios from 'axios';
import { getAppConfig, requireEnvConfig } from '@/config/appConfig';

const MONTH_NAME_BY_NUMBER: Record<number, string> = {
  1: 'Jan',
  2: 'Feb',
  3: 'Mar',
  4: 'Apr',
  5: 'May',
  6: 'Jun',
  7: 'Jul',
  8: 'Aug',
  9: 'Sep',
  10: 'Oct',
  11: 'Nov',
  12: 'Dec',
};

interface ApiResponse {
  success: boolean;
  records: any[];
  total?: number;
}

export async function fetchMgnregaData(
  stateName?: string,
  districtCode?: string,
  financialYear?: string,
  month?: number,
  offset: number = 0,
  limit: number = getAppConfig().dataGov.pageLimit
): Promise<ApiResponse> {
  // Ensure required env is present
  requireEnvConfig();
  const cfg = getAppConfig();

  // Build params - data.gov.in uses filters[field_name] format
  const params: Record<string, string | number> = {
  'api-key': cfg.dataGov.apiKey,
    format: 'json',
    offset: offset,
    limit: limit,
  };

  // Add filters if provided
  const effectiveState = stateName || cfg.defaultStateName;
  if (effectiveState) params['filters[state_name]'] = effectiveState;
  if (districtCode) {
    params['filters[district_code]'] = districtCode;
  }
  if (financialYear) {
    params['filters[fin_year]'] = financialYear;
  }
  if (month) {
    const monthName = MONTH_NAME_BY_NUMBER[month] || month;
    params['filters[month]'] = monthName;
  }

  try {
    const response = await axios.get(`${cfg.dataGov.apiBaseUrl}/${cfg.dataGov.resourceId}`, {
      params,
      timeout: cfg.dataGov.requestTimeoutMs,
    });

    // Handle API response structure - data.gov.in typically returns { records: [...], total: number }
    if (response.data?.records) {
      // Only log structure in development and first request
      if (process.env.NODE_ENV === 'development' && offset === 0 && response.data.records.length > 0) {
        console.log('Sample API record structure:', JSON.stringify(response.data.records[0], null, 2));
      }
      
      return {
        success: true,
        records: response.data.records,
        total: response.data.total || response.data.records.length,
      };
    }

    // Some APIs return data directly as an array
    if (Array.isArray(response.data)) {
      return {
        success: true,
        records: response.data,
        total: response.data.length,
      };
    }

    console.warn('Unexpected API response structure:', response.data);
    return {
      success: true,
      records: [],
      total: 0,
    };
  } catch (error: any) {
    console.error('Data.gov.in API Error:', error.message);
    if (error.response) {
      console.error('API Response Status:', error.response.status);
      console.error('API Response Data:', error.response.data);
    }
    // Check if it's a timeout error
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      throw new Error(`Request timeout - API is slow. Try fetching smaller batches or increasing timeout. Original: ${error.message}`);
    }
    throw new Error(`Failed to fetch MGNREGA data: ${error.message}`);
  }
}
