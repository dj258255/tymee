import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
  useWindowDimensions,
  InteractionManager,
  Appearance,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import {usePomodoroStore} from '../store/pomodoroStore';
import {useThemeStore} from '../store/themeStore';
import TimeTimer from '../components/TimeTimer';
import {TimerMode} from '../types/pomodoro';
import {safeGetColorScheme, safeAddAppearanceListener} from '../utils/appearance';

const PomodoroScreen: React.FC = () => {
  const [systemColorScheme, setSystemColorScheme] = useState<'light' | 'dark'>('light');
  const [showControls, setShowControls] = useState(false);

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

  const {themeMode} = useThemeStore();

  const isDark =
    themeMode === 'system'
      ? systemColorScheme === 'dark'
      : themeMode === 'dark';
  const {width, height} = useWindowDimensions();
  const isLandscape = width > height;

  const {
    mode,
    timeLeft,
    isRunning,
    completedSessions,
    settings,
    isFullscreen,
    setTimeLeft,
    setIsRunning,
    setIsFullscreen,
    tick,
    reset,
    setMode,
  } = usePomodoroStore();

  // Timer tick effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        tick();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, tick]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTotalDuration = (): number => {
    switch (mode) {
      case 'WORK':
        return settings.workDuration * 60;
      case 'SHORT_BREAK':
        return settings.shortBreakDuration * 60;
      case 'LONG_BREAK':
        return settings.longBreakDuration * 60;
    }
  };

  const getModeLabel = (currentMode: TimerMode): string => {
    switch (currentMode) {
      case 'WORK':
        return '집중 시간';
      case 'SHORT_BREAK':
        return '짧은 휴식';
      case 'LONG_BREAK':
        return '긴 휴식';
    }
  };

  const getModeColor = (currentMode: TimerMode): string => {
    const isAndroid = Platform.OS === 'android';

    // 안드로이드는 색상이 더 어둡게 보여서 보정
    switch (currentMode) {
      case 'WORK':
        return isAndroid ? '#FF6B6B' : '#FF5252'; // 안드로이드: 더 밝은 빨강
      case 'SHORT_BREAK':
        return isAndroid ? '#26C6DA' : '#00BCD4'; // 안드로이드: 더 밝은 청록
      case 'LONG_BREAK':
        return isAndroid ? '#42A5F5' : '#2196F3'; // 안드로이드: 더 밝은 파랑
    }
  };

  const progress = timeLeft / getTotalDuration(); // 남은 시간의 비율 (1 -> 0으로 감소)
  const currentColor = getModeColor(mode);


  const styles = getStyles(isDark);

  // 현재 시각 업데이트를 위한 state
  const [currentTime, setCurrentTime] = React.useState(new Date());

  // 현재 시각 업데이트 effect
  useEffect(() => {
    if (isFullscreen) {
      const timeInterval = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
      return () => clearInterval(timeInterval);
    }
  }, [isFullscreen]);

  // 가로모드 진입 시 컨트롤 표시
  useEffect(() => {
    if (isFullscreen && isLandscape) {
      setShowControls(true);
    }
  }, [isFullscreen, isLandscape]);

  // 가로모드에서 컨트롤 자동 숨김 (3초 후)
  useEffect(() => {
    if (isFullscreen && isLandscape && showControls) {
      const timer = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isFullscreen, isLandscape, showControls]);

  // 화면 터치로 컨트롤 토글
  const handleScreenPress = () => {
    if (isLandscape) {
      setShowControls(!showControls);
    }
  };

  const formatCurrentTime = (date: Date): string => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const formatCurrentDate = (date: Date): string => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[date.getDay()];
    return `${month}월 ${day}일 ${weekday}요일`;
  };

  // 전체화면 모드일 때
  if (isFullscreen) {
    // 화면 크기 계산
    const effectiveWidth = isLandscape ? Math.max(width, height) : Math.min(width, height);
    const effectiveHeight = isLandscape ? Math.min(width, height) : Math.max(width, height);

    // 반응형 폰트 크기
    const timeFontSize = isLandscape ? effectiveHeight * 0.28 : effectiveWidth * 0.2;
    const dateFontSize = isLandscape ? effectiveHeight * 0.06 : effectiveWidth * 0.04;
    const timerSize = isLandscape ? effectiveHeight * 0.8 : effectiveWidth * 0.88;

    return (
      <TouchableOpacity
        style={styles.fullscreenContainer}
        activeOpacity={1}
        onPress={handleScreenPress}>
        <StatusBar hidden={true} />

        <View style={[
          styles.fullscreenContent,
          !isLandscape && styles.fullscreenContentPortrait
        ]} pointerEvents="box-none">
          {/* 세로 모드 레이아웃 */}
          {!isLandscape ? (
            <>
              {/* 현재 시각 섹션 - 맨 위 */}
              <View style={styles.currentTimeSectionPortrait}>
                <Text
                  style={[
                    styles.currentTimeTextPortrait,
                    {fontSize: timeFontSize}
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit>
                  {formatCurrentTime(currentTime)}
                </Text>
                <Text
                  style={[
                    styles.currentDateTextPortrait,
                    {fontSize: dateFontSize}
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit>
                  {formatCurrentDate(currentTime)}
                </Text>
              </View>

              {/* 타이머 섹션 - 가운데 */}
              <View style={styles.fullscreenTimerContainerPortrait}>
                <TimeTimer
                  size={timerSize}
                  progress={progress}
                  color={currentColor}
                  backgroundColor={isDark ? '#F5F5F5' : '#FFFFFF'}
                  timeText={formatTime(timeLeft)}
                  totalSeconds={getTotalDuration()}
                />

                {/* 재생 버튼 - 타이머 아래 */}
                <TouchableOpacity
                  style={[
                    styles.fullscreenPlayButtonBelowTimer,
                    {backgroundColor: currentColor}
                  ]}
                  onPress={() => setIsRunning(!isRunning)}>
                  <Icon
                    name={isRunning ? 'pause' : 'play'}
                    size={48}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              {/* 가로 모드 레이아웃 (기존) */}
              <View style={styles.currentTimeSection}>
                <Text
                  style={[
                    styles.currentDateText,
                    {fontSize: dateFontSize}
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit>
                  {formatCurrentDate(currentTime)}
                </Text>
                <Text
                  style={[
                    styles.currentTimeText,
                    {fontSize: timeFontSize}
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit>
                  {formatCurrentTime(currentTime)}
                </Text>
              </View>

              <View style={styles.fullscreenTimerContainer}>
                <TimeTimer
                  size={timerSize}
                  progress={progress}
                  color={currentColor}
                  backgroundColor={isDark ? '#F5F5F5' : '#FFFFFF'}
                  timeText={formatTime(timeLeft)}
                  totalSeconds={getTotalDuration()}
                />
              </View>
            </>
          )}
        </View>

        {/* 가로 모드 재생 버튼 - 항상 렌더링하되 opacity로 제어 */}
        {isLandscape && (
          <TouchableOpacity
            style={[
              styles.fullscreenPlayButtonCenter,
              {backgroundColor: currentColor},
              !showControls && {opacity: 0, pointerEvents: 'none'}
            ]}
            onPress={() => setIsRunning(!isRunning)}>
            <Icon
              name={isRunning ? 'pause' : 'play'}
              size={48}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        )}

        {/* X 버튼 - 가로모드에서는 opacity로 제어, 세로모드에서는 항상 표시 */}
        <TouchableOpacity
          style={[
            styles.exitFullscreenButton,
            {top: 32, bottom: undefined},
            isLandscape && !showControls && {opacity: 0, pointerEvents: 'none'}
          ]}
          onPress={() => setIsFullscreen(false)}>
          <Text style={styles.exitFullscreenText}>✕</Text>
        </TouchableOpacity>

      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={Platform.OS === 'ios'}
        scrollEventThrottle={16}
        decelerationRate="normal"
        bounces={true}>
        {/* Mode Tabs */}
        <View style={styles.modeContainer}>
          {(['WORK', 'SHORT_BREAK', 'LONG_BREAK'] as TimerMode[]).map(
            (m) => (
              <TouchableOpacity
                key={m}
                style={[
                  styles.modeTab,
                  mode === m && {
                    ...styles.modeTabActive,
                    backgroundColor: getModeColor(m),
                  },
                ]}
                onPress={() => setMode(m)}
                disabled={isRunning}>
                <Text
                  style={[
                    styles.modeTabText,
                    mode === m && styles.modeTabTextActive,
                  ]}>
                  {getModeLabel(m)}
                </Text>
              </TouchableOpacity>
            ),
          )}
        </View>

        {/* Timer Display */}
        <View style={styles.timerContainer}>
          {/* 전체화면 버튼 - 타이머 원 기준 왼쪽 위 */}
          <TouchableOpacity
            style={styles.fullscreenBtn}
            onPress={() => setIsFullscreen(true)}>
            <Icon
              name="expand"
              size={24}
              color={isDark ? '#AAAAAA' : '#666666'}
            />
          </TouchableOpacity>
          <TimeTimer
            size={320}
            progress={progress}
            color={currentColor}
            backgroundColor={isDark ? '#F5F5F5' : '#FFFFFF'}
            timeText={formatTime(timeLeft)}
            totalSeconds={getTotalDuration()}
          />
        </View>

        {/* Control Buttons */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton, {backgroundColor: currentColor}]}
            onPress={() => setIsRunning(!isRunning)}>
            <Text style={styles.buttonText}>
              {isRunning ? '일시정지' : '시작'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={reset}>
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              초기화
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{completedSessions}</Text>
            <Text style={styles.statLabel}>완료</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {Math.floor((completedSessions * settings.workDuration) / 60)}시간{' '}
              {(completedSessions * settings.workDuration) % 60}분
            </Text>
            <Text style={styles.statLabel}>집중 시간</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#121212' : '#FAFAFA',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingTop: 60,
      paddingHorizontal: 24,
      paddingBottom: 120,
    },
    fullscreenBtn: {
      position: 'absolute',
      top: 0,
      left: 0,
      zIndex: 10,
      padding: 12,
      borderRadius: 24,
      backgroundColor: isDark ? '#2A2A2A' : '#F0F0F0',
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: isDark ? '#FFFFFF' : '#1A1A1A',
      letterSpacing: -0.5,
    },
    sessionCounter: {
      fontSize: 14,
      color: isDark ? '#999999' : '#757575',
      marginTop: 4,
      fontWeight: '500',
    },
    modeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 32,
      gap: 8,
      backgroundColor: isDark ? '#1E1E1E' : '#EFEFEF',
      borderRadius: 14,
      padding: 4,
    },
    modeTab: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 10,
      alignItems: 'center',
    },
    modeTabActive: {
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 3},
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 6,
    },
    modeTabText: {
      fontSize: 11,
      fontWeight: '700',
      color: isDark ? '#666666' : '#888888',
      letterSpacing: 0.3,
    },
    modeTabTextActive: {
      color: '#FFFFFF',
    },
    timerContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 40,
      position: 'relative',
    },
    timerContent: {
      position: 'absolute',
      alignItems: 'center',
    },
    timerText: {
      fontSize: 56,
      fontWeight: 'bold',
      color: isDark ? '#FFFFFF' : '#333333',
      fontVariant: ['tabular-nums'],
    },
    modeLabel: {
      fontSize: 18,
      color: isDark ? '#AAAAAA' : '#666666',
      marginTop: 8,
    },
    controls: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 12,
      marginBottom: 32,
      paddingHorizontal: 16,
    },
    button: {
      paddingVertical: 18,
      paddingHorizontal: 40,
      borderRadius: 16,
      minWidth: 140,
      alignItems: 'center',
    },
    primaryButton: {
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 8,
    },
    secondaryButton: {
      backgroundColor: isDark ? '#252525' : '#E8E8E8',
      borderWidth: 1,
      borderColor: isDark ? '#3A3A3A' : '#D0D0D0',
    },
    buttonText: {
      fontSize: 17,
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },
    secondaryButtonText: {
      color: isDark ? '#999999' : '#666666',
    },
    stats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
      borderRadius: 20,
      padding: 24,
      marginHorizontal: 4,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: isDark ? 0.3 : 0.08,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: 1,
      borderColor: isDark ? '#2A2A2A' : '#F0F0F0',
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statValue: {
      fontSize: 26,
      fontWeight: '800',
      color: isDark ? '#FFFFFF' : '#1A1A1A',
      marginBottom: 6,
      letterSpacing: -0.5,
    },
    statLabel: {
      fontSize: 13,
      color: isDark ? '#999999' : '#757575',
      fontWeight: '600',
      letterSpacing: 0.2,
    },
    statDivider: {
      width: 1,
      backgroundColor: isDark ? '#2A2A2A' : '#E8E8E8',
      marginHorizontal: 16,
    },
    bottomNav: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
      paddingVertical: 8,
      paddingBottom: 8,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#2A2A2A' : '#F0F0F0',
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: -2},
      shadowOpacity: isDark ? 0.3 : 0.05,
      shadowRadius: 8,
      elevation: 10,
    },
    navItem: {
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      paddingVertical: 4,
    },
    navIcon: {
      fontSize: 26,
      marginBottom: 4,
      opacity: 0.4,
    },
    navIconActive: {
      opacity: 1,
    },
    navLabel: {
      fontSize: 11,
      color: isDark ? '#666666' : '#888888',
      fontWeight: '600',
      letterSpacing: 0.2,
    },
    navLabelActive: {
      color: isDark ? '#FFFFFF' : '#1A1A1A',
      fontWeight: '700',
    },
    fullscreenContainer: {
      flex: 1,
      backgroundColor: isDark ? '#121212' : '#FAFAFA',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    fullscreenContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      paddingHorizontal: 40,
      gap: 40,
    },
    currentTimeSection: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    currentTimeText: {
      fontSize: 120,
      fontWeight: '800',
      color: isDark ? '#FFFFFF' : '#1A1A1A',
      letterSpacing: -6,
      marginBottom: 32,
    },
    currentDateText: {
      fontSize: 24,
      fontWeight: '600',
      color: isDark ? '#999999' : '#666666',
      marginBottom: 20,
      letterSpacing: 0.5,
    },
    fullscreenModeLabel: {
      backgroundColor: isDark ? '#2A2A2A' : '#F0F0F0',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 28,
      marginBottom: 40,
      alignSelf: 'flex-start',
    },
    fullscreenModeLabelText: {
      fontSize: 15,
      fontWeight: '700',
      color: isDark ? '#AAAAAA' : '#666666',
      letterSpacing: 0.5,
    },
    exitFullscreenButton: {
      position: 'absolute',
      right: 32,
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: isDark ? 'rgba(42, 42, 42, 0.9)' : 'rgba(240, 240, 240, 0.9)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 3},
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 6,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    },
    exitFullscreenText: {
      fontSize: 22,
      color: isDark ? '#FFFFFF' : '#1A1A1A',
      fontWeight: '600',
    },
    rotateButton: {
      position: 'absolute',
      top: 32,
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: isDark ? 'rgba(42, 42, 42, 0.9)' : 'rgba(240, 240, 240, 0.9)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 3},
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 6,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    },
    rotateButtonText: {
      fontSize: 24,
      color: isDark ? '#FFFFFF' : '#1A1A1A',
      fontWeight: '600',
    },
    fullscreenTimerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    fullscreenPlayButton: {
      position: 'absolute',
      bottom: 20,
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 8,
    },
    fullscreenPlayButtonPortrait: {
      bottom: undefined,
      top: 340,
    },
    fullscreenPlayButtonLandscape: {
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 6},
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 12,
      marginTop: 8,
    },
    fullscreenPlayButtonText: {
      fontSize: 36,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    fullscreenPlayButtonCenter: {
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 6},
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 12,
    },
    // 세로 모드 스타일
    fullscreenContentPortrait: {
      flexDirection: 'column',
      paddingHorizontal: 24,
      paddingTop: 60,
      paddingBottom: 40,
      justifyContent: 'space-between',
      flex: 1,
    },
    currentTimeSectionPortrait: {
      alignItems: 'center',
      width: '100%',
      paddingTop: 20,
    },
    currentTimeTextPortrait: {
      fontSize: 72,
      fontWeight: '800',
      color: isDark ? '#FFFFFF' : '#1A1A1A',
      letterSpacing: -4,
      marginBottom: 8,
    },
    currentDateTextPortrait: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#999999' : '#666666',
      letterSpacing: 0.5,
    },
    fullscreenTimerContainerPortrait: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
    },
    fullscreenPlayButtonBelowTimer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 6},
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 12,
      marginTop: 40,
    },
  });

export default PomodoroScreen;
