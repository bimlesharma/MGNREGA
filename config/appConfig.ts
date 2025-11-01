/**
 * Centralized application configuration
 * - Defaults the app to Madhya Pradesh (MP) for now
 * - Keeps modules reusable by reading from env with sane fallbacks
 */

export type AppConfig = {
  defaultStateCode: string; // e.g., 'MP'
  defaultStateName: string; // e.g., 'MADHYA PRADESH'
  dataGov: {
    apiBaseUrl: string;
    resourceId: string;
    apiKey: string;
    pageLimit: number; // per-request limit (data.gov.in enforces caps by key type)
    requestTimeoutMs: number;
    pageBackoffMs: number; // pause between pages
    maxRetries: number;
  };
};

export function getAppConfig(): AppConfig {
  return {
    defaultStateCode: process.env.DEFAULT_STATE_CODE?.trim() || 'MP',
    defaultStateName: process.env.DEFAULT_STATE_NAME?.trim() || 'MADHYA PRADESH',
    dataGov: {
      apiBaseUrl: process.env.DATA_GOV_API_BASE?.trim() || 'https://api.data.gov.in/resource',
      resourceId:
        process.env.DATA_GOV_RESOURCE_ID?.trim() ||
        'ee03643a-ee4c-48c2-ac30-9f2ff26ab722',
      apiKey: process.env.DATA_GOV_API_KEY?.trim() || '',
      pageLimit: Number(process.env.DATA_GOV_PAGE_LIMIT || 500),
      requestTimeoutMs: Number(process.env.DATA_GOV_TIMEOUT_MS || 60000),
      pageBackoffMs: Number(process.env.DATA_GOV_PAGE_BACKOFF_MS || 1500),
      maxRetries: Number(process.env.DATA_GOV_MAX_RETRIES || 3),
    },
  };
}

export function requireEnvConfig() {
  const cfg = getAppConfig();
  const missing: string[] = [];
  if (!cfg.dataGov.apiKey) missing.push('DATA_GOV_API_KEY');
  if (!cfg.dataGov.resourceId) missing.push('DATA_GOV_RESOURCE_ID');
  if (!cfg.defaultStateName) missing.push('DEFAULT_STATE_NAME');
  if (!cfg.defaultStateCode) missing.push('DEFAULT_STATE_CODE');

  if (missing.length) {
    throw new Error(
      `Missing required configuration: ${missing.join(', ')}. Set them in .env or deployment secrets.`
    );
  }
}
