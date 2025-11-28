import {SegmentInfo, TimerState, TimerDisplayTime} from '../types/timer';

/**
 * Calculate 12 segments for the ring timer
 */
export const calculateSegments = (totalDuration: number): SegmentInfo[] => {
  const segmentDuration = totalDuration / 12;

  return Array.from({length: 12}, (_, i) => ({
    index: i,
    startTime: i * segmentDuration,
    endTime: (i + 1) * segmentDuration,
    duration: segmentDuration,
    angle: {
      start: i * 30, // 360 / 12 = 30 degrees per segment
      end: (i + 1) * 30,
    },
    status: 'idle' as const,
    progress: 0,
  }));
};

/**
 * Get elapsed time accounting for pauses
 */
export const getElapsedTime = (timer: TimerState): number => {
  if (timer.status === 'idle') {
    return 0;
  }

  if (timer.pausedAt) {
    return timer.pausedAt - timer.startTimestamp - timer.pausedDuration;
  }

  return Date.now() - timer.startTimestamp - timer.pausedDuration;
};

/**
 * Get remaining time in milliseconds
 */
export const getRemainingTime = (timer: TimerState): number => {
  const elapsed = getElapsedTime(timer);
  return Math.max(0, timer.duration - elapsed);
};

/**
 * Get current segment index based on elapsed time
 */
export const getCurrentSegment = (
  elapsed: number,
  segments: SegmentInfo[],
): number => {
  for (let i = 0; i < segments.length; i++) {
    if (elapsed >= segments[i].startTime && elapsed < segments[i].endTime) {
      return i;
    }
  }
  return 11; // Last segment
};

/**
 * Get progress percentage within a segment
 */
export const getSegmentProgress = (
  elapsed: number,
  segment: SegmentInfo,
): number => {
  if (elapsed < segment.startTime) {
    return 0;
  }
  if (elapsed >= segment.endTime) {
    return 100;
  }

  const segmentElapsed = elapsed - segment.startTime;
  return (segmentElapsed / segment.duration) * 100;
};

/**
 * Update segment statuses based on current time
 */
export const updateSegmentStatuses = (
  segments: SegmentInfo[],
  currentSegmentIndex: number,
  elapsed: number,
): SegmentInfo[] => {
  return segments.map((segment, index) => {
    if (index < currentSegmentIndex) {
      return {...segment, status: 'completed' as const, progress: 100};
    } else if (index === currentSegmentIndex) {
      const progress = getSegmentProgress(elapsed, segment);
      return {...segment, status: 'running' as const, progress};
    } else {
      return {...segment, status: 'idle' as const, progress: 0};
    }
  });
};

/**
 * Format time for display (MM:SS)
 */
export const formatTime = (milliseconds: number): TimerDisplayTime => {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return {
    minutes,
    seconds,
    totalSeconds,
    formattedTime: `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`,
  };
};

/**
 * Calculate overall progress percentage
 */
export const getOverallProgress = (timer: TimerState): number => {
  const elapsed = getElapsedTime(timer);
  return (elapsed / timer.duration) * 100;
};

/**
 * Check if timer is complete
 */
export const isTimerComplete = (timer: TimerState): boolean => {
  return getRemainingTime(timer) === 0;
};
