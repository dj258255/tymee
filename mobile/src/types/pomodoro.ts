import {PomodoroThemeType} from '../themes/pomodoroThemes';

export type TimerMode = 'FOCUS' | 'BREAK';
export type AppMode = 'FREE' | 'CONCENTRATION'; // 자유 모드 | 집중 모드
export type TabName = 'Timer' | 'Matching' | 'Community' | 'StudyRecord' | 'More';

// 알람 사운드 타입
// - default: 시스템 기본 알림음 (무음모드 시 소리 없음)
// - none: 소리 없이 진동만
// - silent: 소리와 진동 모두 없음 (완전 무음)
export type AlarmSoundType = 'default' | 'none' | 'silent';

export interface TimerSettings {
  appMode: AppMode; // 앱 모드
  focusDuration: number; // 집중 시간 (분)
  breakDuration: number; // 휴식 시간 (분)
  cycleCount: number; // 집중 모드일 때 반복 횟수
  lockEnabled: boolean; // 잠금 모드 활성화 여부 (탭/앱 차단)
  blockedTabs: TabName[]; // 집중 모드일 때 차단할 탭들
  blockedApps: string[]; // 집중 모드일 때 차단할 앱들 (번들 ID)
  pomodoroTheme: PomodoroThemeType; // 뽀모도로 타이머 테마 (레거시, 하위 호환용)
  // 개별 타이머 색상 설정
  focusColorId: string; // 집중 타이머 색상 ID
  breakColorId: string; // 휴식 타이머 색상 ID
  // 알람 설정
  alarmEnabled: boolean; // 집중 완료 알람 활성화 여부
  alarmSound: AlarmSoundType | string; // 알람 사운드 종류 (기본 타입 또는 커스텀 사운드 ID)
  alarmVibration: boolean; // 알람 시 진동 여부
  breakAlarmEnabled: boolean; // 휴식 완료 알람 활성화 여부 (집중모드에서만)
}

export interface PomodoroSession {
  id: string;
  startTime: Date;
  endTime: Date;
  mode: TimerMode;
  completed: boolean;
  memo?: string; // 세션 메모
}

export interface PomodoroStats {
  totalSessions: number;
  completedSessions: number;
  totalFocusTime: number; // in minutes
  todayFocusTime: number; // in minutes
  weekFocusTime: number; // in minutes
}
