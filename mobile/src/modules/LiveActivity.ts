import {NativeModules, Platform} from 'react-native';

const {LiveActivityModule} = NativeModules;

// Timer modes for Live Activity
// - FOCUS: 집중모드에서 집중시간
// - BREAK: 집중모드에서 휴식시간
// - FREE_FOCUS: 자유모드에서 집중시간
// - FREE_BREAK: 자유모드에서 휴식시간
export type LiveActivityTimerMode = 'FOCUS' | 'BREAK' | 'FREE_FOCUS' | 'FREE_BREAK';

// 색상 옵션 (hex 색상 코드)
export interface LiveActivityColors {
  focusColor: string;  // 집중 시간 색상 (예: '#FF5252')
  breakColor: string;  // 휴식 시간 색상 (예: '#2196F3')
}

interface LiveActivityInterface {
  /**
   * Live Activity 시작
   * @param timerMode - 타이머 모드 ('FOCUS' | 'BREAK' | 'FREE_FOCUS' | 'FREE_BREAK')
   * @param remainingSeconds - 현재 남은 시간 (초) - endTime 계산에 사용
   * @param colors - 테마 색상 (선택사항, 없으면 기본 색상 사용)
   * @param totalTargetDuration - 총 목표 시간 (초) - 경과시간/프로그레스 계산에 사용
   * @returns Activity ID
   */
  startActivity(timerMode: LiveActivityTimerMode, remainingSeconds: number, colors?: LiveActivityColors, totalTargetDuration?: number): Promise<string>;

  /**
   * Live Activity 업데이트
   * @param elapsedSeconds - 경과 시간 (초)
   * @param isRunning - 실행 중 여부
   */
  updateActivity(elapsedSeconds: number, isRunning: boolean): Promise<boolean>;

  /**
   * Live Activity 종료
   */
  endActivity(): Promise<boolean>;

  /**
   * Live Activity 지원 여부 확인
   */
  isActivitySupported(): Promise<boolean>;

  /**
   * Live Activity 활성화 여부 확인
   */
  isActivityActive(): Promise<boolean>;
}

// 기본 색상
const DEFAULT_COLORS: LiveActivityColors = {
  focusColor: '#FF5252',
  breakColor: '#2196F3',
};

const LiveActivity: LiveActivityInterface = {
  async startActivity(
    timerMode: LiveActivityTimerMode,
    remainingSeconds: number,
    colors?: LiveActivityColors,
    totalTargetDuration?: number
  ): Promise<string> {
    if (Platform.OS !== 'ios') {
      throw new Error('Live Activity is only supported on iOS');
    }
    const finalColors = colors || DEFAULT_COLORS;
    // totalTargetDuration이 없으면 remainingSeconds를 사용 (처음 시작할 때)
    const targetDuration = totalTargetDuration || remainingSeconds;
    return LiveActivityModule.startActivity(
      timerMode,
      remainingSeconds,
      finalColors,
      targetDuration
    );
  },

  async updateActivity(elapsedSeconds: number, isRunning: boolean): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      return false;
    }
    try {
      return await LiveActivityModule.updateActivity(elapsedSeconds, isRunning);
    } catch {
      return false;
    }
  },

  async endActivity(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      return false;
    }
    try {
      return await LiveActivityModule.endActivity();
    } catch {
      return false;
    }
  },

  async isActivitySupported(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      return false;
    }
    try {
      return await LiveActivityModule.isActivitySupported();
    } catch {
      return false;
    }
  },

  async isActivityActive(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      return false;
    }
    try {
      return await LiveActivityModule.isActivityActive();
    } catch {
      return false;
    }
  },
};

export default LiveActivity;
