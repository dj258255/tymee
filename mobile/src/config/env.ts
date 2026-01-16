import {
  ENV as _ENV,
  API_URL as _API_URL,
  API_TIMEOUT as _API_TIMEOUT,
  APP_NAME as _APP_NAME,
  BUNDLE_ID as _BUNDLE_ID,
  ENABLE_ANALYTICS as _ENABLE_ANALYTICS,
  ENABLE_CRASHLYTICS as _ENABLE_CRASHLYTICS,
  DEBUG_MODE as _DEBUG_MODE,
} from '@env';

export interface EnvConfig {
  ENV: 'development' | 'staging' | 'production';
  API_URL: string;
  API_TIMEOUT: number;
  APP_NAME: string;
  BUNDLE_ID: string;
  ENABLE_ANALYTICS: boolean;
  ENABLE_CRASHLYTICS: boolean;
  DEBUG_MODE: boolean;
}

const parseBoolean = (value: string | undefined): boolean => {
  return value?.toLowerCase() === 'true';
};

const env: EnvConfig = {
  ENV: (_ENV as EnvConfig['ENV']) || 'development',
  API_URL: _API_URL || 'http://localhost:8080',
  API_TIMEOUT: parseInt(_API_TIMEOUT || '30000', 10),
  APP_NAME: _APP_NAME || 'Tymee',
  BUNDLE_ID: _BUNDLE_ID || 'app.tymee.mobile',
  ENABLE_ANALYTICS: parseBoolean(_ENABLE_ANALYTICS),
  ENABLE_CRASHLYTICS: parseBoolean(_ENABLE_CRASHLYTICS),
  DEBUG_MODE: parseBoolean(_DEBUG_MODE),
};

export const isDevelopment = env.ENV === 'development';
export const isStaging = env.ENV === 'staging';
export const isProduction = env.ENV === 'production';

export default env;
