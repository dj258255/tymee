import {StyleSheet} from 'react-native';
import {sp, hp, fp} from '../utils/responsive';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // 날짜 헤더 (고정)
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: sp(20),
    paddingVertical: hp(12),
    borderBottomWidth: 1,
  },
  dateLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(6),
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
  },
  dateText: {
    fontSize: fp(18),
    fontWeight: '700',
  },
  ddayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(12),
    paddingVertical: hp(6),
    borderRadius: sp(16),
    gap: sp(6),
  },
  ddayTitle: {
    fontSize: fp(11),
    fontWeight: '600',
  },
  ddayCount: {
    fontSize: fp(14),
    fontWeight: '800',
  },
  ddayPlaceholder: {
    fontSize: fp(12),
    fontWeight: '600',
  },
  todayButton: {
    paddingHorizontal: sp(10),
    paddingVertical: hp(4),
    borderRadius: sp(10),
  },
  todayButtonText: {
    color: '#fff',
    fontSize: fp(12),
    fontWeight: '600',
  },
  // 탭 바
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: hp(10),
    gap: sp(4),
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomWidth: 2,
  },
  tabLabel: {
    fontSize: fp(11),
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  // 코멘트/메모
  editContainer: {
    gap: hp(12),
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: sp(8),
    padding: sp(12),
    fontSize: fp(14),
    minHeight: hp(60),
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: sp(8),
  },
  editButton: {
    paddingHorizontal: sp(16),
    paddingVertical: hp(8),
    borderRadius: sp(8),
  },
  editButtonText: {
    fontSize: fp(13),
    fontWeight: '600',
  },
  commentText: {
    fontSize: fp(15),
    fontWeight: '500',
    fontStyle: 'italic',
    lineHeight: fp(22),
  },
  commentPlaceholder: {
    fontSize: fp(14),
    fontStyle: 'italic',
  },
  memoContainer: {
    minHeight: hp(80),
  },
  memoInput: {
    borderWidth: 1,
    borderRadius: sp(8),
    padding: sp(12),
    fontSize: fp(14),
    minHeight: hp(120),
  },
  memoText: {
    fontSize: fp(14),
    lineHeight: fp(22),
  },
  memoPlaceholder: {
    fontSize: fp(14),
  },
  // 할 일 요약
  taskSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskSummaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: sp(4),
  },
  taskSummaryValue: {
    fontSize: fp(24),
    fontWeight: '800',
  },
  taskSummaryLabel: {
    fontSize: fp(11),
    fontWeight: '600',
  },
  taskSummaryDivider: {
    width: 1,
    height: hp(30),
  },
  // 타임테이블 요약
  todaySummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(12),
  },
  todayTimeValue: {
    fontSize: fp(32),
    fontWeight: '800',
    letterSpacing: -1,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(4),
    paddingHorizontal: sp(10),
    paddingVertical: hp(4),
    borderRadius: sp(12),
  },
  streakBadgeText: {
    fontSize: fp(12),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressContainer: {
    gap: hp(6),
  },
  progressBar: {
    height: hp(8),
    borderRadius: sp(4),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontSize: fp(11),
  },
  // 과목 버튼
  subjectButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(6),
  },
  addSubjectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(10),
    paddingVertical: hp(6),
    borderRadius: sp(14),
    gap: sp(4),
  },
  addSubjectButtonText: {
    fontSize: fp(12),
    fontWeight: '600',
  },
  manageSubjectButton: {
    padding: sp(6),
    borderRadius: sp(14),
  },
  // 통계
  mainStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(12),
  },
  mainStatItem: {
    gap: sp(4),
  },
  mainStatLabel: {
    fontSize: fp(12),
    fontWeight: '600',
  },
  mainStatValue: {
    fontSize: fp(32),
    fontWeight: '800',
    letterSpacing: -1,
  },
  periodStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  periodStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: sp(6),
  },
  periodStatLabel: {
    fontSize: fp(11),
    fontWeight: '600',
  },
  periodStatValue: {
    fontSize: fp(16),
    fontWeight: '800',
  },
  periodStatDivider: {
    width: 1,
    height: hp(40),
  },
  periodProgressBar: {
    width: '80%',
    height: hp(4),
    borderRadius: sp(2),
    overflow: 'hidden',
  },
  periodProgressFill: {
    height: '100%',
    borderRadius: sp(2),
  },
  streakStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: sp(8),
  },
  streakStatValue: {
    fontSize: fp(28),
    fontWeight: '800',
  },
  streakStatLabel: {
    fontSize: fp(12),
    fontWeight: '600',
  },
  streakStatDivider: {
    width: 1,
    height: hp(60),
  },
  subjectStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(12),
  },
  subjectStatInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: sp(70),
    gap: sp(8),
  },
  subjectDot: {
    width: sp(10),
    height: sp(10),
    borderRadius: sp(5),
  },
  subjectStatName: {
    fontSize: fp(12),
    fontWeight: '600',
  },
  subjectStatBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
  },
  subjectStatBar: {
    flex: 1,
    height: hp(8),
    borderRadius: sp(4),
    overflow: 'hidden',
  },
  subjectStatFill: {
    height: '100%',
    borderRadius: sp(4),
  },
  subjectStatTime: {
    fontSize: fp(11),
    fontWeight: '600',
    minWidth: sp(55),
    textAlign: 'right',
  },
  // 메모 통계
  memoStatList: {
    gap: sp(10),
  },
  memoStatCard: {
    // padding, borderWidth, borderRadius는 theme에서 설정
  },
  memoStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(10),
    marginBottom: hp(6),
  },
  memoStatTime: {
    fontSize: fp(12),
    fontWeight: '600',
  },
  memoStatSubject: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(8),
    paddingVertical: hp(3),
    borderRadius: sp(10),
    gap: sp(4),
  },
  memoStatDot: {
    width: sp(6),
    height: sp(6),
    borderRadius: sp(3),
  },
  memoStatSubjectText: {
    fontSize: fp(10),
    fontWeight: '600',
  },
  memoStatText: {
    fontSize: fp(13),
    fontStyle: 'italic',
    lineHeight: fp(20),
    paddingLeft: sp(4),
  },
  emptyMemoContainer: {
    alignItems: 'center',
    paddingVertical: hp(30),
    gap: sp(8),
  },
  emptyMemoText: {
    fontSize: fp(14),
    fontWeight: '600',
  },
  emptyMemoSubtext: {
    fontSize: fp(12),
    textAlign: 'center',
  },
  // 공유 버튼
  storyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: sp(20),
    marginVertical: hp(16),
    paddingVertical: hp(16),
    borderRadius: sp(12),
    gap: sp(8),
    shadowColor: '#FF5252',
    shadowOffset: {width: 0, height: sp(4)},
    shadowOpacity: 0.3,
    shadowRadius: sp(8),
    elevation: 4,
  },
  storyButtonText: {
    fontSize: fp(16),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // 모달 공통
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: sp(20),
  },
  modalTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    marginBottom: hp(16),
    textAlign: 'center',
  },
  // 캘린더 모달
  calendarModalContent: {
    width: '100%',
    maxWidth: sp(360),
    borderRadius: sp(16),
    padding: sp(20),
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(16),
  },
  calendarTitle: {
    fontSize: fp(18),
    fontWeight: '700',
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: hp(8),
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: hp(8),
  },
  weekDayText: {
    fontSize: fp(12),
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dayTextContainer: {
    width: sp(36),
    height: sp(36),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: sp(18),
  },
  dayText: {
    fontSize: fp(14),
    fontWeight: '500',
  },
  eventDot: {
    width: sp(4),
    height: sp(4),
    borderRadius: sp(2),
    position: 'absolute',
    bottom: hp(4),
  },
  // D-day 모달
  ddayModalContent: {
    width: '100%',
    maxWidth: sp(320),
    borderRadius: sp(16),
    padding: sp(20),
  },
  ddayInput: {
    borderWidth: 1,
    borderRadius: sp(8),
    padding: sp(12),
    fontSize: fp(14),
    marginBottom: hp(12),
  },
  ddayDatePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
    borderWidth: 1,
    borderRadius: sp(8),
    padding: sp(12),
    marginBottom: hp(20),
  },
  ddayDateText: {
    fontSize: fp(14),
  },
  ddayButtons: {
    flexDirection: 'row',
    gap: sp(8),
  },
  ddayButton: {
    flex: 1,
    paddingVertical: hp(12),
    borderRadius: sp(8),
    alignItems: 'center',
  },
  ddayButtonText: {
    color: '#fff',
    fontSize: fp(14),
    fontWeight: '600',
  },
  ddayButtonTextDark: {
    fontSize: fp(14),
    fontWeight: '600',
  },
  // 캘린더 일정 스타일
  calendarEventsNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(6),
    marginBottom: hp(12),
    paddingHorizontal: sp(4),
  },
  calendarEventsNoteText: {
    fontSize: fp(11),
    flex: 1,
  },
  calendarEventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(12),
    borderBottomWidth: 1,
    gap: sp(12),
  },
  calendarEventCheckbox: {
    padding: sp(4),
  },
  calendarEventCheck: {
    width: sp(22),
    height: sp(22),
    borderRadius: sp(6),
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
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
    opacity: 0.6,
  },
  calendarEventTime: {
    fontSize: fp(12),
  },
  calendarEventHideButton: {
    padding: sp(8),
  },
  // 일일 목표 스타일
  dailyGoalContent: {
    gap: sp(4),
  },
  dailyGoalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dailyGoalTimeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: sp(4),
  },
  dailyGoalCurrentTime: {
    fontSize: fp(28),
    fontWeight: '800',
  },
  dailyGoalSeparator: {
    fontSize: fp(18),
    fontWeight: '500',
  },
  dailyGoalTargetTime: {
    fontSize: fp(18),
    fontWeight: '600',
  },
  dailyGoalPercent: {
    fontSize: fp(20),
    fontWeight: '700',
  },
  dailyGoalComplete: {
    fontSize: fp(14),
    fontWeight: '700',
    textAlign: 'center',
    marginTop: hp(8),
  },
  // 집중 탭 스타일
  focusSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  focusSummaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: sp(8),
  },
  focusSummaryValue: {
    fontSize: fp(24),
    fontWeight: '800',
  },
  focusSummaryLabel: {
    fontSize: fp(12),
    fontWeight: '600',
  },
  focusSummaryDivider: {
    width: 1,
    height: hp(60),
  },
  emptyFocusContainer: {
    alignItems: 'center',
    paddingVertical: hp(40),
    gap: sp(12),
  },
  emptyFocusText: {
    fontSize: fp(15),
    fontWeight: '600',
  },
  emptyFocusSubtext: {
    fontSize: fp(13),
  },
  focusSessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(14),
  },
  focusSessionList: {
    gap: hp(10),
  },
  focusSessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(14),
    paddingHorizontal: sp(14),
    borderRadius: sp(12),
    borderWidth: 1,
    overflow: 'hidden',
  },
  focusSessionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(12),
    flex: 1,
  },
  focusSessionIcon: {
    width: sp(36),
    height: sp(36),
    borderRadius: sp(18),
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusSessionInfo: {
    flex: 1,
    gap: sp(4),
  },
  focusSessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
  },
  focusSessionTime: {
    fontSize: fp(14),
    fontWeight: '600',
  },
  freeModeBadge: {
    paddingHorizontal: sp(8),
    paddingVertical: hp(2),
    borderRadius: sp(8),
  },
  freeModeBadgeText: {
    fontSize: fp(10),
    fontWeight: '600',
  },
  focusSessionDuration: {
    fontSize: fp(12),
  },
  sessionMemoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: sp(6),
    marginTop: hp(6),
    paddingVertical: hp(6),
    paddingHorizontal: sp(8),
    borderRadius: sp(6),
  },
  sessionMemoText: {
    flex: 1,
    fontSize: fp(11),
    lineHeight: fp(16),
  },
  focusSessionStatus: {
    paddingHorizontal: sp(12),
    paddingVertical: hp(6),
    borderRadius: sp(12),
  },
  focusSessionStatusText: {
    fontSize: fp(11),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  breakSessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(12),
    gap: sp(10),
  },
  breakSessionText: {
    flex: 1,
    fontSize: fp(13),
  },
  breakSessionDuration: {
    fontSize: fp(12),
  },
  // 통계 탭 집중 기록 스타일
  focusStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  focusStatsItem: {
    flex: 1,
    alignItems: 'center',
    gap: sp(6),
  },
  focusStatsValue: {
    fontSize: fp(18),
    fontWeight: '800',
  },
  focusStatsLabel: {
    fontSize: fp(11),
    fontWeight: '600',
  },
  focusStatsDivider: {
    width: 1,
    height: hp(50),
  },
  // 집중 탭 도움말
  focusHelpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(6),
    paddingHorizontal: sp(12),
    paddingVertical: hp(8),
    borderRadius: sp(16),
  },
  focusHelpText: {
    fontSize: fp(12),
    fontWeight: '600',
  },
  // 통계 가이드 버튼 (NotebookCard rightAction용)
  statsGuideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(4),
    paddingHorizontal: sp(8),
    paddingVertical: hp(4),
    borderRadius: sp(12),
  },
  statsGuideText: {
    fontSize: fp(11),
    fontWeight: '600',
  },
  focusHelpModal: {
    width: '90%',
    maxWidth: sp(360),
    borderRadius: sp(16),
    padding: sp(20),
  },
  focusHelpTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    marginBottom: hp(16),
    textAlign: 'center',
  },
  focusHelpItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: sp(12),
    marginBottom: hp(16),
  },
  focusHelpItemIcon: {
    width: sp(32),
    height: sp(32),
    borderRadius: sp(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusHelpItemContent: {
    flex: 1,
    flexShrink: 1,
  },
  focusHelpItemTitle: {
    fontSize: fp(14),
    fontWeight: '700',
    marginBottom: hp(4),
  },
  focusHelpItemDesc: {
    fontSize: fp(12),
    lineHeight: fp(18),
  },
  focusHelpCloseButton: {
    marginTop: hp(8),
    paddingVertical: hp(12),
    borderRadius: sp(8),
    alignItems: 'center',
  },
  focusHelpCloseText: {
    fontSize: fp(14),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // 원형 차트 버튼
  pieChartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp(8),
    marginTop: hp(12),
    paddingVertical: hp(10),
    borderRadius: sp(8),
  },
  pieChartButtonText: {
    fontSize: fp(13),
    fontWeight: '600',
  },
  // 원형 차트 모달
  pieChartModal: {
    width: '90%',
    maxHeight: '85%',
    borderRadius: sp(20),
    padding: sp(20),
  },
  pieChartModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(20),
  },
  pieChartModalTitle: {
    fontSize: fp(20),
    fontWeight: '700',
  },
  pieChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(20),
    position: 'relative',
  },
  pieChartCenterText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieChartTotalLabel: {
    fontSize: fp(12),
  },
  pieChartTotalValue: {
    fontSize: fp(18),
    fontWeight: '700',
  },
  emptyChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: sp(200),
    gap: sp(12),
  },
  emptyChartText: {
    fontSize: fp(14),
  },
  pieChartLegend: {
    maxHeight: hp(200),
    marginBottom: hp(16),
  },
  pieChartLegendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(10),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.1)',
  },
  pieChartLegendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(10),
    flex: 1,
  },
  pieChartLegendDot: {
    width: sp(12),
    height: sp(12),
    borderRadius: sp(6),
  },
  pieChartLegendName: {
    fontSize: fp(14),
    fontWeight: '600',
  },
  pieChartLegendRight: {
    alignItems: 'flex-end',
    gap: sp(2),
  },
  pieChartLegendPercent: {
    fontSize: fp(16),
    fontWeight: '700',
  },
  pieChartLegendTime: {
    fontSize: fp(12),
  },
  pieChartCloseButton: {
    paddingVertical: hp(14),
    borderRadius: sp(10),
    alignItems: 'center',
  },
  pieChartCloseText: {
    fontSize: fp(15),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // 목표 설정 모달
  goalModal: {
    width: '85%',
    borderRadius: sp(16),
    padding: sp(20),
  },
  goalModalTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: hp(8),
  },
  goalModalDesc: {
    fontSize: fp(13),
    textAlign: 'center',
    marginBottom: hp(20),
  },
  goalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp(12),
    marginBottom: hp(16),
  },
  goalInput: {
    width: sp(80),
    height: hp(50),
    borderRadius: sp(12),
    borderWidth: 1,
    fontSize: fp(24),
    fontWeight: '700',
    textAlign: 'center',
  },
  goalInputLabel: {
    fontSize: fp(18),
    fontWeight: '600',
  },
  goalQuickOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: sp(8),
    marginBottom: hp(20),
  },
  goalQuickOption: {
    paddingHorizontal: sp(14),
    paddingVertical: hp(8),
    borderRadius: sp(20),
    borderWidth: 1,
  },
  goalQuickOptionText: {
    fontSize: fp(13),
    fontWeight: '600',
  },
  goalModalButtons: {
    flexDirection: 'row',
    gap: sp(12),
  },
  goalModalButton: {
    flex: 1,
    paddingVertical: hp(14),
    borderRadius: sp(10),
    alignItems: 'center',
  },
  goalModalCancelButton: {
    borderWidth: 1,
  },
  goalModalButtonText: {
    fontSize: fp(15),
    fontWeight: '700',
  },
  // 기간별 통계 날짜 범위 모달
  dateRangeModal: {
    width: '90%',
    borderRadius: sp(16),
    padding: sp(20),
  },
  dateRangeTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp(12),
    marginBottom: hp(16),
  },
  dateRangeTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: hp(12),
    borderRadius: sp(12),
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dateRangeTabLabel: {
    fontSize: fp(11),
    marginBottom: hp(4),
  },
  dateRangeTabValue: {
    fontSize: fp(16),
    fontWeight: '700',
  },
  dateRangeButtons: {
    flexDirection: 'row',
    gap: sp(12),
    marginTop: hp(16),
  },
  dateRangeButton: {
    flex: 1,
    paddingVertical: hp(14),
    borderRadius: sp(10),
    alignItems: 'center',
    borderWidth: 1,
  },
  dateRangeButtonPrimary: {
    borderWidth: 0,
  },
  dateRangeButtonText: {
    fontSize: fp(15),
    fontWeight: '700',
  },
  // 통계탭 기간 선택 버튼
  periodSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(6),
    paddingHorizontal: sp(12),
    paddingVertical: hp(8),
    borderRadius: sp(16),
  },
  periodSelectButtonText: {
    fontSize: fp(12),
    fontWeight: '600',
  },
  // 커스텀 기간 통계 - 포스트잇 스타일
  customPeriodPostIt: {
    marginTop: hp(16),
    padding: sp(16),
    borderRadius: sp(4),
    position: 'relative',
    overflow: 'visible',
  },
  customPeriodTape: {
    position: 'absolute',
    top: -hp(6),
    left: '50%',
    marginLeft: -sp(20),
    width: sp(40),
    height: hp(12),
    borderRadius: sp(2),
  },
  customPeriodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(12),
  },
  customPeriodDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(6),
  },
  customPeriodTitle: {
    fontSize: fp(13),
    fontWeight: '600',
    fontFamily: 'System',
  },
  customPeriodClear: {
    padding: sp(4),
  },
  customPeriodValue: {
    fontSize: fp(28),
    fontWeight: '800',
    textAlign: 'center',
    marginTop: hp(4),
  },
  // 기존 스타일 (미사용 - 이전 호환성)
  customPeriodStats: {
    marginTop: hp(16),
    padding: sp(12),
    borderRadius: sp(12),
  },
  customPeriodRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customPeriodItem: {
    flex: 1,
    alignItems: 'center',
    gap: sp(4),
  },
  customPeriodLabel: {
    fontSize: fp(12),
    fontWeight: '600',
  },
  customPeriodDivider: {
    width: 1,
    height: hp(40),
  },
  // 통계 탭 - 오늘의 기록 스타일
  statsDailyItem: {
    gap: sp(8),
  },
  statsDailySectionCard: {
    gap: sp(8),
  },
  statsDailyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(6),
  },
  statsDailyLabel: {
    fontSize: fp(12),
    fontWeight: '600',
  },
  statsDailyContent: {
    fontSize: fp(14),
    lineHeight: fp(20),
    fontStyle: 'italic',
  },
  statsDailyTasks: {
    gap: sp(10),
  },
  statsDailyTaskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: sp(10),
  },
  statsDailyTaskContent: {
    flex: 1,
    gap: sp(4),
  },
  statsDailyTaskText: {
    fontSize: fp(14),
    fontWeight: '500',
  },
  statsDailyTaskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
    flexWrap: 'wrap',
  },
  statsDailyTaskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(8),
    paddingVertical: sp(3),
    borderRadius: sp(10),
    gap: sp(4),
  },
  statsDailyTaskDot: {
    width: sp(6),
    height: sp(6),
    borderRadius: sp(3),
  },
  statsDailyTaskBadgeText: {
    fontSize: fp(11),
    fontWeight: '600',
  },
  statsDailyMore: {
    fontSize: fp(12),
    marginTop: hp(4),
  },
  // 할 일 완료율 진행바 스타일
  taskCompletionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(10),
    marginBottom: hp(4),
  },
  taskCompletionBar: {
    flex: 1,
    height: hp(6),
    borderRadius: sp(3),
    overflow: 'hidden',
  },
  taskCompletionProgress: {
    height: '100%',
    borderRadius: sp(3),
  },
  taskCompletionText: {
    fontSize: fp(12),
    fontWeight: '600',
    minWidth: sp(36),
    textAlign: 'right',
  },
  taskAchievementProgress: {
    height: '100%',
    borderRadius: sp(3),
  },
  taskEstimatedTime: {
    fontSize: fp(11),
    marginLeft: sp(4),
  },
  // 리포트 바로가기 버튼
  reportShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: sp(16),
    marginVertical: hp(8),
    padding: sp(16),
    borderRadius: sp(12),
    borderWidth: 1,
  },
  reportShortcutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(12),
  },
  reportShortcutText: {
    gap: hp(2),
  },
  reportShortcutTitle: {
    fontSize: fp(15),
    fontWeight: '600',
  },
  reportShortcutDesc: {
    fontSize: fp(12),
  },
  // D-day 목록 스타일
  ddayListContainer: {
    gap: hp(8),
  },
  ddayListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(12),
    paddingHorizontal: sp(14),
    borderRadius: sp(10),
    borderWidth: 1,
  },
  ddayListItemPrimary: {
    borderWidth: 2,
  },
  ddayItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(12),
    flex: 1,
  },
  ddayItemIcon: {
    width: sp(36),
    height: sp(36),
    borderRadius: sp(18),
    justifyContent: 'center',
    alignItems: 'center',
  },
  ddayItemContent: {
    flex: 1,
    gap: sp(2),
  },
  ddayItemTitle: {
    fontSize: fp(14),
    fontWeight: '600',
  },
  ddayItemDate: {
    fontSize: fp(11),
  },
  ddayItemRemaining: {
    fontSize: fp(16),
    fontWeight: '800',
  },
  ddayPrimaryBadge: {
    paddingHorizontal: sp(8),
    paddingVertical: hp(2),
    borderRadius: sp(10),
    marginLeft: sp(8),
  },
  ddayPrimaryBadgeText: {
    fontSize: fp(10),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  ddayAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(14),
    borderRadius: sp(10),
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: sp(8),
    marginTop: hp(4),
  },
  ddayAddText: {
    fontSize: fp(14),
    fontWeight: '600',
  },
  ddayEmptyText: {
    fontSize: fp(13),
    textAlign: 'center',
    paddingVertical: hp(16),
  },
  // 주간/월간/연간 목표 스타일
  goalsContainer: {
    gap: hp(16),
  },
  goalSection: {
    gap: hp(10),
  },
  goalSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
  },
  goalSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
  },
  goalSectionTitle: {
    fontSize: fp(14),
    fontWeight: '700',
  },
  goalSectionDate: {
    fontSize: fp(13),
    fontWeight: '500',
  },
  goalSectionCount: {
    fontSize: fp(12),
    fontWeight: '600',
  },
  goalAddButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(4),
    paddingHorizontal: sp(10),
    paddingVertical: hp(6),
    borderRadius: sp(14),
  },
  goalAddButtonSmallText: {
    fontSize: fp(12),
    fontWeight: '600',
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
    paddingVertical: hp(10),
    paddingHorizontal: sp(12),
    borderRadius: sp(10),
    borderWidth: 1,
    marginBottom: hp(8),
  },
  goalDragHandle: {
    padding: sp(4),
    marginRight: sp(4),
  },
  goalItemCheckbox: {
    padding: sp(2),
  },
  goalItemCheck: {
    width: sp(22),
    height: sp(22),
    borderRadius: sp(6),
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalItemContent: {
    flex: 1,
    gap: sp(4),
  },
  goalItemText: {
    fontSize: fp(14),
    fontWeight: '500',
    lineHeight: fp(20),
  },
  goalItemTextCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  goalItemDate: {
    fontSize: fp(11),
  },
  goalItemDelete: {
    padding: sp(4),
  },
  goalEmptyText: {
    fontSize: fp(12),
    textAlign: 'center',
    paddingVertical: hp(8),
  },
  goalAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(14),
    borderRadius: sp(10),
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: sp(8),
    marginTop: hp(8),
  },
  goalAddText: {
    fontSize: fp(14),
    fontWeight: '600',
  },
  goalItemCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  // 목표 추가 모달 스타일
  goalModalExtra: {
    width: '90%',
    maxWidth: sp(340),
    borderRadius: sp(16),
    padding: sp(20),
  },
  goalAddModal: {
    width: '90%',
    maxWidth: sp(340),
    borderRadius: sp(16),
    padding: sp(20),
  },
  goalAddModalTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: hp(16),
  },
  goalPeriodSelector: {
    flexDirection: 'row',
    gap: sp(8),
    marginBottom: hp(16),
  },
  goalPeriodButton: {
    flex: 1,
    paddingVertical: hp(10),
    borderRadius: sp(10),
    borderWidth: 1,
    alignItems: 'center',
  },
  goalPeriodButtonActive: {
    borderWidth: 2,
  },
  goalPeriodText: {
    fontSize: fp(13),
    fontWeight: '600',
  },
  goalContentInput: {
    borderWidth: 1,
    borderRadius: sp(10),
    padding: sp(14),
    fontSize: fp(14),
    minHeight: hp(100),
    textAlignVertical: 'top',
    marginBottom: hp(16),
  },
  goalAddModalButtons: {
    flexDirection: 'row',
    gap: sp(10),
  },
  goalAddModalButton: {
    flex: 1,
    paddingVertical: hp(14),
    borderRadius: sp(10),
    alignItems: 'center',
  },
  goalAddModalButtonText: {
    fontSize: fp(15),
    fontWeight: '700',
  },
});
