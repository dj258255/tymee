import Config from 'react-native-config';

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
  ENV: (Config.ENV as EnvConfig['ENV']) || 'development',
  API_URL: Config.API_URL || 'http://localhost:8080',
  API_TIMEOUT: parseInt(Config.API_TIMEOUT || '30000', 10),
  APP_NAME: Config.APP_NAME || 'Tymee',
  BUNDLE_ID: Config.BUNDLE_ID || 'com.tymee.app',
  ENABLE_ANALYTICS: parseBoolean(Config.ENABLE_ANALYTICS),
  ENABLE_CRASHLYTICS: parseBoolean(Config.ENABLE_CRASHLYTICS),
  DEBUG_MODE: parseBoolean(Config.DEBUG_MODE),
};

export const isDevelopment = env.ENV === 'development';
export const isStaging = env.ENV === 'staging';
export const isProduction = env.ENV === 'production';

export default env;
