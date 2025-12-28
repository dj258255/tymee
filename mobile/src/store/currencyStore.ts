import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 보상 타입
export type RewardSource =
  | 'timer'           // 일반 타이머 집중모드
  | 'pomodoro'        // 뽀모도로
  | 'free_matching'   // 자유매칭
  | 'focus_matching'  // 집중매칭
  | 'daily_bonus'     // 일일 보너스
  | 'achievement'     // 업적 달성
  | 'purchase';       // 구매

// 보상 기록
export interface RewardRecord {
  id: string;
  source: RewardSource;
  pencils: number;
  ballpens: number;
  rp: number;
  durationMinutes?: number;
  createdAt: Date;
}

// 보상 계산 상수
export const REWARD_CONFIG = {
  // 기본 타이머: 분당 연필 1개
  timer: {
    pencilsPerMinute: 1,
    rpPerMinute: 0,
  },
  // 뽀모도로: 분당 연필 1.2개 (25분 = 30연필)
  pomodoro: {
    pencilsPerMinute: 1.2,
    rpPerMinute: 0,
  },
  // 자유매칭: 분당 연필 2개 + RP 4 (25분 = 50연필 + 100RP)
  free_matching: {
    pencilsPerMinute: 2,
    rpPerMinute: 4,
  },
  // 집중매칭: 분당 연필 3개 + RP 8 (25분 = 75연필 + 200RP)
  focus_matching: {
    pencilsPerMinute: 3,
    rpPerMinute: 8,
  },
};

interface CurrencyState {
  pencils: number;      // 연필 (무료 재화)
  ballpens: number;     // 볼펜 (유료 재화)
  rp: number;           // 랭킹 포인트
  rewardHistory: RewardRecord[];
}

interface CurrencyStore extends CurrencyState {
  // Actions
  addPencils: (amount: number) => void;
  spendPencils: (amount: number) => boolean;
  addBallpens: (amount: number) => void;
  spendBallpens: (amount: number) => boolean;
  addRP: (amount: number) => void;

  // 보상 지급 (집중모드 완료 시)
  grantFocusReward: (source: RewardSource, durationMinutes: number) => RewardRecord;

  // 기록 조회
  getRewardHistory: (limit?: number) => RewardRecord[];
  getTodayRewards: () => RewardRecord[];

  // 보상 미리보기 (UI 표시용)
  calculateReward: (source: RewardSource, durationMinutes: number) => {pencils: number; rp: number};
}

const initialState: CurrencyState = {
  pencils: 100,     // 초기 연필 100개
  ballpens: 0,
  rp: 0,
  rewardHistory: [],
};

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      addPencils: (amount: number) => {
        set(state => ({pencils: state.pencils + amount}));
      },

      spendPencils: (amount: number) => {
        const state = get();
        if (state.pencils < amount) return false;
        set({pencils: state.pencils - amount});
        return true;
      },

      addBallpens: (amount: number) => {
        set(state => ({ballpens: state.ballpens + amount}));
      },

      spendBallpens: (amount: number) => {
        const state = get();
        if (state.ballpens < amount) return false;
        set({ballpens: state.ballpens - amount});
        return true;
      },

      addRP: (amount: number) => {
        set(state => ({rp: state.rp + amount}));
      },

      calculateReward: (source: RewardSource, durationMinutes: number) => {
        const config = REWARD_CONFIG[source as keyof typeof REWARD_CONFIG];
        if (!config) {
          return {pencils: 0, rp: 0};
        }

        // 연필 보상 최대 360개로 제한 (뽀모도로/타이머 기준)
        const rawPencils = Math.round(durationMinutes * config.pencilsPerMinute);
        const pencils = (source === 'pomodoro' || source === 'timer')
          ? Math.min(360, rawPencils)
          : rawPencils;
        const rp = Math.round(durationMinutes * config.rpPerMinute);

        return {pencils, rp};
      },

      grantFocusReward: (source: RewardSource, durationMinutes: number) => {
        const {pencils, rp} = get().calculateReward(source, durationMinutes);

        const record: RewardRecord = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          source,
          pencils,
          ballpens: 0,
          rp,
          durationMinutes,
          createdAt: new Date(),
        };

        set(state => ({
          pencils: state.pencils + pencils,
          rp: state.rp + rp,
          rewardHistory: [record, ...state.rewardHistory].slice(0, 100), // 최근 100개만 유지
        }));

        return record;
      },

      getRewardHistory: (limit = 20) => {
        return get().rewardHistory.slice(0, limit);
      },

      getTodayRewards: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return get().rewardHistory.filter(record => {
          const recordDate = new Date(record.createdAt);
          recordDate.setHours(0, 0, 0, 0);
          return recordDate.getTime() === today.getTime();
        });
      },
    }),
    {
      name: 'currency-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        pencils: state.pencils,
        ballpens: state.ballpens,
        rp: state.rp,
        rewardHistory: state.rewardHistory.slice(0, 50), // 저장은 50개만
      }),
    }
  )
);

// 보상 소스 한글명
export const getRewardSourceName = (source: RewardSource): string => {
  switch (source) {
    case 'timer': return '타이머';
    case 'pomodoro': return '뽀모도로';
    case 'free_matching': return '자유매칭';
    case 'focus_matching': return '집중매칭';
    case 'daily_bonus': return '일일 보너스';
    case 'achievement': return '업적 달성';
    case 'purchase': return '구매';
    default: return '기타';
  }
};
