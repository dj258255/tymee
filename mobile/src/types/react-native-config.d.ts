declare module 'react-native-config' {
  export interface NativeConfig {
    ENV?: string;
    API_URL?: string;
    API_TIMEOUT?: string;
    APP_NAME?: string;
    BUNDLE_ID?: string;
    ENABLE_ANALYTICS?: string;
    ENABLE_CRASHLYTICS?: string;
    DEBUG_MODE?: string;
  }

  export const Config: NativeConfig;
  export default Config;
}