import React, {useMemo, useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import {useStudyRecordStore, DailyStats} from '../store/studyRecordStore';
import {usePomodoroStore} from '../store/pomodoroStore';
import {StudyRecordTheme} from '../themes/studyRecordThemes';
import NotebookCard from './NotebookCard';
import {sp, hp, fp, iconSize} from '../utils/responsive';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

interface StudyReportProps {
  theme: StudyRecordTheme;
  isDark: boolean;
}

// 집중세션 기반 일별 통계
interface FocusDayStats {
  totalMinutes: number;
  sessions: number;
}

type ReportType = 'weekly' | 'monthly';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

const formatTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}분`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}시간`;
  }
  return `${hours}시간 ${mins}분`;
};

const getDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const StudyReport: React.FC<StudyReportProps> = ({theme, isDark}) => {
  const [reportType, setReportType] = useState<ReportType>('weekly');
  const [weekOffset, setWeekOffset] = useState(0); // 0 = 이번 주, -1 = 지난 주
  const [monthOffset, setMonthOffset] = useState(0); // 0 = 이번 달, -1 = 지난 달

  const {
    dailyGoalMinutes,
    weeklyGoalMinutes,
  } = useStudyRecordStore();

  // 뽀모도로 세션 가져오기
  const pomodoroSessions = usePomodoroStore(state => state.sessions);

  // 날짜별 집중세션 통계 계산 함수
  const getFocusStatsForDate = useCallback((dateStr: string): FocusDayStats => {
    const completedFocusSessions = pomodoroSessions.filter(s => {
      if (s.mode !== 'FOCUS' || !s.completed) {return false;}
      const sessionDate = new Date(s.startTime);
      const sessionDateStr = getDateString(sessionDate);
      return sessionDateStr === dateStr;
    });

    const totalMinutes = completedFocusSessions.reduce((sum, s) => {
      const duration = (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 1000 / 60;
      return sum + Math.round(duration);
    }, 0);

    return {
      totalMinutes,
      sessions: completedFocusSessions.length,
    };
  }, [pomodoroSessions]);

  // 색상 설정
  const textColor = isDark ? theme.text.primary.dark : theme.text.primary.light;
  const subtextColor = isDark ? theme.text.secondary.dark : theme.text.secondary.light;
  const accentColor = isDark ? theme.text.accent.dark : theme.text.accent.light;
  const successColor = theme.colors.success;
  const warningColor = theme.colors.warning;
  const dividerColor = isDark ? '#333333' : '#E0E0E0';

  // 주간 데이터 계산
  const weeklyData = useMemo(() => {
    const days: FocusDayStats[] = [];
    let totalMinutes = 0;
    const today = new Date();

    // weekOffset에 따라 시작 날짜 계산
    const baseDate = new Date(today);
    baseDate.setDate(today.getDate() + (weekOffset * 7));

    // 해당 주의 일요일 찾기
    const dayOfWeek = baseDate.getDay();
    const startOfWeek = new Date(baseDate);
    startOfWeek.setDate(baseDate.getDate() - dayOfWeek);

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      // 집중세션 기반으로 통계 가져오기
      const stats = getFocusStatsForDate(getDateString(date));
      days.push(stats);
      totalMinutes += stats.totalMinutes;
    }

    // 평균 계산 (공부한 날만)
    const studiedDays = days.filter(d => d.totalMinutes > 0).length;
    const avgMinutes = studiedDays > 0 ? Math.round(totalMinutes / studiedDays) : 0;

    // 최고 공부 시간 날
    const maxDay = days.reduce((max, day) =>
      day.totalMinutes > max.totalMinutes ? day : max, days[0]);

    // 가장 열심히 한 요일 찾기
    const maxDayIndex = days.indexOf(maxDay);
    const bestDayLabel = WEEKDAY_LABELS[maxDayIndex];

    // 주간 목표 달성률
    const goalProgress = Math.min((totalMinutes / weeklyGoalMinutes) * 100, 100);

    // 시작일과 종료일
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    return {
      days,
      totalMinutes,
      avgMinutes,
      studiedDays,
      maxMinutes: maxDay.totalMinutes,
      bestDayLabel,
      goalProgress,
      startDate: startOfWeek,
      endDate: endOfWeek,
    };
  }, [weekOffset, weeklyGoalMinutes, getFocusStatsForDate]);

  // 월간 데이터 계산
  const monthlyData = useMemo(() => {
    const days: FocusDayStats[] = [];
    let totalMinutes = 0;
    const today = new Date();

    // monthOffset에 따라 대상 월 계산
    const targetDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // 주별 합계 계산을 위한 배열
    const weeklyTotals: number[] = [];
    let weekTotal = 0;

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      // 집중세션 기반으로 통계 가져오기
      const stats = getFocusStatsForDate(getDateString(date));
      days.push(stats);
      totalMinutes += stats.totalMinutes;
      weekTotal += stats.totalMinutes;

      // 토요일이거나 마지막 날이면 주간 합계 저장
      if (date.getDay() === 6 || i === daysInMonth) {
        weeklyTotals.push(weekTotal);
        weekTotal = 0;
      }
    }

    // 평균 계산 (공부한 날만)
    const studiedDays = days.filter(d => d.totalMinutes > 0).length;
    const avgMinutes = studiedDays > 0 ? Math.round(totalMinutes / studiedDays) : 0;

    // 최고 공부 시간
    const maxMinutes = Math.max(...days.map(d => d.totalMinutes), 0);

    // 요일별 평균 계산
    const dayOfWeekTotals: number[] = [0, 0, 0, 0, 0, 0, 0];
    const dayOfWeekCounts: number[] = [0, 0, 0, 0, 0, 0, 0];

    days.forEach((stats, index) => {
      const date = new Date(year, month, index + 1);
      const dayOfWeek = date.getDay();
      dayOfWeekTotals[dayOfWeek] += stats.totalMinutes;
      if (stats.totalMinutes > 0) {
        dayOfWeekCounts[dayOfWeek]++;
      }
    });

    const dayOfWeekAvg = dayOfWeekTotals.map((total, i) =>
      dayOfWeekCounts[i] > 0 ? Math.round(total / dayOfWeekCounts[i]) : 0
    );

    // 가장 열심히 한 요일
    const bestDayOfWeek = dayOfWeekAvg.indexOf(Math.max(...dayOfWeekAvg));
    const bestDayLabel = WEEKDAY_LABELS[bestDayOfWeek];

    return {
      days,
      totalMinutes,
      avgMinutes,
      studiedDays,
      maxMinutes,
      bestDayLabel,
      weeklyTotals,
      dayOfWeekAvg,
      year,
      month,
      daysInMonth,
    };
  }, [monthOffset, getFocusStatsForDate]);

  // 막대 차트 렌더링 (주간)
  const renderWeeklyBarChart = () => {
    const maxValue = Math.max(...weeklyData.days.map(d => d.totalMinutes), dailyGoalMinutes);
    const chartHeight = 150;
    const barWidth = (SCREEN_WIDTH - sp(80)) / 7 - sp(8);

    return (
      <View style={localStyles.chartContainer}>
        <View style={localStyles.barChartContainer}>
          {weeklyData.days.map((day, index) => {
            const barHeight = maxValue > 0 ? (day.totalMinutes / maxValue) * chartHeight : 0;
            const date = new Date(weeklyData.startDate);
            date.setDate(weeklyData.startDate.getDate() + index);
            const isToday = getDateString(date) === getDateString(new Date());

            return (
              <View key={index} style={localStyles.barColumn}>
                <Text style={[localStyles.barValue, {color: subtextColor, fontSize: fp(10)}]}>
                  {day.totalMinutes > 0 ? formatTime(day.totalMinutes) : ''}
                </Text>
                <View style={[localStyles.barWrapper, {height: chartHeight}]}>
                  <View
                    style={[
                      localStyles.bar,
                      {
                        height: Math.max(barHeight, 4),
                        width: barWidth,
                        backgroundColor: isToday ? accentColor :
                          index === 0 ? theme.colors.sunday :
                          index === 6 ? theme.colors.saturday : successColor,
                        borderRadius: theme.stats.barChart.borderRadius,
                      },
                    ]}
                  />
                </View>
                <Text style={[
                  localStyles.barLabel,
                  {
                    color: isToday ? accentColor :
                      index === 0 ? theme.colors.sunday :
                      index === 6 ? theme.colors.saturday : textColor,
                    fontWeight: isToday ? '700' : '500',
                  },
                ]}>
                  {WEEKDAY_LABELS[index]}
                </Text>
              </View>
            );
          })}
        </View>
        {/* 목표 라인 */}
        {dailyGoalMinutes > 0 && (
          <View style={[
            localStyles.goalLine,
            {
              bottom: (dailyGoalMinutes / maxValue) * chartHeight + 30,
              borderColor: warningColor,
            },
          ]}>
            <Text style={[localStyles.goalLineLabel, {color: warningColor}]}>
              일일 목표 {formatTime(dailyGoalMinutes)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  // 히트맵 렌더링 (월간)
  const renderMonthlyHeatmap = () => {
    const year = monthlyData.year;
    const month = monthlyData.month;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = monthlyData.daysInMonth;

    const cellSize = (SCREEN_WIDTH - sp(80)) / 7 - sp(4);
    const weeks: (DailyStats | null)[][] = [];
    let currentWeek: (DailyStats | null)[] = [];

    // 첫 주 빈 칸 채우기
    for (let i = 0; i < firstDay; i++) {
      currentWeek.push(null);
    }

    // 날짜 채우기
    for (let i = 0; i < daysInMonth; i++) {
      currentWeek.push(monthlyData.days[i]);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // 마지막 주 빈 칸 채우기
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    const getHeatmapColor = (minutes: number): string => {
      if (minutes === 0) {return isDark ? '#2A2A2A' : '#F0F0F0';}
      const intensity = Math.min(minutes / (dailyGoalMinutes || 180), 1);
      if (intensity < 0.25) {return isDark ? '#1E3A2F' : '#C6E48B';}
      if (intensity < 0.5) {return isDark ? '#2E5A3F' : '#7BC96F';}
      if (intensity < 0.75) {return isDark ? '#3E7A4F' : '#239A3B';}
      return isDark ? '#4E9A5F' : '#196127';
    };

    return (
      <View style={localStyles.heatmapContainer}>
        {/* 요일 헤더 */}
        <View style={localStyles.heatmapHeader}>
          {WEEKDAY_LABELS.map((label, index) => (
            <View key={index} style={[localStyles.heatmapHeaderCell, {width: cellSize}]}>
              <Text style={[
                localStyles.heatmapHeaderText,
                {
                  color: index === 0 ? theme.colors.sunday :
                    index === 6 ? theme.colors.saturday : subtextColor,
                },
              ]}>
                {label}
              </Text>
            </View>
          ))}
        </View>

        {/* 히트맵 그리드 */}
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={localStyles.heatmapRow}>
            {week.map((day, dayIndex) => {
              const actualDayNumber = day ? monthlyData.days.indexOf(day) + 1 : null;

              return (
                <View
                  key={dayIndex}
                  style={[
                    localStyles.heatmapCell,
                    {
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: day ? getHeatmapColor(day.totalMinutes) : 'transparent',
                      borderRadius: 4,
                    },
                  ]}>
                  {actualDayNumber && (
                    <Text style={[
                      localStyles.heatmapDayText,
                      {color: day && day.totalMinutes > 0 ? '#FFFFFF' : subtextColor},
                    ]}>
                      {actualDayNumber}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        ))}

        {/* 범례 */}
        <View style={localStyles.heatmapLegend}>
          <Text style={[localStyles.heatmapLegendText, {color: subtextColor}]}>적음</Text>
          {[0, 0.25, 0.5, 0.75, 1].map((intensity, i) => (
            <View
              key={i}
              style={[
                localStyles.heatmapLegendBox,
                {
                  backgroundColor: intensity === 0
                    ? (isDark ? '#2A2A2A' : '#F0F0F0')
                    : intensity < 0.25 ? (isDark ? '#1E3A2F' : '#C6E48B')
                    : intensity < 0.5 ? (isDark ? '#2E5A3F' : '#7BC96F')
                    : intensity < 0.75 ? (isDark ? '#3E7A4F' : '#239A3B')
                    : (isDark ? '#4E9A5F' : '#196127'),
                },
              ]}
            />
          ))}
          <Text style={[localStyles.heatmapLegendText, {color: subtextColor}]}>많음</Text>
        </View>
      </View>
    );
  };

  // 요일별 평균 차트 (월간)
  const renderDayOfWeekChart = () => {
    const maxAvg = Math.max(...monthlyData.dayOfWeekAvg, 1);
    const chartHeight = 100;
    const barWidth = (SCREEN_WIDTH - sp(80)) / 7 - sp(8);

    return (
      <View style={localStyles.chartContainer}>
        <View style={localStyles.barChartContainer}>
          {monthlyData.dayOfWeekAvg.map((avg, index) => {
            const barHeight = maxAvg > 0 ? (avg / maxAvg) * chartHeight : 0;

            return (
              <View key={index} style={localStyles.barColumn}>
                <Text style={[localStyles.barValue, {color: subtextColor, fontSize: fp(9)}]}>
                  {avg > 0 ? formatTime(avg) : ''}
                </Text>
                <View style={[localStyles.barWrapper, {height: chartHeight}]}>
                  <View
                    style={[
                      localStyles.bar,
                      {
                        height: Math.max(barHeight, 4),
                        width: barWidth,
                        backgroundColor: index === 0 ? theme.colors.sunday :
                          index === 6 ? theme.colors.saturday : accentColor,
                        borderRadius: theme.stats.barChart.borderRadius,
                      },
                    ]}
                  />
                </View>
                <Text style={[
                  localStyles.barLabel,
                  {
                    color: index === 0 ? theme.colors.sunday :
                      index === 6 ? theme.colors.saturday : textColor,
                  },
                ]}>
                  {WEEKDAY_LABELS[index]}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={localStyles.container}>
      {/* 리포트 타입 선택 탭 */}
      <View style={[localStyles.tabContainer, {backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5', borderColor: isDark ? '#333333' : '#D0D0D0'}]}>
        <TouchableOpacity
          style={[
            localStyles.tab,
            reportType === 'weekly' && {backgroundColor: accentColor},
          ]}
          onPress={() => setReportType('weekly')}>
          <Icon
            name="calendar-outline"
            size={iconSize(16)}
            color={reportType === 'weekly' ? '#FFFFFF' : subtextColor}
          />
          <Text style={[
            localStyles.tabText,
            {color: reportType === 'weekly' ? '#FFFFFF' : subtextColor},
          ]}>
            주간 리포트
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            localStyles.tab,
            reportType === 'monthly' && {backgroundColor: accentColor},
          ]}
          onPress={() => setReportType('monthly')}>
          <Icon
            name="calendar"
            size={iconSize(16)}
            color={reportType === 'monthly' ? '#FFFFFF' : subtextColor}
          />
          <Text style={[
            localStyles.tabText,
            {color: reportType === 'monthly' ? '#FFFFFF' : subtextColor},
          ]}>
            월간 리포트
          </Text>
        </TouchableOpacity>
      </View>

      {reportType === 'weekly' ? (
        <>
          {/* 주간 네비게이션 */}
          <View style={[localStyles.navigationContainer, {backgroundColor: isDark ? '#1A1A1A' : '#FAFAFA', borderColor: dividerColor}]}>
            <TouchableOpacity
              style={localStyles.navButton}
              onPress={() => setWeekOffset(weekOffset - 1)}>
              <Icon name="chevron-back" size={iconSize(20)} color={textColor} />
            </TouchableOpacity>
            <View style={localStyles.dateRangeCenter}>
              <Text style={[localStyles.navTitle, {color: textColor}]}>
                {weeklyData.startDate.getMonth() + 1}/{weeklyData.startDate.getDate()} ~ {weeklyData.endDate.getMonth() + 1}/{weeklyData.endDate.getDate()}
              </Text>
              {weekOffset === 0 && <Text style={[localStyles.currentPeriodLabel, {color: accentColor}]}>이번 주</Text>}
            </View>
            <TouchableOpacity
              style={localStyles.navButton}
              onPress={() => setWeekOffset(weekOffset + 1)}
              disabled={weekOffset >= 0}>
              <Icon
                name="chevron-forward"
                size={iconSize(20)}
                color={weekOffset >= 0 ? dividerColor : textColor}
              />
            </TouchableOpacity>
          </View>

          {/* 주간 요약 */}
          <NotebookCard theme={theme} isDark={isDark} title="주간 요약" tapeColor="#87CEEB">
            <View style={localStyles.summaryGrid}>
              <View style={localStyles.summaryItem}>
                <Icon name="time-outline" size={iconSize(24)} color={accentColor} />
                <Text style={[localStyles.summaryValue, {color: textColor}]}>
                  {formatTime(weeklyData.totalMinutes)}
                </Text>
                <Text style={[localStyles.summaryLabel, {color: subtextColor}]}>총 공부 시간</Text>
              </View>
              <View style={[localStyles.summaryDivider, {backgroundColor: dividerColor}]} />
              <View style={localStyles.summaryItem}>
                <Icon name="trending-up-outline" size={iconSize(24)} color={successColor} />
                <Text style={[localStyles.summaryValue, {color: textColor}]}>
                  {formatTime(weeklyData.avgMinutes)}
                </Text>
                <Text style={[localStyles.summaryLabel, {color: subtextColor}]}>일평균</Text>
              </View>
              <View style={[localStyles.summaryDivider, {backgroundColor: dividerColor}]} />
              <View style={localStyles.summaryItem}>
                <Icon name="flame" size={iconSize(24)} color={warningColor} />
                <Text style={[localStyles.summaryValue, {color: textColor}]}>
                  {weeklyData.studiedDays}일
                </Text>
                <Text style={[localStyles.summaryLabel, {color: subtextColor}]}>공부한 날</Text>
              </View>
            </View>
          </NotebookCard>

          {/* 일별 공부 시간 차트 */}
          <NotebookCard theme={theme} isDark={isDark} title="일별 공부 시간" tapeColor="#98FB98">
            {renderWeeklyBarChart()}
          </NotebookCard>

          {/* 주간 인사이트 */}
          <NotebookCard theme={theme} isDark={isDark} title="주간 인사이트" tapeColor="#DDA0DD">
            <View style={localStyles.insightContainer}>
              {weeklyData.maxMinutes > 0 && (
                <View style={localStyles.insightRow}>
                  <Icon name="trophy" size={iconSize(18)} color="#FFD700" />
                  <Text style={[localStyles.insightText, {color: textColor}]}>
                    가장 열심히 한 날: <Text style={{color: accentColor, fontWeight: '600'}}>{weeklyData.bestDayLabel}요일</Text> ({formatTime(weeklyData.maxMinutes)})
                  </Text>
                </View>
              )}
              <View style={localStyles.insightRow}>
                <Icon name="flag" size={iconSize(18)} color={weeklyData.goalProgress >= 100 ? successColor : warningColor} />
                <Text style={[localStyles.insightText, {color: textColor}]}>
                  주간 목표 달성률: <Text style={{color: weeklyData.goalProgress >= 100 ? successColor : warningColor, fontWeight: '600'}}>{Math.round(weeklyData.goalProgress)}%</Text>
                </Text>
              </View>
              {weeklyData.studiedDays >= 5 && (
                <View style={localStyles.insightRow}>
                  <Icon name="star" size={iconSize(18)} color={successColor} />
                  <Text style={[localStyles.insightText, {color: textColor}]}>
                    일주일 중 <Text style={{color: successColor, fontWeight: '600'}}>{weeklyData.studiedDays}일</Text> 공부했어요! 훌륭해요!
                  </Text>
                </View>
              )}
            </View>
          </NotebookCard>
        </>
      ) : (
        <>
          {/* 월간 네비게이션 */}
          <View style={[localStyles.navigationContainer, {backgroundColor: isDark ? '#1A1A1A' : '#FAFAFA', borderColor: dividerColor}]}>
            <TouchableOpacity
              style={localStyles.navButton}
              onPress={() => setMonthOffset(monthOffset - 1)}>
              <Icon name="chevron-back" size={iconSize(20)} color={textColor} />
            </TouchableOpacity>
            <View style={localStyles.dateRangeCenter}>
              <Text style={[localStyles.navTitle, {color: textColor}]}>
                {monthlyData.year}년 {monthlyData.month + 1}월
              </Text>
              {monthOffset === 0 && <Text style={[localStyles.currentPeriodLabel, {color: accentColor}]}>이번 달</Text>}
            </View>
            <TouchableOpacity
              style={localStyles.navButton}
              onPress={() => setMonthOffset(monthOffset + 1)}
              disabled={monthOffset >= 0}>
              <Icon
                name="chevron-forward"
                size={iconSize(20)}
                color={monthOffset >= 0 ? dividerColor : textColor}
              />
            </TouchableOpacity>
          </View>

          {/* 월간 요약 */}
          <NotebookCard theme={theme} isDark={isDark} title="월간 요약" tapeColor="#FFB6C1">
            <View style={localStyles.summaryGrid}>
              <View style={localStyles.summaryItem}>
                <Icon name="time-outline" size={iconSize(24)} color={accentColor} />
                <Text style={[localStyles.summaryValue, {color: textColor}]}>
                  {formatTime(monthlyData.totalMinutes)}
                </Text>
                <Text style={[localStyles.summaryLabel, {color: subtextColor}]}>총 공부 시간</Text>
              </View>
              <View style={[localStyles.summaryDivider, {backgroundColor: dividerColor}]} />
              <View style={localStyles.summaryItem}>
                <Icon name="trending-up-outline" size={iconSize(24)} color={successColor} />
                <Text style={[localStyles.summaryValue, {color: textColor}]}>
                  {formatTime(monthlyData.avgMinutes)}
                </Text>
                <Text style={[localStyles.summaryLabel, {color: subtextColor}]}>일평균</Text>
              </View>
              <View style={[localStyles.summaryDivider, {backgroundColor: dividerColor}]} />
              <View style={localStyles.summaryItem}>
                <Icon name="flame" size={iconSize(24)} color={warningColor} />
                <Text style={[localStyles.summaryValue, {color: textColor}]}>
                  {monthlyData.studiedDays}일
                </Text>
                <Text style={[localStyles.summaryLabel, {color: subtextColor}]}>공부한 날</Text>
              </View>
            </View>
          </NotebookCard>

          {/* 월간 히트맵 */}
          <NotebookCard theme={theme} isDark={isDark} title="공부 달력" tapeColor="#E6E6FA">
            {renderMonthlyHeatmap()}
          </NotebookCard>

          {/* 요일별 평균 */}
          <NotebookCard theme={theme} isDark={isDark} title="요일별 평균" tapeColor="#98FB98">
            {renderDayOfWeekChart()}
            <View style={localStyles.chartInsight}>
              <Icon name="star" size={iconSize(16)} color="#FFD700" />
              <Text style={[localStyles.insightText, {color: textColor}]}>
                <Text style={{color: accentColor, fontWeight: '600'}}>{monthlyData.bestDayLabel}요일</Text>에 가장 집중을 잘해요!
              </Text>
            </View>
          </NotebookCard>
        </>
      )}
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: sp(16),
    marginTop: hp(12),
    marginBottom: hp(16),
    borderRadius: 12,
    padding: sp(4),
    borderWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(10),
    borderRadius: 10,
    gap: sp(6),
  },
  tabText: {
    fontSize: fp(14),
    fontWeight: '600',
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: sp(16),
    marginBottom: hp(12),
    paddingVertical: hp(8),
    paddingHorizontal: sp(4),
    borderRadius: sp(12),
    borderWidth: 1,
  },
  navButton: {
    padding: sp(8),
  },
  navTitle: {
    fontSize: fp(15),
    fontWeight: '600',
  },
  dateRangeCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
  },
  currentPeriodLabel: {
    fontSize: fp(12),
    fontWeight: '600',
  },
  summaryGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: hp(4),
  },
  summaryDivider: {
    width: 1,
    height: 60,
  },
  summaryValue: {
    fontSize: fp(18),
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: fp(11),
  },
  chartContainer: {
    position: 'relative',
    marginTop: hp(8),
  },
  barChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: sp(4),
  },
  barColumn: {
    alignItems: 'center',
    gap: hp(4),
  },
  barWrapper: {
    justifyContent: 'flex-end',
  },
  bar: {
    minHeight: 4,
  },
  barValue: {
    height: hp(16),
    textAlign: 'center',
  },
  barLabel: {
    fontSize: fp(12),
    fontWeight: '500',
  },
  goalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderStyle: 'dashed',
  },
  goalLineLabel: {
    position: 'absolute',
    right: 0,
    top: -14,
    fontSize: fp(10),
  },
  heatmapContainer: {
    marginTop: hp(8),
  },
  heatmapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(8),
  },
  heatmapHeaderCell: {
    alignItems: 'center',
  },
  heatmapHeaderText: {
    fontSize: fp(11),
    fontWeight: '500',
  },
  heatmapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: sp(4),
  },
  heatmapCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heatmapDayText: {
    fontSize: fp(10),
    fontWeight: '500',
  },
  heatmapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(12),
    gap: sp(6),
  },
  heatmapLegendBox: {
    width: 14,
    height: 14,
    borderRadius: 2,
  },
  heatmapLegendText: {
    fontSize: fp(10),
  },
  insightContainer: {
    gap: hp(12),
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(10),
  },
  insightText: {
    fontSize: fp(14),
    flex: 1,
  },
  chartInsight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(10),
    marginTop: hp(16),
  },
});

export default StudyReport;
