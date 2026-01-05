import {NativeModules} from 'react-native';

const {ScreenLockModule} = NativeModules;

interface ScreenLockInterface {
  /**
   * 화면 잠금 (밝기를 최소로 낮춤)
   */
  lockScreen(): Promise<boolean>;

  /**
   * 화면 잠금 해제 (밝기 복원)
   */
  unlockScreen(): Promise<boolean>;

  /**
   * 현재 화면 잠금 상태 확인
   */
  isLocked(): Promise<boolean>;
}

const ScreenLock: ScreenLockInterface = {
  async lockScreen(): Promise<boolean> {
    try {
      if (ScreenLockModule?.lockScreen) {
        return await ScreenLockModule.lockScreen();
      }
      return false;
    } catch {
      return false;
    }
  },

  async unlockScreen(): Promise<boolean> {
    try {
      if (ScreenLockModule?.unlockScreen) {
        return await ScreenLockModule.unlockScreen();
      }
      return false;
    } catch {
      return false;
    }
  },

  async isLocked(): Promise<boolean> {
    try {
      if (ScreenLockModule?.isLocked) {
        return await ScreenLockModule.isLocked();
      }
      return false;
    } catch {
      return false;
    }
  },
};

export default ScreenLock;
