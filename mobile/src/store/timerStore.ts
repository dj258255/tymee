import {create} from 'zustand';
import {TimerState, SegmentInfo} from '../types/timer';
import {
  calculateSegments,
  getElapsedTime,
  getRemainingTime,
  getCurrentSegment,
  updateSegmentStatuses,
  isTimerComplete,
} from '../utils/timerEngine';
import {Vibration} from 'react-native';
import {useStudyRecordStore} from './studyRecordStore';
import {useCurrencyStore} from './currencyStore';

interface TimerStore extends TimerState {
  // Actions
  start: (minutes: number) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reset: () => void;
  tick: () => void;

  // Computed
  getRemainingMs: () => number;
  getElapsedMs: () => number;
}

const initialState: TimerState = {
  startTimestamp: 0,
  duration: 0,
  pausedAt: null,
  pausedDuration: 0,
  currentSegment: 0,
  segments: [],
  status: 'idle',
  totalMinutes: 0,
  createdAt: new Date(),
};

export const useTimerStore = create<TimerStore>((set, get) => ({
  ...initialState,

  start: (minutes: number) => {
    const duration = minutes * 60 * 1000;
    const segments = calculateSegments(duration);

    set({
      startTimestamp: Date.now(),
      duration,
      pausedAt: null,
      pausedDuration: 0,
      currentSegment: 0,
      segments,
      status: 'running',
      totalMinutes: minutes,
      createdAt: new Date(),
      completedAt: undefined,
    });

    // Start haptic
    Vibration.vibrate(50);
  },

  pause: () => {
    const state = get();
    if (state.status !== 'running') return;

    set({
      pausedAt: Date.now(),
      status: 'paused',
    });

    Vibration.vibrate(30);
  },

  resume: () => {
    const state = get();
    if (state.status !== 'paused' || !state.pausedAt) return;

    set({
      pausedDuration: state.pausedDuration + (Date.now() - state.pausedAt),
      pausedAt: null,
      status: 'running',
    });

    Vibration.vibrate(30);
  },

  stop: () => {
    set({
      ...initialState,
      createdAt: new Date(),
    });

    Vibration.vibrate([50, 100, 50]);
  },

  reset: () => {
    set({
      ...initialState,
      createdAt: new Date(),
    });
  },

  tick: () => {
    const state = get();

    if (state.status !== 'running') return;

    const elapsed = getElapsedTime(state);
    const remaining = getRemainingTime(state);

    // Check if timer is complete
    if (isTimerComplete(state)) {
      const completedAt = new Date();
      set({
        status: 'completed',
        completedAt,
      });

      // 공부 기록에 저장
      useStudyRecordStore.getState().addStudySession({
        startTime: state.createdAt,
        endTime: completedAt,
        durationMinutes: state.totalMinutes,
        type: 'timer',
      });

      // 보상 지급 (집중모드 완료)
      useCurrencyStore.getState().grantFocusReward('timer', state.totalMinutes);

      // Completion haptic
      Vibration.vibrate([100, 50, 100, 50, 100]);
      return;
    }

    const currentSegmentIndex = getCurrentSegment(elapsed, state.segments);
    const updatedSegments = updateSegmentStatuses(
      state.segments,
      currentSegmentIndex,
      elapsed,
    );

    // Check if segment changed (trigger haptic)
    if (currentSegmentIndex !== state.currentSegment) {
      Vibration.vibrate(100); // Medium haptic
    }

    set({
      currentSegment: currentSegmentIndex,
      segments: updatedSegments,
    });
  },

  getRemainingMs: () => {
    return getRemainingTime(get());
  },

  getElapsedMs: () => {
    return getElapsedTime(get());
  },
}));
