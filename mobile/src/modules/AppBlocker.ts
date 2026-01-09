import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

// iOS: AppBlockerSwift (Swift 모듈), Android: AppBlocker (Java 모듈)
const AppBlocker = Platform.OS === 'ios'
  ? NativeModules.AppBlockerSwift
  : NativeModules.AppBlocker;

interface AppBlockerInterface {
  // iOS & Android 공통
  requestAuthorization?: () => Promise<string>;
  getAuthorizationStatus?: () => Promise<string>;
  blockApps: (bundleIdentifiers: string[]) => Promise<{ success: boolean; message: string }>;
  unblockAllApps: () => Promise<{ success: boolean; message: string }>;
  getInstalledApps?: () => Promise<Array<{ packageName: string; appName: string }>>;

  // Android 전용
  checkUsageStatsPermission?: () => Promise<boolean>;
  requestUsageStatsPermission?: () => Promise<boolean>;
  getBlockedApps?: () => Promise<string[]>;
  checkAccessibilityPermission?: () => Promise<boolean>;
  requestAccessibilityPermission?: () => Promise<boolean>;
}

class AppBlockerModule implements AppBlockerInterface {
  private eventEmitter: NativeEventEmitter | null = null;

  constructor() {
    if (AppBlocker) {
      this.eventEmitter = new NativeEventEmitter(AppBlocker);
    }
  }

  /**
   * iOS: Screen Time 권한 요청
   * Android: 사용 통계 권한 확인
   */
  async requestAuthorization(): Promise<string> {
    if (Platform.OS === 'ios') {
      if (!AppBlocker?.requestAuthorization) {
        throw new Error('AppBlocker module not available on iOS');
      }
      return await AppBlocker.requestAuthorization();
    } else {
      // Android: 사용 통계 권한 확인 후 요청
      const hasPermission = await this.checkUsageStatsPermission();
      if (!hasPermission) {
        await this.requestUsageStatsPermission();
      }
      return hasPermission ? 'approved' : 'denied';
    }
  }

  /**
   * iOS: Screen Time 권한 상태 확인
   * Android: 사용 통계 권한 상태 확인
   */
  async getAuthorizationStatus(): Promise<string> {
    if (Platform.OS === 'ios') {
      if (!AppBlocker?.getAuthorizationStatus) {
        throw new Error('AppBlocker module not available on iOS');
      }
      return await AppBlocker.getAuthorizationStatus();
    } else {
      const hasPermission = await this.checkUsageStatsPermission();
      return hasPermission ? 'approved' : 'denied';
    }
  }

  /**
   * 특정 앱들 차단
   * @param bundleIdentifiers iOS: Bundle IDs, Android: Package names
   */
  async blockApps(bundleIdentifiers: string[]): Promise<{ success: boolean; message: string }> {
    if (!AppBlocker) {
      throw new Error('AppBlocker module not available');
    }
    if (Platform.OS === 'ios') {
      // iOS는 FamilyControls를 통해 모든 앱 차단 (개별 앱 선택은 FamilyActivityPicker 필요)
      return await AppBlocker.blockAllApps();
    }
    return await AppBlocker.blockApps(bundleIdentifiers);
  }

  /**
   * 모든 앱 차단 해제
   */
  async unblockAllApps(): Promise<{ success: boolean; message: string }> {
    if (!AppBlocker) {
      throw new Error('AppBlocker module not available');
    }
    return await AppBlocker.unblockAllApps();
  }

  /**
   * Android: 설치된 앱 목록 가져오기
   */
  async getInstalledApps(): Promise<Array<{ packageName: string; appName: string }>> {
    if (Platform.OS === 'android') {
      if (!AppBlocker?.getInstalledApps) {
        throw new Error('AppBlocker module not available on Android');
      }
      return await AppBlocker.getInstalledApps();
    } else {
      // iOS에서는 Family Activity Picker 사용 필요
      throw new Error('Use Family Activity Picker on iOS');
    }
  }

  /**
   * Android: 사용 통계 권한 확인
   */
  async checkUsageStatsPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      if (!AppBlocker?.checkUsageStatsPermission) {
        return false;
      }
      return await AppBlocker.checkUsageStatsPermission();
    }
    return false;
  }

  /**
   * Android: 사용 통계 권한 요청 (설정 화면으로 이동)
   */
  async requestUsageStatsPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      if (!AppBlocker?.requestUsageStatsPermission) {
        return false;
      }
      return await AppBlocker.requestUsageStatsPermission();
    }
    return false;
  }

  /**
   * Android: 현재 차단 중인 앱 목록
   */
  async getBlockedApps(): Promise<string[]> {
    if (Platform.OS === 'android') {
      if (!AppBlocker?.getBlockedApps) {
        return [];
      }
      return await AppBlocker.getBlockedApps();
    }
    return [];
  }

  /**
   * Android: Accessibility Service 권한 확인
   */
  async checkAccessibilityPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      if (!AppBlocker?.checkAccessibilityPermission) {
        return false;
      }
      return await AppBlocker.checkAccessibilityPermission();
    }
    return false;
  }

  /**
   * Android: Accessibility Service 설정 화면으로 이동
   */
  async requestAccessibilityPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      if (!AppBlocker?.requestAccessibilityPermission) {
        return false;
      }
      return await AppBlocker.requestAccessibilityPermission();
    }
    return false;
  }

  /**
   * 이벤트 리스너 등록
   */
  addListener(eventName: string, callback: (data: any) => void) {
    if (this.eventEmitter) {
      return this.eventEmitter.addListener(eventName, callback);
    }
    return { remove: () => {} };
  }

  /**
   * 모든 이벤트 리스너 제거
   */
  removeAllListeners(eventName: string) {
    if (this.eventEmitter) {
      this.eventEmitter.removeAllListeners(eventName);
    }
  }
}

export default new AppBlockerModule();
