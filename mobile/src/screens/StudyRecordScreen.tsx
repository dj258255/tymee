import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  InteractionManager,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useThemeStore} from '../store/themeStore';
import {safeGetColorScheme, safeAddAppearanceListener} from '../utils/appearance';
import Icon from '@react-native-vector-icons/ionicons';
import RNCalendarEvents from 'react-native-calendar-events';

interface StudyEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  duration: number; // 분 단위
}

const StudyRecordScreen: React.FC = () => {
  const {t} = useTranslation();
  const [systemColorScheme, setSystemColorScheme] = useState<'light' | 'dark'>('light');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarEvents, setCalendarEvents] = useState<StudyEvent[]>([]);
  const [hasCalendarPermission, setHasCalendarPermission] = useState(false);

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

  useEffect(() => {
    requestCalendarPermission();
  }, []);

  const {themeMode} = useThemeStore();

  const isDark =
    themeMode === 'system'
      ? systemColorScheme === 'dark'
      : themeMode === 'dark';

  // 캘린더 권한 요청
  const requestCalendarPermission = async () => {
    try {
      if (Platform.OS === 'ios') {
        const status = await RNCalendarEvents.requestPermissions();
        setHasCalendarPermission(status === 'authorized');
      } else {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_CALENDAR,
          PermissionsAndroid.PERMISSIONS.WRITE_CALENDAR,
        ]);
        setHasCalendarPermission(
          granted['android.permission.READ_CALENDAR'] === 'granted' &&
          granted['android.permission.WRITE_CALENDAR'] === 'granted'
        );
      }
    } catch (error) {
      console.error('Calendar permission error:', error);
    }
  };

  // 해당 월의 모든 날짜 가져오기
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // 첫 주의 빈 칸 추가
    const firstDayOfWeek = firstDay.getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }

    // 실제 날짜 추가
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  // 날짜 비교 함수
  const isSameDay = (date1: Date | null, date2: Date | null) => {
    if (!date1 || !date2) return false;
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  // 오늘 날짜인지 확인
  const isToday = (date: Date | null) => {
    return isSameDay(date, new Date());
  };

  // 이전 달로 이동
  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  // 다음 달로 이동
  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  // 선택된 날짜의 이벤트 (예시 데이터)
  const getEventsForSelectedDate = () => {
    // 실제로는 calendarEvents에서 필터링
    return [
      {
        id: '1',
        title: '수학 공부',
        startDate: new Date(selectedDate.setHours(14, 0)),
        endDate: new Date(selectedDate.setHours(15, 30)),
        duration: 90,
      },
      {
        id: '2',
        title: '영어 단어 암기',
        startDate: new Date(selectedDate.setHours(16, 0)),
        endDate: new Date(selectedDate.setHours(17, 0)),
        duration: 60,
      },
    ];
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
  const monthName = `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월`;

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: isDark ? '#121212' : '#FAFAFA'}]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
              {t('study.title')}
            </Text>
            <Text style={[styles.subtitle, {color: isDark ? '#999999' : '#666666'}]}>
              학습 일정 관리
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.syncButton, {backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5'}]}
            onPress={requestCalendarPermission}>
            <Icon name="sync" size={20} color={hasCalendarPermission ? '#4CAF50' : (isDark ? '#999999' : '#666666')} />
          </TouchableOpacity>
        </View>

        {/* 캘린더 컨트롤 */}
        <View style={[styles.calendarHeader, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
          <TouchableOpacity onPress={goToPreviousMonth} style={styles.monthButton}>
            <Icon name="chevron-back" size={24} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
          </TouchableOpacity>
          <Text style={[styles.monthText, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
            {monthName}
          </Text>
          <TouchableOpacity onPress={goToNextMonth} style={styles.monthButton}>
            <Icon name="chevron-forward" size={24} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
          </TouchableOpacity>
        </View>

        {/* 캘린더 */}
        <View style={[styles.calendar, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
          {/* 요일 헤더 */}
          <View style={styles.weekDaysRow}>
            {weekDays.map((day, index) => (
              <View key={index} style={styles.weekDayCell}>
                <Text style={[
                  styles.weekDayText,
                  {color: isDark ? '#999999' : '#666666'},
                  index === 0 && {color: '#FF6B6B'}, // 일요일
                  index === 6 && {color: '#4A90E2'}, // 토요일
                ]}>
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* 날짜 그리드 */}
          <View style={styles.daysGrid}>
            {daysInMonth.map((day, index) => {
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);

              return (
                <TouchableOpacity
                  key={index}
                  style={styles.dayCell}
                  onPress={() => day && setSelectedDate(day)}
                  disabled={!day}>
                  {day && (
                    <>
                      <View style={[
                        styles.dayTextContainer,
                        isSelected && styles.selectedDayContainer,
                        isSelected && {backgroundColor: '#007AFF'},
                      ]}>
                        <Text style={[
                          styles.dayText,
                          {color: isDark ? '#FFFFFF' : '#1A1A1A'},
                          isSelected && {color: '#FFFFFF', fontWeight: '700'},
                          isTodayDate && !isSelected && {color: '#007AFF', fontWeight: '700'},
                        ]}>
                          {day.getDate()}
                        </Text>
                      </View>
                      {/* 공부 기록이 있는 날 표시 (예시) */}
                      {day.getDate() % 3 === 0 && !isSelected && (
                        <View style={[styles.eventDot, {backgroundColor: '#4CAF50'}]} />
                      )}
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 선택된 날짜의 이벤트 */}
        <View style={styles.eventsSection}>
          <Text style={[styles.eventsSectionTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
            {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 학습 기록
          </Text>

          {getEventsForSelectedDate().length > 0 ? (
            getEventsForSelectedDate().map((event) => (
              <View
                key={event.id}
                style={[styles.eventCard, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
                <View style={[styles.eventColorBar, {backgroundColor: '#007AFF'}]} />
                <View style={styles.eventContent}>
                  <Text style={[styles.eventTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                    {event.title}
                  </Text>
                  <View style={styles.eventTime}>
                    <Icon name="time-outline" size={14} color={isDark ? '#999999' : '#666666'} />
                    <Text style={[styles.eventTimeText, {color: isDark ? '#999999' : '#666666'}]}>
                      {event.startDate.getHours()}:{event.startDate.getMinutes().toString().padStart(2, '0')} - {event.endDate.getHours()}:{event.endDate.getMinutes().toString().padStart(2, '0')}
                    </Text>
                    <Text style={[styles.eventDuration, {color: isDark ? '#999999' : '#666666'}]}>
                      ({event.duration}분)
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.eventActions}>
                  <Icon name="ellipsis-vertical" size={20} color={isDark ? '#999999' : '#666666'} />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={[styles.emptyState, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
              <Icon name="calendar-outline" size={48} color={isDark ? '#3A3A3A' : '#E0E0E0'} />
              <Text style={[styles.emptyStateText, {color: isDark ? '#666666' : '#999999'}]}>
                이 날은 학습 기록이 없습니다
              </Text>
            </View>
          )}
        </View>

        {/* 일정 추가 버튼 */}
        <TouchableOpacity
          style={[styles.addButton, {backgroundColor: '#007AFF'}]}
          onPress={() => Alert.alert('일정 추가', '일정 추가 기능을 구현하세요')}>
          <Icon name="add" size={24} color="#FFFFFF" />
          <Text style={styles.addButtonText}>학습 일정 추가</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  syncButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  monthButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '700',
  },
  calendar: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%', // 7일 = 100% / 7
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dayTextContainer: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  selectedDayContainer: {
    borderRadius: 18,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 8,
  },
  eventsSection: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  eventsSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  eventCard: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  eventColorBar: {
    width: 4,
  },
  eventContent: {
    flex: 1,
    padding: 16,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  eventTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventTimeText: {
    fontSize: 14,
  },
  eventDuration: {
    fontSize: 12,
  },
  eventActions: {
    padding: 16,
    justifyContent: 'center',
  },
  emptyState: {
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
  },
  emptyStateText: {
    fontSize: 14,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default StudyRecordScreen;
