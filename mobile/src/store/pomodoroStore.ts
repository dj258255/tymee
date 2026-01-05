import {create} from 'zustand';
import {NativeModules, Platform} from 'react-native';
import {TimerMode, TimerSettings, PomodoroSession} from '../types/pomodoro';
import {useStudyRecordStore} from './studyRecordStore';
import AlarmService from '../modules/AlarmService';

const {LiveActivityModule, PomodoroWidgetModule} = NativeModules;

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

  // Pending session for memo (세션 완료 후 메모 입력 대기용)
  pendingSessionId: string | null;

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
  addMemoToSession: (sessionId: string, memo: string) => void;
  clearPendingSession: () => void;
  updateWidget: () => void;
}

const defaultSettings: TimerSettings = {
  appMode: 'FREE',
  focusDuration: 25,
  breakDuration: 5,
  cycleCount: 4,
  lockEnabled: false, // 기본적으로 잠금 비활성화
  blockedTabs: [], // 기본적으로 차단 탭 없음
  blockedApps: [], // 기본적으로 차단 앱 없음
  pomodoroTheme: 'default', // 기본 테마 (레거시)
  // 개별 타이머 색상 설정
  focusColorId: 'red', // 기본 집중 색상: 레드
  breakColorId: 'blue', // 기본 휴식 색상: 블루
  // 알람 설정
  alarmEnabled: true, // 기본적으로 알람 활성화
  alarmSound: 'default', // 기본 시스템 알람 사운드
  alarmVibration: true, // 기본적으로 진동 활성화
  breakAlarmEnabled: true, // 기본적으로 휴식 완료 알람도 활성화
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
  pendingSessionId: null,

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
    // 잠금은 집중모드 + 잠금 활성화 + 집중 시간일 때만
    const shouldLock = isRunning && settings.appMode === 'CONCENTRATION' && settings.lockEnabled && mode === 'FOCUS';
    set({
      isRunning,
      isLocked: shouldLock,
    });
    // 위젯 업데이트
    setTimeout(() => get().updateWidget(), 100);
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

    const durationMinutes = mode === 'FOCUS' ? settings.focusDuration : settings.breakDuration;
    const newSession: PomodoroSession = {
      id: Date.now().toString(),
      startTime: new Date(Date.now() - durationMinutes * 60 * 1000),
      endTime: new Date(),
      mode,
      completed: true,
    };

    // 알람 재생 (자유모드/집중모드 모두)
    const shouldPlayAlarm =
      (mode === 'FOCUS' && settings.alarmEnabled) ||
      (mode === 'BREAK' && settings.breakAlarmEnabled);

    if (shouldPlayAlarm) {
      AlarmService.playAlarm(settings.alarmSound, settings.alarmVibration);
    }

    let newMode: TimerMode;
    let newCurrentCycle = currentCycle;
    let newCompletedCycles = completedCycles;

    // 자유 모드: 세션 저장 안함, 메모 모달 안뜸, 자동 전환 없음
    if (settings.appMode === 'FREE') {
      newMode = mode; // 현재 모드 유지
      set({
        timeLeft: getInitialTimeLeft(mode, settings),
        isRunning: false,
        // 자유모드는 세션을 저장하지 않음
        pendingSessionId: null, // 메모 모달도 안뜸
      });
      return;
    }

    // 집중 모드: 집중/휴식 모두 공부 기록에 저장
    useStudyRecordStore.getState().addStudySession({
      startTime: newSession.startTime,
      endTime: newSession.endTime,
      durationMinutes,
      type: mode === 'FOCUS' ? 'pomodoro' : 'break',
    });

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
      // 집중 모드에서는 세션 완료 시 메모 입력 가능 (선택적)
      pendingSessionId: newSession.id,
    });

    // 위젯 업데이트
    setTimeout(() => get().updateWidget(), 100);
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

  addMemoToSession: (sessionId: string, memo: string) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? {...s, memo} : s
      ),
      pendingSessionId: null,
    }));
  },

  clearPendingSession: () => {
    set({pendingSessionId: null});
  },

  updateWidget: () => {
    const {mode, isRunning, completedCycles, settings, sessions} = get();
    const studyStore = useStudyRecordStore.getState();

    // 오늘 날짜
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // 오늘 완료한 뽀모도로 수 계산 (집중 모드 세션만)
    const todayPomodoros = sessions.filter(s => {
      const sessionDate = new Date(s.startTime);
      const sessionDateStr = `${sessionDate.getFullYear()}-${String(sessionDate.getMonth() + 1).padStart(2, '0')}-${String(sessionDate.getDate()).padStart(2, '0')}`;
      return sessionDateStr === todayStr && s.mode === 'FOCUS' && s.completed;
    }).length;

    // 오늘 집중 시간 (분) - studyRecordStore에서 가져오기
    const todaySessions = (studyStore.sessions || []).filter(s => {
      const sessionDate = new Date(s.startTime);
      const sessionDateStr = `${sessionDate.getFullYear()}-${String(sessionDate.getMonth() + 1).padStart(2, '0')}-${String(sessionDate.getDate()).padStart(2, '0')}`;
      return sessionDateStr === todayStr && s.type === 'pomodoro';
    });
    const todayFocusMinutes = todaySessions.reduce((sum, s) => sum + s.durationMinutes, 0);

    // 위젯 데이터 업데이트
    const widgetData = {
      todayPomodoros,
      todayFocusMinutes,
      currentStreak: completedCycles, // 현재 완료한 사이클 수
      dailyGoal: settings.cycleCount * 2, // 일일 목표 (사이클 수 * 2)
      focusDuration: settings.focusDuration,
      breakDuration: settings.breakDuration,
      isTimerRunning: isRunning,
      currentMode: mode,
    };

    // iOS 위젯 업데이트
    if (Platform.OS === 'ios') {
      LiveActivityModule?.updateWidgetData?.(widgetData).catch((err: Error) => {
        console.log('iOS Widget update failed:', err);
      });
    }

    // Android 위젯 업데이트
    if (Platform.OS === 'android') {
      PomodoroWidgetModule?.updateWidgetData?.(widgetData).catch((err: Error) => {
        console.log('Android Widget update failed:', err);
      });
    }
  },
}));
