export type TimerMode = 'FOCUS' | 'BREAK';
export type AppMode = 'FREE' | 'CONCENTRATION'; // 자유 모드 | 집중 모드
export type TabName = 'Timer' | 'Store' | 'Group' | 'StudyRecord' | 'More';

export interface TimerSettings {
  appMode: AppMode; // 앱 모드
  focusDuration: number; // 집중 시간 (분)
  breakDuration: number; // 휴식 시간 (분)
  cycleCount: number; // 집중 모드일 때 반복 횟수
  blockedTabs: TabName[]; // 집중 모드일 때 차단할 탭들
  blockedApps: string[]; // 집중 모드일 때 차단할 앱들 (번들 ID)
}

export interface PomodoroSession {
  id: string;
  startTime: Date;
  endTime: Date;
  mode: TimerMode;
  completed: boolean;
}

export interface PomodoroStats {
  totalSessions: number;
  completedSessions: number;
  totalFocusTime: number; // in minutes
  todayFocusTime: number; // in minutes
  weekFocusTime: number; // in minutes
}
