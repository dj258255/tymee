export type TimerMode = 'WORK' | 'SHORT_BREAK' | 'LONG_BREAK';

export interface TimerSettings {
  workDuration: number; // in minutes
  shortBreakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  sessionsUntilLongBreak: number;
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
