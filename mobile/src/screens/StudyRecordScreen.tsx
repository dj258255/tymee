import React, {useEffect, useState, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  InteractionManager,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DraggableFlatList, {RenderItemParams} from 'react-native-draggable-flatlist';
import {useTranslation} from 'react-i18next';
import {useThemeStore} from '../store/themeStore';
import {useStudyRecordStore, Goal, DayOfWeek} from '../store/studyRecordStore';
import {usePomodoroStore} from '../store/pomodoroStore';
import {safeGetColorScheme, safeAddAppearanceListener} from '../utils/appearance';
import {getStudyRecordTheme, getPostItColor, getRotation, getPostItShadow} from '../themes/studyRecordThemes';
import Icon from '@react-native-vector-icons/ionicons';
import StudyStoryCard from '../components/StudyStoryCard';
import TenMinutePlanner from '../components/TenMinutePlanner';
import TaskManager from '../components/TaskManager';
import NotebookBackground from '../components/NotebookBackground';
import NotebookCard from '../components/NotebookCard';
import StudyReport from '../components/StudyReport';
import {sp, hp, fp, iconSize} from '../utils/responsive';
import RNCalendarEvents, {CalendarEventReadable} from 'react-native-calendar-events';
import Svg, {Path, G, Circle as SvgCircle} from 'react-native-svg';
import {styles} from './StudyRecordScreen.styles';

const getDateString = (date: Date = new Date()): string => {
  // 로컬 시간 기준으로 YYYY-MM-DD 형식 반환
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

type TabType = 'plan' | 'timetable' | 'focus' | 'stats' | 'report';

// 캘린더 일정 타입 (앱 내부용)
interface CalendarTask {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  isFromCalendar: true; // 캘린더에서 가져온 것 표시
  isHidden: boolean; // 앱 내에서 숨김 처리
  isCompleted: boolean; // 앱 내에서 완료 처리
}

const StudyRecordScreen: React.FC = () => {
  const {t: _t} = useTranslation();
  const [systemColorScheme, setSystemColorScheme] = useState<'light' | 'dark'>('light');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTab, setSelectedTab] = useState<TabType>('plan');
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showDdayModal, setShowDdayModal] = useState(false);
  const [showStoryCard, setShowStoryCard] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // 캘린더 일정 관련 상태
  const [calendarEvents, setCalendarEvents] = useState<CalendarTask[]>([]);
  const [hiddenCalendarEvents, setHiddenCalendarEvents] = useState<string[]>([]); // 숨긴 일정 ID들
  const [completedCalendarEvents, setCompletedCalendarEvents] = useState<string[]>([]); // 완료한 일정 ID들

  // D-day 설정 모달 상태
  const [ddayTitle, setDdayTitle] = useState('');
  const [ddayDate, setDdayDate] = useState(new Date());
  const [editingDdayId, setEditingDdayId] = useState<string | null>(null); // 편집 중인 D-day ID

  // 장기 목표 모달 상태 (주간/월간/연간)
  const [showLongTermGoalModal, setShowLongTermGoalModal] = useState(false);
  const [goalContent, setGoalContent] = useState('');
  const [selectedGoalPeriod, setSelectedGoalPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null); // 수정 중인 목표 ID

  // 코멘트/메모 편집 상태
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [isEditingMemo, setIsEditingMemo] = useState(false);
  const [tempComment, setTempComment] = useState('');
  const [tempMemo, setTempMemo] = useState('');

  // 집중 탭 도움말 모달
  const [showFocusHelpModal, setShowFocusHelpModal] = useState(false);

  // 통계 탭 도움말 모달
  const [showStatsHelpModal, setShowStatsHelpModal] = useState(false);

  // 시간표 탭 도움말 모달
  const [showTimetableHelpModal, setShowTimetableHelpModal] = useState(false);
  // 시간표 설정 모달
  const [showTimetableSettingsModal, setShowTimetableSettingsModal] = useState(false);

  // 원형 차트 모달
  const [showPieChartModal, setShowPieChartModal] = useState(false);

  // 목표 설정 모달
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [tempGoalHours, setTempGoalHours] = useState('3');

  // 기간별 통계 날짜 범위 선택 모달
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [dateRangeMonth, setDateRangeMonth] = useState(new Date());
  const [selectingDateType, setSelectingDateType] = useState<'start' | 'end'>('start');

  // D-day 캘린더 모달
  const [_showDdayCalendar, _setShowDdayCalendar] = useState(false);
  const [ddayCalendarMonth, setDdayCalendarMonth] = useState(new Date());
  const [ddayStep, setDdayStep] = useState<'form' | 'calendar'>('form');

  // 플래너 시간 설정 모달
  const [showPlannerTimeModal, setShowPlannerTimeModal] = useState(false);
  const [tempStartHour, setTempStartHour] = useState(6);

  // 시간표 템플릿 모달
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');

  // 요일별 시간표 모달
  const [showWeeklyModal, setShowWeeklyModal] = useState(false);
  // 요일별 템플릿 선택용 (기존 템플릿 모달 재사용)
  const [selectedDayForTemplate, setSelectedDayForTemplate] = useState<DayOfWeek | null>(null);
  const [isTemplateModalForWeekly, setIsTemplateModalForWeekly] = useState(false);

  // Store 연결
  const {
    subjects,
    timeBlocks,
    tasks,
    sessions: _sessions,
    dday,
    streak: _streak,
    bestStreak: _bestStreak,
    dailyGoalMinutes,
    weeklyGoalMinutes,
    selectedTheme,
    setTimeBlocks,
    addTask,
    toggleTask,
    deleteTask,
    updateTask,
    reorderTasks,
    addSubject,
    updateSubject,
    deleteSubject,
    getBlocksForDate,
    getTasksForDate,
    getTodayStats,
    getWeekStats,
    getMonthStats,
    getStatsForDate,
    getTotalStats,
    setDday: _setDday,
    getDdayRemaining,
    // D-day 목록 관련
    ddays,
    addDday,
    updateDday,
    deleteDday,
    setPrimaryDday,
    getAllDdays,
    // 목표 관련
    goals: _goals,
    addGoal,
    updateGoal,
    toggleGoal,
    deleteGoal,
    getGoalsByPeriod,
    reorderGoals,
    setDailyComment,
    getDailyComment,
    setDailyMemo,
    getDailyMemo,
    setDailyGoal,
    plannerStartHour,
    setPlannerHours,
    toggleBlockStatus,
    // 시간표 템플릿 관련
    timetableTemplates,
    saveAsTemplate,
    loadTemplate,
    deleteTemplate,
    renameTemplate: _renameTemplate,
    // 요일별 시간표 관련
    weeklyTimetable,
    weeklyTimetableEnabled,
    setWeeklyTimetableEnabled,
    saveCurrentAsWeeklyTimetable: _saveCurrentAsWeeklyTimetable,
    applyWeeklyTimetable: _applyWeeklyTimetable,
    clearWeeklyTimetableForDay: _clearWeeklyTimetableForDay,
    // 요일별 템플릿 매핑
    weeklyTemplateMapping,
    setWeeklyTemplateMapping,
  } = useStudyRecordStore();

  // 뽀모도로 세션 가져오기
  const pomodoroSessions = usePomodoroStore(state => state.sessions);

  // 테마 가져오기
  const theme = useMemo(() => getStudyRecordTheme(selectedTheme), [selectedTheme]);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setSystemColorScheme(safeGetColorScheme());
    });

    const subscription = safeAddAppearanceListener((colorScheme) => {
      setSystemColorScheme(colorScheme);
    });

    return () => {
      task.cancel();
      subscription?.remove();
    };
  }, []);

  // 캘린더 일정 가져오기
  const fetchCalendarEvents = useCallback(async (date: Date) => {
    try {
      const status = await RNCalendarEvents.requestPermissions();
      if (status !== 'authorized') {
        return;
      }

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const events = await RNCalendarEvents.fetchAllEvents(
        startOfDay.toISOString(),
        endOfDay.toISOString()
      );

      const calendarTasks: CalendarTask[] = events.map((event: CalendarEventReadable) => ({
        id: event.id,
        title: event.title || '(제목 없음)',
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate || event.startDate),
        isFromCalendar: true as const,
        isHidden: hiddenCalendarEvents.includes(event.id),
        isCompleted: completedCalendarEvents.includes(event.id),
      }));

      setCalendarEvents(calendarTasks);
    } catch (error) {
      console.log('캘린더 접근 오류:', error);
    }
  }, [hiddenCalendarEvents, completedCalendarEvents]);

  // 날짜 변경 시 캘린더 일정 가져오기
  useEffect(() => {
    fetchCalendarEvents(selectedDate);
  }, [selectedDate, fetchCalendarEvents]);

  const {themeMode} = useThemeStore();

  const isDark =
    themeMode === 'system'
      ? systemColorScheme === 'dark'
      : themeMode === 'dark';

  // 선택된 날짜 기준 데이터
  const selectedDateStr = getDateString(selectedDate);
  const today = getDateString();
  const isToday = selectedDateStr === today;

  const selectedBlocks = getBlocksForDate(selectedDateStr);
  const selectedTasks = getTasksForDate(selectedDateStr);
  const selectedStats = getStatsForDate(selectedDateStr);
  const _todayStats = getTodayStats();
  const weekStats = getWeekStats();
  const _monthStats = getMonthStats();
  const _totalStats = getTotalStats();

  // 집중세션 기반 통계 계산
  const focusSessionStats = useMemo(() => {
    const getDateFromSession = (session: any) => {
      const d = new Date(session.startTime);
      return getDateString(d);
    };

    // 완료된 집중 세션만 필터링
    const completedFocusSessions = pomodoroSessions.filter(
      s => s.mode === 'FOCUS' && s.completed
    );

    // 선택된 날짜의 집중세션
    const selectedDateSessions = completedFocusSessions.filter(
      s => getDateFromSession(s) === selectedDateStr
    );

    // 선택된 날짜의 총 집중 시간 (분)
    const selectedDateFocusMinutes = selectedDateSessions.reduce((sum, s) => {
      const duration = (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 1000 / 60;
      return sum + Math.round(duration);
    }, 0);

    // 이번 주 집중 시간
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const weekFocusMinutes = completedFocusSessions
      .filter(s => {
        const d = new Date(s.startTime);
        return d >= weekStart && d <= weekEnd;
      })
      .reduce((sum, s) => {
        const duration = (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 1000 / 60;
        return sum + Math.round(duration);
      }, 0);

    // 이번 달 집중 시간
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthFocusMinutes = completedFocusSessions
      .filter(s => {
        const d = new Date(s.startTime);
        return d >= monthStart && d <= monthEnd;
      })
      .reduce((sum, s) => {
        const duration = (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 1000 / 60;
        return sum + Math.round(duration);
      }, 0);

    // 연속 기록 계산 (집중세션 기준)
    const datesWithFocus = new Set(completedFocusSessions.map(s => getDateFromSession(s)));
    let focusStreak = 0;
    let focusBestStreak = 0;
    let currentStreak = 0;

    // 오늘부터 거꾸로 연속 기록 계산
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    for (let i = 0; i <= 365; i++) {
      const checkDate = new Date(todayDate);
      checkDate.setDate(todayDate.getDate() - i);
      const dateStr = getDateString(checkDate);

      if (datesWithFocus.has(dateStr)) {
        currentStreak++;
        if (i === 0 || focusStreak > 0) {
          focusStreak = currentStreak;
        }
        focusBestStreak = Math.max(focusBestStreak, currentStreak);
      } else if (i === 0) {
        // 오늘 집중 안 했으면 어제부터 체크
        continue;
      } else {
        if (focusStreak === 0 && currentStreak > 0) {
          focusStreak = currentStreak;
        }
        currentStreak = 0;
      }
    }

    return {
      selectedDateMinutes: selectedDateFocusMinutes,
      selectedDateSessions: selectedDateSessions.length,
      weekMinutes: weekFocusMinutes,
      monthMinutes: monthFocusMinutes,
      streak: focusStreak,
      bestStreak: focusBestStreak,
    };
  }, [pomodoroSessions, selectedDateStr]);

  // 코멘트/메모
  const dailyComment = getDailyComment(selectedDateStr);
  const dailyMemo = getDailyMemo(selectedDateStr);

  // D-day
  const ddayRemaining = getDdayRemaining();

  // 태스크 핸들러
  const handleTaskToggle = useCallback((taskId: string) => {
    toggleTask(taskId);
  }, [toggleTask]);

  const handleTaskAdd = useCallback((task: {title: string; estimatedMinutes: number; completed: boolean; subjectId?: string}) => {
    addTask(task, selectedDateStr);
  }, [addTask, selectedDateStr]);

  const handleTaskDelete = useCallback((taskId: string) => {
    deleteTask(taskId);
  }, [deleteTask]);

  const handleTaskUpdate = useCallback((taskId: string, task: {title?: string; estimatedMinutes?: number}) => {
    updateTask(taskId, task);
  }, [updateTask]);

  const handleTaskReorder = useCallback((orderedTaskIds: string[]) => {
    reorderTasks(selectedDateStr, orderedTaskIds);
  }, [reorderTasks, selectedDateStr]);

  // 텐미닛 블록 핸들러
  const handleBlockChange = useCallback((blocks: Array<{hour: number; minute: number; subjectId: string | null}>) => {
    const validBlocks = blocks
      .filter((b): b is {hour: number; minute: number; subjectId: string} => b.subjectId !== null)
      .map(b => ({...b, date: selectedDateStr}));
    setTimeBlocks(validBlocks);
  }, [setTimeBlocks, selectedDateStr]);

  // 시간 포맷팅
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
    }
    return `${mins}분`;
  };

  // 날짜 포맷팅
  const formatDate = (date: Date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = WEEKDAYS[date.getDay()];
    return `${month}월 ${day}일 (${weekday})`;
  };

  // 진행률 계산
  const _weekProgress = Math.min((weekStats.totalMinutes / weeklyGoalMinutes) * 100, 100);

  // D-day 저장 (추가 또는 수정)
  const handleSaveDday = () => {
    if (!ddayTitle.trim()) {
      Alert.alert('알림', 'D-day 제목을 입력해주세요.');
      return;
    }

    if (editingDdayId) {
      // 수정 모드
      updateDday(editingDdayId, {
        targetDate: getDateString(ddayDate),
        title: ddayTitle.trim(),
      });
    } else {
      // 추가 모드
      addDday({
        targetDate: getDateString(ddayDate),
        title: ddayTitle.trim(),
        isPrimary: ddays.length === 0,
      });
    }

    setShowDdayModal(false);
    setEditingDdayId(null);
    setDdayTitle('');
    setDdayDate(new Date());
  };

  // D-day 삭제
  const handleDeleteDday = () => {
    if (!editingDdayId) {return;}

    Alert.alert(
      'D-day 삭제',
      'D-day를 삭제하시겠습니까?',
      [
        {text: '취소', style: 'cancel'},
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            deleteDday(editingDdayId);
            setShowDdayModal(false);
            setEditingDdayId(null);
            setDdayTitle('');
            setDdayDate(new Date());
          },
        },
      ]
    );
  };

  // D-day 편집 열기
  const handleEditDday = (ddayItem: typeof ddays[0]) => {
    setEditingDdayId(ddayItem.id);
    setDdayTitle(ddayItem.title);
    setDdayDate(new Date(ddayItem.targetDate));
    setShowDdayModal(true);
  };

  // 새 D-day 추가 모달 열기
  const handleAddNewDday = () => {
    setEditingDdayId(null);
    setDdayTitle('');
    setDdayDate(new Date());
    setShowDdayModal(true);
  };

  // 목표 저장
  const handleSaveGoal = () => {
    if (!goalContent.trim()) {
      Alert.alert('알림', '목표 내용을 입력해주세요.');
      return;
    }
    if (editingGoalId) {
      // 수정 모드
      updateGoal(editingGoalId, {content: goalContent.trim()});
    } else {
      // 추가 모드
      addGoal({
        period: selectedGoalPeriod,
        content: goalContent.trim(),
      });
    }
    setGoalContent('');
    setEditingGoalId(null);
    setShowLongTermGoalModal(false);
  };

  // 코멘트 저장
  const handleSaveComment = () => {
    setDailyComment(selectedDateStr, tempComment);
    setIsEditingComment(false);
  };

  // 메모 저장
  const handleSaveMemo = () => {
    setDailyMemo(selectedDateStr, tempMemo);
    setIsEditingMemo(false);
  };

  // 캘린더 관련 함수들
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Array<{date: Date; isCurrentMonth: boolean}> = [];

    const firstDayOfWeek = firstDay.getDay();
    if (firstDayOfWeek > 0) {
      const prevMonthLastDay = new Date(year, month, 0);
      const prevMonthLastDate = prevMonthLastDay.getDate();
      for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        days.push({
          date: new Date(year, month - 1, prevMonthLastDate - i),
          isCurrentMonth: false,
        });
      }
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const isSameDay = (date1: Date | null, date2: Date | null) => {
    if (!date1 || !date2) {return false;}
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const isTodayDate = (date: Date | null) => isSameDay(date, new Date());

  // 해당 날짜에 공부 기록이 있는지 확인
  const hasStudyRecord = (date: Date) => {
    const stats = getStatsForDate(getDateString(date));
    return stats.totalMinutes > 0;
  };

  // ============ 테마 색상 변수 ============
  const _themeBg = isDark ? theme.background.dark : theme.background.light;
  const cardBg = isDark ? theme.card.dark : theme.card.light;
  const textColor = isDark ? theme.text.primary.dark : theme.text.primary.light;
  const subtextColor = isDark ? theme.text.secondary.dark : theme.text.secondary.light;
  const accentColor = theme.colors.accent;
  const successColor = theme.colors.success;
  const warningColor = theme.colors.warning;
  const errorColor = theme.colors.error;
  const sundayColor = theme.colors.sunday;
  const saturdayColor = theme.colors.saturday;
  const progressBg = isDark ? theme.progressBar.background.dark : theme.progressBar.background.light;
  const dividerColor = isDark ? theme.card.borderColor.dark : theme.card.borderColor.light;

  // ============ 통계 탭 테마 변수 ============
  const statsValueFontSize = theme.stats.value.fontSize;
  const statsValueFontWeight = theme.stats.value.fontWeight;
  const statsLegendDotSize = theme.stats.legend.dotSize;
  const statsLegendFontSize = theme.stats.legend.fontSize;
  const statsBarChartBorderRadius = theme.stats.barChart.borderRadius;
  const statsBarChartGap = theme.stats.barChart.gap;

  const daysInMonth = getDaysInMonth(calendarMonth);

  // 시간 포맷 (HH:MM)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const formatTimeHHMM = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours}:${String(minutes).padStart(2, '0')}`;
  };

  // 캘린더 일정 완료 토글 (앱 내부만)
  const toggleCalendarEventComplete = (eventId: string) => {
    setCompletedCalendarEvents(prev =>
      prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  // 캘린더 일정 숨기기 (앱 내부만)
  const hideCalendarEvent = (eventId: string) => {
    setHiddenCalendarEvents(prev => [...prev, eventId]);
  };

  // ============ 탭 콘텐츠 렌더링 ============

  // 1. 할 일 탭 (다짐 + 할 일 + 캘린더 통합)
  const renderPlanTab = () => {
    return (
      <ScrollView
        style={styles.tabContent}
        contentContainerStyle={{paddingBottom: 120}}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* 오늘의 다짐 */}
        <NotebookCard
          theme={theme}
          isDark={isDark}
          title={isToday ? '오늘의 다짐' : `${selectedDate.getMonth() + 1}/${selectedDate.getDate()} 다짐`}
          tapeColor="#FFE4B5">
          {isEditingComment ? (
            <View style={styles.editContainer}>
              <TextInput
                style={[styles.commentInput, {color: textColor, borderColor: dividerColor}]}
                placeholder="오늘의 목표나 다짐을 적어보세요..."
                placeholderTextColor={subtextColor}
                value={tempComment}
                onChangeText={setTempComment}
                multiline
                autoFocus
              />
              <View style={styles.editButtons}>
                <TouchableOpacity
                  style={[styles.editButton, {backgroundColor: dividerColor}]}
                  onPress={() => setIsEditingComment(false)}>
                  <Text style={[styles.editButtonText, {color: textColor}]}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editButton, {backgroundColor: accentColor}]}
                  onPress={handleSaveComment}>
                  <Text style={[styles.editButtonText, {color: '#fff'}]}>저장</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => {
                setTempComment(dailyComment);
                setIsEditingComment(true);
              }}>
              {dailyComment ? (
                <Text style={[styles.commentText, {color: textColor}]}>
                  "{dailyComment}"
                </Text>
              ) : (
                <Text style={[styles.commentPlaceholder, {color: subtextColor}]}>
                  터치하여 다짐을 적어보세요...
                </Text>
              )}
            </TouchableOpacity>
          )}
        </NotebookCard>

        {/* 태스크 매니저 (캘린더 일정 통합) */}
        <NotebookCard
          theme={theme}
          isDark={isDark}
          title="할 일"
          tapeColor="#FFB6C1">
          <TaskManager
            isDark={isDark}
            tasks={selectedTasks}
            subjects={subjects}
            onTaskToggle={handleTaskToggle}
            onTaskAdd={handleTaskAdd}
            onTaskDelete={handleTaskDelete}
            onTaskUpdate={handleTaskUpdate}
            onTaskReorder={handleTaskReorder}
            onSubjectAdd={addSubject}
            theme={theme}
            allTasks={tasks}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            calendarEvents={calendarEvents.map(e => ({
              ...e,
              isHidden: hiddenCalendarEvents.includes(e.id),
              isCompleted: completedCalendarEvents.includes(e.id),
            }))}
            onCalendarEventToggle={toggleCalendarEventComplete}
            onCalendarEventHide={hideCalendarEvent}
          />
        </NotebookCard>

        {/* 메모 */}
        <NotebookCard
          theme={theme}
          isDark={isDark}
          title={isToday ? '오늘의 메모' : `${selectedDate.getMonth() + 1}/${selectedDate.getDate()} 메모`}
          tapeColor="#DDA0DD">
          {isEditingMemo ? (
            <View style={styles.editContainer}>
              <TextInput
                style={[styles.memoInput, {color: textColor, borderColor: dividerColor}]}
                placeholder="자유롭게 메모를 작성하세요..."
                placeholderTextColor={subtextColor}
                value={tempMemo}
                onChangeText={setTempMemo}
                multiline
                autoFocus
                textAlignVertical="top"
              />
              <View style={styles.editButtons}>
                <TouchableOpacity
                  style={[styles.editButton, {backgroundColor: dividerColor}]}
                  onPress={() => setIsEditingMemo(false)}>
                  <Text style={[styles.editButtonText, {color: textColor}]}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editButton, {backgroundColor: accentColor}]}
                  onPress={handleSaveMemo}>
                  <Text style={[styles.editButtonText, {color: '#fff'}]}>저장</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => {
                setTempMemo(dailyMemo);
                setIsEditingMemo(true);
              }}
              style={styles.memoContainer}>
              {dailyMemo ? (
                <Text style={[styles.memoText, {color: textColor}]}>
                  {dailyMemo}
                </Text>
              ) : (
                <Text style={[styles.memoPlaceholder, {color: subtextColor}]}>
                  터치하여 메모를 작성하세요...
                </Text>
              )}
            </TouchableOpacity>
          )}
        </NotebookCard>

        {/* D-day 목록 */}
        <NotebookCard
          theme={theme}
          isDark={isDark}
          title="D-day"
          tapeColor="#87CEEB">
          <View style={styles.ddayListContainer}>
            {getAllDdays().map((ddayItem) => (
              <TouchableOpacity
                key={ddayItem.id}
                style={[
                  styles.ddayListItem,
                  ddayItem.isPrimary && styles.ddayListItemPrimary,
                  {backgroundColor: isDark ? '#2A2A2E' : '#F8F8F8'},
                ]}
                onPress={() => handleEditDday(ddayItem)}
                onLongPress={() => {
                  if (!ddayItem.isPrimary) {
                    setPrimaryDday(ddayItem.id);
                  }
                }}>
                <View style={styles.ddayItemLeft}>
                  {ddayItem.isPrimary && (
                    <Icon name="star" size={iconSize(14)} color="#FFD700" style={{marginRight: sp(4)}} />
                  )}
                  <Text style={[styles.ddayItemTitle, {color: textColor}]} numberOfLines={1}>
                    {ddayItem.title}
                  </Text>
                </View>
                <Text style={[
                  styles.ddayItemRemaining,
                  {color: ddayItem.remaining <= 7 ? '#FF3B30' : ddayItem.remaining <= 30 ? '#FF9500' : accentColor},
                ]}>
                  {ddayItem.remaining === 0 ? 'D-Day' : ddayItem.remaining > 0 ? `D-${ddayItem.remaining}` : `D+${Math.abs(ddayItem.remaining)}`}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.ddayAddButton, {borderColor: dividerColor}]}
              onPress={handleAddNewDday}>
              <Icon name="add-circle-outline" size={iconSize(20)} color={accentColor} />
              <Text style={[styles.ddayAddText, {color: accentColor}]}>D-day 추가</Text>
            </TouchableOpacity>
          </View>
        </NotebookCard>

        {/* 장기 목표 (주간/월간/연간) */}
        <NotebookCard
          theme={theme}
          isDark={isDark}
          title="목표"
          tapeColor="#98FB98">
          <View style={styles.goalsContainer}>
            {/* 주간 목표 */}
            {(() => {
              const now = new Date();
              const dayOfWeek = now.getDay();
              const startOfWeek = new Date(now);
              startOfWeek.setDate(now.getDate() - dayOfWeek);
              const endOfWeek = new Date(startOfWeek);
              endOfWeek.setDate(startOfWeek.getDate() + 6);
              const weekRange = `${startOfWeek.getMonth() + 1}.${startOfWeek.getDate()} - ${endOfWeek.getMonth() + 1}.${endOfWeek.getDate()}`;
              const weeklyGoals = getGoalsByPeriod('weekly');

              const renderWeeklyGoalItem = ({item: goal, drag, isActive}: RenderItemParams<Goal>) => (
                <TouchableOpacity
                  style={[
                    styles.goalItem,
                    theme.task.item.postItStyle && {
                      backgroundColor: isDark ? '#FBF0C4' + '20' : '#FBF0C4',
                      borderWidth: 0,
                      borderLeftWidth: 3,
                      borderLeftColor: '#4CAF50',
                      shadowColor: '#000',
                      shadowOffset: {width: 1, height: 1},
                      shadowOpacity: isDark ? 0.3 : 0.1,
                      shadowRadius: 2,
                      elevation: 2,
                    },
                    !theme.task.item.postItStyle && {borderColor: dividerColor},
                    isActive && {opacity: 0.9},
                  ]}
                  onPress={() => toggleGoal(goal.id)}
                  onLongPress={drag}
                  delayLongPress={150}>
                  {/* 드래그 핸들 */}
                  <TouchableOpacity onPressIn={drag} style={styles.goalDragHandle}>
                    <Icon name="menu" size={iconSize(16)} color={subtextColor} />
                  </TouchableOpacity>
                  {/* 체크박스 */}
                  <TouchableOpacity style={{padding: sp(4)}} onPress={() => toggleGoal(goal.id)}>
                    <View style={[
                      styles.goalItemCheck,
                      {borderColor: goal.isCompleted ? '#4CAF50' : subtextColor},
                      goal.isCompleted && {backgroundColor: '#4CAF50'},
                    ]}>
                      {goal.isCompleted && <Icon name="checkmark" size={iconSize(14)} color="#fff" />}
                    </View>
                  </TouchableOpacity>
                  <Text style={[
                    styles.goalItemText,
                    {color: textColor, flex: 1},
                    goal.isCompleted && styles.goalItemCompleted,
                  ]}>
                    {goal.content}
                  </Text>
                  <TouchableOpacity style={styles.goalItemDelete} onPress={() => {
                    setEditingGoalId(goal.id);
                    setGoalContent(goal.content);
                    setSelectedGoalPeriod('weekly');
                    setShowLongTermGoalModal(true);
                  }}>
                    <Icon name="create-outline" size={iconSize(16)} color={subtextColor} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.goalItemDelete} onPress={() => deleteGoal(goal.id)}>
                    <Icon name="trash-outline" size={iconSize(16)} color={subtextColor} />
                  </TouchableOpacity>
                </TouchableOpacity>
              );

              return (
                <View style={styles.goalSection}>
                  <View style={styles.goalSectionHeader}>
                    <Icon name="calendar-outline" size={iconSize(16)} color="#4CAF50" />
                    <Text style={[styles.goalSectionTitle, {color: textColor}]}>주간 목표</Text>
                    <Text style={[styles.goalSectionDate, {color: subtextColor}]}>{weekRange}</Text>
                  </View>
                  {weeklyGoals.length > 0 && (
                    <DraggableFlatList
                      data={weeklyGoals}
                      keyExtractor={(item) => item.id}
                      renderItem={renderWeeklyGoalItem}
                      onDragEnd={({data}) => reorderGoals('weekly', data.map(g => g.id))}
                      scrollEnabled={false}
                    />
                  )}
                </View>
              );
            })()}

            {/* 월간 목표 */}
            {(() => {
              const now = new Date();
              const monthName = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}`;
              const monthlyGoals = getGoalsByPeriod('monthly');

              const renderMonthlyGoalItem = ({item: goal, drag, isActive}: RenderItemParams<Goal>) => (
                <TouchableOpacity
                  style={[
                    styles.goalItem,
                    theme.task.item.postItStyle && {
                      backgroundColor: isDark ? '#E3F2FD' + '20' : '#E3F2FD',
                      borderWidth: 0,
                      borderLeftWidth: 3,
                      borderLeftColor: '#2196F3',
                      shadowColor: '#000',
                      shadowOffset: {width: 1, height: 1},
                      shadowOpacity: isDark ? 0.3 : 0.1,
                      shadowRadius: 2,
                      elevation: 2,
                    },
                    !theme.task.item.postItStyle && {borderColor: dividerColor},
                    isActive && {opacity: 0.9},
                  ]}
                  onPress={() => toggleGoal(goal.id)}
                  onLongPress={drag}
                  delayLongPress={150}>
                  {/* 드래그 핸들 */}
                  <TouchableOpacity onPressIn={drag} style={styles.goalDragHandle}>
                    <Icon name="menu" size={iconSize(16)} color={subtextColor} />
                  </TouchableOpacity>
                  {/* 체크박스 */}
                  <TouchableOpacity style={{padding: sp(4)}} onPress={() => toggleGoal(goal.id)}>
                    <View style={[
                      styles.goalItemCheck,
                      {borderColor: goal.isCompleted ? '#4CAF50' : subtextColor},
                      goal.isCompleted && {backgroundColor: '#4CAF50'},
                    ]}>
                      {goal.isCompleted && <Icon name="checkmark" size={iconSize(14)} color="#fff" />}
                    </View>
                  </TouchableOpacity>
                  <Text style={[
                    styles.goalItemText,
                    {color: textColor, flex: 1},
                    goal.isCompleted && styles.goalItemCompleted,
                  ]}>
                    {goal.content}
                  </Text>
                  <TouchableOpacity style={styles.goalItemDelete} onPress={() => {
                    setEditingGoalId(goal.id);
                    setGoalContent(goal.content);
                    setSelectedGoalPeriod('monthly');
                    setShowLongTermGoalModal(true);
                  }}>
                    <Icon name="create-outline" size={iconSize(16)} color={subtextColor} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.goalItemDelete} onPress={() => deleteGoal(goal.id)}>
                    <Icon name="trash-outline" size={iconSize(16)} color={subtextColor} />
                  </TouchableOpacity>
                </TouchableOpacity>
              );

              return (
                <View style={styles.goalSection}>
                  <View style={styles.goalSectionHeader}>
                    <Icon name="calendar" size={iconSize(16)} color="#2196F3" />
                    <Text style={[styles.goalSectionTitle, {color: textColor}]}>월간 목표</Text>
                    <Text style={[styles.goalSectionDate, {color: subtextColor}]}>{monthName}</Text>
                  </View>
                  {monthlyGoals.length > 0 && (
                    <DraggableFlatList
                      data={monthlyGoals}
                      keyExtractor={(item) => item.id}
                      renderItem={renderMonthlyGoalItem}
                      onDragEnd={({data}) => reorderGoals('monthly', data.map(g => g.id))}
                      scrollEnabled={false}
                    />
                  )}
                </View>
              );
            })()}

            {/* 연간 목표 */}
            {(() => {
              const now = new Date();
              const yearName = `${now.getFullYear()}년`;
              const yearlyGoals = getGoalsByPeriod('yearly');

              const renderYearlyGoalItem = ({item: goal, drag, isActive}: RenderItemParams<Goal>) => (
                <TouchableOpacity
                  style={[
                    styles.goalItem,
                    theme.task.item.postItStyle && {
                      backgroundColor: isDark ? '#FFF3E0' + '20' : '#FFF3E0',
                      borderWidth: 0,
                      borderLeftWidth: 3,
                      borderLeftColor: '#FF9800',
                      shadowColor: '#000',
                      shadowOffset: {width: 1, height: 1},
                      shadowOpacity: isDark ? 0.3 : 0.1,
                      shadowRadius: 2,
                      elevation: 2,
                    },
                    !theme.task.item.postItStyle && {borderColor: dividerColor},
                    isActive && {opacity: 0.9},
                  ]}
                  onPress={() => toggleGoal(goal.id)}
                  onLongPress={drag}
                  delayLongPress={150}>
                  {/* 드래그 핸들 */}
                  <TouchableOpacity onPressIn={drag} style={styles.goalDragHandle}>
                    <Icon name="menu" size={iconSize(16)} color={subtextColor} />
                  </TouchableOpacity>
                  {/* 체크박스 */}
                  <TouchableOpacity style={{padding: sp(4)}} onPress={() => toggleGoal(goal.id)}>
                    <View style={[
                      styles.goalItemCheck,
                      {borderColor: goal.isCompleted ? '#4CAF50' : subtextColor},
                      goal.isCompleted && {backgroundColor: '#4CAF50'},
                    ]}>
                      {goal.isCompleted && <Icon name="checkmark" size={iconSize(14)} color="#fff" />}
                    </View>
                  </TouchableOpacity>
                  <Text style={[
                    styles.goalItemText,
                    {color: textColor, flex: 1},
                    goal.isCompleted && styles.goalItemCompleted,
                  ]}>
                    {goal.content}
                  </Text>
                  <TouchableOpacity style={styles.goalItemDelete} onPress={() => {
                    setEditingGoalId(goal.id);
                    setGoalContent(goal.content);
                    setSelectedGoalPeriod('yearly');
                    setShowLongTermGoalModal(true);
                  }}>
                    <Icon name="create-outline" size={iconSize(16)} color={subtextColor} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.goalItemDelete} onPress={() => deleteGoal(goal.id)}>
                    <Icon name="trash-outline" size={iconSize(16)} color={subtextColor} />
                  </TouchableOpacity>
                </TouchableOpacity>
              );

              return (
                <View style={styles.goalSection}>
                  <View style={styles.goalSectionHeader}>
                    <Icon name="trophy-outline" size={iconSize(16)} color="#FF9800" />
                    <Text style={[styles.goalSectionTitle, {color: textColor}]}>연간 목표</Text>
                    <Text style={[styles.goalSectionDate, {color: subtextColor}]}>{yearName}</Text>
                  </View>
                  {yearlyGoals.length > 0 && (
                    <DraggableFlatList
                      data={yearlyGoals}
                      keyExtractor={(item) => item.id}
                      renderItem={renderYearlyGoalItem}
                      onDragEnd={({data}) => reorderGoals('yearly', data.map(g => g.id))}
                      scrollEnabled={false}
                    />
                  )}
                </View>
              );
            })()}

            {/* 목표 추가 버튼 */}
            <TouchableOpacity
              style={[styles.goalAddButton, {borderColor: dividerColor}]}
              onPress={() => setShowLongTermGoalModal(true)}>
              <Icon name="add-circle-outline" size={iconSize(20)} color={accentColor} />
              <Text style={[styles.goalAddText, {color: accentColor}]}>목표 추가</Text>
            </TouchableOpacity>
          </View>
        </NotebookCard>
      </ScrollView>
    );
  };

  // 3. 타임테이블 탭
  const renderTimetableTab = () => (
    <ScrollView
      style={styles.tabContent}
      contentContainerStyle={{paddingBottom: 120}}
      showsVerticalScrollIndicator={false}>

      {/* 텐미닛 플래너 */}
      <NotebookCard
        theme={theme}
        isDark={isDark}
        title="텐미닛 플래너"
        tapeColor="#FFE4B5"
        rightAction={
          <View style={{gap: hp(6)}}>
            {/* 첫 번째 줄: 기존 버튼들 */}
            <View style={styles.subjectButtons}>
              <TouchableOpacity
                style={[styles.addSubjectButton, {backgroundColor: accentColor + '15'}]}
                onPress={() => setShowSubjectModal(true)}>
                <Icon name="add" size={iconSize(16)} color={accentColor} />
                <Text style={[styles.addSubjectButtonText, {color: accentColor}]}>추가</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.manageSubjectButton, {backgroundColor: subtextColor + '15'}]}
                onPress={() => setShowTimetableSettingsModal(true)}>
                <Icon name="settings-outline" size={iconSize(16)} color={subtextColor} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.manageSubjectButton, {backgroundColor: subtextColor + '15'}]}
                onPress={() => setShowTimetableHelpModal(true)}>
                <Icon name="help-circle-outline" size={iconSize(16)} color={subtextColor} />
              </TouchableOpacity>
            </View>
          </View>
        }>
        <TenMinutePlanner
          isDark={isDark}
          subjects={subjects}
          blocks={selectedBlocks}
          onBlockChange={handleBlockChange}
          onBlockStatusChange={(hour, minute) => toggleBlockStatus(hour, minute, selectedDateStr)}
          onAddSubject={(subject) => addSubject(subject)}
          onUpdateSubject={(id, subject) => updateSubject(id, subject)}
          onDeleteSubject={(id) => deleteSubject(id)}
          startHour={plannerStartHour}
          endHour={24}
          theme={theme}
          showSubjectModalExternal={showSubjectModal}
          onCloseSubjectModal={() => setShowSubjectModal(false)}
          showManageModalExternal={showManageModal}
          onCloseManageModal={() => setShowManageModal(false)}
        />
      </NotebookCard>

      {/* 주간 시간표 - Google Calendar 스타일 */}
      <NotebookCard
        theme={theme}
        isDark={isDark}
        title="주간 시간표"
        tapeColor="#B0E0E6"
        showTape={false}
        rightAction={
          <TouchableOpacity
            style={[styles.manageSubjectButton, {backgroundColor: '#4682B4' + '15'}]}
            onPress={() => setShowWeeklyModal(true)}>
            <Icon name="settings-outline" size={iconSize(14)} color="#4682B4" />
          </TouchableOpacity>
        }>
        <View style={{marginTop: hp(4)}}>
          {/* 요일 헤더 (고정) */}
          <View style={{
            flexDirection: 'row',
            marginLeft: sp(20),
            marginBottom: hp(4),
          }}>
            {WEEKDAYS.map((day, idx) => {
              const isToday = new Date().getDay() === idx;
              const isWeekend = idx === 0 || idx === 6;
              return (
                <View key={idx} style={{
                  flex: 1,
                  alignItems: 'center',
                }}>
                  <View style={{
                    width: sp(24),
                    height: sp(24),
                    borderRadius: sp(12),
                    backgroundColor: isToday ? accentColor : 'transparent',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <Text style={{
                      fontSize: fp(11),
                      fontWeight: isToday ? '700' : '600',
                      color: isToday ? '#FFFFFF' : isWeekend ? '#FF6B6B' : textColor,
                    }}>
                      {day}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* 시간표 그리드 (스크롤 가능) */}
          <ScrollView
            style={{maxHeight: hp(320)}}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}>
            <View style={{flexDirection: 'row'}}>
              {/* 시간 레이블 (왼쪽 고정) - 24시간 순환 표시 */}
              <View style={{width: sp(20)}}>
                {Array.from({length: 24}, (_, i) => (plannerStartHour + i) % 24).map(hour => (
                  <View key={hour} style={{
                    height: hp(32),
                    justifyContent: 'flex-start',
                    alignItems: 'flex-end',
                    paddingRight: sp(2),
                  }}>
                    <Text style={{
                      fontSize: fp(9),
                      color: subtextColor,
                      fontWeight: '500',
                    }}>
                      {hour}
                    </Text>
                  </View>
                ))}
              </View>

              {/* 요일별 그리드 */}
              <View style={{flex: 1, flexDirection: 'row'}}>
                {WEEKDAYS.map((_, dayIdx) => {
                  const dayBlocks = weeklyTimetable[dayIdx as 0|1|2|3|4|5|6] || [];
                  const isToday = new Date().getDay() === dayIdx;

                  // 블록을 시간별로 그룹화 (연속 블록 감지용)
                  const blockMap: {[key: string]: {subjectId: string; minute: number}} = {};
                  dayBlocks.forEach(b => {
                    blockMap[`${b.hour}-${b.minute}`] = {subjectId: b.subjectId, minute: b.minute};
                  });

                  return (
                    <View key={dayIdx} style={{
                      flex: 1,
                      borderLeftWidth: 0.5,
                      borderLeftColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                      backgroundColor: isToday
                        ? (isDark ? 'rgba(0,122,255,0.08)' : 'rgba(0,122,255,0.04)')
                        : 'transparent',
                    }}>
                      {Array.from({length: 24}, (_, i) => (plannerStartHour + i) % 24).map(hour => {
                        // 해당 시간의 10분 블록들
                        const hourBlocks: Array<{minute: number; subjectId: string}> = [];
                        [0, 10, 20, 30, 40, 50].forEach(minute => {
                          const block = blockMap[`${hour}-${minute}`];
                          if (block) {
                            hourBlocks.push({minute, subjectId: block.subjectId});
                          }
                        });

                        // 과목별로 그룹화해서 연속 블록으로 표시
                        const segments: Array<{startMin: number; endMin: number; subjectId: string}> = [];
                        let currentSegment: {startMin: number; endMin: number; subjectId: string} | null = null;

                        [0, 10, 20, 30, 40, 50].forEach(minute => {
                          const block = blockMap[`${hour}-${minute}`];
                          if (block) {
                            if (currentSegment && currentSegment.subjectId === block.subjectId) {
                              currentSegment.endMin = minute + 10;
                            } else {
                              if (currentSegment) {segments.push(currentSegment);}
                              currentSegment = {startMin: minute, endMin: minute + 10, subjectId: block.subjectId};
                            }
                          } else {
                            if (currentSegment) {
                              segments.push(currentSegment);
                              currentSegment = null;
                            }
                          }
                        });
                        if (currentSegment) {segments.push(currentSegment);}

                        const hasBlocks = segments.length > 0;

                        return (
                          <View key={hour} style={{
                            height: hp(32),
                            borderBottomWidth: 0.5,
                            borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                            position: 'relative',
                          }}>
                            {hasBlocks && segments.map((seg, segIdx) => {
                              const subject = subjects.find(s => s.id === seg.subjectId);
                              const color = subject?.color || accentColor;
                              const name = subject?.name || '';
                              const segHeight = ((seg.endMin - seg.startMin) / 60) * hp(32);
                              const segTop = (seg.startMin / 60) * hp(32);

                              return (
                                <View
                                  key={segIdx}
                                  style={{
                                    position: 'absolute',
                                    top: segTop,
                                    left: sp(1),
                                    right: sp(1),
                                    height: segHeight,
                                    backgroundColor: color,
                                    borderRadius: sp(2),
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    overflow: 'hidden',
                                  }}>
                                  {segHeight >= hp(10) && (
                                    <Text
                                      style={{
                                        fontSize: fp(8),
                                        color: '#FFFFFF',
                                        fontWeight: '600',
                                        textAlign: 'center',
                                      }}
                                      numberOfLines={1}>
                                      {name.length > 4 ? name.slice(0, 4) : name}
                                    </Text>
                                  )}
                                </View>
                              );
                            })}
                          </View>
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* 과목 범례 */}
          {subjects.length > 0 && (
            <View style={{
              marginTop: hp(12),
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: sp(6),
            }}>
              {subjects.slice(0, 6).map(subject => (
                <View key={subject.id} style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: sp(8),
                  paddingVertical: hp(3),
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  borderRadius: sp(10),
                }}>
                  <View style={{
                    width: sp(10),
                    height: sp(10),
                    borderRadius: sp(2),
                    backgroundColor: subject.color,
                    marginRight: sp(4),
                  }} />
                  <Text style={{
                    fontSize: fp(10),
                    color: textColor,
                    fontWeight: '500',
                  }}>
                    {subject.name}
                  </Text>
                </View>
              ))}
              {subjects.length > 6 && (
                <Text style={{
                  fontSize: fp(10),
                  color: subtextColor,
                  alignSelf: 'center',
                }}>
                  +{subjects.length - 6}
                </Text>
              )}
            </View>
          )}

          {/* 하단 안내 */}
          <View style={{marginTop: hp(10), alignItems: 'center'}}>
            <Text style={{fontSize: fp(10), color: subtextColor}}>
              {weeklyTimetableEnabled ? '매일 자동으로 요일별 템플릿 불러오기 ON' : '설정 버튼을 눌러 요일별 템플릿을 설정하세요'}
            </Text>
          </View>
        </View>
      </NotebookCard>
    </ScrollView>
  );

  // 4. 집중 기록 탭 (뽀모도로 세션 표시 - 집중 모드만)
  const renderFocusTab = () => {
    // 선택된 날짜의 뽀모도로 세션 필터링
    const selectedDateSessions = pomodoroSessions.filter(session => {
      const sessionDate = getDateString(new Date(session.startTime));
      return sessionDate === selectedDateStr;
    });

    // 집중 세션만 (FOCUS만, 자유모드 제외)
    const focusSessions = selectedDateSessions.filter(
      s => s.mode === 'FOCUS'
    );

    // 휴식 세션 (BREAK만, 자유모드 제외)
    const breakSessions = selectedDateSessions.filter(
      s => s.mode === 'BREAK'
    );

    // 총 집중 시간 (분)
    const totalFocusMinutes = focusSessions.reduce((sum, s) => {
      const duration = (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 60000;
      return sum + Math.round(duration);
    }, 0);

    // 완료된 세션 수
    const _completedFocusSessions = focusSessions.filter(s => s.completed).length;

    // 시간 포맷 (00:00 형식)
    const formatSessionTime = (date: Date) => {
      const d = new Date(date);
      const h = d.getHours();
      const m = d.getMinutes();
      return `${h}:${String(m).padStart(2, '0')}`;
    };

    // 시간 계산 (분)
    const getSessionDuration = (start: Date, end: Date) => {
      const duration = (new Date(end).getTime() - new Date(start).getTime()) / 60000;
      return Math.round(duration);
    };

    // 목표 진행률
    const focusProgress = Math.min((totalFocusMinutes / dailyGoalMinutes) * 100, 100);

    return (
      <ScrollView
        style={styles.tabContent}
        contentContainerStyle={{paddingBottom: 120}}
        showsVerticalScrollIndicator={false}>

        {/* 일일 목표 */}
        <NotebookCard
          theme={theme}
          isDark={isDark}
          title="일일 목표"
          tapeColor="#B0E0E6"
          rightAction={
            <TouchableOpacity
              style={[styles.focusHelpButton, {backgroundColor: accentColor + '15'}]}
              onPress={() => setShowGoalModal(true)}>
              <Icon name="settings-outline" size={iconSize(16)} color={accentColor} />
              <Text style={[styles.focusHelpText, {color: accentColor}]}>설정</Text>
            </TouchableOpacity>
          }>
          {/* 목표 진행률 */}
          <View style={styles.dailyGoalContent}>
            <View style={styles.dailyGoalHeader}>
              <View style={styles.dailyGoalTimeRow}>
                <Text style={[styles.dailyGoalCurrentTime, {color: accentColor}]}>
                  {formatTime(totalFocusMinutes)}
                </Text>
                <Text style={[styles.dailyGoalSeparator, {color: subtextColor}]}>/</Text>
                <Text style={[styles.dailyGoalTargetTime, {color: subtextColor}]}>
                  {formatTime(dailyGoalMinutes)}
                </Text>
              </View>
              <Text style={[styles.dailyGoalPercent, {color: focusProgress >= 100 ? successColor : accentColor}]}>
                {Math.round(focusProgress)}%
              </Text>
            </View>
            <View style={[
              styles.progressBar,
              {backgroundColor: progressBg, borderRadius: theme.progressBar.borderRadius, height: theme.progressBar.height, marginTop: hp(12)},
            ]}>
              <View style={[
                styles.progressFill,
                {width: `${focusProgress}%`, backgroundColor: focusProgress >= 100 ? successColor : accentColor, borderRadius: theme.progressBar.borderRadius},
              ]} />
            </View>
            {focusProgress >= 100 && (
              <Text style={[styles.dailyGoalComplete, {color: successColor}]}>
                목표 달성!
              </Text>
            )}
          </View>
        </NotebookCard>

        {/* 집중 세션 목록 */}
        <NotebookCard
          theme={theme}
          isDark={isDark}
          title={`집중 세션 (${focusSessions.length})`}
          tapeColor="#FFB347"
          rightAction={
            <TouchableOpacity
              style={[styles.statsGuideButton, {backgroundColor: isDark ? '#2A2A2A' : '#F0F0F0'}]}
              onPress={() => setShowFocusHelpModal(true)}>
              <Icon name="help-circle-outline" size={iconSize(14)} color={accentColor} />
              <Text style={[styles.statsGuideText, {color: accentColor}]}>가이드</Text>
            </TouchableOpacity>
          }>
          {focusSessions.length === 0 ? (
            <View style={styles.emptyFocusContainer}>
              <Icon name="cafe-outline" size={iconSize(48)} color={dividerColor} />
              <Text style={[styles.emptyFocusText, {color: subtextColor}]}>
                {isToday ? '오늘 아직 집중 기록이 없어요' : '이 날은 집중 기록이 없어요'}
              </Text>
              <Text style={[styles.emptyFocusSubtext, {color: subtextColor}]}>
                뽀모도로 타이머로 집중해보세요!
              </Text>
            </View>
          ) : (
            <View style={styles.focusSessionList}>
              {focusSessions.map((session, index) => {
                const duration = getSessionDuration(session.startTime, session.endTime);
                const isNotebook = theme.id === 'notebook';
                const statusColor = session.completed ? successColor : warningColor;

                // 포스트잇 색상 배열 (노트북 테마용) - 자연스러운 파스텔톤
                const postItColors = [
                  {bg: '#FBF0C4', border: '#E5D48A'}, // 부드러운 노란색
                  {bg: '#F5E0C8', border: '#D9BFA0'}, // 따뜻한 베이지
                  {bg: '#D8ECD5', border: '#B0D4A8'}, // 부드러운 민트/초록
                  {bg: '#DAE8F2', border: '#A8C8E0'}, // 부드러운 하늘색
                  {bg: '#E8DCF0', border: '#C8B0D8'}, // 부드러운 라벤더
                  {bg: '#F5E0DC', border: '#E0B8B0'}, // 부드러운 살구/핑크
                ];
                const postItColor = postItColors[index % postItColors.length];

                return (
                  <View
                    key={`${session.startTime}-${index}`}
                    style={[
                      styles.focusSessionCard,
                      isNotebook ? {
                        // 포스트잇 스타일
                        backgroundColor: isDark ? '#3A3520' : postItColor.bg,
                        borderWidth: 0,
                        borderRadius: 2,
                        borderLeftWidth: 4,
                        borderLeftColor: isDark ? postItColor.border + '80' : postItColor.border,
                        shadowColor: '#000',
                        shadowOffset: {width: 2, height: 2},
                        shadowOpacity: isDark ? 0.3 : 0.15,
                        shadowRadius: 3,
                        elevation: 3,
                        transform: [{rotate: index % 2 === 0 ? '-0.5deg' : '0.5deg'}],
                      } : {
                        // 기본 테마 스타일
                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                        borderColor: statusColor + '30',
                        borderWidth: 1,
                        borderRadius: 12,
                      },
                    ]}>
                    <View style={styles.focusSessionLeft}>
                      <View style={[
                        styles.focusSessionIcon,
                        {
                          backgroundColor: isNotebook
                            ? (isDark ? statusColor + '30' : 'rgba(0,0,0,0.08)')
                            : statusColor + '20',
                          borderRadius: isNotebook ? 4 : 18,
                        },
                      ]}>
                        <Icon
                          name={session.completed ? 'checkmark' : 'close'}
                          size={iconSize(18)}
                          color={isNotebook ? (isDark ? statusColor : '#5C4A3D') : statusColor}
                        />
                      </View>
                      <View style={styles.focusSessionInfo}>
                        <Text style={[
                          styles.focusSessionTime,
                          {color: isNotebook ? (isDark ? '#E0D5C8' : '#5C4A3D') : textColor},
                        ]}>
                          {formatSessionTime(session.startTime)} - {formatSessionTime(session.endTime)}
                        </Text>
                        <Text style={[
                          styles.focusSessionDuration,
                          {color: isNotebook ? (isDark ? '#8B7355' : '#8B7355') : subtextColor},
                        ]}>
                          {formatTime(duration)} 집중
                        </Text>
                        {session.memo && (
                          <View style={[
                            styles.sessionMemoContainer,
                            {backgroundColor: isNotebook ? 'rgba(0,0,0,0.05)' : accentColor + '10'},
                          ]}>
                            <Icon name="document-text-outline" size={iconSize(12)} color={isNotebook ? '#8B7355' : accentColor} />
                            <Text style={[
                              styles.sessionMemoText,
                              {color: isNotebook ? (isDark ? '#C8B8A8' : '#6B5A4A') : subtextColor},
                            ]} numberOfLines={2}>
                              {session.memo}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={[
                      styles.focusSessionStatus,
                      {
                        backgroundColor: statusColor,
                        borderRadius: isNotebook ? 2 : 12,
                      },
                    ]}>
                      <Text style={styles.focusSessionStatusText}>
                        {session.completed ? '완료' : '중단'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </NotebookCard>

        {/* 휴식 세션 */}
        {breakSessions.length > 0 && (
          <NotebookCard
            theme={theme}
            isDark={isDark}
            title={`휴식 세션 (${breakSessions.length})`}
            tapeColor="#87CEEB">
            {breakSessions.map((session, index) => {
              const duration = getSessionDuration(session.startTime, session.endTime);
              return (
                <View
                  key={`break-${session.startTime}-${index}`}
                  style={[
                    styles.breakSessionItem,
                    index < breakSessions.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: dividerColor,
                    },
                  ]}>
                  <Icon name="cafe" size={iconSize(18)} color={subtextColor} />
                  <Text style={[styles.breakSessionText, {color: textColor}]}>
                    {formatSessionTime(session.startTime)} - {formatSessionTime(session.endTime)}
                  </Text>
                  <Text style={[styles.breakSessionDuration, {color: subtextColor}]}>
                    {formatTime(duration)}
                  </Text>
                </View>
              );
            })}
          </NotebookCard>
        )}
      </ScrollView>
    );
  };

  // 5. 통계 탭
  const renderStatsTab = () => {
    const subjectMinutes = selectedStats.subjectMinutes;
    const totalSubjectMinutes = Object.values(subjectMinutes).reduce((sum, m) => sum + m, 0);
    // 오늘의 목표 진행률 계산
    const _todayProgress = Math.min((selectedStats.totalMinutes / dailyGoalMinutes) * 100, 100);

    return (
      <ScrollView
        style={styles.tabContent}
        contentContainerStyle={{paddingBottom: 120}}
        showsVerticalScrollIndicator={false}>

        {/* 메인 통계 - 오늘의 공부 시간 (목표 진행률은 집중탭에서) */}
        <NotebookCard
          theme={theme}
          isDark={isDark}
          title={isToday ? '오늘의 공부' : `${selectedDate.getMonth() + 1}/${selectedDate.getDate()} 공부`}
          tapeColor="#B0E0E6"
          rightAction={
            <TouchableOpacity
              style={[styles.statsGuideButton, {backgroundColor: isDark ? '#2A2A2A' : '#F0F0F0'}]}
              onPress={() => setShowStatsHelpModal(true)}>
              <Icon name="help-circle-outline" size={iconSize(14)} color={accentColor} />
              <Text style={[styles.statsGuideText, {color: accentColor}]}>가이드</Text>
            </TouchableOpacity>
          }>
          <View style={styles.mainStatRow}>
            <View style={styles.mainStatItem}>
              <Text style={[styles.mainStatValue, {color: accentColor, fontSize: fp(statsValueFontSize), fontWeight: statsValueFontWeight as any}]}>
                {formatTime(focusSessionStats.selectedDateMinutes)}
              </Text>
              <Text style={[styles.mainStatLabel, {color: subtextColor}]}>
                {focusSessionStats.selectedDateSessions}회 집중
              </Text>
            </View>
            {focusSessionStats.streak > 0 && (
              <View style={[styles.streakBadge, {backgroundColor: warningColor}]}>
                <Icon name="flame" size={iconSize(14)} color="#FFFFFF" />
                <Text style={styles.streakBadgeText}>{focusSessionStats.streak}일 연속</Text>
              </View>
            )}
          </View>
        </NotebookCard>

        {/* 리포트 바로가기 */}
        <TouchableOpacity
          style={[
            styles.reportShortcut,
            {
              backgroundColor: isDark ? '#1E3A5F' : '#E8F4FD',
              borderColor: accentColor + '40',
            },
          ]}
          onPress={() => setSelectedTab('report')}>
          <View style={styles.reportShortcutContent}>
            <Icon name="analytics" size={iconSize(24)} color={accentColor} />
            <View style={styles.reportShortcutText}>
              <Text style={[styles.reportShortcutTitle, {color: textColor}]}>
                주간/월간 리포트 보기
              </Text>
              <Text style={[styles.reportShortcutDesc, {color: subtextColor}]}>
                이번 주 {formatTime(focusSessionStats.weekMinutes)} · 이번 달 {formatTime(focusSessionStats.monthMinutes)}
              </Text>
            </View>
          </View>
          <Icon name="chevron-forward" size={iconSize(20)} color={subtextColor} />
        </TouchableOpacity>

        {/* 연속 기록 */}
        <NotebookCard theme={theme} isDark={isDark} title="연속 기록" tapeColor="#FFB6C1">
          <View style={styles.streakStatsRow}>
            <View style={styles.streakStatItem}>
              <Icon name="flame" size={iconSize(28)} color={warningColor} />
              <Text style={[styles.streakStatValue, {color: textColor, fontWeight: statsValueFontWeight as any}]}>{focusSessionStats.streak}일</Text>
              <Text style={[styles.streakStatLabel, {color: subtextColor, fontSize: fp(statsLegendFontSize)}]}>현재 연속</Text>
            </View>
            <View style={[styles.streakStatDivider, {backgroundColor: dividerColor}]} />
            <View style={styles.streakStatItem}>
              <Icon name="ribbon" size={iconSize(28)} color="#FFD700" />
              <Text style={[styles.streakStatValue, {color: textColor, fontWeight: statsValueFontWeight as any}]}>{focusSessionStats.bestStreak}일</Text>
              <Text style={[styles.streakStatLabel, {color: subtextColor, fontSize: fp(statsLegendFontSize)}]}>최고 기록</Text>
            </View>
          </View>
        </NotebookCard>

        {/* 과목별 통계 */}
        {subjects.length > 0 && (
          <NotebookCard theme={theme} isDark={isDark} title="과목별 시간" tapeColor="#FFE4B5">
            {subjects.map((subject) => {
              const subjectTime = subjectMinutes[subject.id] || 0;
              const subjectPercent = totalSubjectMinutes > 0 ? (subjectTime / totalSubjectMinutes) * 100 : 0;
              return (
                <View key={subject.id} style={[styles.subjectStatRow, {marginBottom: statsBarChartGap}]}>
                  <View style={styles.subjectStatInfo}>
                    <View style={[styles.subjectDot, {backgroundColor: subject.color, width: statsLegendDotSize, height: statsLegendDotSize, borderRadius: statsLegendDotSize / 2}]} />
                    <Text style={[styles.subjectStatName, {color: textColor, fontSize: fp(statsLegendFontSize)}]}>
                      {subject.name}
                    </Text>
                  </View>
                  <View style={styles.subjectStatBarContainer}>
                    <View style={[styles.subjectStatBar, {backgroundColor: progressBg, borderRadius: statsBarChartBorderRadius}]}>
                      <View style={[styles.subjectStatFill, {width: `${subjectPercent}%`, backgroundColor: subject.color, borderRadius: statsBarChartBorderRadius}]} />
                    </View>
                    <Text style={[styles.subjectStatTime, {color: subtextColor, fontSize: fp(statsLegendFontSize)}]}>
                      {formatTime(subjectTime)}
                    </Text>
                  </View>
                </View>
              );
            })}
            {/* 원형 차트 버튼 */}
            {totalSubjectMinutes > 0 && (
              <TouchableOpacity
                style={[styles.pieChartButton, {backgroundColor: isDark ? '#2A2A2A' : '#F0F0F0', borderRadius: theme.button.borderRadius}]}
                onPress={() => setShowPieChartModal(true)}>
                <Icon name="pie-chart-outline" size={iconSize(18)} color={accentColor} />
                <Text style={[styles.pieChartButtonText, {color: accentColor, fontWeight: theme.button.fontWeight as any}]}>
                  원형 차트로 보기
                </Text>
              </TouchableOpacity>
            )}
          </NotebookCard>
        )}

        {/* 오늘의 기록 (다짐/할일/메모 - 읽기 전용) */}
        {(() => {
          const dailyComment = getDailyComment(getDateString(selectedDate));
          const dailyMemo = getDailyMemo(getDateString(selectedDate));
          const dailyTasks = getTasksForDate(getDateString(selectedDate));
          const completedTasks = dailyTasks.filter(t => t.completed);
          const hasAnyContent = dailyComment || dailyMemo || dailyTasks.length > 0;

          if (!hasAnyContent) {return null;}

          // 포스트잇 스타일 여부 (노트북 테마만)
          const isPostItStyle = theme.task.item.postItStyle || false;

          // 각 섹션별 포스트잇 색상 (인덱스 기반)
          const commentPostIt = getPostItColor(theme, 0, isDark);
          const taskPostIt = getPostItColor(theme, 1, isDark);
          const memoPostIt = getPostItColor(theme, 2, isDark);

          // 각 섹션별 회전 각도
          const commentRotation = getRotation(theme, 0);
          const taskRotation = getRotation(theme, 1);
          const memoRotation = getRotation(theme, 2);

          // 포스트잇 그림자
          const postItShadow = isPostItStyle ? getPostItShadow(isDark) : {};

          return (
            <NotebookCard theme={theme} isDark={isDark} title={isToday ? '오늘의 기록' : `${selectedDate.getMonth() + 1}/${selectedDate.getDate()} 기록`} tapeColor="#E6E6FA">
              {/* 오늘의 다짐 */}
              {dailyComment && (
                <View style={[
                  styles.statsDailySectionCard,
                  isPostItStyle ? {
                    backgroundColor: commentPostIt.bg,
                    borderLeftWidth: 4,
                    borderLeftColor: commentPostIt.border,
                    borderRadius: theme.task.item.borderRadius,
                    padding: theme.task.item.padding,
                    transform: [{rotate: `${commentRotation}deg`}],
                    ...postItShadow,
                  } : {
                    backgroundColor: isDark ? theme.stats.dailySection.comment.dark : theme.stats.dailySection.comment.light,
                    borderRadius: theme.stats.dailySection.borderRadius,
                    borderWidth: theme.stats.dailySection.borderWidth,
                    padding: theme.stats.dailySection.padding,
                    // 기본 테마: 왼쪽 악센트 라인 + 그림자
                    borderLeftWidth: 4,
                    borderLeftColor: theme.stats.dailySection.comment.accent
                      ? (isDark ? theme.stats.dailySection.comment.accent.dark : theme.stats.dailySection.comment.accent.light)
                      : errorColor,
                    ...(theme.stats.dailySection.shadow ? {
                      shadowColor: '#000',
                      shadowOffset: {width: 0, height: 2},
                      shadowOpacity: isDark ? 0.25 : 0.08,
                      shadowRadius: 8,
                      elevation: 3,
                    } : {}),
                  },
                ]}>
                  <View style={styles.statsDailyHeader}>
                    <Icon name="heart" size={iconSize(16)} color={errorColor} />
                    <Text style={[styles.statsDailyLabel, {color: errorColor}]}>오늘의 다짐</Text>
                  </View>
                  <Text style={[styles.statsDailyContent, {color: textColor}]}>"{dailyComment}"</Text>
                </View>
              )}

              {/* 오늘의 할 일 */}
              {dailyTasks.length > 0 && (
                <View style={[
                  styles.statsDailySectionCard,
                  isPostItStyle ? {
                    backgroundColor: taskPostIt.bg,
                    borderLeftWidth: 4,
                    borderLeftColor: taskPostIt.border,
                    borderRadius: theme.task.item.borderRadius,
                    padding: theme.task.item.padding,
                    marginTop: dailyComment ? hp(10) : 0,
                    transform: [{rotate: `${taskRotation}deg`}],
                    ...postItShadow,
                  } : {
                    backgroundColor: isDark ? theme.stats.dailySection.task.dark : theme.stats.dailySection.task.light,
                    borderRadius: theme.stats.dailySection.borderRadius,
                    borderWidth: theme.stats.dailySection.borderWidth,
                    padding: theme.stats.dailySection.padding,
                    marginTop: dailyComment ? hp(12) : 0,
                    // 기본 테마: 왼쪽 악센트 라인 + 그림자
                    borderLeftWidth: 4,
                    borderLeftColor: theme.stats.dailySection.task.accent
                      ? (isDark ? theme.stats.dailySection.task.accent.dark : theme.stats.dailySection.task.accent.light)
                      : successColor,
                    ...(theme.stats.dailySection.shadow ? {
                      shadowColor: '#000',
                      shadowOffset: {width: 0, height: 2},
                      shadowOpacity: isDark ? 0.25 : 0.08,
                      shadowRadius: 8,
                      elevation: 3,
                    } : {}),
                  },
                ]}>
                  <View style={styles.statsDailyHeader}>
                    <Icon name="checkbox" size={iconSize(16)} color={successColor} />
                    <Text style={[styles.statsDailyLabel, {color: successColor}]}>
                      할 일 ({completedTasks.length}/{dailyTasks.length} 완료)
                    </Text>
                  </View>

                  {/* 할 일 완료율 진행바 */}
                  {dailyTasks.length > 0 && (
                    <View style={styles.taskCompletionContainer}>
                      <View style={[styles.taskCompletionBar, {backgroundColor: isDark ? theme.progressBar.background.dark : theme.progressBar.background.light}]}>
                        <View style={[
                          styles.taskCompletionProgress,
                          {
                            width: `${(completedTasks.length / dailyTasks.length) * 100}%`,
                            backgroundColor: completedTasks.length === dailyTasks.length ? successColor : accentColor,
                            borderRadius: theme.progressBar.borderRadius,
                          },
                        ]} />
                      </View>
                      <Text style={[styles.taskCompletionText, {color: subtextColor}]}>
                        {Math.round((completedTasks.length / dailyTasks.length) * 100)}%
                      </Text>
                    </View>
                  )}

                  <View style={styles.statsDailyTasks}>
                    {dailyTasks.slice(0, 5).map(task => {
                      const taskSubject = task.subjectId ? subjects.find(s => s.id === task.subjectId) : null;
                      return (
                        <View key={task.id} style={styles.statsDailyTaskItem}>
                          <Icon
                            name={task.completed ? 'checkmark-circle' : 'ellipse-outline'}
                            size={iconSize(16)}
                            color={task.completed ? successColor : subtextColor}
                          />
                          <View style={styles.statsDailyTaskContent}>
                            <Text style={[
                              styles.statsDailyTaskText,
                              {color: task.completed ? subtextColor : textColor},
                              task.completed && {textDecorationLine: 'line-through'},
                            ]}>
                              {task.title}
                            </Text>
                            <View style={styles.statsDailyTaskMeta}>
                              {taskSubject && (
                                <View style={[styles.statsDailyTaskBadge, {backgroundColor: taskSubject.color + '20', borderRadius: theme.task.badge.borderRadius}]}>
                                  <View style={[styles.statsDailyTaskDot, {backgroundColor: taskSubject.color}]} />
                                  <Text style={[styles.statsDailyTaskBadgeText, {color: taskSubject.color}]}>
                                    {taskSubject.name}
                                  </Text>
                                </View>
                              )}
                              <Text style={[styles.taskEstimatedTime, {color: subtextColor}]}>
                                예상 {task.estimatedMinutes}분
                              </Text>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                    {dailyTasks.length > 5 && (
                      <Text style={[styles.statsDailyMore, {color: subtextColor}]}>
                        +{dailyTasks.length - 5}개 더
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {/* 오늘의 메모 */}
              {dailyMemo && (
                <View style={[
                  styles.statsDailySectionCard,
                  isPostItStyle ? {
                    backgroundColor: memoPostIt.bg,
                    borderLeftWidth: 4,
                    borderLeftColor: memoPostIt.border,
                    borderRadius: theme.task.item.borderRadius,
                    padding: theme.task.item.padding,
                    marginTop: (dailyComment || dailyTasks.length > 0) ? hp(10) : 0,
                    transform: [{rotate: `${memoRotation}deg`}],
                    ...postItShadow,
                  } : {
                    backgroundColor: isDark ? theme.stats.dailySection.memo.dark : theme.stats.dailySection.memo.light,
                    borderRadius: theme.stats.dailySection.borderRadius,
                    borderWidth: theme.stats.dailySection.borderWidth,
                    padding: theme.stats.dailySection.padding,
                    marginTop: (dailyComment || dailyTasks.length > 0) ? hp(12) : 0,
                    // 기본 테마: 왼쪽 악센트 라인 + 그림자
                    borderLeftWidth: 4,
                    borderLeftColor: theme.stats.dailySection.memo.accent
                      ? (isDark ? theme.stats.dailySection.memo.accent.dark : theme.stats.dailySection.memo.accent.light)
                      : accentColor,
                    ...(theme.stats.dailySection.shadow ? {
                      shadowColor: '#000',
                      shadowOffset: {width: 0, height: 2},
                      shadowOpacity: isDark ? 0.25 : 0.08,
                      shadowRadius: 8,
                      elevation: 3,
                    } : {}),
                  },
                ]}>
                  <View style={styles.statsDailyHeader}>
                    <Icon name="document-text" size={iconSize(16)} color={accentColor} />
                    <Text style={[styles.statsDailyLabel, {color: accentColor}]}>메모</Text>
                  </View>
                  <Text style={[styles.statsDailyContent, {color: textColor}]} numberOfLines={4}>
                    {dailyMemo}
                  </Text>
                </View>
              )}
            </NotebookCard>
          );
        })()}

        {/* 텐미닛 메모 */}
        {(() => {
          const blocksWithMemo = selectedBlocks.filter(b => b.memo);
          const isPostItStyle = theme.task.item.postItStyle || false;

          return (
            <NotebookCard theme={theme} isDark={isDark} title="공부 메모" tapeColor="#DDA0DD">
              {blocksWithMemo.length === 0 ? (
                <View style={styles.emptyMemoContainer}>
                  <Icon name="document-text-outline" size={iconSize(40)} color={dividerColor} />
                  <Text style={[styles.emptyMemoText, {color: subtextColor}]}>
                    아직 작성된 메모가 없어요
                  </Text>
                  <Text style={[styles.emptyMemoSubtext, {color: subtextColor}]}>
                    시간표 탭에서 블록을 눌러 메모를 남겨보세요
                  </Text>
                </View>
              ) : (
                <View style={styles.memoStatList}>
                {blocksWithMemo.map((block, index) => {
                  const subject = subjects.find(s => s.id === block.subjectId);

                  // 포스트잇 스타일 (노트북 테마)
                  if (isPostItStyle) {
                    const postItColor = getPostItColor(theme, index + 3, isDark); // 오늘의 기록과 겹치지 않게 +3
                    const rotation = getRotation(theme, index);
                    const postItShadow = getPostItShadow(isDark);

                    return (
                      <View
                        key={`${block.hour}-${block.minute}-${index}`}
                        style={[
                          styles.memoStatCard,
                          {
                            backgroundColor: postItColor.bg,
                            borderLeftWidth: 4,
                            borderLeftColor: postItColor.border,
                            borderRadius: theme.task.item.borderRadius,
                            padding: theme.task.item.padding,
                            transform: [{rotate: `${rotation}deg`}],
                            ...postItShadow,
                          },
                        ]}>
                        <View style={styles.memoStatHeader}>
                          <Text style={[styles.memoStatTime, {color: textColor}]}>
                            {block.hour}:{String(block.minute).padStart(2, '0')}
                          </Text>
                          {subject && (
                            <View style={[styles.memoStatSubject, {backgroundColor: subject.color + '20', borderRadius: theme.task.badge.borderRadius}]}>
                              <View style={[styles.memoStatDot, {backgroundColor: subject.color}]} />
                              <Text style={[styles.memoStatSubjectText, {color: subject.color}]}>
                                {subject.name}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.memoStatText, {color: textColor}]}>
                          {block.memo}
                        </Text>
                      </View>
                    );
                  }

                  // 기본 스타일
                  const useSubjectColor = theme.stats.memoCard.useSubjectColor && subject;
                  const memoColor = useSubjectColor ? subject.color : accentColor;
                  const memoBg = isDark ? theme.stats.memoCard.defaultColor.dark : theme.stats.memoCard.defaultColor.light;
                  const memoShadowStyle = theme.stats.memoCard.shadow ? {
                    shadowColor: '#000',
                    shadowOffset: {width: 0, height: 2},
                    shadowOpacity: isDark ? 0.25 : 0.08,
                    shadowRadius: 8,
                    elevation: 3,
                  } : {};
                  return (
                    <View
                      key={`${block.hour}-${block.minute}-${index}`}
                      style={[
                        styles.memoStatCard,
                        {
                          backgroundColor: memoBg,
                          borderRadius: theme.stats.memoCard.borderRadius,
                          borderWidth: theme.stats.memoCard.borderWidth,
                          padding: theme.stats.memoCard.padding,
                          // 기본 테마: 왼쪽 악센트 라인 (과목 색상 또는 기본 색상)
                          borderLeftWidth: 4,
                          borderLeftColor: memoColor,
                          ...memoShadowStyle,
                        },
                      ]}>
                      <View style={styles.memoStatHeader}>
                        <Text style={[styles.memoStatTime, {color: memoColor}]}>
                          {block.hour}:{String(block.minute).padStart(2, '0')}
                        </Text>
                        {subject && (
                          <View style={[styles.memoStatSubject, {backgroundColor: subject.color + '20', borderRadius: theme.task.badge.borderRadius}]}>
                            <View style={[styles.memoStatDot, {backgroundColor: subject.color}]} />
                            <Text style={[styles.memoStatSubjectText, {color: subject.color}]}>
                              {subject.name}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.memoStatText, {color: textColor}]}>
                        {block.memo}
                      </Text>
                    </View>
                  );
                })}
              </View>
              )}
            </NotebookCard>
          );
        })()}

        {/* 오공완 공유 버튼 */}
        {isToday && selectedStats.totalMinutes > 0 && (
          <TouchableOpacity
            style={[styles.storyButton, {backgroundColor: warningColor}]}
            onPress={() => setShowStoryCard(true)}>
            <Icon name="share-social" size={iconSize(24)} color="#FFFFFF" />
            <Text style={styles.storyButtonText}>오공완 자랑하기</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  };

  return (
    <NotebookBackground theme={theme} isDark={isDark}>
      {/* 상태바 영역 배경색 - 날짜 헤더와 통일 */}
      <View style={{backgroundColor: cardBg, position: 'absolute', top: 0, left: 0, right: 0, height: 120}} />
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}>

          {/* ===== 날짜 헤더 (고정) ===== */}
          <View style={[styles.dateHeader, {backgroundColor: cardBg, borderBottomColor: dividerColor}]}>
            {/* 왼쪽: 캘린더 + 오늘 버튼 */}
            <View style={styles.dateLeftGroup}>
              <TouchableOpacity
                style={styles.dateSelector}
                onPress={() => {
                  setCalendarMonth(selectedDate);
                  setShowCalendarModal(true);
                }}>
                <Icon name="calendar-outline" size={iconSize(20)} color={accentColor} />
                <Text style={[styles.dateText, {color: textColor}]}>
                  {formatDate(selectedDate)}
                </Text>
                <Icon name="chevron-down" size={iconSize(16)} color={subtextColor} />
              </TouchableOpacity>

              {/* 오늘로 이동 버튼 - 캘린더 바로 오른쪽 */}
              {!isToday && (
                <TouchableOpacity
                  style={[styles.todayButton, {backgroundColor: accentColor}]}
                  onPress={() => setSelectedDate(new Date())}>
                  <Text style={styles.todayButtonText}>오늘</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* D-day 표시 - 테마에 맞게 스타일링 */}
            <TouchableOpacity
              style={[
                styles.ddayBadge,
                theme.task.item.postItStyle ? {
                  // 노트북 테마: 태그/포스트잇 스타일
                  backgroundColor: isDark ? '#4A3A20' : '#FBF0C4',
                  borderRadius: theme.task.badge.borderRadius,
                  borderLeftWidth: 3,
                  borderLeftColor: isDark ? '#D4A84A' : '#C4A040',
                  shadowColor: '#000',
                  shadowOffset: {width: 1, height: 1},
                  shadowOpacity: isDark ? 0.3 : 0.15,
                  shadowRadius: 2,
                  elevation: 2,
                } : {
                  // 기본 테마: 모던 스타일
                  backgroundColor: warningColor + '15',
                  borderRadius: theme.task.badge.borderRadius,
                  borderWidth: 1,
                  borderColor: warningColor + '30',
                },
              ]}
              onPress={() => {
                // ddays에서 primary D-day 찾기
                const primaryDday = ddays.find(d => d.isPrimary) || ddays[0];
                if (primaryDday) {
                  setEditingDdayId(primaryDday.id);
                  setDdayTitle(primaryDday.title);
                  setDdayDate(new Date(primaryDday.targetDate));
                } else {
                  setEditingDdayId(null);
                  setDdayTitle('');
                  setDdayDate(new Date());
                }
                setShowDdayModal(true);
              }}>
              {dday && ddayRemaining !== null ? (
                <>
                  <Text style={[
                    styles.ddayTitle,
                    {color: theme.task.item.postItStyle ? (isDark ? '#D4A84A' : '#8B7355') : warningColor},
                  ]}>
                    {dday.title}
                  </Text>
                  <Text style={[
                    styles.ddayCount,
                    {color: theme.task.item.postItStyle ? (isDark ? '#E8C060' : '#5C4A3D') : warningColor},
                  ]}>
                    D{ddayRemaining > 0 ? `-${ddayRemaining}` : ddayRemaining === 0 ? '-Day' : `+${Math.abs(ddayRemaining)}`}
                  </Text>
                </>
              ) : (
                <Text style={[
                  styles.ddayPlaceholder,
                  {color: theme.task.item.postItStyle ? (isDark ? '#8B7355' : '#8B7355') : subtextColor},
                ]}>
                  + D-day
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* ===== 탭 바 ===== */}
          <View style={[styles.tabBar, {backgroundColor: cardBg, borderBottomColor: dividerColor}]}>
            {[
              {id: 'plan' as TabType, icon: 'document-text', label: '할 일'},
              {id: 'timetable' as TabType, icon: 'grid', label: '시간표'},
              {id: 'focus' as TabType, icon: 'timer', label: '집중'},
              {id: 'stats' as TabType, icon: 'stats-chart', label: '통계'},
              {id: 'report' as TabType, icon: 'analytics', label: '리포트'},
            ].map(tab => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tabItem,
                  selectedTab === tab.id && styles.tabItemActive,
                  selectedTab === tab.id && {borderBottomColor: accentColor},
                ]}
                onPress={() => setSelectedTab(tab.id)}>
                <Icon
                  name={tab.icon as any}
                  size={iconSize(20)}
                  color={selectedTab === tab.id ? accentColor : subtextColor}
                />
                <Text style={[
                  styles.tabLabel,
                  {color: subtextColor},
                  selectedTab === tab.id && {color: accentColor, fontWeight: '700'},
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ===== 탭 콘텐츠 ===== */}
          {selectedTab === 'plan' && renderPlanTab()}
          {selectedTab === 'timetable' && renderTimetableTab()}
          {selectedTab === 'focus' && renderFocusTab()}
          {selectedTab === 'stats' && renderStatsTab()}
          {selectedTab === 'report' && (
            <ScrollView
              style={styles.tabContent}
              contentContainerStyle={{paddingBottom: 120}}
              showsVerticalScrollIndicator={false}>
              <StudyReport theme={theme} isDark={isDark} />
            </ScrollView>
          )}

        </KeyboardAvoidingView>

        {/* ===== 캘린더 모달 ===== */}
        <Modal
          visible={showCalendarModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCalendarModal(false)}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowCalendarModal(false)}>
            <TouchableOpacity activeOpacity={1} style={[styles.calendarModalContent, {backgroundColor: cardBg}]}>
              {/* 캘린더 헤더 */}
              <View style={styles.calendarHeader}>
                <TouchableOpacity
                  onPress={() => {
                    const newMonth = new Date(calendarMonth);
                    newMonth.setMonth(newMonth.getMonth() - 1);
                    setCalendarMonth(newMonth);
                  }}>
                  <Icon name="chevron-back" size={iconSize(24)} color={textColor} />
                </TouchableOpacity>
                <Text style={[styles.calendarTitle, {color: textColor}]}>
                  {calendarMonth.getFullYear()}년 {calendarMonth.getMonth() + 1}월
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    const newMonth = new Date(calendarMonth);
                    newMonth.setMonth(newMonth.getMonth() + 1);
                    setCalendarMonth(newMonth);
                  }}>
                  <Icon name="chevron-forward" size={iconSize(24)} color={textColor} />
                </TouchableOpacity>
              </View>

              {/* 요일 헤더 */}
              <View style={styles.weekDaysRow}>
                {WEEKDAYS.map((day, index) => (
                  <View key={index} style={styles.weekDayCell}>
                    <Text style={[
                      styles.weekDayText,
                      {color: subtextColor},
                      index === 0 && {color: sundayColor},
                      index === 6 && {color: saturdayColor},
                    ]}>
                      {day}
                    </Text>
                  </View>
                ))}
              </View>

              {/* 날짜 그리드 */}
              <View style={styles.daysGrid}>
                {daysInMonth.map((dayInfo, index) => {
                  const {date, isCurrentMonth} = dayInfo;
                  const isSelected = isSameDay(date, selectedDate);
                  const isTodayD = isTodayDate(date);
                  const hasRecord = isCurrentMonth && hasStudyRecord(date);

                  return (
                    <TouchableOpacity
                      key={index}
                      style={styles.dayCell}
                      onPress={() => {
                        setSelectedDate(date);
                        setShowCalendarModal(false);
                      }}>
                      <View style={[
                        styles.dayTextContainer,
                        isSelected && {backgroundColor: accentColor},
                      ]}>
                        <Text style={[
                          styles.dayText,
                          {color: textColor},
                          !isCurrentMonth && {color: dividerColor},
                          isSelected && {color: '#FFFFFF', fontWeight: '700'},
                          isTodayD && !isSelected && {color: accentColor, fontWeight: '700'},
                        ]}>
                          {date.getDate()}
                        </Text>
                      </View>
                      {hasRecord && !isSelected && (
                        <View style={[styles.eventDot, {backgroundColor: successColor}]} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* ===== D-day 모달 (스텝 기반) ===== */}
        <Modal
          visible={showDdayModal}
          transparent
          animationType="fade"
          onRequestClose={() => {
            if (ddayStep === 'calendar') {
              setDdayStep('form');
            } else {
              setShowDdayModal(false);
              setDdayStep('form');
            }
          }}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => {
              if (ddayStep === 'calendar') {
                setDdayStep('form');
              } else {
                setShowDdayModal(false);
                setDdayStep('form');
              }
            }}>
            <TouchableOpacity activeOpacity={1} style={[styles.ddayModalContent, {backgroundColor: cardBg}]}>
              {ddayStep === 'form' ? (
                <>
                  <Text style={[styles.modalTitle, {color: textColor}]}>D-day 설정</Text>

                  <TextInput
                    style={[styles.ddayInput, {color: textColor, borderColor: dividerColor}]}
                    placeholder="제목 (예: 수능, 기말고사)"
                    placeholderTextColor={subtextColor}
                    value={ddayTitle}
                    onChangeText={setDdayTitle}
                  />

                  <TouchableOpacity
                    style={[styles.ddayDatePicker, {borderColor: dividerColor}]}
                    onPress={() => {
                      setDdayCalendarMonth(ddayDate);
                      setDdayStep('calendar');
                    }}>
                    <Icon name="calendar" size={iconSize(20)} color={accentColor} />
                    <Text style={[styles.ddayDateText, {color: textColor}]}>
                      {formatDate(ddayDate)}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.ddayButtons}>
                    {editingDdayId && (
                      <TouchableOpacity
                        style={[styles.ddayButton, {backgroundColor: '#FF3B30'}]}
                        onPress={handleDeleteDday}>
                        <Text style={styles.ddayButtonText}>삭제</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.ddayButton, {backgroundColor: dividerColor}]}
                      onPress={() => {
                        setShowDdayModal(false);
                        setDdayStep('form');
                        setEditingDdayId(null);
                        setDdayTitle('');
                        setDdayDate(new Date());
                      }}>
                      <Text style={[styles.ddayButtonTextDark, {color: textColor}]}>취소</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.ddayButton, {backgroundColor: accentColor}]}
                      onPress={handleSaveDday}>
                      <Text style={styles.ddayButtonText}>저장</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  {/* 캘린더 화면 */}
                  <View style={styles.calendarHeader}>
                    <TouchableOpacity
                      onPress={() => {
                        const newMonth = new Date(ddayCalendarMonth);
                        newMonth.setMonth(newMonth.getMonth() - 1);
                        setDdayCalendarMonth(newMonth);
                      }}>
                      <Icon name="chevron-back" size={iconSize(24)} color={textColor} />
                    </TouchableOpacity>
                    <Text style={[styles.calendarTitle, {color: textColor}]}>
                      {ddayCalendarMonth.getFullYear()}년 {ddayCalendarMonth.getMonth() + 1}월
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        const newMonth = new Date(ddayCalendarMonth);
                        newMonth.setMonth(newMonth.getMonth() + 1);
                        setDdayCalendarMonth(newMonth);
                      }}>
                      <Icon name="chevron-forward" size={iconSize(24)} color={textColor} />
                    </TouchableOpacity>
                  </View>

                  {/* 요일 헤더 */}
                  <View style={styles.weekDaysRow}>
                    {WEEKDAYS.map((day, index) => (
                      <View key={index} style={styles.weekDayCell}>
                        <Text style={[
                          styles.weekDayText,
                          {color: subtextColor},
                          index === 0 && {color: sundayColor},
                          index === 6 && {color: saturdayColor},
                        ]}>
                          {day}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* 날짜 그리드 */}
                  <View style={styles.daysGrid}>
                    {(() => {
                      const year = ddayCalendarMonth.getFullYear();
                      const month = ddayCalendarMonth.getMonth();
                      const firstDay = new Date(year, month, 1);
                      const lastDay = new Date(year, month + 1, 0);
                      const daysArray: {date: Date; isCurrentMonth: boolean}[] = [];

                      // 이전 달 날짜들
                      const startDayOfWeek = firstDay.getDay();
                      for (let i = startDayOfWeek - 1; i >= 0; i--) {
                        const date = new Date(year, month, -i);
                        daysArray.push({date, isCurrentMonth: false});
                      }

                      // 현재 달 날짜들
                      for (let day = 1; day <= lastDay.getDate(); day++) {
                        daysArray.push({date: new Date(year, month, day), isCurrentMonth: true});
                      }

                      // 다음 달 날짜들
                      const endDayOfWeek = lastDay.getDay();
                      for (let i = 1; i < 7 - endDayOfWeek; i++) {
                        const date = new Date(year, month + 1, i);
                        daysArray.push({date, isCurrentMonth: false});
                      }

                      return daysArray.map((dayInfo, index) => {
                        const {date, isCurrentMonth} = dayInfo;
                        const isSelected = isSameDay(date, ddayDate);
                        const isTodayD = isTodayDate(date);

                        return (
                          <TouchableOpacity
                            key={index}
                            style={styles.dayCell}
                            onPress={() => {
                              setDdayDate(date);
                              setDdayStep('form');
                            }}>
                            <View style={[
                              styles.dayTextContainer,
                              isSelected && {backgroundColor: accentColor},
                            ]}>
                              <Text style={[
                                styles.dayText,
                                {color: textColor},
                                !isCurrentMonth && {color: dividerColor},
                                isSelected && {color: '#FFFFFF', fontWeight: '700'},
                                isTodayD && !isSelected && {color: accentColor, fontWeight: '700'},
                              ]}>
                                {date.getDate()}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      });
                    })()}
                  </View>

                </>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* ===== 장기 목표 추가/수정 모달 (주간/월간/연간) ===== */}
        <Modal
          visible={showLongTermGoalModal}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setEditingGoalId(null);
            setGoalContent('');
            setShowLongTermGoalModal(false);
          }}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => {
              setEditingGoalId(null);
              setGoalContent('');
              setShowLongTermGoalModal(false);
            }}>
            <TouchableOpacity activeOpacity={1} style={[styles.goalModal, {backgroundColor: cardBg}]}>
              <Text style={[styles.modalTitle, {color: textColor}]}>
                {editingGoalId ? '목표 수정' : '목표 추가'}
              </Text>

              {/* 기간 선택 (수정 모드에서는 비활성화) */}
              {!editingGoalId && (
                <View style={styles.goalPeriodSelector}>
                  {(['weekly', 'monthly', 'yearly'] as const).map((period) => (
                    <TouchableOpacity
                      key={period}
                      style={[
                        styles.goalPeriodButton,
                        selectedGoalPeriod === period && {backgroundColor: accentColor},
                        {borderColor: dividerColor},
                      ]}
                      onPress={() => setSelectedGoalPeriod(period)}>
                      <Text style={[
                        styles.goalPeriodText,
                        {color: selectedGoalPeriod === period ? '#fff' : textColor},
                      ]}>
                        {period === 'weekly' ? '주간' : period === 'monthly' ? '월간' : '연간'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* 목표 입력 */}
              <TextInput
                style={[styles.goalContentInput, {color: textColor, borderColor: dividerColor, backgroundColor: isDark ? '#2A2A2E' : '#F8F8F8'}]}
                placeholder="목표를 입력하세요..."
                placeholderTextColor={subtextColor}
                value={goalContent}
                onChangeText={setGoalContent}
                multiline
                autoFocus
              />

              <View style={styles.goalModalButtons}>
                <TouchableOpacity
                  style={[styles.goalModalButton, {backgroundColor: dividerColor}]}
                  onPress={() => {
                    setGoalContent('');
                    setEditingGoalId(null);
                    setShowLongTermGoalModal(false);
                  }}>
                  <Text style={[styles.goalModalButtonText, {color: textColor}]}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.goalModalButton, {backgroundColor: accentColor}]}
                  onPress={handleSaveGoal}>
                  <Text style={[styles.goalModalButtonText, {color: '#fff'}]}>저장</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* ===== 스토리 카드 모달 ===== */}
        <Modal
          visible={showStoryCard}
          transparent
          animationType="fade"
          onRequestClose={() => setShowStoryCard(false)}>
          <StudyStoryCard
            isDark={isDark}
            selectedDate={selectedDate}
            totalStudyTime={selectedStats.totalMinutes}
            studyCount={selectedStats.sessions}
            onClose={() => setShowStoryCard(false)}
          />
        </Modal>

        {/* ===== 집중 탭 도움말 모달 ===== */}
        <Modal
          visible={showFocusHelpModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowFocusHelpModal(false)}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowFocusHelpModal(false)}>
            <TouchableOpacity activeOpacity={1} style={[styles.focusHelpModal, {backgroundColor: cardBg}]}>
              <Text style={[styles.focusHelpTitle, {color: textColor}]}>집중 기록 안내</Text>

              <View style={styles.focusHelpItem}>
                <View style={[styles.focusHelpItemIcon, {backgroundColor: accentColor + '20'}]}>
                  <Icon name="timer" size={iconSize(18)} color={accentColor} />
                </View>
                <View style={styles.focusHelpItemContent}>
                  <Text style={[styles.focusHelpItemTitle, {color: textColor}]}>집중 세션</Text>
                  <Text style={[styles.focusHelpItemDesc, {color: subtextColor}]}>
                    뽀모도로 타이머의 집중 모드로 기록한 시간이에요. 자유 모드는 기록되지 않습니다.
                  </Text>
                </View>
              </View>

              <View style={styles.focusHelpItem}>
                <View style={[styles.focusHelpItemIcon, {backgroundColor: successColor + '20'}]}>
                  <Icon name="checkmark-circle" size={iconSize(18)} color={successColor} />
                </View>
                <View style={styles.focusHelpItemContent}>
                  <Text style={[styles.focusHelpItemTitle, {color: textColor}]}>완료 세션</Text>
                  <Text style={[styles.focusHelpItemDesc, {color: subtextColor}]}>
                    설정한 시간을 끝까지 완료한 세션이에요. 중간에 중단하면 "중단"으로 표시됩니다.
                  </Text>
                </View>
              </View>

              <View style={[styles.focusHelpItem, {marginBottom: 0}]}>
                <View style={[styles.focusHelpItemIcon, {backgroundColor: '#87CEEB20'}]}>
                  <Icon name="cafe" size={iconSize(18)} color="#5B9BD5" />
                </View>
                <View style={styles.focusHelpItemContent}>
                  <Text style={[styles.focusHelpItemTitle, {color: textColor}]}>휴식 세션</Text>
                  <Text style={[styles.focusHelpItemDesc, {color: subtextColor}]}>
                    집중 후 휴식 모드로 쉰 시간이에요. 적절한 휴식으로 다음 집중을 준비하세요!
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.focusHelpCloseButton, {backgroundColor: accentColor}]}
                onPress={() => setShowFocusHelpModal(false)}>
                <Text style={styles.focusHelpCloseText}>확인</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* ===== 통계 탭 도움말 모달 ===== */}
        <Modal
          visible={showStatsHelpModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowStatsHelpModal(false)}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowStatsHelpModal(false)}>
            <View style={[styles.focusHelpModal, {backgroundColor: cardBg, maxHeight: '85%'}]}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={[styles.focusHelpTitle, {color: textColor}]}>통계 가이드</Text>

                <View style={styles.focusHelpItem}>
                  <View style={[styles.focusHelpItemIcon, {backgroundColor: accentColor + '20'}]}>
                    <Icon name="time" size={iconSize(18)} color={accentColor} />
                  </View>
                  <View style={styles.focusHelpItemContent}>
                    <Text style={[styles.focusHelpItemTitle, {color: textColor}]}>오늘의 공부</Text>
                    <Text style={[styles.focusHelpItemDesc, {color: subtextColor}]}>
                      선택한 날짜의 총 공부 시간과 집중 세션 횟수를 보여줘요. 시간표에 입력한 시간이 합산됩니다.
                    </Text>
                  </View>
                </View>

                <View style={styles.focusHelpItem}>
                  <View style={[styles.focusHelpItemIcon, {backgroundColor: successColor + '20'}]}>
                    <Icon name="calendar" size={iconSize(18)} color={successColor} />
                  </View>
                  <View style={styles.focusHelpItemContent}>
                    <Text style={[styles.focusHelpItemTitle, {color: textColor}]}>기간별 통계</Text>
                    <Text style={[styles.focusHelpItemDesc, {color: subtextColor}]}>
                      이번 주, 이번 달, 전체 누적 공부 시간을 한눈에 확인해요. 기간 선택으로 원하는 기간의 통계도 볼 수 있어요.
                    </Text>
                  </View>
                </View>

                <View style={styles.focusHelpItem}>
                  <View style={[styles.focusHelpItemIcon, {backgroundColor: warningColor + '20'}]}>
                    <Icon name="flame" size={iconSize(18)} color={warningColor} />
                  </View>
                  <View style={styles.focusHelpItemContent}>
                    <Text style={[styles.focusHelpItemTitle, {color: textColor}]}>연속 기록</Text>
                    <Text style={[styles.focusHelpItemDesc, {color: subtextColor}]}>
                      매일 공부한 연속 일수예요. 하루라도 공부하면 연속 기록이 이어집니다. 최고 기록에 도전해보세요!
                    </Text>
                  </View>
                </View>

                <View style={styles.focusHelpItem}>
                  <View style={[styles.focusHelpItemIcon, {backgroundColor: '#FFD70020'}]}>
                    <Icon name="pie-chart" size={iconSize(18)} color="#E6A700" />
                  </View>
                  <View style={styles.focusHelpItemContent}>
                    <Text style={[styles.focusHelpItemTitle, {color: textColor}]}>과목별 시간</Text>
                    <Text style={[styles.focusHelpItemDesc, {color: subtextColor}]}>
                      각 과목에 얼마나 시간을 투자했는지 보여줘요. 원형 차트로 비율을 시각적으로 확인할 수 있어요.
                    </Text>
                  </View>
                </View>

                <View style={styles.focusHelpItem}>
                  <View style={[styles.focusHelpItemIcon, {backgroundColor: errorColor + '20'}]}>
                    <Icon name="heart" size={iconSize(18)} color={errorColor} />
                  </View>
                  <View style={styles.focusHelpItemContent}>
                    <Text style={[styles.focusHelpItemTitle, {color: textColor}]}>오늘의 기록</Text>
                    <Text style={[styles.focusHelpItemDesc, {color: subtextColor}]}>
                      할 일 탭에서 작성한 다짐, 할 일, 메모를 모아서 보여줘요. 하루를 정리하고 돌아보기 좋아요.
                    </Text>
                  </View>
                </View>

                <View style={[styles.focusHelpItem, {marginBottom: 0}]}>
                  <View style={[styles.focusHelpItemIcon, {backgroundColor: '#DDA0DD20'}]}>
                    <Icon name="document-text" size={iconSize(18)} color="#9B6B9E" />
                  </View>
                  <View style={styles.focusHelpItemContent}>
                    <Text style={[styles.focusHelpItemTitle, {color: textColor}]}>공부 메모</Text>
                    <Text style={[styles.focusHelpItemDesc, {color: subtextColor}]}>
                      시간표에서 각 시간 블록에 남긴 메모들이에요. 무엇을 공부했는지 기록하고 복습할 때 활용하세요.
                    </Text>
                  </View>
                </View>

              </ScrollView>
              <TouchableOpacity
                style={[styles.focusHelpCloseButton, {backgroundColor: accentColor}]}
                onPress={() => setShowStatsHelpModal(false)}>
                <Text style={styles.focusHelpCloseText}>확인</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* ===== 시간표 탭 도움말 모달 ===== */}
        <Modal
          visible={showTimetableHelpModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowTimetableHelpModal(false)}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowTimetableHelpModal(false)}>
            <View style={[styles.focusHelpModal, {backgroundColor: cardBg, maxHeight: '85%'}]}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={[styles.focusHelpTitle, {color: textColor}]}>시간표 사용법</Text>

                <View style={styles.focusHelpItem}>
                  <View style={[styles.focusHelpItemIcon, {backgroundColor: accentColor + '20'}]}>
                    <Icon name="grid" size={iconSize(18)} color={accentColor} />
                  </View>
                  <View style={styles.focusHelpItemContent}>
                    <Text style={[styles.focusHelpItemTitle, {color: textColor}]}>텐미닛 플래너</Text>
                    <Text style={[styles.focusHelpItemDesc, {color: subtextColor}]}>
                      10분 단위로 공부 시간을 기록해요. 과목을 선택하고 블록을 터치하면 색칠됩니다.
                    </Text>
                  </View>
                </View>

                <View style={styles.focusHelpItem}>
                  <View style={[styles.focusHelpItemIcon, {backgroundColor: successColor + '20'}]}>
                    <Icon name="checkmark-circle" size={iconSize(18)} color={successColor} />
                  </View>
                  <View style={styles.focusHelpItemContent}>
                    <Text style={[styles.focusHelpItemTitle, {color: textColor}]}>완료 표시</Text>
                    <Text style={[styles.focusHelpItemDesc, {color: subtextColor}]}>
                      블록을 터치해서 선택한 뒤, 완료 버튼을 눌러 실제로 공부했는지 표시해요. 완료된 블록은 진하게, 미완료는 흐리게 보여요.
                    </Text>
                  </View>
                </View>

                <View style={styles.focusHelpItem}>
                  <View style={[styles.focusHelpItemIcon, {backgroundColor: '#DDA0DD20'}]}>
                    <Icon name="document-text" size={iconSize(18)} color="#9B6B9E" />
                  </View>
                  <View style={styles.focusHelpItemContent}>
                    <Text style={[styles.focusHelpItemTitle, {color: textColor}]}>블록 메모</Text>
                    <Text style={[styles.focusHelpItemDesc, {color: subtextColor}]}>
                      블록을 선택하면 메모를 남길 수 있어요. 메모가 있는 블록은 점으로 표시됩니다.
                    </Text>
                  </View>
                </View>

                <View style={styles.focusHelpItem}>
                  <View style={[styles.focusHelpItemIcon, {backgroundColor: warningColor + '20'}]}>
                    <Icon name="color-palette" size={iconSize(18)} color={warningColor} />
                  </View>
                  <View style={styles.focusHelpItemContent}>
                    <Text style={[styles.focusHelpItemTitle, {color: textColor}]}>과목 관리</Text>
                    <Text style={[styles.focusHelpItemDesc, {color: subtextColor}]}>
                      +추가 버튼으로 새 과목을 만들고, 과목을 선택하면 수정/삭제 버튼이 나타나요.
                    </Text>
                  </View>
                </View>

                <View style={styles.focusHelpItem}>
                  <View style={[styles.focusHelpItemIcon, {backgroundColor: '#87CEEB20'}]}>
                    <Icon name="time" size={iconSize(18)} color="#5B9BD5" />
                  </View>
                  <View style={styles.focusHelpItemContent}>
                    <Text style={[styles.focusHelpItemTitle, {color: textColor}]}>시작 시간</Text>
                    <Text style={[styles.focusHelpItemDesc, {color: subtextColor}]}>
                      설정 버튼에서 플래너 시작 시간을 변경할 수 있어요.
                    </Text>
                  </View>
                </View>

                <View style={styles.focusHelpItem}>
                  <View style={[styles.focusHelpItemIcon, {backgroundColor: '#6B8E2320'}]}>
                    <Icon name="bookmark" size={iconSize(18)} color="#6B8E23" />
                  </View>
                  <View style={styles.focusHelpItemContent}>
                    <Text style={[styles.focusHelpItemTitle, {color: textColor}]}>시간표 템플릿</Text>
                    <Text style={[styles.focusHelpItemDesc, {color: subtextColor}]}>
                      설정 버튼에서 자주 쓰는 시간표를 저장하고 불러올 수 있어요.
                    </Text>
                  </View>
                </View>

                <View style={[styles.focusHelpItem, {marginBottom: 0}]}>
                  <View style={[styles.focusHelpItemIcon, {backgroundColor: '#4682B420'}]}>
                    <Icon name="calendar" size={iconSize(18)} color="#4682B4" />
                  </View>
                  <View style={styles.focusHelpItemContent}>
                    <Text style={[styles.focusHelpItemTitle, {color: textColor}]}>요일별 시간표</Text>
                    <Text style={[styles.focusHelpItemDesc, {color: subtextColor}]}>
                      월~일 각 요일마다 다른 시간표를 설정할 수 있어요. "자동 적용"을 켜면 해당 요일에 시간표가 없을 때 자동으로 적용됩니다.
                    </Text>
                  </View>
                </View>

              </ScrollView>
              <TouchableOpacity
                style={[styles.focusHelpCloseButton, {backgroundColor: accentColor}]}
                onPress={() => setShowTimetableHelpModal(false)}>
                <Text style={styles.focusHelpCloseText}>확인</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* ===== 시간표 설정 모달 ===== */}
        <Modal
          visible={showTimetableSettingsModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowTimetableSettingsModal(false)}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowTimetableSettingsModal(false)}>
            <TouchableOpacity activeOpacity={1} style={[styles.goalModal, {backgroundColor: cardBg}]}>
              <Text style={[styles.goalModalTitle, {color: textColor}]}>시간표 설정</Text>

              {/* 시작 시간 설정 */}
              <TouchableOpacity
                style={[styles.focusHelpItem, {marginBottom: hp(16)}]}
                onPress={() => {
                  setShowTimetableSettingsModal(false);
                  setTempStartHour(plannerStartHour);
                  setShowPlannerTimeModal(true);
                }}>
                <View style={[styles.focusHelpItemIcon, {backgroundColor: '#87CEEB20'}]}>
                  <Icon name="time" size={iconSize(18)} color="#5B9BD5" />
                </View>
                <View style={[styles.focusHelpItemContent, {flex: 1}]}>
                  <Text style={[styles.focusHelpItemTitle, {color: textColor}]}>시작 시간 설정</Text>
                  <Text style={[styles.focusHelpItemDesc, {color: subtextColor}]}>
                    현재: {plannerStartHour}시부터 시작
                  </Text>
                </View>
                <Icon name="chevron-forward" size={iconSize(18)} color={subtextColor} />
              </TouchableOpacity>

              {/* 시간표 템플릿 */}
              <TouchableOpacity
                style={[styles.focusHelpItem, {marginBottom: 0}]}
                onPress={() => {
                  setShowTimetableSettingsModal(false);
                  setShowTemplateModal(true);
                }}>
                <View style={[styles.focusHelpItemIcon, {backgroundColor: '#6B8E2320'}]}>
                  <Icon name="bookmark" size={iconSize(18)} color="#6B8E23" />
                </View>
                <View style={[styles.focusHelpItemContent, {flex: 1}]}>
                  <Text style={[styles.focusHelpItemTitle, {color: textColor}]}>시간표 템플릿</Text>
                  <Text style={[styles.focusHelpItemDesc, {color: subtextColor}]}>
                    자주 쓰는 시간표 저장/불러오기
                  </Text>
                </View>
                <Icon name="chevron-forward" size={iconSize(18)} color={subtextColor} />
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: dividerColor,
                  paddingVertical: hp(14),
                  borderRadius: sp(12),
                  alignItems: 'center',
                  marginTop: hp(24),
                }}
                onPress={() => setShowTimetableSettingsModal(false)}>
                <Text style={{color: textColor, fontSize: fp(15), fontWeight: '600'}}>닫기</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* ===== 시간표 템플릿 모달 ===== */}
        <Modal
          visible={showTemplateModal}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setShowTemplateModal(false);
            if (isTemplateModalForWeekly) {
              setIsTemplateModalForWeekly(false);
              setSelectedDayForTemplate(null);
              setTimeout(() => setShowWeeklyModal(true), 300);
            }
          }}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => {
              setShowTemplateModal(false);
              if (isTemplateModalForWeekly) {
                setIsTemplateModalForWeekly(false);
                setSelectedDayForTemplate(null);
                setTimeout(() => setShowWeeklyModal(true), 300);
              }
            }}>
            <TouchableOpacity activeOpacity={1} style={[styles.goalModal, {backgroundColor: cardBg, maxHeight: '75%'}]}>
              <Text style={[styles.goalModalTitle, {color: textColor}]}>시간표 템플릿</Text>
              <Text style={[styles.goalModalDesc, {color: subtextColor}]}>
                자주 사용하는 시간표를 저장하고 불러와요
              </Text>

              {/* 현재 시간표 저장 */}
              <View style={{flexDirection: 'row', gap: sp(8), marginBottom: hp(16)}}>
                <TextInput
                  style={{
                    flex: 1,
                    color: textColor,
                    borderColor: dividerColor,
                    borderWidth: 1,
                    borderRadius: sp(12),
                    paddingHorizontal: sp(16),
                    paddingVertical: hp(12),
                    fontSize: fp(14),
                  }}
                  placeholder="템플릿 이름"
                  placeholderTextColor={subtextColor}
                  value={templateName}
                  onChangeText={setTemplateName}
                />
                <TouchableOpacity
                  style={[styles.goalModalButton, {backgroundColor: '#6B8E23', flex: 0, paddingHorizontal: sp(16)}]}
                  onPress={() => {
                    if (!templateName.trim()) {
                      Alert.alert('알림', '템플릿 이름을 입력해주세요.');
                      return;
                    }
                    const todayBlocks = timeBlocks.filter(b => b.date === getDateString(selectedDate));
                    if (todayBlocks.length === 0) {
                      Alert.alert('알림', '저장할 시간표 블록이 없습니다.');
                      return;
                    }
                    saveAsTemplate(templateName.trim());
                    setTemplateName('');
                    Alert.alert('완료', '템플릿이 저장되었습니다.');
                  }}>
                  <Text style={[styles.goalModalButtonText, {color: '#FFFFFF'}]}>저장</Text>
                </TouchableOpacity>
              </View>

              {/* 템플릿 목록 */}
              <ScrollView style={{maxHeight: hp(280)}} showsVerticalScrollIndicator={false}>
                {timetableTemplates.length === 0 ? (
                  <View style={{alignItems: 'center', paddingVertical: hp(24)}}>
                    <Icon name="bookmark-outline" size={iconSize(32)} color={subtextColor} />
                    <Text style={[{color: subtextColor, marginTop: hp(8), fontSize: fp(13)}]}>
                      저장된 템플릿이 없어요
                    </Text>
                  </View>
                ) : (
                  timetableTemplates.map((template) => (
                    <View
                      key={template.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: hp(12),
                        borderBottomWidth: 1,
                        borderBottomColor: dividerColor,
                      }}>
                      <View style={{flex: 1}}>
                        <Text style={[{color: textColor, fontSize: fp(14), fontWeight: '600'}]}>
                          {template.name}
                        </Text>
                        <Text style={[{color: subtextColor, fontSize: fp(11), marginTop: hp(2)}]}>
                          {template.blocks.length}개 블록
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={{padding: sp(8)}}
                        onPress={() => {
                          if (isTemplateModalForWeekly && selectedDayForTemplate !== null) {
                            // 주간 시간표 모드: 선택한 요일에 템플릿 매핑 저장
                            Alert.alert(
                              '템플릿 저장',
                              `"${template.name}" 템플릿을 ${['일', '월', '화', '수', '목', '금', '토'][selectedDayForTemplate]}요일에 설정할까요?`,
                              [
                                {text: '취소', style: 'cancel'},
                                {
                                  text: '저장',
                                  onPress: () => {
                                    setWeeklyTemplateMapping(selectedDayForTemplate, template.id);
                                    setShowTemplateModal(false);
                                    setIsTemplateModalForWeekly(false);
                                    setSelectedDayForTemplate(null);
                                    setTimeout(() => setShowWeeklyModal(true), 300);
                                  },
                                },
                              ]
                            );
                          } else {
                            // 일반 모드: 템플릿 불러오기
                            Alert.alert(
                              '템플릿 불러오기',
                              `"${template.name}" 템플릿을 불러올까요?\n현재 날짜의 시간표가 교체됩니다.`,
                              [
                                {text: '취소', style: 'cancel'},
                                {
                                  text: '불러오기',
                                  onPress: () => {
                                    loadTemplate(template.id, getDateString(selectedDate));
                                    setShowTemplateModal(false);
                                    Alert.alert('완료', '템플릿을 불러왔습니다.');
                                  },
                                },
                              ]
                            );
                          }
                        }}>
                        <Icon
                          name={isTemplateModalForWeekly ? 'save-outline' : 'download-outline'}
                          size={iconSize(20)}
                          color={accentColor}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{padding: sp(8)}}
                        onPress={() => {
                          Alert.alert(
                            '템플릿 삭제',
                            `"${template.name}" 템플릿을 삭제할까요?`,
                            [
                              {text: '취소', style: 'cancel'},
                              {
                                text: '삭제',
                                style: 'destructive',
                                onPress: () => deleteTemplate(template.id),
                              },
                            ]
                          );
                        }}>
                        <Icon name="trash-outline" size={iconSize(20)} color="#FF6B6B" />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </ScrollView>

              <TouchableOpacity
                style={[styles.focusHelpCloseButton, {backgroundColor: accentColor, marginTop: hp(16)}]}
                onPress={() => {
                  setShowTemplateModal(false);
                  if (isTemplateModalForWeekly) {
                    setIsTemplateModalForWeekly(false);
                    setSelectedDayForTemplate(null);
                    setTimeout(() => setShowWeeklyModal(true), 300);
                  }
                }}>
                <Text style={styles.focusHelpCloseText}>닫기</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* ===== 요일별 시간표 모달 ===== */}
        <Modal
          visible={showWeeklyModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowWeeklyModal(false)}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowWeeklyModal(false)}>
            <TouchableOpacity activeOpacity={1} style={[styles.goalModal, {backgroundColor: cardBg}]}>
              <Text style={[styles.goalModalTitle, {color: textColor}]}>요일별 시간표</Text>
              <Text style={[styles.goalModalDesc, {color: subtextColor}]}>
                각 요일에 적용할 템플릿을 설정하세요
              </Text>

              {/* 자동 적용 토글 */}
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: hp(12),
                  borderBottomWidth: 1,
                  borderBottomColor: dividerColor,
                  marginBottom: hp(12),
                }}
                onPress={() => setWeeklyTimetableEnabled(!weeklyTimetableEnabled)}>
                <View style={{flex: 1, marginRight: sp(12)}}>
                  <Text style={[{color: textColor, fontSize: fp(14), fontWeight: '600'}]}>자동 적용</Text>
                  <Text style={[{color: subtextColor, fontSize: fp(11)}]}>
                    켜면 매일 앱 실행시 해당 요일 템플릿이 자동으로 불러와져요
                  </Text>
                </View>
                <View
                  style={{
                    width: sp(48),
                    height: sp(28),
                    borderRadius: sp(14),
                    backgroundColor: weeklyTimetableEnabled ? '#4682B4' : dividerColor,
                    justifyContent: 'center',
                    paddingHorizontal: sp(2),
                  }}>
                  <View
                    style={{
                      width: sp(24),
                      height: sp(24),
                      borderRadius: sp(12),
                      backgroundColor: '#FFFFFF',
                      alignSelf: weeklyTimetableEnabled ? 'flex-end' : 'flex-start',
                    }}
                  />
                </View>
              </TouchableOpacity>

              {/* 요일별 템플릿 설정 */}
              <ScrollView style={{maxHeight: hp(320)}} showsVerticalScrollIndicator={false}>
                {WEEKDAYS.map((dayName, dayIndex) => {
                  const mappedTemplateId = weeklyTemplateMapping[dayIndex as DayOfWeek];
                  const mappedTemplate = mappedTemplateId
                    ? timetableTemplates.find(t => t.id === mappedTemplateId)
                    : null;
                  const isWeekend = dayIndex === 0 || dayIndex === 6;

                  return (
                    <View
                      key={dayIndex}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: hp(10),
                        borderBottomWidth: 1,
                        borderBottomColor: dividerColor,
                      }}>
                      <View style={{
                        width: sp(32),
                        height: sp(32),
                        borderRadius: sp(16),
                        backgroundColor: isWeekend ? '#FF6B6B20' : '#4682B420',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: sp(12),
                      }}>
                        <Text style={{
                          color: isWeekend ? '#FF6B6B' : '#4682B4',
                          fontSize: fp(14),
                          fontWeight: '700',
                        }}>
                          {dayName}
                        </Text>
                      </View>
                      <View style={{flex: 1}}>
                        {mappedTemplate ? (
                          <Text style={{color: textColor, fontSize: fp(13), fontWeight: '500'}}>
                            {mappedTemplate.name}
                          </Text>
                        ) : (
                          <Text style={{color: subtextColor, fontSize: fp(13)}}>
                            템플릿 미설정
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        style={{
                          padding: sp(8),
                        }}
                        onPress={() => {
                          setSelectedDayForTemplate(dayIndex as DayOfWeek);
                          setIsTemplateModalForWeekly(true);
                          setShowWeeklyModal(false);
                          setTimeout(() => {
                            setShowTemplateModal(true);
                          }, 300);
                        }}>
                        <Icon name="create-outline" size={iconSize(18)} color={accentColor} />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </ScrollView>

              <View style={{gap: hp(8), marginTop: hp(16)}}>
                <TouchableOpacity
                  style={[styles.focusHelpCloseButton, {backgroundColor: accentColor}]}
                  onPress={() => setShowWeeklyModal(false)}>
                  <Text style={styles.focusHelpCloseText}>닫기</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>


        {/* ===== 플래너 시간 설정 모달 ===== */}
        <Modal
          visible={showPlannerTimeModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPlannerTimeModal(false)}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowPlannerTimeModal(false)}>
            <TouchableOpacity activeOpacity={1} style={[styles.goalModal, {backgroundColor: cardBg}]}>
              <Text style={[styles.goalModalTitle, {color: textColor}]}>플래너 시작 시간</Text>
              <Text style={[styles.goalModalDesc, {color: subtextColor}]}>
                선택한 시간부터 24시간이 순서대로 표시됩니다
              </Text>

              {/* 시작 시간 */}
              <View style={{marginBottom: hp(16)}}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.goalQuickOptions}>
                    {[0, 4, 5, 6, 7, 8, 9, 10].map(h => (
                      <TouchableOpacity
                        key={h}
                        style={[
                          styles.goalQuickOption,
                          {
                            backgroundColor: tempStartHour === h ? accentColor : accentColor + '15',
                            borderColor: accentColor,
                          },
                        ]}
                        onPress={() => setTempStartHour(h)}>
                        <Text style={[
                          styles.goalQuickOptionText,
                          {color: tempStartHour === h ? '#FFFFFF' : accentColor},
                        ]}>
                          {h}시
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <Text style={[styles.goalModalDesc, {color: subtextColor, fontSize: fp(11)}]}>
                {tempStartHour}시 → ... → 23시 → 0시 → ... → {(tempStartHour + 23) % 24}시
              </Text>

              <View style={styles.goalModalButtons}>
                <TouchableOpacity
                  style={[styles.goalModalButton, styles.goalModalCancelButton, {borderColor: dividerColor}]}
                  onPress={() => setShowPlannerTimeModal(false)}>
                  <Text style={[styles.goalModalButtonText, {color: subtextColor}]}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.goalModalButton, {backgroundColor: accentColor}]}
                  onPress={() => {
                    setPlannerHours(tempStartHour, 24);
                    setShowPlannerTimeModal(false);
                  }}>
                  <Text style={[styles.goalModalButtonText, {color: '#FFFFFF'}]}>저장</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* ===== 목표 설정 모달 ===== */}
        <Modal
          visible={showGoalModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowGoalModal(false)}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowGoalModal(false)}>
            <TouchableOpacity activeOpacity={1} style={[styles.goalModal, {backgroundColor: cardBg}]}>
              <Text style={[styles.goalModalTitle, {color: textColor}]}>일일 목표 설정</Text>
              <Text style={[styles.goalModalDesc, {color: subtextColor}]}>
                하루에 집중할 목표 시간을 설정하세요
              </Text>

              <View style={styles.goalInputContainer}>
                <TextInput
                  style={[styles.goalInput, {backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5', color: textColor, borderColor: dividerColor}]}
                  value={tempGoalHours}
                  onChangeText={setTempGoalHours}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <Text style={[styles.goalInputLabel, {color: textColor}]}>시간</Text>
              </View>

              {/* 빠른 선택 */}
              <View style={styles.goalQuickOptions}>
                {[1, 2, 3, 4, 5, 6].map(h => (
                  <TouchableOpacity
                    key={h}
                    style={[
                      styles.goalQuickOption,
                      {
                        backgroundColor: tempGoalHours === String(h) ? accentColor : accentColor + '15',
                        borderColor: accentColor,
                      },
                    ]}
                    onPress={() => setTempGoalHours(String(h))}>
                    <Text style={[
                      styles.goalQuickOptionText,
                      {color: tempGoalHours === String(h) ? '#FFFFFF' : accentColor},
                    ]}>
                      {h}시간
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.goalModalButtons}>
                <TouchableOpacity
                  style={[styles.goalModalButton, styles.goalModalCancelButton, {borderColor: dividerColor}]}
                  onPress={() => setShowGoalModal(false)}>
                  <Text style={[styles.goalModalButtonText, {color: subtextColor}]}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.goalModalButton, {backgroundColor: accentColor}]}
                  onPress={() => {
                    const hours = parseInt(tempGoalHours) || 3;
                    setDailyGoal(hours * 60);
                    setShowGoalModal(false);
                  }}>
                  <Text style={[styles.goalModalButtonText, {color: '#FFFFFF'}]}>저장</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* ===== 원형 차트 모달 ===== */}
        <Modal
          visible={showPieChartModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPieChartModal(false)}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowPieChartModal(false)}>
            <TouchableOpacity activeOpacity={1} style={[styles.pieChartModal, {backgroundColor: cardBg}]}>
              <View style={styles.pieChartModalHeader}>
                <Text style={[styles.pieChartModalTitle, {color: textColor}]}>과목별 비율</Text>
                <TouchableOpacity onPress={() => setShowPieChartModal(false)}>
                  <Icon name="close" size={iconSize(24)} color={subtextColor} />
                </TouchableOpacity>
              </View>

              {/* 원형 차트 */}
              <View style={styles.pieChartContainer}>
                {(() => {
                  const size = sp(200);
                  const strokeWidth = sp(40);
                  const radius = (size - strokeWidth) / 2;
                  const center = size / 2;

                  // 컴포넌트 레벨에서 계산
                  const pieSubjectMinutes = selectedStats.subjectMinutes;
                  const pieTotalMinutes = Object.values(pieSubjectMinutes).reduce((sum, m) => sum + m, 0);

                  // 과목별 데이터 계산 (시간이 있는 과목만)
                  const subjectData = subjects
                    .map(subject => ({
                      ...subject,
                      minutes: pieSubjectMinutes[subject.id] || 0,
                    }))
                    .filter(s => s.minutes > 0)
                    .sort((a, b) => b.minutes - a.minutes);

                  if (subjectData.length === 0 || pieTotalMinutes === 0) {
                    return (
                      <View style={styles.emptyChartContainer}>
                        <Icon name="pie-chart-outline" size={iconSize(60)} color={dividerColor} />
                        <Text style={[styles.emptyChartText, {color: subtextColor}]}>
                          아직 기록된 시간이 없어요
                        </Text>
                      </View>
                    );
                  }

                  let currentAngle = -90; // 12시 방향에서 시작

                  return (
                    <Svg width={size} height={size}>
                      {/* 배경 원 */}
                      <SvgCircle
                        cx={center}
                        cy={center}
                        r={radius}
                        stroke={isDark ? '#3A3A3A' : '#E5E5EA'}
                        strokeWidth={strokeWidth}
                        fill="none"
                      />
                      {/* 과목별 호 */}
                      {subjectData.map((subject) => {
                        const percent = subject.minutes / pieTotalMinutes;
                        const angle = percent * 360;
                        const startAngle = currentAngle;
                        currentAngle += angle;

                        // 100% (360도)일 때는 원으로 그림
                        if (angle >= 359.9) {
                          return (
                            <SvgCircle
                              key={subject.id}
                              cx={center}
                              cy={center}
                              r={radius}
                              stroke={subject.color}
                              strokeWidth={strokeWidth}
                              fill="none"
                            />
                          );
                        }

                        // 호의 시작점과 끝점 계산
                        const startRad = (startAngle * Math.PI) / 180;
                        const endRad = ((startAngle + angle) * Math.PI) / 180;
                        const x1 = center + radius * Math.cos(startRad);
                        const y1 = center + radius * Math.sin(startRad);
                        const x2 = center + radius * Math.cos(endRad);
                        const y2 = center + radius * Math.sin(endRad);
                        const largeArcFlag = angle > 180 ? 1 : 0;

                        return (
                          <Path
                            key={subject.id}
                            d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`}
                            stroke={subject.color}
                            strokeWidth={strokeWidth}
                            fill="none"
                            strokeLinecap="round"
                          />
                        );
                      })}
                      {/* 가운데 텍스트 */}
                      <G>
                        <SvgCircle
                          cx={center}
                          cy={center}
                          r={radius - strokeWidth / 2 - sp(5)}
                          fill={cardBg}
                        />
                      </G>
                    </Svg>
                  );
                })()}
                {/* 가운데 총 시간 표시 */}
                <View style={styles.pieChartCenterText}>
                  <Text style={[styles.pieChartTotalLabel, {color: subtextColor}]}>총 시간</Text>
                  <Text style={[styles.pieChartTotalValue, {color: textColor}]}>
                    {formatTime(Object.values(selectedStats.subjectMinutes).reduce((sum, m) => sum + m, 0))}
                  </Text>
                </View>
              </View>

              {/* 범례 */}
              <ScrollView style={styles.pieChartLegend} showsVerticalScrollIndicator={false}>
                {(() => {
                  const pieSubjectMinutes = selectedStats.subjectMinutes;
                  const pieTotalMinutes = Object.values(pieSubjectMinutes).reduce((sum, m) => sum + m, 0);

                  return subjects
                    .map(subject => ({
                      ...subject,
                      minutes: pieSubjectMinutes[subject.id] || 0,
                    }))
                    .filter(s => s.minutes > 0)
                    .sort((a, b) => b.minutes - a.minutes)
                    .map(subject => {
                      const percent = pieTotalMinutes > 0
                        ? ((subject.minutes / pieTotalMinutes) * 100).toFixed(1)
                        : '0';
                      return (
                        <View key={subject.id} style={styles.pieChartLegendItem}>
                          <View style={styles.pieChartLegendLeft}>
                            <View style={[styles.pieChartLegendDot, {backgroundColor: subject.color}]} />
                            <Text style={[styles.pieChartLegendName, {color: textColor}]}>
                              {subject.name}
                            </Text>
                          </View>
                          <View style={styles.pieChartLegendRight}>
                            <Text style={[styles.pieChartLegendPercent, {color: subject.color}]}>
                              {percent}%
                            </Text>
                            <Text style={[styles.pieChartLegendTime, {color: subtextColor}]}>
                              {formatTime(subject.minutes)}
                            </Text>
                          </View>
                        </View>
                      );
                    });
                })()}
              </ScrollView>

              <TouchableOpacity
                style={[styles.pieChartCloseButton, {backgroundColor: accentColor}]}
                onPress={() => setShowPieChartModal(false)}>
                <Text style={styles.pieChartCloseText}>닫기</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* ===== 기간별 통계 날짜 범위 선택 모달 ===== */}
        <Modal
          visible={showDateRangeModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDateRangeModal(false)}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowDateRangeModal(false)}>
            <TouchableOpacity activeOpacity={1} style={[styles.dateRangeModal, {backgroundColor: cardBg}]}>
              <Text style={[styles.modalTitle, {color: textColor}]}>기간 선택</Text>

              {/* 시작/종료 날짜 선택 탭 */}
              <View style={styles.dateRangeTabs}>
                <TouchableOpacity
                  style={[
                    styles.dateRangeTab,
                    selectingDateType === 'start' && {backgroundColor: accentColor + '20', borderColor: accentColor},
                  ]}
                  onPress={() => setSelectingDateType('start')}>
                  <Text style={[styles.dateRangeTabLabel, {color: subtextColor}]}>시작일</Text>
                  <Text style={[
                    styles.dateRangeTabValue,
                    {color: selectingDateType === 'start' ? accentColor : textColor},
                  ]}>
                    {customStartDate ? `${customStartDate.getMonth() + 1}/${customStartDate.getDate()}` : '선택'}
                  </Text>
                </TouchableOpacity>
                <Icon name="arrow-forward" size={iconSize(20)} color={subtextColor} />
                <TouchableOpacity
                  style={[
                    styles.dateRangeTab,
                    selectingDateType === 'end' && {backgroundColor: accentColor + '20', borderColor: accentColor},
                  ]}
                  onPress={() => setSelectingDateType('end')}>
                  <Text style={[styles.dateRangeTabLabel, {color: subtextColor}]}>종료일</Text>
                  <Text style={[
                    styles.dateRangeTabValue,
                    {color: selectingDateType === 'end' ? accentColor : textColor},
                  ]}>
                    {customEndDate ? `${customEndDate.getMonth() + 1}/${customEndDate.getDate()}` : '선택'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 캘린더 헤더 */}
              <View style={styles.calendarHeader}>
                <TouchableOpacity
                  onPress={() => {
                    const newMonth = new Date(dateRangeMonth);
                    newMonth.setMonth(newMonth.getMonth() - 1);
                    setDateRangeMonth(newMonth);
                  }}>
                  <Icon name="chevron-back" size={iconSize(24)} color={textColor} />
                </TouchableOpacity>
                <Text style={[styles.calendarTitle, {color: textColor}]}>
                  {dateRangeMonth.getFullYear()}년 {dateRangeMonth.getMonth() + 1}월
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    const newMonth = new Date(dateRangeMonth);
                    newMonth.setMonth(newMonth.getMonth() + 1);
                    setDateRangeMonth(newMonth);
                  }}>
                  <Icon name="chevron-forward" size={iconSize(24)} color={textColor} />
                </TouchableOpacity>
              </View>

              {/* 요일 헤더 */}
              <View style={styles.weekDaysRow}>
                {WEEKDAYS.map((day, index) => (
                  <View key={index} style={styles.weekDayCell}>
                    <Text style={[
                      styles.weekDayText,
                      {color: subtextColor},
                      index === 0 && {color: sundayColor},
                      index === 6 && {color: saturdayColor},
                    ]}>
                      {day}
                    </Text>
                  </View>
                ))}
              </View>

              {/* 날짜 그리드 */}
              <View style={styles.daysGrid}>
                {(() => {
                  const year = dateRangeMonth.getFullYear();
                  const month = dateRangeMonth.getMonth();
                  const firstDay = new Date(year, month, 1);
                  const lastDay = new Date(year, month + 1, 0);
                  const daysArray: {date: Date; isCurrentMonth: boolean}[] = [];

                  const startDayOfWeek = firstDay.getDay();
                  for (let i = startDayOfWeek - 1; i >= 0; i--) {
                    const date = new Date(year, month, -i);
                    daysArray.push({date, isCurrentMonth: false});
                  }

                  for (let day = 1; day <= lastDay.getDate(); day++) {
                    daysArray.push({date: new Date(year, month, day), isCurrentMonth: true});
                  }

                  const endDayOfWeek = lastDay.getDay();
                  for (let i = 1; i < 7 - endDayOfWeek; i++) {
                    const date = new Date(year, month + 1, i);
                    daysArray.push({date, isCurrentMonth: false});
                  }

                  return daysArray.map((dayInfo, index) => {
                    const {date, isCurrentMonth} = dayInfo;
                    const isStart = customStartDate && isSameDay(date, customStartDate);
                    const isEnd = customEndDate && isSameDay(date, customEndDate);
                    const isInRange = customStartDate && customEndDate &&
                      date >= customStartDate && date <= customEndDate;
                    const isTodayD = isTodayDate(date);

                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.dayCell,
                          isInRange && !isStart && !isEnd && {backgroundColor: accentColor + '15'},
                        ]}
                        onPress={() => {
                          if (selectingDateType === 'start') {
                            setCustomStartDate(date);
                            if (!customEndDate || date > customEndDate) {
                              setCustomEndDate(null);
                            }
                            setSelectingDateType('end');
                          } else {
                            if (customStartDate && date < customStartDate) {
                              setCustomStartDate(date);
                              setCustomEndDate(customStartDate);
                            } else {
                              setCustomEndDate(date);
                            }
                          }
                        }}>
                        <View style={[
                          styles.dayTextContainer,
                          (isStart || isEnd) && {backgroundColor: accentColor},
                        ]}>
                          <Text style={[
                            styles.dayText,
                            {color: textColor},
                            !isCurrentMonth && {color: dividerColor},
                            (isStart || isEnd) && {color: '#FFFFFF', fontWeight: '700'},
                            isTodayD && !isStart && !isEnd && {color: accentColor, fontWeight: '700'},
                          ]}>
                            {date.getDate()}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  });
                })()}
              </View>

              {/* 버튼들 */}
              <View style={styles.dateRangeButtons}>
                <TouchableOpacity
                  style={[styles.dateRangeButton, {borderColor: dividerColor}]}
                  onPress={() => {
                    setCustomStartDate(null);
                    setCustomEndDate(null);
                    setShowDateRangeModal(false);
                  }}>
                  <Text style={[styles.dateRangeButtonText, {color: textColor}]}>초기화</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dateRangeButton, styles.dateRangeButtonPrimary, {backgroundColor: accentColor}]}
                  onPress={() => setShowDateRangeModal(false)}>
                  <Text style={[styles.dateRangeButtonText, {color: '#FFFFFF'}]}>확인</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

      </SafeAreaView>
    </NotebookBackground>
  );
};


export default StudyRecordScreen;
