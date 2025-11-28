import {useEffect, useRef} from 'react';
import {useTimerStore} from '../store/timerStore';
import {formatTime} from '../utils/timerEngine';

/**
 * Custom hook for timer logic
 * Handles interval updates
 */
export const useTimer = () => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const {status, tick, getRemainingMs, getElapsedMs, start, pause, resume, stop, reset} =
    useTimerStore();

  // Tick interval
  useEffect(() => {
    if (status === 'running') {
      // Update every 100ms for smooth animation
      intervalRef.current = setInterval(() => {
        tick();
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [status, tick]);

  // Get display time
  const remainingTime = formatTime(getRemainingMs());
  const elapsedTime = formatTime(getElapsedMs());

  return {
    status,
    remainingTime,
    elapsedTime,
    start,
    pause,
    resume,
    stop,
    reset,
  };
};
