import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {StudyRecordThemeType} from '../themes/studyRecordThemes';

// ============ 타입 정의 ============

export interface Subject {
  id: string;
  name: string;
  color: string;
}

export type TimeBlockStatus = 'incomplete' | 'completed'; // 미완료, 완료

export interface TimeBlock {
  hour: number;
  minute: number; // 0, 10, 20, 30, 40, 50
  subjectId: string;
  date: string; // YYYY-MM-DD
  memo?: string; // 블록별 메모
  status?: TimeBlockStatus; // 블록 완료 상태 (기본: incomplete)
}

export interface Task {
  id: string;
  title: string;
  estimatedMinutes: number;
  actualMinutes?: number;
  completed: boolean;
  subjectId?: string;
  date: string; // YYYY-MM-DD
  priority: number; // 우선순위 (낮을수록 높은 우선순위)
}

export interface StudySession {
  id: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  subjectId?: string;
  type: 'timer' | 'pomodoro' | 'break' | 'manual'; // 어디서 기록됐는지 (break: 휴식시간)
  date: string; // YYYY-MM-DD
}

export interface DailyStats {
  date: string;
  totalMinutes: number;
  sessions: number;
  subjectMinutes: Record<string, number>; // subjectId -> minutes
}

// 일일 코멘트 (오늘의 다짐/목표)
export interface DailyComment {
  date: string;
  comment: string;
}

// 일일 메모
export interface DailyMemo {
  date: string;
  memo: string;
}

// D-day 설정
export interface DdayInfo {
  id: string;
  targetDate: string; // YYYY-MM-DD
  title: string; // 예: "수능", "기말고사"
  color?: string; // 디데이별 색상 (선택)
  isPrimary?: boolean; // 메인 디데이 여부
}

// 목표 타입
export type GoalPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Goal {
  id: string;
  period: GoalPeriod;
  content: string;
  isCompleted: boolean;
  createdAt: string;
  completedAt?: string;
  order?: number; // 정렬 순서
}

// 시간표 템플릿 (저장된 패턴)
export interface TimetableTemplate {
  id: string;
  name: string;
  blocks: Array<{hour: number; minute: number; subjectId: string}>;
  createdAt: string;
}

// 요일별 시간표 블록 (날짜 없이 시간만)
export interface WeeklyTimetableBlock {
  hour: number;
  minute: number;
  subjectId: string;
}

// 요일별 시간표 (0: 일, 1: 월, ..., 6: 토)
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface WeeklyTimetable {
  [key: number]: WeeklyTimetableBlock[]; // 0-6 (일-토)
}

// 요일별 템플릿 연결 (요일 -> 템플릿 ID)
export interface WeeklyTemplateMapping {
  [key: number]: string | null; // 0-6 (일-토) -> templateId
}

// ============ Store 인터페이스 ============

interface StudyRecordState {
  // 과목 목록
  subjects: Subject[];

  // 텐미닛 플래너 블록
  timeBlocks: TimeBlock[];

  // 태스크 목록
  tasks: Task[];

  // 공부 세션 기록
  sessions: StudySession[];

  // 일일 코멘트 (오늘의 다짐/목표)
  dailyComments: DailyComment[];

  // 일일 메모
  dailyMemos: DailyMemo[];

  // D-day 설정 (기존 - 호환성)
  dday: DdayInfo | null;

  // D-day 목록 (여러 개)
  ddays: DdayInfo[];

  // 목표 목록 (주간/월간/연간)
  goals: Goal[];

  // 전체 공부 시간 (분)
  totalStudyMinutes: number;

  // 연속 기록
  streak: number;
  bestStreak: number;
  lastStudyDate: string | null;

  // 목표
  dailyGoalMinutes: number;
  weeklyGoalMinutes: number;

  // 탠미닛 플래너 설정
  plannerStartHour: number; // 플래너 시작 시간 (0-23)
  plannerEndHour: number;   // 플래너 종료 시간 (1-28, 24 초과 시 다음날)

  // 테마
  selectedTheme: StudyRecordThemeType;

  // 시간표 템플릿
  timetableTemplates: TimetableTemplate[];

  // 요일별 시간표
  weeklyTimetable: WeeklyTimetable;

  // 요일별 템플릿 매핑
  weeklyTemplateMapping: WeeklyTemplateMapping;

  // 요일별 시간표 활성화 여부
  weeklyTimetableEnabled: boolean;

  // Actions - 과목
  addSubject: (subject: Omit<Subject, 'id'>) => void;
  updateSubject: (id: string, subject: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;

  // Actions - 텐미닛 블록
  setTimeBlocks: (blocks: TimeBlock[]) => void;
  addTimeBlock: (block: Omit<TimeBlock, 'date'>) => void;
  removeTimeBlock: (hour: number, minute: number, date?: string) => void;
  toggleBlockStatus: (hour: number, minute: number, date?: string) => void;
  getBlocksForDate: (date: string) => TimeBlock[];

  // Actions - 태스크
  addTask: (task: Omit<Task, 'id' | 'date' | 'priority'>, date?: string) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  getTasksForDate: (date: string) => Task[];
  reorderTasks: (date: string, orderedTaskIds: string[]) => void;

  // Actions - 세션 (타이머/뽀모도로에서 호출)
  addStudySession: (session: Omit<StudySession, 'id' | 'date'>) => void;
  getSessionsForDate: (date: string) => StudySession[];

  // Actions - 통계
  getStatsForDate: (date: string) => DailyStats;
  getTodayStats: () => DailyStats;
  getWeekStats: () => {totalMinutes: number; days: DailyStats[]};
  getMonthStats: () => {totalMinutes: number; days: DailyStats[]};

  // Actions - 연속 기록 업데이트
  updateStreak: () => void;

  // Actions - 목표
  setDailyGoal: (minutes: number) => void;
  setWeeklyGoal: (minutes: number) => void;

  // Actions - 플래너 설정
  setPlannerHours: (startHour: number, endHour: number) => void;

  // Actions - 테마
  setTheme: (theme: StudyRecordThemeType) => void;

  // Actions - 코멘트
  setDailyComment: (date: string, comment: string) => void;
  getDailyComment: (date: string) => string;

  // Actions - 메모
  setDailyMemo: (date: string, memo: string) => void;
  getDailyMemo: (date: string) => string;

  // Actions - D-day (기존 - 호환성)
  setDday: (dday: DdayInfo | null) => void;
  getDdayRemaining: () => number | null;

  // Actions - D-day 목록
  addDday: (dday: Omit<DdayInfo, 'id'>) => void;
  updateDday: (id: string, dday: Partial<DdayInfo>) => void;
  deleteDday: (id: string) => void;
  setPrimaryDday: (id: string) => void;
  getDdayRemainingById: (id: string) => number | null;
  getAllDdays: () => Array<DdayInfo & {remaining: number}>;

  // Actions - 목표 (주간/월간/연간)
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'isCompleted'>) => void;
  updateGoal: (id: string, goal: Partial<Goal>) => void;
  toggleGoal: (id: string) => void;
  deleteGoal: (id: string) => void;
  getGoalsByPeriod: (period: GoalPeriod) => Goal[];
  reorderGoals: (period: GoalPeriod, orderedGoalIds: string[]) => void;

  // Actions - 전체 통계
  getTotalStats: () => {totalMinutes: number; totalDays: number};
  getCustomRangeStats: (startDate: string, endDate: string) => {totalMinutes: number; days: number};

  // Actions - 시간표 템플릿
  saveAsTemplate: (name: string) => void;
  loadTemplate: (templateId: string, date?: string) => void;
  deleteTemplate: (templateId: string) => void;
  renameTemplate: (templateId: string, newName: string) => void;

  // Actions - 요일별 시간표
  setWeeklyTimetableEnabled: (enabled: boolean) => void;
  setWeeklyTimetableForDay: (day: DayOfWeek, blocks: WeeklyTimetableBlock[]) => void;
  saveCurrentAsWeeklyTimetable: (day: DayOfWeek) => void;
  applyWeeklyTimetable: (date?: string) => void;
  clearWeeklyTimetableForDay: (day: DayOfWeek) => void;

  // Actions - 요일별 템플릿 매핑
  setWeeklyTemplateMapping: (day: DayOfWeek, templateId: string | null) => void;
  getTemplateName: (templateId: string) => string | null;
}

// ============ 유틸 함수 ============

const getDateString = (date: Date = new Date()): string => {
  // 로컬 시간 기준으로 YYYY-MM-DD 형식 반환
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// ============ 기본 과목 (빈 배열 - 사용자가 직접 추가) ============

const defaultSubjects: Subject[] = [];

// ============ Store 생성 ============

export const useStudyRecordStore = create<StudyRecordState>()(
  persist(
    (set, get) => ({
      // 초기 상태
      subjects: defaultSubjects,
      timeBlocks: [],
      tasks: [],
      sessions: [],
      dailyComments: [],
      dailyMemos: [],
      dday: null,
      ddays: [],
      goals: [],
      totalStudyMinutes: 0,
      streak: 0,
      bestStreak: 0,
      lastStudyDate: null,
      dailyGoalMinutes: 180, // 3시간
      weeklyGoalMinutes: 1260, // 21시간
      plannerStartHour: 6, // 기본 시작 시간 6시
      plannerEndHour: 24, // 기본 종료 시간 24시
      selectedTheme: 'notebook', // 기본 테마는 노트북

      // ============ 과목 Actions ============

      addSubject: (subject) => {
        set((state) => ({
          subjects: [...state.subjects, {...subject, id: generateId()}],
        }));
      },

      updateSubject: (id, subject) => {
        set((state) => ({
          subjects: state.subjects.map((s) =>
            s.id === id ? {...s, ...subject} : s
          ),
        }));
      },

      deleteSubject: (id) => {
        set((state) => ({
          subjects: state.subjects.filter((s) => s.id !== id),
        }));
      },

      // ============ 텐미닛 블록 Actions ============

      setTimeBlocks: (blocks) => {
        const today = getDateString();
        // 오늘 날짜로 설정
        const blocksWithDate = blocks.map((b) => ({
          ...b,
          date: b.date || today,
        }));
        set({timeBlocks: blocksWithDate});
      },

      addTimeBlock: (block) => {
        const today = getDateString();
        set((state) => {
          // 이미 같은 위치에 블록이 있으면 제거 후 추가
          const filtered = state.timeBlocks.filter(
            (b) => !(b.hour === block.hour && b.minute === block.minute && b.date === today)
          );
          return {
            timeBlocks: [...filtered, {...block, date: today}],
          };
        });
        // 공부 기록 추가 시 연속 기록 업데이트
        get().updateStreak();
      },

      removeTimeBlock: (hour, minute, date) => {
        const targetDate = date || getDateString();
        set((state) => ({
          timeBlocks: state.timeBlocks.filter(
            (b) => !(b.hour === hour && b.minute === minute && b.date === targetDate)
          ),
        }));
      },

      toggleBlockStatus: (hour, minute, date) => {
        const targetDate = date || getDateString();
        set((state) => ({
          timeBlocks: state.timeBlocks.map((b) => {
            if (b.hour === hour && b.minute === minute && b.date === targetDate) {
              // 두 상태 토글: incomplete <-> completed
              const currentStatus = b.status || 'incomplete';
              const nextStatus: TimeBlockStatus =
                currentStatus === 'completed' ? 'incomplete' : 'completed';
              return {...b, status: nextStatus};
            }
            return b;
          }),
        }));
      },

      getBlocksForDate: (date) => {
        return get().timeBlocks.filter((b) => b.date === date);
      },

      // ============ 태스크 Actions ============

      addTask: (task, date) => {
        const targetDate = date || getDateString();
        // 해당 날짜의 기존 태스크 중 가장 높은 priority + 1
        const tasksForDate = get().tasks.filter((t) => t.date === targetDate);
        const maxPriority = tasksForDate.length > 0
          ? Math.max(...tasksForDate.map((t) => t.priority ?? 0))
          : -1;
        set((state) => ({
          tasks: [...state.tasks, {...task, id: generateId(), date: targetDate, priority: maxPriority + 1}],
        }));
      },

      updateTask: (id, task) => {
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? {...t, ...task} : t)),
        }));
      },

      toggleTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? {...t, completed: !t.completed} : t
          ),
        }));
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        }));
      },

      getTasksForDate: (date) => {
        return get().tasks.filter((t) => t.date === date).sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
      },

      reorderTasks: (date, orderedTaskIds) => {
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.date !== date) {return t;}
            const newPriority = orderedTaskIds.indexOf(t.id);
            return newPriority >= 0 ? {...t, priority: newPriority} : t;
          }),
        }));
      },

      // ============ 세션 Actions ============

      addStudySession: (session) => {
        const date = getDateString(new Date(session.startTime));
        set((state) => ({
          sessions: [...state.sessions, {...session, id: generateId(), date}],
        }));
        // 연속 기록 업데이트
        get().updateStreak();
      },

      getSessionsForDate: (date) => {
        return get().sessions.filter((s) => s.date === date);
      },

      // ============ 통계 Actions ============

      getStatsForDate: (date) => {
        const state = get();

        // 텐미닛 블록에서 계산 (각 블록 = 10분)
        const blocks = state.timeBlocks.filter((b) => b.date === date);
        const blockMinutes = blocks.length * 10;

        // 세션에서 계산
        const sessions = state.sessions.filter((s) => s.date === date);
        const sessionMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);

        // 과목별 시간 계산
        const subjectMinutes: Record<string, number> = {};

        blocks.forEach((b) => {
          if (b.subjectId) {
            subjectMinutes[b.subjectId] = (subjectMinutes[b.subjectId] || 0) + 10;
          }
        });

        sessions.forEach((s) => {
          if (s.subjectId) {
            subjectMinutes[s.subjectId] = (subjectMinutes[s.subjectId] || 0) + s.durationMinutes;
          }
        });

        // 블록과 세션 중 더 큰 값 사용 (중복 방지)
        const totalMinutes = Math.max(blockMinutes, sessionMinutes);

        return {
          date,
          totalMinutes,
          sessions: sessions.length,
          subjectMinutes,
        };
      },

      getTodayStats: () => {
        return get().getStatsForDate(getDateString());
      },

      getWeekStats: () => {
        const days: DailyStats[] = [];
        let totalMinutes = 0;

        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const stats = get().getStatsForDate(getDateString(date));
          days.push(stats);
          totalMinutes += stats.totalMinutes;
        }

        return {totalMinutes, days};
      },

      getMonthStats: () => {
        const days: DailyStats[] = [];
        let totalMinutes = 0;

        const today = new Date();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

        for (let i = 1; i <= daysInMonth; i++) {
          const date = new Date(today.getFullYear(), today.getMonth(), i);
          const stats = get().getStatsForDate(getDateString(date));
          days.push(stats);
          totalMinutes += stats.totalMinutes;
        }

        return {totalMinutes, days};
      },

      // ============ 연속 기록 ============

      updateStreak: () => {
        const today = getDateString();
        const state = get();

        if (state.lastStudyDate === today) {
          // 오늘 이미 기록됨
          return;
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = getDateString(yesterday);

        let newStreak = state.streak;

        if (state.lastStudyDate === yesterdayStr) {
          // 어제도 공부함 -> 연속 증가
          newStreak = state.streak + 1;
        } else if (state.lastStudyDate !== today) {
          // 어제 공부 안 함 -> 연속 리셋
          newStreak = 1;
        }

        const newBestStreak = Math.max(state.bestStreak, newStreak);

        set({
          streak: newStreak,
          bestStreak: newBestStreak,
          lastStudyDate: today,
        });
      },

      // ============ 목표 ============

      setDailyGoal: (minutes) => {
        set({dailyGoalMinutes: minutes});
      },

      setWeeklyGoal: (minutes) => {
        set({weeklyGoalMinutes: minutes});
      },

      // ============ 플래너 설정 ============

      setPlannerHours: (startHour, endHour) => {
        // 유효성 검사 (endHour는 최대 28시 = 다음날 4시까지 지원)
        const validStart = Math.max(0, Math.min(23, startHour));
        const validEnd = Math.max(validStart + 1, Math.min(28, endHour));
        set({plannerStartHour: validStart, plannerEndHour: validEnd});
      },

      // ============ 테마 ============

      setTheme: (theme) => {
        set({selectedTheme: theme});
      },

      // ============ 코멘트 ============

      setDailyComment: (date, comment) => {
        set((state) => {
          const existing = state.dailyComments.findIndex((c) => c.date === date);
          if (existing !== -1) {
            const updated = [...state.dailyComments];
            updated[existing] = {date, comment};
            return {dailyComments: updated};
          }
          return {dailyComments: [...state.dailyComments, {date, comment}]};
        });
      },

      getDailyComment: (date) => {
        const comment = get().dailyComments.find((c) => c.date === date);
        return comment?.comment || '';
      },

      // ============ 메모 ============

      setDailyMemo: (date, memo) => {
        set((state) => {
          const existing = state.dailyMemos.findIndex((m) => m.date === date);
          if (existing !== -1) {
            const updated = [...state.dailyMemos];
            updated[existing] = {date, memo};
            return {dailyMemos: updated};
          }
          return {dailyMemos: [...state.dailyMemos, {date, memo}]};
        });
      },

      getDailyMemo: (date) => {
        const memo = get().dailyMemos.find((m) => m.date === date);
        return memo?.memo || '';
      },

      // ============ D-day ============

      setDday: (dday) => {
        set({dday});
      },

      getDdayRemaining: () => {
        const state = get();
        if (!state.dday) {return null;}

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(state.dday.targetDate);
        target.setHours(0, 0, 0, 0);

        const diff = target.getTime() - today.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
      },

      // ============ D-day 목록 Actions ============

      addDday: (dday) => {
        const newDday: DdayInfo = {
          ...dday,
          id: generateId(),
          isPrimary: get().ddays.length === 0, // 첫 번째 D-day는 기본 primary
        };
        set((state) => ({
          ddays: [...state.ddays, newDday],
          // 기존 dday도 업데이트 (호환성)
          dday: newDday.isPrimary ? newDday : state.dday,
        }));
      },

      updateDday: (id, dday) => {
        set((state) => {
          const updatedDdays = state.ddays.map((d) =>
            d.id === id ? {...d, ...dday} : d
          );
          const updatedItem = updatedDdays.find((d) => d.id === id);
          return {
            ddays: updatedDdays,
            // primary D-day가 수정되면 기존 dday도 업데이트
            dday: updatedItem?.isPrimary ? updatedItem : state.dday,
          };
        });
      },

      deleteDday: (id) => {
        set((state) => {
          const filtered = state.ddays.filter((d) => d.id !== id);
          const deletedItem = state.ddays.find((d) => d.id === id);
          let newPrimary = state.dday;

          // 삭제되는 것이 primary였으면 다음 것을 primary로
          if (deletedItem?.isPrimary && filtered.length > 0) {
            filtered[0].isPrimary = true;
            newPrimary = filtered[0];
          } else if (filtered.length === 0) {
            newPrimary = null;
          }

          return {
            ddays: filtered,
            dday: newPrimary,
          };
        });
      },

      setPrimaryDday: (id) => {
        set((state) => {
          const updatedDdays = state.ddays.map((d) => ({
            ...d,
            isPrimary: d.id === id,
          }));
          const primaryItem = updatedDdays.find((d) => d.id === id);
          return {
            ddays: updatedDdays,
            dday: primaryItem || state.dday,
          };
        });
      },

      getDdayRemainingById: (id) => {
        const dday = get().ddays.find((d) => d.id === id);
        if (!dday) {return null;}

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(dday.targetDate);
        target.setHours(0, 0, 0, 0);

        const diff = target.getTime() - today.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
      },

      getAllDdays: () => {
        const state = get();
        return state.ddays
          .map((d) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const target = new Date(d.targetDate);
            target.setHours(0, 0, 0, 0);
            const diff = target.getTime() - today.getTime();
            const remaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
            return {...d, remaining};
          })
          .sort((a, b) => a.remaining - b.remaining); // 가까운 순으로 정렬
      },

      // ============ 목표 Actions ============

      addGoal: (goal) => {
        const state = get();
        // 해당 period의 최대 order + 1
        const periodGoals = state.goals.filter((g) => g.period === goal.period);
        const maxOrder = periodGoals.length > 0
          ? Math.max(...periodGoals.map((g) => g.order ?? 0))
          : -1;
        const newGoal: Goal = {
          ...goal,
          id: generateId(),
          isCompleted: false,
          createdAt: getDateString(),
          order: maxOrder + 1,
        };
        set((state) => ({
          goals: [...state.goals, newGoal],
        }));
      },

      updateGoal: (id, goal) => {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? {...g, ...goal} : g
          ),
        }));
      },

      toggleGoal: (id) => {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id
              ? {
                  ...g,
                  isCompleted: !g.isCompleted,
                  completedAt: !g.isCompleted ? getDateString() : undefined,
                }
              : g
          ),
        }));
      },

      deleteGoal: (id) => {
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        }));
      },

      getGoalsByPeriod: (period) => {
        return get().goals
          .filter((g) => g.period === period)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      },

      reorderGoals: (period, orderedGoalIds) => {
        set((state) => ({
          goals: state.goals.map((g) => {
            if (g.period !== period) {return g;}
            const newOrder = orderedGoalIds.indexOf(g.id);
            return newOrder >= 0 ? {...g, order: newOrder} : g;
          }),
        }));
      },

      // ============ 전체 통계 ============

      getTotalStats: () => {
        const state = get();
        const allDates = new Set([
          ...state.timeBlocks.map((b) => b.date),
          ...state.sessions.map((s) => s.date),
        ]);

        let totalMinutes = 0;
        allDates.forEach((date) => {
          const stats = get().getStatsForDate(date);
          totalMinutes += stats.totalMinutes;
        });

        return {
          totalMinutes,
          totalDays: allDates.size,
        };
      },

      getCustomRangeStats: (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        let totalMinutes = 0;
        let days = 0;

        const current = new Date(start);
        while (current <= end) {
          const dateStr = getDateString(current);
          const stats = get().getStatsForDate(dateStr);
          totalMinutes += stats.totalMinutes;
          if (stats.totalMinutes > 0) {days++;}
          current.setDate(current.getDate() + 1);
        }

        return {totalMinutes, days};
      },

      // ============ 시간표 템플릿 초기값 ============
      timetableTemplates: [],
      weeklyTimetable: {},
      weeklyTimetableEnabled: false,
      weeklyTemplateMapping: {},

      // ============ 시간표 템플릿 Actions ============

      saveAsTemplate: (name) => {
        const state = get();
        const today = getDateString();
        const todayBlocks = state.timeBlocks.filter((b) => b.date === today);

        if (todayBlocks.length === 0) {return;}

        const template: TimetableTemplate = {
          id: generateId(),
          name,
          blocks: todayBlocks.map((b) => ({
            hour: b.hour,
            minute: b.minute,
            subjectId: b.subjectId,
          })),
          createdAt: new Date().toISOString(),
        };

        set((s) => ({
          timetableTemplates: [...s.timetableTemplates, template],
        }));
      },

      loadTemplate: (templateId, date) => {
        const state = get();
        const template = state.timetableTemplates.find((t) => t.id === templateId);
        if (!template) {return;}

        const targetDate = date || getDateString();

        // 해당 날짜의 기존 블록 제거 후 템플릿 블록 추가
        const otherBlocks = state.timeBlocks.filter((b) => b.date !== targetDate);
        const newBlocks: TimeBlock[] = template.blocks.map((b) => ({
          hour: b.hour,
          minute: b.minute,
          subjectId: b.subjectId,
          date: targetDate,
          status: 'incomplete' as TimeBlockStatus,
        }));

        set({timeBlocks: [...otherBlocks, ...newBlocks]});
      },

      deleteTemplate: (templateId) => {
        set((state) => ({
          timetableTemplates: state.timetableTemplates.filter((t) => t.id !== templateId),
        }));
      },

      renameTemplate: (templateId, newName) => {
        set((state) => ({
          timetableTemplates: state.timetableTemplates.map((t) =>
            t.id === templateId ? {...t, name: newName} : t
          ),
        }));
      },

      // ============ 요일별 시간표 Actions ============

      setWeeklyTimetableEnabled: (enabled) => {
        set({weeklyTimetableEnabled: enabled});
      },

      setWeeklyTimetableForDay: (day, blocks) => {
        set((state) => ({
          weeklyTimetable: {
            ...state.weeklyTimetable,
            [day]: blocks,
          },
        }));
      },

      saveCurrentAsWeeklyTimetable: (day) => {
        const state = get();
        const today = getDateString();
        const todayBlocks = state.timeBlocks.filter((b) => b.date === today);

        const weeklyBlocks: WeeklyTimetableBlock[] = todayBlocks.map((b) => ({
          hour: b.hour,
          minute: b.minute,
          subjectId: b.subjectId,
        }));

        set((s) => ({
          weeklyTimetable: {
            ...s.weeklyTimetable,
            [day]: weeklyBlocks,
          },
        }));
      },

      applyWeeklyTimetable: (date) => {
        const state = get();
        if (!state.weeklyTimetableEnabled) {return;}

        const targetDate = date || getDateString();
        const dayOfWeek = new Date(targetDate).getDay() as DayOfWeek;

        // 해당 날짜에 이미 블록이 있으면 적용하지 않음
        const existingBlocks = state.timeBlocks.filter((b) => b.date === targetDate);
        if (existingBlocks.length > 0) {return;}

        // 1. 먼저 템플릿 매핑 확인
        const mappedTemplateId = state.weeklyTemplateMapping[dayOfWeek];
        if (mappedTemplateId) {
          const template = state.timetableTemplates.find((t) => t.id === mappedTemplateId);
          if (template) {
            const newBlocks: TimeBlock[] = template.blocks.map((b) => ({
              hour: b.hour,
              minute: b.minute,
              subjectId: b.subjectId,
              date: targetDate,
              status: 'incomplete' as TimeBlockStatus,
            }));
            set((s) => ({
              timeBlocks: [...s.timeBlocks, ...newBlocks],
            }));
            return;
          }
        }

        // 2. 템플릿 매핑이 없으면 기존 weeklyTimetable 사용 (하위 호환)
        const dayBlocks = state.weeklyTimetable[dayOfWeek];
        if (!dayBlocks || dayBlocks.length === 0) {return;}

        const newBlocks: TimeBlock[] = dayBlocks.map((b) => ({
          hour: b.hour,
          minute: b.minute,
          subjectId: b.subjectId,
          date: targetDate,
          status: 'incomplete' as TimeBlockStatus,
        }));

        set((s) => ({
          timeBlocks: [...s.timeBlocks, ...newBlocks],
        }));
      },

      clearWeeklyTimetableForDay: (day) => {
        set((state) => {
          const newWeeklyTimetable = {...state.weeklyTimetable};
          delete newWeeklyTimetable[day];
          return {weeklyTimetable: newWeeklyTimetable};
        });
      },

      // ============ 요일별 템플릿 매핑 Actions ============

      setWeeklyTemplateMapping: (day, templateId) => {
        set((state) => ({
          weeklyTemplateMapping: {
            ...state.weeklyTemplateMapping,
            [day]: templateId,
          },
        }));
      },

      getTemplateName: (templateId) => {
        const template = get().timetableTemplates.find((t) => t.id === templateId);
        return template?.name || null;
      },
    }),
    {
      name: 'study-record-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Date 객체 직렬화 처리
      partialize: (state) => ({
        subjects: state.subjects,
        timeBlocks: state.timeBlocks,
        tasks: state.tasks,
        sessions: state.sessions.map((s) => ({
          ...s,
          startTime: s.startTime instanceof Date ? s.startTime.toISOString() : s.startTime,
          endTime: s.endTime instanceof Date ? s.endTime.toISOString() : s.endTime,
        })),
        dailyComments: state.dailyComments,
        dailyMemos: state.dailyMemos,
        dday: state.dday,
        ddays: state.ddays,
        goals: state.goals,
        totalStudyMinutes: state.totalStudyMinutes,
        streak: state.streak,
        bestStreak: state.bestStreak,
        lastStudyDate: state.lastStudyDate,
        dailyGoalMinutes: state.dailyGoalMinutes,
        weeklyGoalMinutes: state.weeklyGoalMinutes,
        plannerStartHour: state.plannerStartHour,
        plannerEndHour: state.plannerEndHour,
        selectedTheme: state.selectedTheme,
        // 시간표 템플릿 & 요일별 시간표
        timetableTemplates: state.timetableTemplates,
        weeklyTimetable: state.weeklyTimetable,
        weeklyTimetableEnabled: state.weeklyTimetableEnabled,
        weeklyTemplateMapping: state.weeklyTemplateMapping,
      }),
    }
  )
);
