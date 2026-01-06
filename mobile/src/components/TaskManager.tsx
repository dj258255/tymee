import React, {useState, useMemo, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import DraggableFlatList, {
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {
  StudyRecordTheme,
  getPostItColor,
  getRotation,
  getPostItShadow,
  getThemeShadow,
} from '../themes/studyRecordThemes';
import {sp, hp, fp, iconSize, touchSize} from '../utils/responsive';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// 날짜를 YYYY-MM-DD 형식으로 변환
const getDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface Task {
  id: string;
  title: string;
  estimatedMinutes: number;
  actualMinutes?: number;
  completed: boolean;
  subjectId?: string;
  date?: string; // YYYY-MM-DD
  priority: number; // 우선순위 (낮을수록 높은 우선순위)
}

interface Subject {
  id: string;
  name: string;
  color: string;
}

// 캘린더 일정 타입
interface CalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  isFromCalendar: true;
  isHidden: boolean;
  isCompleted: boolean;
}

interface TaskManagerProps {
  isDark: boolean;
  tasks: Task[];
  subjects: Subject[];
  onTaskToggle?: (taskId: string) => void;
  onTaskAdd?: (task: Omit<Task, 'id' | 'priority'>) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskUpdate?: (taskId: string, task: Partial<Task>) => void;
  onTaskReorder?: (orderedTaskIds: string[]) => void;
  onSubjectAdd?: (subject: Omit<Subject, 'id'>) => void;
  theme?: StudyRecordTheme;
  allTasks?: Task[]; // 모든 날짜의 태스크 (캘린더 표시용)
  selectedDate?: Date; // 선택된 날짜
  onDateChange?: (date: Date) => void; // 날짜 변경 콜백
  // 캘린더 일정 관련
  calendarEvents?: CalendarEvent[];
  onCalendarEventToggle?: (eventId: string) => void;
  onCalendarEventHide?: (eventId: string) => void;
}

const TaskManager: React.FC<TaskManagerProps> = ({
  isDark,
  tasks,
  subjects: _subjects,
  onTaskToggle,
  onTaskAdd,
  onTaskDelete,
  onTaskUpdate,
  onTaskReorder,
  onSubjectAdd: _onSubjectAdd,
  theme,
  allTasks = [],
  selectedDate = new Date(),
  onDateChange,
  calendarEvents = [],
  onCalendarEventToggle,
  onCalendarEventHide,
}) => {
  // 주간 캘린더 상태
  const [weekOffset, setWeekOffset] = useState(0); // 0 = 이번 주

  // 수정 모달 상태
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskMinutes, setEditTaskMinutes] = useState('30');
  // 테마 기반 색상
  const cardBg = isDark
    ? theme?.card.dark || '#2A2A2A'
    : theme?.card.light || '#F8F8F8';
  const inputBg = isDark
    ? theme?.background.dark || '#1E1E1E'
    : theme?.background.light || '#FFFFFF';
  const borderColor = isDark
    ? theme?.card.borderColor.dark || '#3A3A3A'
    : theme?.card.borderColor.light || '#E0E0E0';
  const textColor = isDark
    ? theme?.text.primary.dark || '#FFFFFF'
    : theme?.text.primary.light || '#1A1A1A';
  const subtextColor = isDark
    ? theme?.text.secondary.dark || '#666666'
    : theme?.text.secondary.light || '#999999';
  const accentColor = theme?.colors.accent || '#007AFF';
  const successColor = theme?.colors.success || '#34C759';
  const progressBg = isDark
    ? theme?.progressBar.background.dark || '#3A3A3A'
    : theme?.progressBar.background.light || '#E5E5EA';
  const checkboxStyle = theme?.checkbox.style || 'rounded';

  // 테마별 스타일 속성
  const isPostItStyle = theme?.task.item.postItStyle || false;
  const taskBorderRadius = theme?.task.item.borderRadius || 10;
  const taskPadding = theme?.task.item.padding || 12;
  const taskMarginBottom = theme?.task.item.marginBottom || 8;
  const taskBorderWidth = theme?.task.item.borderWidth || 1;
  const taskHasShadow = theme?.task.item.shadow || false;
  const modalBorderRadius = theme?.modal.borderRadius || 16;
  const buttonBorderRadius = theme?.button.borderRadius || 8;
  const inputBorderRadius = theme?.input.borderRadius || 8;
  const inputBorderStyle = theme?.input.borderStyle || 'solid';

  // 모달 상태
  const [showModal, setShowModal] = useState(false);

  // 할 일 폼 상태
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskMinutes, setNewTaskMinutes] = useState('30');

  // 주간 캘린더 데이터 계산
  const weekData = useMemo(() => {
    const today = new Date();
    const baseDate = new Date(today);
    baseDate.setDate(today.getDate() + (weekOffset * 7));

    // 해당 주의 일요일 찾기
    const dayOfWeek = baseDate.getDay();
    const startOfWeek = new Date(baseDate);
    startOfWeek.setDate(baseDate.getDate() - dayOfWeek);

    const days: { date: Date; dateStr: string; taskCount: number; completedCount: number }[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = getDateString(date);

      // 해당 날짜의 태스크 수 계산
      const dayTasks = allTasks.filter(t => t.date === dateStr);
      const completedCount = dayTasks.filter(t => t.completed).length;

      days.push({
        date,
        dateStr,
        taskCount: dayTasks.length,
        completedCount,
      });
    }

    return {
      days,
      startOfWeek,
      endOfWeek: days[6].date,
    };
  }, [weekOffset, allTasks]);

  // 선택된 날짜 문자열
  const selectedDateStr = getDateString(selectedDate);
  const todayStr = getDateString(new Date());

  // 완료된 태스크 수
  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // 총 예상 시간
  const totalEstimated = tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);

  // 시간 포맷
  const formatMinutes = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0) {return `${h}시간 ${m > 0 ? `${m}분` : ''}`;}
    return `${m}분`;
  };

  // 캘린더 일정 시간 포맷 (HH:MM)
  const formatTimeHHMM = (date: Date) => {
    const d = new Date(date);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // 숨기지 않은 캘린더 일정
  const visibleCalendarEvents = calendarEvents.filter(e => !e.isHidden);

  // 태스크 추가
  const handleAddTask = () => {
    if (!newTaskTitle.trim() || !onTaskAdd) {return;}

    onTaskAdd({
      title: newTaskTitle.trim(),
      estimatedMinutes: parseInt(newTaskMinutes) || 30,
      completed: false,
    });

    setNewTaskTitle('');
    setNewTaskMinutes('30');
    setShowModal(false);
  };

  // 모달 열기
  const openModal = () => {
    setShowModal(true);
  };

  // 모달 닫기
  const closeModal = () => {
    setShowModal(false);
    setNewTaskTitle('');
    setNewTaskMinutes('30');
  };

  // 수정 모달 열기
  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setEditTaskTitle(task.title);
    setEditTaskMinutes(task.estimatedMinutes.toString());
    setShowEditModal(true);
  };

  // 수정 모달 닫기
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingTask(null);
    setEditTaskTitle('');
    setEditTaskMinutes('30');
  };

  // 태스크 수정 완료
  const handleEditTask = () => {
    if (!editingTask || !editTaskTitle.trim() || !onTaskUpdate) {return;}

    onTaskUpdate(editingTask.id, {
      title: editTaskTitle.trim(),
      estimatedMinutes: parseInt(editTaskMinutes) || 30,
    });

    closeEditModal();
  };

  // 드래그 정렬 완료 핸들러
  const handleDragEnd = useCallback(({data}: {data: Task[]}) => {
    if (onTaskReorder) {
      const orderedIds = data.map(t => t.id);
      onTaskReorder(orderedIds);
    }
  }, [onTaskReorder]);

  // 드래그 가능한 태스크 아이템 렌더링
  const renderTaskItem = useCallback(({item: task, drag, isActive, getIndex}: RenderItemParams<Task>) => {
    const index = getIndex() ?? 0;
    // 테마에서 포스트잇 색상 가져오기
    const postItColor = theme ? getPostItColor(theme, index, isDark) : {bg: cardBg, border: borderColor};
    const rotation = theme ? getRotation(theme, index) : 0;
    const shadowStyle = isPostItStyle && taskHasShadow ? getPostItShadow(isDark) : (taskHasShadow && theme ? getThemeShadow(theme, isDark) : {});

    return (
      <TouchableOpacity
        style={[
          styles.taskItem,
          {
            backgroundColor: isPostItStyle ? postItColor.bg : cardBg,
            borderWidth: isPostItStyle ? 0 : taskBorderWidth,
            borderRadius: taskBorderRadius,
            borderLeftWidth: isPostItStyle ? 4 : taskBorderWidth,
            borderLeftColor: isPostItStyle ? postItColor.border : borderColor,
            borderColor: borderColor,
            padding: taskPadding,
            marginBottom: taskMarginBottom,
            transform: isPostItStyle ? [{rotate: `${rotation}deg`}] : [],
            opacity: task.completed ? 0.7 : 1,
            ...shadowStyle,
          },
          isActive && {opacity: 0.9},
        ]}
        onPress={() => onTaskToggle?.(task.id)}
        onLongPress={drag}
        delayLongPress={150}>
        {/* 드래그 핸들 */}
        <TouchableOpacity onPressIn={drag} style={styles.dragHandle}>
          <Icon name="menu" size={iconSize(16)} color={subtextColor} />
        </TouchableOpacity>

        {/* 체크박스 */}
        <TouchableOpacity
          style={[
            styles.checkbox,
            {
              backgroundColor: task.completed
                ? successColor
                : 'transparent',
              borderColor: successColor,
              borderRadius: checkboxStyle === 'circle' ? 11 : (checkboxStyle === 'square' ? 4 : 6),
            },
          ]}
          onPress={() => onTaskToggle?.(task.id)}>
          {task.completed && <Icon name="checkmark" size={iconSize(14)} color="#FFFFFF" />}
        </TouchableOpacity>

        {/* 태스크 내용 */}
        <View style={styles.taskContent}>
          <Text
            style={[
              styles.taskTitle,
              {
                color: textColor,
                textDecorationLine: task.completed ? 'line-through' : 'none',
              },
            ]}>
            {task.title}
          </Text>
          <Text style={[styles.taskTime, {color: subtextColor}]}>
            예상 {task.estimatedMinutes}분
          </Text>
        </View>

        {/* 수정 버튼 */}
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => openEditModal(task)}>
          <Icon name="create-outline" size={iconSize(16)} color={subtextColor} />
        </TouchableOpacity>

        {/* 삭제 버튼 */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onTaskDelete?.(task.id)}>
          <Icon name="trash-outline" size={iconSize(16)} color={subtextColor} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }, [
    theme, isDark, cardBg, borderColor, isPostItStyle, taskHasShadow, taskBorderWidth,
    taskBorderRadius, taskPadding, taskMarginBottom, successColor, checkboxStyle,
    textColor, subtextColor, onTaskToggle, onTaskDelete,
  ]);

  // 날짜 선택 핸들러
  const handleDateSelect = (date: Date) => {
    onDateChange?.(date);
  };

  // 선택된 날짜 포맷
  const formatSelectedDate = () => {
    const month = selectedDate.getMonth() + 1;
    const day = selectedDate.getDate();
    const dayOfWeek = WEEKDAYS[selectedDate.getDay()];
    const isToday = selectedDateStr === todayStr;
    return `${month}월 ${day}일 ${dayOfWeek}요일${isToday ? ' (오늘)' : ''}`;
  };

  return (
    <View style={styles.innerContainer}>
      {/* 주간 캘린더 */}
      {onDateChange && (
        <View style={styles.weekCalendarContainer}>
          {/* 주 네비게이션 */}
          <View style={styles.weekNavigation}>
            <TouchableOpacity
              style={styles.weekNavButton}
              onPress={() => setWeekOffset(weekOffset - 1)}>
              <Icon name="chevron-back" size={iconSize(18)} color={subtextColor} />
            </TouchableOpacity>
            <Text style={[styles.weekTitle, {color: textColor}]}>
              {weekData.startOfWeek.getMonth() + 1}월 {weekData.startOfWeek.getDate()}일 ~ {weekData.endOfWeek.getMonth() + 1}월 {weekData.endOfWeek.getDate()}일
            </Text>
            <TouchableOpacity
              style={styles.weekNavButton}
              onPress={() => setWeekOffset(weekOffset + 1)}
              disabled={weekOffset >= 0}>
              <Icon
                name="chevron-forward"
                size={iconSize(18)}
                color={weekOffset >= 0 ? borderColor : subtextColor}
              />
            </TouchableOpacity>
          </View>

          {/* 요일 헤더 + 날짜 그리드 */}
          <View style={[styles.weekGrid, {borderColor: borderColor}]}>
            {weekData.days.map((day, index) => {
              const isSelected = day.dateStr === selectedDateStr;
              const isToday = day.dateStr === todayStr;
              const isSunday = index === 0;
              const isSaturday = index === 6;
              const isLastDay = index === 6;

              return (
                <TouchableOpacity
                  key={day.dateStr}
                  style={[
                    styles.dayCell,
                    !isLastDay && {borderRightWidth: 1, borderRightColor: borderColor},
                    isSelected && {backgroundColor: accentColor + '15'},
                  ]}
                  onPress={() => handleDateSelect(day.date)}>
                  {/* 요일 */}
                  <Text style={[
                    styles.dayLabel,
                    {
                      color: isSunday ? theme?.colors.sunday || '#FF3B30' :
                        isSaturday ? theme?.colors.saturday || '#007AFF' : subtextColor,
                    },
                  ]}>
                    {WEEKDAYS[index]}
                  </Text>
                  {/* 날짜 */}
                  <View style={[
                    styles.dayNumber,
                    isToday && {backgroundColor: accentColor},
                  ]}>
                    <Text style={[
                      styles.dayNumberText,
                      {
                        color: isToday ? '#FFFFFF' :
                          isSunday ? theme?.colors.sunday || '#FF3B30' :
                          isSaturday ? theme?.colors.saturday || '#007AFF' : textColor,
                      },
                      isSelected && !isToday && {fontWeight: '700'},
                    ]}>
                      {day.date.getDate()}
                    </Text>
                  </View>
                  {/* 할 일 인디케이터 (점) */}
                  <View style={styles.taskIndicators}>
                    {day.taskCount > 0 && (
                      <View
                        style={[
                          styles.taskDot,
                          {backgroundColor: successColor},
                        ]}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* 선택된 날짜 헤더 */}
      <View style={styles.header}>
        <View>
          {onDateChange && (
            <Text style={[styles.selectedDateText, {color: textColor}]}>
              {formatSelectedDate()}
            </Text>
          )}
          <Text style={[styles.subtitle, {color: subtextColor}]}>
            {completedCount}/{totalCount} 완료 • 예상 {formatMinutes(totalEstimated)}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, {backgroundColor: accentColor}]}
          onPress={openModal}>
          <Icon name="add" size={iconSize(20)} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* 진행률 바 */}
      <View style={styles.progressContainer}>
        <View style={[
          styles.progressBar,
          {
            backgroundColor: progressBg,
            borderRadius: theme?.progressBar.borderRadius || 3,
            height: theme?.progressBar.height || 6,
          },
        ]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress}%`,
                backgroundColor: successColor,
                borderRadius: theme?.progressBar.borderRadius || 3,
              },
            ]}
          />
        </View>
        <Text style={[styles.progressText, {color: subtextColor}]}>
          {Math.round(progress)}%
        </Text>
      </View>

      {/* 할 일 추가 모달 */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={closeModal}>
        <Pressable style={styles.modalOverlay} onPress={closeModal}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboard}>
            <Pressable
              style={[styles.modalContent, {backgroundColor: cardBg, borderRadius: modalBorderRadius}]}
              onPress={e => e.stopPropagation()}>
              {/* 모달 헤더 */}
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, {color: textColor}]}>
                  할 일 추가
                </Text>
                <TouchableOpacity onPress={closeModal}>
                  <Icon name="close" size={iconSize(24)} color={subtextColor} />
                </TouchableOpacity>
              </View>

              <TextInput
                    style={[
                      styles.taskInput,
                      {
                        backgroundColor: inputBg,
                        color: textColor,
                        borderColor: borderColor,
                        borderRadius: inputBorderRadius,
                        borderStyle: inputBorderStyle as any,
                      },
                    ]}
                    placeholder="할 일을 입력하세요"
                    placeholderTextColor={subtextColor}
                    value={newTaskTitle}
                    onChangeText={setNewTaskTitle}
                    autoFocus
                  />

                  {/* 예상 시간 */}
                  <View style={styles.timeInputRow}>
                    <Text style={[styles.inputLabel, {color: subtextColor}]}>예상 시간</Text>
                    <View style={styles.timeInputContainer}>
                      <TextInput
                        style={[
                          styles.timeInput,
                          {
                            backgroundColor: inputBg,
                            color: textColor,
                            borderColor: borderColor,
                            borderRadius: inputBorderRadius,
                            borderStyle: inputBorderStyle as any,
                          },
                        ]}
                        placeholder="30"
                        placeholderTextColor={subtextColor}
                        value={newTaskMinutes}
                        onChangeText={setNewTaskMinutes}
                        keyboardType="number-pad"
                      />
                      <Text style={[styles.timeLabel, {color: subtextColor}]}>분</Text>
                    </View>
                  </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  {
                    backgroundColor: newTaskTitle.trim() ? accentColor : borderColor,
                    borderRadius: buttonBorderRadius,
                  },
                ]}
                onPress={handleAddTask}
                disabled={!newTaskTitle.trim()}>
                <Text style={styles.submitButtonText}>추가</Text>
              </TouchableOpacity>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      {/* 캘린더 일정 */}
      {visibleCalendarEvents.length > 0 && (
        <View style={styles.calendarSection}>
          <View style={styles.calendarSectionHeader}>
            <Icon name="calendar-outline" size={iconSize(14)} color={accentColor} />
            <Text style={[styles.calendarSectionTitle, {color: textColor}]}>
              오늘 일정
            </Text>
          </View>
          {visibleCalendarEvents.map((event, index) => {
            // 캘린더 일정에도 테마 적용
            const eventPostItColor = theme ? getPostItColor(theme, index, isDark) : {bg: cardBg, border: accentColor};
            const eventShadowStyle = isPostItStyle && taskHasShadow ? getPostItShadow(isDark) : (taskHasShadow && theme ? getThemeShadow(theme, isDark) : {});

            return (
              <View
                key={event.id}
                style={[
                  styles.calendarEventItem,
                  {
                    backgroundColor: isPostItStyle ? eventPostItColor.bg : cardBg,
                    borderColor: isPostItStyle ? eventPostItColor.border : accentColor,
                    borderLeftWidth: isPostItStyle ? 4 : 3,
                    borderLeftColor: isPostItStyle ? eventPostItColor.border : accentColor,
                    borderRadius: taskBorderRadius,
                    opacity: event.isCompleted ? 0.7 : 1,
                    ...eventShadowStyle,
                  },
                ]}>
                <TouchableOpacity
                  style={styles.calendarEventCheckbox}
                  onPress={() => onCalendarEventToggle?.(event.id)}>
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: event.isCompleted ? accentColor : 'transparent',
                        borderColor: accentColor,
                        borderRadius: checkboxStyle === 'circle' ? 11 : (checkboxStyle === 'square' ? 4 : 6),
                      },
                    ]}>
                    {event.isCompleted && <Icon name="checkmark" size={iconSize(14)} color="#FFFFFF" />}
                  </View>
                </TouchableOpacity>
                <View style={styles.calendarEventContent}>
                  <Text
                    style={[
                      styles.calendarEventTitle,
                      {color: textColor},
                      event.isCompleted && styles.calendarEventTitleDone,
                    ]}
                    numberOfLines={1}>
                    {event.title}
                  </Text>
                  <Text style={[styles.calendarEventTime, {color: subtextColor}]}>
                    {formatTimeHHMM(event.startDate)} - {formatTimeHHMM(event.endDate)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.calendarEventHideButton}
                  onPress={() => onCalendarEventHide?.(event.id)}>
                  <Icon name="eye-off-outline" size={iconSize(16)} color={subtextColor} />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      {/* 할 일 섹션 */}
      {tasks.length === 0 && visibleCalendarEvents.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="checkbox-outline" size={iconSize(40)} color={borderColor} />
          <Text style={[styles.emptyText, {color: subtextColor}]}>
            오늘 할 일을 추가해보세요
          </Text>
        </View>
      ) : tasks.length > 0 ? (
        <View style={styles.taskListContainer}>
          {/* 할 일 섹션 헤더 */}
          <View style={styles.taskSectionHeader}>
            <Icon name="checkbox-outline" size={iconSize(14)} color={successColor} />
            <Text style={[styles.taskSectionTitle, {color: textColor}]}>
              할 일
            </Text>
            <Text style={[styles.taskSectionCount, {color: subtextColor}]}>
              {completedCount}/{totalCount}
            </Text>
          </View>
          <GestureHandlerRootView style={{flex: 1}}>
            <DraggableFlatList
              data={tasks}
              keyExtractor={(item) => item.id}
              renderItem={renderTaskItem}
              onDragEnd={handleDragEnd}
              containerStyle={styles.taskList}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          </GestureHandlerRootView>
        </View>
      ) : null}

      {/* 수정 모달 */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={closeEditModal}>
        <Pressable style={styles.modalOverlay} onPress={closeEditModal}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboard}>
            <Pressable
              style={[styles.modalContent, {backgroundColor: cardBg, borderRadius: modalBorderRadius}]}
              onPress={e => e.stopPropagation()}>
              {/* 모달 헤더 */}
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, {color: textColor}]}>
                  할 일 수정
                </Text>
                <TouchableOpacity onPress={closeEditModal}>
                  <Icon name="close" size={iconSize(24)} color={subtextColor} />
                </TouchableOpacity>
              </View>

              <TextInput
                style={[
                  styles.taskInput,
                  {
                    backgroundColor: inputBg,
                    color: textColor,
                    borderColor: borderColor,
                    borderRadius: inputBorderRadius,
                    borderStyle: inputBorderStyle as any,
                  },
                ]}
                placeholder="할 일을 입력하세요"
                placeholderTextColor={subtextColor}
                value={editTaskTitle}
                onChangeText={setEditTaskTitle}
                autoFocus
              />

              {/* 예상 시간 */}
              <View style={styles.timeInputRow}>
                <Text style={[styles.inputLabel, {color: subtextColor}]}>예상 시간</Text>
                <View style={styles.timeInputContainer}>
                  <TextInput
                    style={[
                      styles.timeInput,
                      {
                        backgroundColor: inputBg,
                        color: textColor,
                        borderColor: borderColor,
                        borderRadius: inputBorderRadius,
                        borderStyle: inputBorderStyle as any,
                      },
                    ]}
                    placeholder="30"
                    placeholderTextColor={subtextColor}
                    value={editTaskMinutes}
                    onChangeText={setEditTaskMinutes}
                    keyboardType="number-pad"
                  />
                  <Text style={[styles.timeLabel, {color: subtextColor}]}>분</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  {
                    backgroundColor: editTaskTitle.trim() ? accentColor : borderColor,
                    borderRadius: buttonBorderRadius,
                  },
                ]}
                onPress={handleEditTask}
                disabled={!editTaskTitle.trim()}>
                <Text style={styles.submitButtonText}>수정</Text>
              </TouchableOpacity>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: sp(16),
    padding: sp(16),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: sp(2)},
    shadowOpacity: 0.05,
    shadowRadius: sp(8),
    elevation: 2,
  },
  innerContainer: {
    // NotebookCard 내부에서 사용될 때
  },
  // 주간 캘린더 스타일
  weekCalendarContainer: {
    marginBottom: hp(16),
  },
  weekNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(12),
  },
  weekNavButton: {
    padding: sp(4),
  },
  weekTitle: {
    fontSize: fp(14),
    fontWeight: '600',
  },
  weekGrid: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: sp(8),
    overflow: 'hidden',
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: hp(10),
  },
  dayLabel: {
    fontSize: fp(11),
    fontWeight: '500',
    marginBottom: hp(4),
  },
  dayNumber: {
    width: sp(28),
    height: sp(28),
    borderRadius: sp(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberText: {
    fontSize: fp(14),
    fontWeight: '500',
  },
  taskIndicators: {
    height: hp(10),
    marginTop: hp(4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(2),
  },
  taskDot: {
    width: sp(6),
    height: sp(6),
    borderRadius: sp(3),
  },
  moreTasks: {
    fontSize: fp(8),
    marginLeft: sp(1),
  },
  selectedDateText: {
    fontSize: fp(15),
    fontWeight: '600',
    marginBottom: hp(2),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp(12),
  },
  title: {
    fontSize: fp(16),
    fontWeight: '700',
  },
  subtitle: {
    fontSize: fp(12),
    marginTop: hp(4),
  },
  addButton: {
    width: touchSize(32),
    height: touchSize(32),
    borderRadius: sp(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
    marginBottom: hp(16),
  },
  progressBar: {
    flex: 1,
    height: hp(6),
    borderRadius: sp(3),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: sp(3),
  },
  progressText: {
    fontSize: fp(12),
    fontWeight: '600',
    width: sp(36),
    textAlign: 'right',
  },
  addForm: {
    padding: sp(12),
    borderRadius: sp(12),
    marginBottom: hp(12),
    gap: sp(10),
  },
  taskInput: {
    padding: sp(12),
    borderRadius: sp(8),
    borderWidth: 1,
    fontSize: fp(14),
  },
  addFormRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(10),
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(6),
  },
  timeInput: {
    width: sp(50),
    padding: sp(8),
    borderRadius: sp(8),
    borderWidth: 1,
    fontSize: fp(14),
    textAlign: 'center',
  },
  timeLabel: {
    fontSize: fp(12),
  },
  subjectScroll: {
    flex: 1,
  },
  subjectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(10),
    paddingVertical: hp(6),
    borderRadius: sp(14),
    borderWidth: 2,
    marginRight: sp(6),
    gap: sp(4),
  },
  subjectDot: {
    width: sp(8),
    height: sp(8),
    borderRadius: sp(4),
  },
  subjectOptionText: {
    fontSize: fp(11),
    fontWeight: '600',
  },
  submitButton: {
    padding: sp(12),
    borderRadius: sp(8),
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: fp(14),
    fontWeight: '700',
  },
  taskList: {
    // scrollEnabled={false}이므로 maxHeight 제한 없음
  },
  taskListContainer: {
    flex: 1,
  },
  taskSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(6),
    marginBottom: hp(10),
    marginTop: hp(8),
  },
  taskSectionTitle: {
    fontSize: fp(13),
    fontWeight: '600',
    flex: 1,
  },
  taskSectionCount: {
    fontSize: fp(12),
  },
  dragHandle: {
    padding: sp(4),
    marginRight: sp(4),
  },
  editButton: {
    padding: sp(8),
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: hp(40),
    gap: sp(12),
  },
  emptyText: {
    fontSize: fp(13),
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: sp(12),
    borderRadius: sp(10),
    marginBottom: hp(8),
    gap: sp(12),
  },
  checkbox: {
    width: sp(22),
    height: sp(22),
    borderRadius: sp(6),
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskContent: {
    flex: 1,
    gap: sp(6),
  },
  taskTitle: {
    fontSize: fp(14),
    fontWeight: '600',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
  },
  taskSubject: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(8),
    paddingVertical: hp(3),
    borderRadius: sp(10),
    gap: sp(4),
  },
  taskSubjectDot: {
    width: sp(6),
    height: sp(6),
    borderRadius: sp(3),
  },
  taskSubjectText: {
    fontSize: fp(10),
    fontWeight: '600',
  },
  taskTime: {
    fontSize: fp(11),
  },
  deleteButton: {
    padding: sp(8),
  },
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalKeyboard: {
    width: '100%',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: sp(16),
    padding: sp(20),
    gap: sp(16),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: fp(18),
    fontWeight: '700',
  },
  timeInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: fp(14),
    fontWeight: '600',
  },
  subjectSection: {
    gap: sp(10),
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectScrollModal: {
    flexGrow: 0,
  },
  addSubjectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(10),
    paddingVertical: hp(6),
    borderRadius: sp(14),
    borderWidth: 1,
    gap: sp(4),
  },
  addSubjectText: {
    fontSize: fp(12),
    fontWeight: '600',
  },
  // 과목 생성 폼 스타일
  subjectFormContainer: {
    gap: sp(16),
  },
  colorLabel: {
    fontSize: fp(14),
    fontWeight: '600',
  },
  colorPalette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sp(10),
  },
  colorOption: {
    width: sp(36),
    height: sp(36),
    borderRadius: sp(18),
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: sp(12),
    marginTop: hp(8),
  },
  modalButton: {
    flex: 1,
    padding: sp(12),
    borderRadius: sp(8),
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: fp(14),
    fontWeight: '600',
  },
  // 캘린더 일정 스타일
  calendarSection: {
    marginBottom: hp(16),
  },
  calendarSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(6),
    marginBottom: hp(10),
  },
  calendarSectionTitle: {
    fontSize: fp(12),
    fontWeight: '500',
  },
  calendarEventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: sp(12),
    marginBottom: hp(8),
    borderWidth: 1,
    gap: sp(12),
  },
  calendarEventCheckbox: {
    // 체크박스 터치 영역
  },
  calendarEventContent: {
    flex: 1,
    gap: sp(4),
  },
  calendarEventTitle: {
    fontSize: fp(14),
    fontWeight: '600',
  },
  calendarEventTitleDone: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  calendarEventTime: {
    fontSize: fp(11),
  },
  calendarEventHideButton: {
    padding: sp(4),
  },
});

export default TaskManager;
