import {create} from 'zustand';
import {TimerMode, TimerSettings, PomodoroSession} from '../types/pomodoro';

interface PomodoroState {
  // Timer state
  mode: TimerMode;
  timeLeft: number; // in seconds
  isRunning: boolean;
  completedCycles: number; // 완료된 사이클 수 (집중 모드용)
  currentCycle: number; // 현재 사이클 번호 (집중 모드용)
  isFullscreen: boolean;
  isLocked: boolean; // 앱 잠금 상태 (집중 모드 집중 시간일 때)

  // Settings
  settings: TimerSettings;

  // Sessions history
  sessions: PomodoroSession[];

  // Actions
  setMode: (mode: TimerMode) => void;
  setTimeLeft: (time: number) => void;
  setIsRunning: (isRunning: boolean) => void;
  setIsFullscreen: (isFullscreen: boolean) => void;
  setIsLocked: (isLocked: boolean) => void;
  tick: () => void;
  reset: () => void;
  completeSession: () => void;
  updateSettings: (settings: Partial<TimerSettings>) => void;
}

const defaultSettings: TimerSettings = {
  appMode: 'FREE',
  focusDuration: 25,
  breakDuration: 5,
  cycleCount: 4,
  blockedTabs: ['Store', 'Group', 'StudyRecord', 'More'], // 기본적으로 타이머 외 모든 탭 차단
  blockedApps: [], // 기본적으로 차단 앱 없음
};

const getInitialTimeLeft = (mode: TimerMode, settings: TimerSettings): number => {
  switch (mode) {
    case 'FOCUS':
      return settings.focusDuration * 60;
    case 'BREAK':
      return settings.breakDuration * 60;
  }
};

export const usePomodoroStore = create<PomodoroState>((set, get) => ({
  mode: 'FOCUS',
  timeLeft: defaultSettings.focusDuration * 60,
  isRunning: false,
  completedCycles: 0,
  currentCycle: 1,
  isFullscreen: false,
  isLocked: false,
  settings: defaultSettings,
  sessions: [],

  setMode: (mode: TimerMode) => {
    const {settings} = get();
    set({
      mode,
      timeLeft: getInitialTimeLeft(mode, settings),
      isRunning: false,
    });
  },

  setTimeLeft: (time: number) => set({timeLeft: time}),

  setIsRunning: (isRunning: boolean) => {
    const {settings, mode} = get();
    const shouldLock = isRunning && settings.appMode === 'CONCENTRATION' && mode === 'FOCUS';
    set({
      isRunning,
      isLocked: shouldLock,
    });
  },

  setIsFullscreen: (isFullscreen: boolean) => set({isFullscreen}),

  setIsLocked: (isLocked: boolean) => set({isLocked}),

  tick: () => {
    const {timeLeft, isRunning} = get();
    if (isRunning && timeLeft > 0) {
      set({timeLeft: timeLeft - 1});
    } else if (isRunning && timeLeft === 0) {
      get().completeSession();
    }
  },

  reset: () => {
    const {mode, settings} = get();
    set({
      timeLeft: getInitialTimeLeft(mode, settings),
      isRunning: false,
    });
  },

  completeSession: () => {
    const {mode, currentCycle, completedCycles, settings, sessions} = get();

    const newSession: PomodoroSession = {
      id: Date.now().toString(),
      startTime: new Date(Date.now() - (mode === 'FOCUS' ? settings.focusDuration * 60 * 1000 : settings.breakDuration * 60 * 1000)),
      endTime: new Date(),
      mode,
      completed: true,
    };

    let newMode: TimerMode;
    let newCurrentCycle = currentCycle;
    let newCompletedCycles = completedCycles;

    // 자유 모드: 타이머 완료 시 자동 전환 없음, 그냥 정지
    if (settings.appMode === 'FREE') {
      newMode = mode; // 현재 모드 유지
      set({
        timeLeft: getInitialTimeLeft(mode, settings),
        isRunning: false,
        sessions: [...sessions, newSession],
      });
      return;
    }

    // 집중 모드: 집중 -> 휴식 -> 집중 순환
    if (mode === 'FOCUS') {
      // 집중 완료 후 휴식으로
      newMode = 'BREAK';
      newCurrentCycle += 1;
    } else {
      // 휴식 완료 후
      if (currentCycle > settings.cycleCount) {
        // 모든 사이클 완료
        newMode = 'FOCUS';
        newCurrentCycle = 1;
        newCompletedCycles += 1;
      } else {
        // 다음 사이클 집중
        newMode = 'FOCUS';
      }
    }

    set({
      mode: newMode,
      timeLeft: getInitialTimeLeft(newMode, settings),
      isRunning: settings.appMode === 'CONCENTRATION', // 집중 모드에서는 자동 시작
      currentCycle: newCurrentCycle,
      completedCycles: newCompletedCycles,
      sessions: [...sessions, newSession],
    });
  },

  updateSettings: (newSettings: Partial<TimerSettings>) => {
    const {settings, mode} = get();
    const updatedSettings = {...settings, ...newSettings};

    // appMode 변경 시 타이머 리셋
    if (newSettings.appMode && newSettings.appMode !== settings.appMode) {
      set({
        settings: updatedSettings,
        timeLeft: getInitialTimeLeft(mode, updatedSettings),
        isRunning: false,
        currentCycle: 1,
      });
    } else {
      set({
        settings: updatedSettings,
        timeLeft: getInitialTimeLeft(mode, updatedSettings),
      });
    }
  },
}));
