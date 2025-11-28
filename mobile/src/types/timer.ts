// Timer Types

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

export type SegmentStatus = 'idle' | 'running' | 'completed';

export interface SegmentInfo {
  index: number;              // 0-11
  startTime: number;          // ms
  endTime: number;            // ms
  duration: number;           // ms
  angle: {
    start: number;            // degree (0-360)
    end: number;              // degree
  };
  status: SegmentStatus;
  progress: number;           // 0-100
}

export interface TimerState {
  // Time
  startTimestamp: number;
  duration: number;           // total duration in ms
  pausedAt: number | null;
  pausedDuration: number;

  // Segments
  currentSegment: number;     // 0-11
  segments: SegmentInfo[];

  // Status
  status: TimerStatus;

  // Settings
  totalMinutes: number;

  // Metadata
  createdAt: Date;
  completedAt?: Date;
}

export interface TimerControls {
  start: (minutes: number) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reset: () => void;
}

export interface TimerDisplayTime {
  minutes: number;
  seconds: number;
  totalSeconds: number;
  formattedTime: string;      // "MM:SS"
}
