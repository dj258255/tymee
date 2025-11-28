import {create} from 'zustand';
import {TimerMode, TimerSettings, PomodoroSession} from '../types/pomodoro';

interface PomodoroState {
  // Timer state
  mode: TimerMode;
  timeLeft: number; // in seconds
  isRunning: boolean;
  completedSessions: number;
  isFullscreen: boolean;

  // Settings
  settings: TimerSettings;

  // Sessions history
  sessions: PomodoroSession[];

  // Actions
  setMode: (mode: TimerMode) => void;
  setTimeLeft: (time: number) => void;
  setIsRunning: (isRunning: boolean) => void;
  setIsFullscreen: (isFullscreen: boolean) => void;
  tick: () => void;
  reset: () => void;
  completeSession: () => void;
  updateSettings: (settings: Partial<TimerSettings>) => void;
}

const defaultSettings: TimerSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4,
};

const getInitialTimeLeft = (mode: TimerMode, settings: TimerSettings): number => {
  switch (mode) {
    case 'WORK':
      return settings.workDuration * 60;
    case 'SHORT_BREAK':
      return settings.shortBreakDuration * 60;
    case 'LONG_BREAK':
      return settings.longBreakDuration * 60;
  }
};

export const usePomodoroStore = create<PomodoroState>((set, get) => ({
  mode: 'WORK',
  timeLeft: defaultSettings.workDuration * 60,
  isRunning: false,
  completedSessions: 0,
  isFullscreen: false,
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

  setIsRunning: (isRunning: boolean) => set({isRunning}),

  setIsFullscreen: (isFullscreen: boolean) => set({isFullscreen}),

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
    const {mode, completedSessions, settings, sessions} = get();

    const newSession: PomodoroSession = {
      id: Date.now().toString(),
      startTime: new Date(Date.now() - (mode === 'WORK' ? settings.workDuration * 60 * 1000 : 0)),
      endTime: new Date(),
      mode,
      completed: true,
    };

    let newMode: TimerMode;
    let newCompletedSessions = completedSessions;

    if (mode === 'WORK') {
      newCompletedSessions += 1;
      if (newCompletedSessions % settings.sessionsUntilLongBreak === 0) {
        newMode = 'LONG_BREAK';
      } else {
        newMode = 'SHORT_BREAK';
      }
    } else {
      newMode = 'WORK';
    }

    set({
      mode: newMode,
      timeLeft: getInitialTimeLeft(newMode, settings),
      isRunning: false,
      completedSessions: newCompletedSessions,
      sessions: [...sessions, newSession],
    });
  },

  updateSettings: (newSettings: Partial<TimerSettings>) => {
    const {settings} = get();
    const updatedSettings = {...settings, ...newSettings};
    set({
      settings: updatedSettings,
      timeLeft: getInitialTimeLeft(get().mode, updatedSettings),
    });
  },
}));
