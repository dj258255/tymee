import {NativeModules, NativeEventEmitter, Platform} from 'react-native';

const {FocusTimerModule} = NativeModules;

// Timer modes for Android Foreground Service
// - FOCUS: 집중모드에서 집중시간 (빨강)
// - BREAK: 집중모드에서 휴식시간 (초록)
// - FREE_FOCUS: 자유모드에서 집중시간 (빨강)
// - FREE_BREAK: 자유모드에서 휴식시간 (초록)
export type FocusTimerMode = 'FOCUS' | 'BREAK' | 'FREE_FOCUS' | 'FREE_BREAK';

export interface TimerState {
  remainingSeconds: number;
  isRunning: boolean;
  mode: string;
}

export interface TimerUpdateEvent {
  remainingSeconds: number;
  isRunning: boolean;
  mode: string;
}

export interface TimerCompleteEvent {
  mode: string;
}

// 색상 옵션 (hex 색상 코드)
export interface FocusTimerColors {
  focusColor: string;  // 집중 시간 색상 (예: '#FF5252')
  breakColor: string;  // 휴식 시간 색상 (예: '#2196F3')
}

// Event emitter for timer updates from native service
const eventEmitter = Platform.OS === 'android' && FocusTimerModule
  ? new NativeEventEmitter(FocusTimerModule)
  : null;

interface FocusTimerInterface {
  /**
   * 타이머 시작 (Foreground Service 시작 + 자체 타이머 실행)
   * @param timerMode - 타이머 모드 ('FOCUS' | 'BREAK' | 'FREE_FOCUS' | 'FREE_BREAK')
   * @param targetDuration - 설정된 전체 시간 (초) - progress 계산용
   * @param remainingSeconds - 현재 남은 시간 (초) - 실제 카운트다운 시작 시간
   * @param colors - 테마 색상 (선택사항, 없으면 기본 색상 사용)
   */
  startTimer(timerMode: FocusTimerMode, targetDuration: number, remainingSeconds?: number, colors?: FocusTimerColors): Promise<boolean>;

  /**
   * 타이머 일시정지
   */
  pauseTimer(): Promise<boolean>;

  /**
   * 타이머 재개
   */
  resumeTimer(): Promise<boolean>;

  /**
   * 타이머 종료 (Foreground Service 종료)
   */
  stopTimer(): Promise<boolean>;

  /**
   * 타이머 동기화 (RN과 Service 시간 맞추기)
   */
  syncTimer(remainingSeconds: number): Promise<boolean>;

  /**
   * 현재 타이머 상태 조회
   */
  getCurrentState(): Promise<TimerState | null>;

  /**
   * 지원 여부 확인
   */
  isSupported(): Promise<boolean>;

  /**
   * 타이머 업데이트 이벤트 구독
   */
  addUpdateListener(callback: (event: TimerUpdateEvent) => void): () => void;

  /**
   * 타이머 완료 이벤트 구독
   */
  addCompleteListener(callback: (event: TimerCompleteEvent) => void): () => void;

  // Legacy
  updateTimer(elapsedSeconds: number, isRunning: boolean, remainingSeconds: number): Promise<boolean>;
}

// 기본 색상
const DEFAULT_COLORS: FocusTimerColors = {
  focusColor: '#FF5252',
  breakColor: '#2196F3',
};

const FocusTimer: FocusTimerInterface = {
  async startTimer(
    timerMode: FocusTimerMode,
    targetDuration: number,
    remainingSeconds?: number,
    colors?: FocusTimerColors
  ): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }
    try {
      // remainingSeconds가 없으면 targetDuration을 사용
      const remaining = remainingSeconds ?? targetDuration;
      const finalColors = colors || DEFAULT_COLORS;
      return await FocusTimerModule.startTimer(
        timerMode,
        targetDuration,
        remaining,
        finalColors.focusColor,
        finalColors.breakColor
      );
    } catch {
      return false;
    }
  },

  async pauseTimer(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }
    try {
      return await FocusTimerModule.pauseTimer();
    } catch {
      return false;
    }
  },

  async resumeTimer(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }
    try {
      return await FocusTimerModule.resumeTimer();
    } catch {
      return false;
    }
  },

  async stopTimer(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }
    try {
      return await FocusTimerModule.stopTimer();
    } catch {
      return false;
    }
  },

  async syncTimer(remainingSeconds: number): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }
    try {
      return await FocusTimerModule.syncTimer(remainingSeconds);
    } catch {
      return false;
    }
  },

  async getCurrentState(): Promise<TimerState | null> {
    if (Platform.OS !== 'android') {
      return null;
    }
    try {
      return await FocusTimerModule.getCurrentState();
    } catch {
      return null;
    }
  },

  async isSupported(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }
    try {
      return await FocusTimerModule.isSupported();
    } catch {
      return false;
    }
  },

  addUpdateListener(callback: (event: TimerUpdateEvent) => void): () => void {
    if (!eventEmitter) {
      return () => {};
    }
    const subscription = eventEmitter.addListener('onTimerUpdate', callback);
    return () => subscription.remove();
  },

  addCompleteListener(callback: (event: TimerCompleteEvent) => void): () => void {
    if (!eventEmitter) {
      return () => {};
    }
    const subscription = eventEmitter.addListener('onTimerComplete', callback);
    return () => subscription.remove();
  },

  // Legacy method for backward compatibility
  async updateTimer(elapsedSeconds: number, isRunning: boolean, remainingSeconds: number): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }
    try {
      return await FocusTimerModule.updateTimer(elapsedSeconds, isRunning, remainingSeconds);
    } catch {
      return false;
    }
  },
};

export default FocusTimer;
