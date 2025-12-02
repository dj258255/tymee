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
  SafeAreaView,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import {usePomodoroStore} from '../store/pomodoroStore';
import {useThemeStore} from '../store/themeStore';
import TimeTimer from '../components/TimeTimer';
import {TimerMode, TabName} from '../types/pomodoro';
import {safeGetColorScheme, safeAddAppearanceListener} from '../utils/appearance';
import AppBlocker from '../modules/AppBlocker';

const PomodoroScreen: React.FC = () => {
  const [systemColorScheme, setSystemColorScheme] = useState<'light' | 'dark'>('light');
  const [showControls, setShowControls] = useState(false);
  const [showTimerSettings, setShowTimerSettings] = useState(false);
  const [tempFocusDuration, setTempFocusDuration] = useState('25');
  const [tempBreakDuration, setTempBreakDuration] = useState('5');
  const [tempCycleCount, setTempCycleCount] = useState('4');
  const [tempAppMode, setTempAppMode] = useState<'FREE' | 'CONCENTRATION'>('FREE');
  const [tempBlockedTabs, setTempBlockedTabs] = useState<TabName[]>(['Store', 'Group', 'StudyRecord', 'More']);
  const [tempBlockedApps, setTempBlockedApps] = useState<string[]>([]);
  const [showUnlockPrompt, setShowUnlockPrompt] = useState(false);
  const [showAppSelector, setShowAppSelector] = useState(false);
  const [installedApps, setInstalledApps] = useState<Array<{packageName: string; appName: string}>>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [appBlockerPermission, setAppBlockerPermission] = useState<string>('notDetermined');
  const [accessibilityPermission, setAccessibilityPermission] = useState(false);

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
    completedCycles,
    currentCycle,
    settings,
    isFullscreen,
    setTimeLeft,
    setIsRunning,
    setIsFullscreen,
    tick,
    reset,
    setMode,
    updateSettings,
  } = usePomodoroStore();

  // Initialize temp values from settings
  useEffect(() => {
    setTempFocusDuration((settings.focusDuration || 25).toString());
    setTempBreakDuration((settings.breakDuration || 5).toString());
    setTempCycleCount((settings.cycleCount || 4).toString());
    setTempAppMode(settings.appMode || 'FREE');
    setTempBlockedTabs(settings.blockedTabs || ['Store', 'Group', 'StudyRecord', 'More']);
    setTempBlockedApps(settings.blockedApps || []);
  }, [settings]);

  // 앱 차단 권한 확인
  useEffect(() => {
    const checkPermission = async () => {
      try {
        if (Platform.OS === 'android') {
          const usageStats = await AppBlocker.checkUsageStatsPermission();
          const accessibility = await AppBlocker.checkAccessibilityPermission();
          setAppBlockerPermission(usageStats ? 'approved' : 'denied');
          setAccessibilityPermission(accessibility);
        } else {
          const status = await AppBlocker.getAuthorizationStatus();
          setAppBlockerPermission(status);
        }
      } catch (error) {
        console.log('App blocker not available:', error);
      }
    };
    checkPermission();
  }, []);

  const handleSaveTimerSettings = async () => {
    const focus = parseInt(tempFocusDuration) || 25;
    const breakTime = parseInt(tempBreakDuration) || 5;
    const cycles = parseInt(tempCycleCount) || 4;

    updateSettings({
      appMode: tempAppMode,
      focusDuration: focus,
      breakDuration: breakTime,
      cycleCount: cycles,
      blockedTabs: tempBlockedTabs,
      blockedApps: tempBlockedApps,
    });

    // 앱 차단 설정 적용
    if (tempAppMode === 'CONCENTRATION' && tempBlockedApps.length > 0) {
      try {
        await AppBlocker.blockApps(tempBlockedApps);
      } catch (error) {
        console.log('Failed to apply app blocking:', error);
      }
    }

    setShowTimerSettings(false);
  };

  const toggleBlockedTab = (tab: TabName) => {
    if (tab === 'Timer') return; // 타이머 탭은 차단할 수 없음

    setTempBlockedTabs(prev => {
      if (prev.includes(tab)) {
        return prev.filter(t => t !== tab);
      } else {
        return [...prev, tab];
      }
    });
  };

  const getTabLabel = (tab: TabName): string => {
    switch (tab) {
      case 'Timer': return '타이머';
      case 'Store': return '상점';
      case 'Group': return '그룹';
      case 'StudyRecord': return '공부 기록';
      case 'More': return '더보기';
      default: return tab;
    }
  };

  // 앱 목록 불러오기
  const loadInstalledApps = async () => {
    if (Platform.OS !== 'android') {
      // iOS에서는 Family Activity Picker 사용 필요
      return;
    }

    setLoadingApps(true);
    try {
      const apps = await AppBlocker.getInstalledApps();
      setInstalledApps(apps || []);
    } catch (error) {
      console.log('Failed to load installed apps:', error);
    } finally {
      setLoadingApps(false);
    }
  };

  // 차단할 앱 선택/해제
  const toggleBlockedApp = (packageName: string) => {
    setTempBlockedApps(prev => {
      if (prev.includes(packageName)) {
        return prev.filter(p => p !== packageName);
      } else {
        return [...prev, packageName];
      }
    });
  };

  // 사용 통계 권한 요청
  const requestUsageStatsPermission = async () => {
    Alert.alert(
      '사용 통계 권한 필요',
      Platform.OS === 'android'
        ? '앱 차단 기능을 사용하려면 사용 통계 접근 권한이 필요합니다.\n\n설정에서 "타이미" 앱을 찾아 권한을 허용해주세요.'
        : '앱 차단 기능을 사용하려면 Screen Time 권한이 필요합니다.',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '설정으로 이동',
          onPress: async () => {
            try {
              if (Platform.OS === 'android') {
                await AppBlocker.requestUsageStatsPermission();
                // 권한 상태 다시 확인 (사용자가 설정에서 돌아온 후)
                setTimeout(async () => {
                  const newUsageStats = await AppBlocker.checkUsageStatsPermission();
                  setAppBlockerPermission(newUsageStats ? 'approved' : 'denied');
                }, 1000);
              } else {
                const status = await AppBlocker.requestAuthorization();
                setAppBlockerPermission(status);
              }
            } catch (error) {
              console.log('Failed to request usage stats permission:', error);
            }
          },
        },
      ]
    );
  };

  // 접근성 서비스 권한 요청
  const requestAccessibilityPermission = async () => {
    Alert.alert(
      '접근성 서비스 권한 필요',
      '앱 차단 기능을 사용하려면 접근성 서비스 권한이 필요합니다.\n\n설정에서 "타이미" 앱을 찾아 서비스를 활성화해주세요.\n\n접근성 서비스는 다른 앱이 실행될 때를 감지하여 차단하는 데 사용됩니다.',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '설정으로 이동',
          onPress: async () => {
            try {
              await AppBlocker.requestAccessibilityPermission();
              // 권한 상태 다시 확인 (사용자가 설정에서 돌아온 후)
              setTimeout(async () => {
                const newAccessibility = await AppBlocker.checkAccessibilityPermission();
                setAccessibilityPermission(newAccessibility);
              }, 1000);
            } catch (error) {
              console.log('Failed to request accessibility permission:', error);
            }
          },
        },
      ]
    );
  };

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
      case 'FOCUS':
        return settings.focusDuration * 60;
      case 'BREAK':
        return settings.breakDuration * 60;
    }
  };

  const getModeLabel = (currentMode: TimerMode): string => {
    switch (currentMode) {
      case 'FOCUS':
        return '집중 시간';
      case 'BREAK':
        return '휴식 시간';
    }
  };

  const getModeColor = (currentMode: TimerMode): string => {
    const isAndroid = Platform.OS === 'android';

    // 안드로이드는 색상이 더 어둡게 보여서 보정
    switch (currentMode) {
      case 'FOCUS':
        return isAndroid ? '#FF6B6B' : '#FF5252'; // 집중: 빨강
      case 'BREAK':
        return isAndroid ? '#42A5F5' : '#2196F3'; // 휴식: 파랑 (기존 긴휴식 색상)
    }
  };

  const progress = timeLeft / getTotalDuration(); // 남은 시간의 비율 (1 -> 0으로 감소)
  const currentColor = getModeColor(mode);

  // 집중 모드에서 집중 시간일 때 잠금 상태
  const isLocked = settings.appMode === 'CONCENTRATION' && mode === 'FOCUS' && isRunning;

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
                  isRunning={isRunning}
                  onPlayPause={() => setIsRunning(!isRunning)}
                  showButton={true}
                />

                {/* 남은 시간 텍스트 - 타이머 아래 */}
                <Text style={[
                  styles.fullscreenTimeLeftText,
                  {color: isDark ? '#FFFFFF' : '#1A1A1A'}
                ]}>{formatTime(timeLeft)}</Text>
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
                  isRunning={isRunning}
                  onPlayPause={() => setIsRunning(!isRunning)}
                  showButton={true}
                />
              </View>
            </>
          )}
        </View>


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
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={Platform.OS === 'ios'}
        scrollEventThrottle={16}
        decelerationRate="normal"
        bounces={true}>
        {/* Current Mode Display */}
        <View style={[styles.mainModeIndicator, {
          backgroundColor: settings.appMode === 'FREE' ? '#FF5252' : '#2196F3',
        }]}>
          <Text style={styles.mainModeText}>
            {settings.appMode === 'FREE' ? '자유 모드' : '집중 모드'}
          </Text>
        </View>

        {/* Timer Mode Selection - 자유 모드일 때만 선택 가능 */}
        {settings.appMode === 'FREE' && (
          <View style={styles.timerModeContainer}>
            {(['FOCUS', 'BREAK'] as TimerMode[]).map((m) => (
              <TouchableOpacity
                key={m}
                style={[
                  styles.timerModeButton,
                  mode === m && {
                    ...styles.timerModeButtonActive,
                    backgroundColor: getModeColor(m),
                  },
                ]}
                onPress={() => setMode(m)}
                disabled={isRunning}>
                <Text
                  style={[
                    styles.timerModeButtonText,
                    mode === m && styles.timerModeButtonTextActive,
                  ]}>
                  {getModeLabel(m)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 집중 모드일 때 사이클 표시 */}
        {settings.appMode === 'CONCENTRATION' && (
          <View style={styles.cycleInfoContainer}>
            <Text style={[styles.cycleInfoText, {color: isDark ? '#AAAAAA' : '#666666'}]}>
              {currentCycle}/{settings.cycleCount} 사이클 · {getModeLabel(mode)}
            </Text>
          </View>
        )}

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
          {/* 시간 설정 버튼 - 타이머 원 기준 오른쪽 위 */}
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => setShowTimerSettings(true)}
            disabled={isRunning}>
            <Icon
              name="settings-outline"
              size={24}
              color={isRunning ? (isDark ? '#3A3A3A' : '#CCCCCC') : (isDark ? '#AAAAAA' : '#666666')}
            />
          </TouchableOpacity>
          <TimeTimer
            size={320}
            progress={progress}
            color={currentColor}
            backgroundColor={isDark ? '#F5F5F5' : '#FFFFFF'}
            timeText={formatTime(timeLeft)}
            totalSeconds={getTotalDuration()}
            isRunning={isRunning}
            onPlayPause={() => setIsRunning(!isRunning)}
            showButton={true}
          />
          {/* 남은 시간 텍스트 - 타이머 아래 */}
          <Text style={styles.timeLeftText}>{formatTime(timeLeft)}</Text>
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
      </ScrollView>

      {/* Timer Settings Modal */}
      <Modal
        visible={showTimerSettings}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTimerSettings(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                타이머 설정
              </Text>
              <TouchableOpacity onPress={() => setShowTimerSettings(false)}>
                <Icon name="close" size={28} color={isDark ? '#AAAAAA' : '#666666'} />
              </TouchableOpacity>
            </View>

            {/* Settings inputs */}
            <ScrollView
              style={styles.settingsInputContainer}
              showsVerticalScrollIndicator={false}>
              {/* App Mode Selection */}
              <View style={styles.settingItem}>
                <Text style={[styles.settingLabel, {color: isDark ? '#CCCCCC' : '#666666'}]}>
                  타이머 모드
                </Text>
                <View style={styles.appModeSelector}>
                  <TouchableOpacity
                    style={[
                      styles.appModeButton,
                      tempAppMode === 'FREE' && styles.appModeButtonActive,
                      {
                        backgroundColor: tempAppMode === 'FREE'
                          ? '#FF5252'
                          : (isDark ? '#2A2A2A' : '#F5F5F5'),
                      }
                    ]}
                    onPress={() => setTempAppMode('FREE')}>
                    <Text style={[
                      styles.appModeButtonText,
                      tempAppMode === 'FREE' && styles.appModeButtonTextActive,
                      {color: tempAppMode === 'FREE' ? '#FFFFFF' : (isDark ? '#999999' : '#666666')}
                    ]}>
                      자유 모드
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.appModeButton,
                      tempAppMode === 'CONCENTRATION' && styles.appModeButtonActive,
                      {
                        backgroundColor: tempAppMode === 'CONCENTRATION'
                          ? '#2196F3'
                          : (isDark ? '#2A2A2A' : '#F5F5F5'),
                      }
                    ]}
                    onPress={() => setTempAppMode('CONCENTRATION')}>
                    <Text style={[
                      styles.appModeButtonText,
                      tempAppMode === 'CONCENTRATION' && styles.appModeButtonTextActive,
                      {color: tempAppMode === 'CONCENTRATION' ? '#FFFFFF' : (isDark ? '#999999' : '#666666')}
                    ]}>
                      집중 모드
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Focus Duration */}
              <View style={styles.settingItem}>
                <Text style={[styles.settingLabel, {color: isDark ? '#CCCCCC' : '#666666'}]}>
                  집중 시간 (분)
                </Text>
                <TextInput
                  style={[styles.settingInput, {
                    backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
                    color: isDark ? '#FFFFFF' : '#1A1A1A',
                  }]}
                  value={tempFocusDuration}
                  onChangeText={setTempFocusDuration}
                  keyboardType="number-pad"
                  maxLength={3}
                  placeholder="25"
                  placeholderTextColor={isDark ? '#666666' : '#999999'}
                />
              </View>

              {/* Break Duration */}
              <View style={styles.settingItem}>
                <Text style={[styles.settingLabel, {color: isDark ? '#CCCCCC' : '#666666'}]}>
                  휴식 시간 (분)
                </Text>
                <TextInput
                  style={[styles.settingInput, {
                    backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
                    color: isDark ? '#FFFFFF' : '#1A1A1A',
                  }]}
                  value={tempBreakDuration}
                  onChangeText={setTempBreakDuration}
                  keyboardType="number-pad"
                  maxLength={3}
                  placeholder="5"
                  placeholderTextColor={isDark ? '#666666' : '#999999'}
                />
              </View>

              {/* Cycle Count - 집중 모드일 때만 표시 */}
              {tempAppMode === 'CONCENTRATION' && (
                <View style={styles.settingItem}>
                  <Text style={[styles.settingLabel, {color: isDark ? '#CCCCCC' : '#666666'}]}>
                    반복 횟수
                  </Text>
                  <TextInput
                    style={[styles.settingInput, {
                      backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
                      color: isDark ? '#FFFFFF' : '#1A1A1A',
                    }]}
                    value={tempCycleCount}
                    onChangeText={setTempCycleCount}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="4"
                    placeholderTextColor={isDark ? '#666666' : '#999999'}
                  />
                </View>
              )}

              {/* Blocked Tabs - 집중 모드일 때만 표시 */}
              {tempAppMode === 'CONCENTRATION' && (
                <View style={styles.settingItem}>
                  <Text style={[styles.settingLabel, {color: isDark ? '#CCCCCC' : '#666666'}]}>
                    차단할 탭
                  </Text>
                  <Text style={[styles.settingDescription, {color: isDark ? '#888888' : '#999999'}]}>
                    집중 시간 동안 접근을 차단할 탭을 선택하세요
                  </Text>
                  <View style={styles.blockedTabsContainer}>
                    {(['Store', 'Group', 'StudyRecord', 'More'] as TabName[]).map((tab) => (
                      <TouchableOpacity
                        key={tab}
                        style={[
                          styles.blockedTabButton,
                          {
                            backgroundColor: tempBlockedTabs.includes(tab)
                              ? '#FF5252'
                              : (isDark ? '#2A2A2A' : '#F5F5F5'),
                            borderColor: tempBlockedTabs.includes(tab)
                              ? '#FF5252'
                              : (isDark ? '#3A3A3A' : '#E0E0E0'),
                          },
                        ]}
                        onPress={() => toggleBlockedTab(tab)}>
                        <Icon
                          name={tempBlockedTabs.includes(tab) ? 'lock-closed' : 'lock-open'}
                          size={18}
                          color={tempBlockedTabs.includes(tab) ? '#FFFFFF' : (isDark ? '#AAAAAA' : '#666666')}
                        />
                        <Text style={[
                          styles.blockedTabButtonText,
                          {
                            color: tempBlockedTabs.includes(tab)
                              ? '#FFFFFF'
                              : (isDark ? '#AAAAAA' : '#666666'),
                          },
                        ]}>
                          {getTabLabel(tab)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Blocked Apps - 집중 모드일 때만 표시 (Android만) */}
              {tempAppMode === 'CONCENTRATION' && Platform.OS === 'android' && (
                <View style={styles.settingItem}>
                  <Text style={[styles.settingLabel, {color: isDark ? '#CCCCCC' : '#666666'}]}>
                    차단할 앱
                  </Text>
                  <Text style={[styles.settingDescription, {color: isDark ? '#888888' : '#999999'}]}>
                    집중 시간 동안 사용을 차단할 앱을 선택하세요
                  </Text>

                  {(appBlockerPermission !== 'approved' || !accessibilityPermission) && (
                    <View style={{gap: 8}}>
                      {appBlockerPermission !== 'approved' && (
                        <TouchableOpacity
                          style={[styles.permissionButton, {backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5'}]}
                          onPress={requestUsageStatsPermission}>
                          <Icon name="stats-chart" size={18} color="#FF5252" />
                          <Text style={[styles.permissionButtonText, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                            사용 통계 권한 허용하기
                          </Text>
                        </TouchableOpacity>
                      )}
                      {!accessibilityPermission && (
                        <TouchableOpacity
                          style={[styles.permissionButton, {backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5'}]}
                          onPress={requestAccessibilityPermission}>
                          <Icon name="accessibility" size={18} color="#FF5252" />
                          <Text style={[styles.permissionButtonText, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                            접근성 서비스 권한 허용하기
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {appBlockerPermission === 'approved' && accessibilityPermission && (
                    <TouchableOpacity
                      style={[styles.selectAppsButton, {backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5'}]}
                      onPress={() => {
                        setShowAppSelector(true);
                        loadInstalledApps();
                      }}>
                      <Icon name="apps" size={18} color={isDark ? '#AAAAAA' : '#666666'} />
                      <Text style={[styles.selectAppsButtonText, {color: isDark ? '#AAAAAA' : '#666666'}]}>
                        앱 선택 ({tempBlockedApps.length}개)
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* iOS 앱 차단 */}
              {tempAppMode === 'CONCENTRATION' && Platform.OS === 'ios' && (
                <View style={styles.settingItem}>
                  <Text style={[styles.settingLabel, {color: isDark ? '#CCCCCC' : '#666666'}]}>
                    앱 차단
                  </Text>
                  <Text style={[styles.settingDescription, {color: isDark ? '#888888' : '#999999'}]}>
                    iOS에서 앱 차단 기능은 Screen Time API를 사용합니다.{'\n'}
                    실제 기기에서만 작동하며, 시뮬레이터에서는 지원되지 않습니다.
                  </Text>

                  {appBlockerPermission !== 'approved' && (
                    <TouchableOpacity
                      style={[styles.permissionButton, {backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5'}]}
                      onPress={requestUsageStatsPermission}>
                      <Icon name="shield-checkmark" size={18} color="#FF5252" />
                      <Text style={[styles.permissionButtonText, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                        Screen Time 권한 허용하기
                      </Text>
                    </TouchableOpacity>
                  )}

                  {appBlockerPermission === 'approved' && (
                    <View style={[styles.permissionGranted, {backgroundColor: isDark ? '#1E3A1E' : '#E8F5E9'}]}>
                      <Icon name="checkmark-circle" size={18} color="#4CAF50" />
                      <Text style={[styles.permissionGrantedText, {color: isDark ? '#81C784' : '#2E7D32'}]}>
                        권한이 허용되었습니다
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>

            {/* Save button */}
            <TouchableOpacity
              style={[styles.modalSaveButton, {backgroundColor: currentColor}]}
              onPress={handleSaveTimerSettings}>
              <Text style={styles.modalSaveButtonText}>저장</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Lock Screen Overlay - 집중 모드 집중 시간일 때 */}
      {isLocked && (
        <Modal
          visible={true}
          animationType="fade"
          transparent={false}
          onRequestClose={() => setShowUnlockPrompt(true)}>
          <View style={[styles.lockScreen, {backgroundColor: isDark ? '#121212' : '#FAFAFA'}]}>
            <View style={styles.lockContent}>
              {/* Lock Icon */}
              <View style={[styles.lockIconContainer, {backgroundColor: currentColor}]}>
                <Icon name="lock-closed" size={60} color="#FFFFFF" />
              </View>

              {/* Lock Message */}
              <Text style={[styles.lockTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                집중 시간
              </Text>
              <Text style={[styles.lockSubtitle, {color: isDark ? '#AAAAAA' : '#666666'}]}>
                타이머가 종료되거나 일시정지할 때까지{'\n'}다른 기능을 사용할 수 없습니다
              </Text>

              {/* Timer Display */}
              <View style={styles.lockTimerContainer}>
                <TimeTimer
                  size={280}
                  progress={progress}
                  color={currentColor}
                  backgroundColor={isDark ? '#F5F5F5' : '#FFFFFF'}
                  timeText={formatTime(timeLeft)}
                  totalSeconds={getTotalDuration()}
                  isRunning={isRunning}
                  onPlayPause={() => setIsRunning(!isRunning)}
                  showButton={true}
                />
                <Text style={[styles.lockTimeText, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                  {formatTime(timeLeft)}
                </Text>
              </View>

              {/* Cycle Info */}
              <View style={[styles.lockCycleInfo, {backgroundColor: isDark ? '#1E1E1E' : '#F5F5F5'}]}>
                <Text style={[styles.lockCycleText, {color: isDark ? '#AAAAAA' : '#666666'}]}>
                  {currentCycle}/{settings.cycleCount} 사이클
                </Text>
              </View>

              {/* Pause Button */}
              <TouchableOpacity
                style={[styles.lockPauseButton, {backgroundColor: currentColor}]}
                onPress={() => setIsRunning(false)}>
                <Icon name="pause" size={24} color="#FFFFFF" />
                <Text style={styles.lockPauseButtonText}>일시정지</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Unlock Confirmation Prompt */}
      <Modal
        visible={showUnlockPrompt}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowUnlockPrompt(false)}>
        <View style={styles.unlockPromptOverlay}>
          <View style={[styles.unlockPromptContent, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
            <Icon name="alert-circle" size={56} color="#FF5252" />
            <Text style={[styles.unlockPromptTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
              집중을 중단하시겠습니까?
            </Text>
            <Text style={[styles.unlockPromptMessage, {color: isDark ? '#AAAAAA' : '#666666'}]}>
              타이머를 일시정지하면 잠금이 해제됩니다
            </Text>
            <View style={styles.unlockPromptButtons}>
              <TouchableOpacity
                style={[styles.unlockPromptButton, styles.unlockCancelButton, {backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5'}]}
                onPress={() => setShowUnlockPrompt(false)}>
                <Text style={[styles.unlockCancelButtonText, {color: isDark ? '#AAAAAA' : '#666666'}]}>
                  취소
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.unlockPromptButton, styles.unlockConfirmButton, {backgroundColor: '#FF5252'}]}
                onPress={() => {
                  setIsRunning(false);
                  setShowUnlockPrompt(false);
                }}>
                <Text style={styles.unlockConfirmButtonText}>일시정지</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* App Selector Modal - Android only */}
      <Modal
        visible={showAppSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAppSelector(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.appSelectorContent, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                차단할 앱 선택
              </Text>
              <TouchableOpacity onPress={() => setShowAppSelector(false)}>
                <Icon name="close" size={28} color={isDark ? '#AAAAAA' : '#666666'} />
              </TouchableOpacity>
            </View>

            {/* App List */}
            {loadingApps ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF5252" />
                <Text style={[styles.loadingText, {color: isDark ? '#AAAAAA' : '#666666'}]}>
                  앱 목록 불러오는 중...
                </Text>
              </View>
            ) : (
              <FlatList
                data={installedApps}
                keyExtractor={(item) => item.packageName}
                renderItem={({item}) => {
                  const isBlocked = tempBlockedApps.includes(item.packageName);
                  return (
                    <TouchableOpacity
                      style={[
                        styles.appItem,
                        {
                          backgroundColor: isBlocked
                            ? 'rgba(255, 82, 82, 0.1)'
                            : (isDark ? '#2A2A2A' : '#F5F5F5'),
                        },
                      ]}
                      onPress={() => toggleBlockedApp(item.packageName)}>
                      <View style={styles.appItemLeft}>
                        <Icon
                          name={isBlocked ? 'lock-closed' : 'lock-open'}
                          size={20}
                          color={isBlocked ? '#FF5252' : (isDark ? '#666666' : '#999999')}
                        />
                        <View style={styles.appItemInfo}>
                          <Text style={[styles.appItemName, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                            {item.appName}
                          </Text>
                          <Text style={[styles.appItemPackage, {color: isDark ? '#666666' : '#999999'}]}>
                            {item.packageName}
                          </Text>
                        </View>
                      </View>
                      {isBlocked && (
                        <Icon name="checkmark-circle" size={24} color="#FF5252" />
                      )}
                    </TouchableOpacity>
                  );
                }}
                ItemSeparatorComponent={() => <View style={{height: 8}} />}
                contentContainerStyle={styles.appListContent}
                showsVerticalScrollIndicator={false}
              />
            )}

            {/* Done button */}
            <TouchableOpacity
              style={[styles.appSelectorDoneButton, {backgroundColor: '#FF5252'}]}
              onPress={() => setShowAppSelector(false)}>
              <Text style={styles.appSelectorDoneButtonText}>
                완료 ({tempBlockedApps.length}개 선택)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
      paddingTop: 20,
      paddingHorizontal: 24,
      paddingBottom: 100, // 플로팅 탭바 높이(70) + 여백(30)
    },
    mainModeIndicator: {
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 24,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
    mainModeText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: 0.3,
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
    settingsBtn: {
      position: 'absolute',
      top: 0,
      right: 0,
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
      marginBottom: 36,
      gap: 10,
      backgroundColor: isDark ? '#1E1E1E' : '#F5F5F5',
      borderRadius: 16,
      padding: 5,
    },
    modeTab: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    modeTabActive: {
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
    modeTabText: {
      fontSize: 12,
      fontWeight: '600',
      color: isDark ? '#666666' : '#999999',
      letterSpacing: 0.2,
    },
    modeTabTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    timerModeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 24,
      gap: 12,
    },
    timerModeButton: {
      flex: 1,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      alignItems: 'center',
      backgroundColor: isDark ? '#1E1E1E' : '#F5F5F5',
      borderWidth: 1,
      borderColor: isDark ? '#2A2A2A' : '#E0E0E0',
    },
    timerModeButtonActive: {
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
      borderColor: 'transparent',
    },
    timerModeButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#666666' : '#999999',
      letterSpacing: 0.2,
    },
    timerModeButtonTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    cycleInfoContainer: {
      alignItems: 'center',
      marginBottom: 20,
      paddingVertical: 10,
      paddingHorizontal: 20,
      backgroundColor: isDark ? '#1E1E1E' : '#F5F5F5',
      borderRadius: 12,
      alignSelf: 'center',
    },
    cycleInfoText: {
      fontSize: 14,
      fontWeight: '600',
      letterSpacing: 0.3,
    },
    timerContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 40,
      position: 'relative',
    },
    timeLeftText: {
      fontSize: 48,
      fontWeight: '800',
      color: isDark ? '#FFFFFF' : '#1A1A1A',
      marginTop: 24,
      letterSpacing: -2,
      fontVariant: ['tabular-nums'],
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
      gap: 14,
      marginBottom: 36,
      paddingHorizontal: 20,
    },
    button: {
      paddingVertical: 16,
      paddingHorizontal: 36,
      borderRadius: 14,
      minWidth: 140,
      alignItems: 'center',
    },
    primaryButton: {
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 3},
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 6,
    },
    secondaryButton: {
      backgroundColor: isDark ? '#2A2A2A' : '#EFEFEF',
      borderWidth: 0,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: 0.3,
    },
    secondaryButtonText: {
      color: isDark ? '#AAAAAA' : '#666666',
    },
    stats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
      borderRadius: 18,
      padding: 26,
      marginHorizontal: 0,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: isDark ? 0.2 : 0.06,
      shadowRadius: 10,
      elevation: 3,
      borderWidth: 0,
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statValue: {
      fontSize: 28,
      fontWeight: '800',
      color: isDark ? '#FFFFFF' : '#1A1A1A',
      marginBottom: 8,
      letterSpacing: -0.8,
    },
    statLabel: {
      fontSize: 12,
      color: isDark ? '#999999' : '#888888',
      fontWeight: '600',
      letterSpacing: 0.3,
    },
    statDivider: {
      width: 1,
      backgroundColor: isDark ? '#2A2A2A' : '#EFEFEF',
      marginHorizontal: 20,
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
      position: 'absolute',
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
      zIndex: 10,
    },
    // 세로 모드 스타일
    fullscreenContentPortrait: {
      flexDirection: 'column',
      paddingHorizontal: 24,
      paddingTop: 40,
      paddingBottom: 40,
      justifyContent: 'flex-start',
      flex: 1,
    },
    currentTimeSectionPortrait: {
      alignItems: 'center',
      width: '100%',
      paddingTop: 30,
      paddingBottom: 10,
      marginBottom: 20,
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
      justifyContent: 'flex-start',
      flex: 1,
      marginTop: -20,
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
    fullscreenTimeLeftText: {
      fontSize: 64,
      fontWeight: '800',
      marginTop: 20,
      letterSpacing: -3,
      fontVariant: ['tabular-nums'],
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: '85%',
      borderRadius: 20,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 10,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: '700',
      letterSpacing: -0.5,
    },
    settingsInputContainer: {
      gap: 20,
      marginBottom: 24,
      maxHeight: 500,
    },
    settingItem: {
      gap: 8,
    },
    settingLabel: {
      fontSize: 15,
      fontWeight: '600',
      letterSpacing: 0.2,
    },
    settingInput: {
      padding: 16,
      borderRadius: 12,
      fontSize: 18,
      fontWeight: '600',
      textAlign: 'center',
    },
    appModeSelector: {
      flexDirection: 'row',
      gap: 10,
    },
    appModeButton: {
      flex: 1,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDark ? '#3A3A3A' : '#E0E0E0',
    },
    appModeButtonActive: {
      borderColor: 'transparent',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
    appModeButtonText: {
      fontSize: 14,
      fontWeight: '600',
      letterSpacing: 0.2,
    },
    appModeButtonTextActive: {
      fontWeight: '700',
    },
    currentModeIndicator: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
      alignItems: 'center',
      marginBottom: 8,
    },
    currentModeText: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.2,
    },
    settingsDivider: {
      height: 1,
      marginVertical: 16,
    },
    settingDescription: {
      fontSize: 12,
      marginTop: 4,
      marginBottom: 12,
      lineHeight: 18,
    },
    blockedTabsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 8,
    },
    blockedTabButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 10,
      borderWidth: 1.5,
      gap: 6,
    },
    blockedTabButtonText: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.2,
    },
    modalSaveButton: {
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    modalSaveButtonText: {
      fontSize: 17,
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },
    // Lock Screen Styles
    lockScreen: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    lockContent: {
      alignItems: 'center',
      width: '100%',
    },
    lockIconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    lockTitle: {
      fontSize: 28,
      fontWeight: '800',
      marginBottom: 12,
      letterSpacing: -0.5,
    },
    lockSubtitle: {
      fontSize: 15,
      fontWeight: '500',
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 40,
    },
    lockTimerContainer: {
      alignItems: 'center',
      marginBottom: 32,
    },
    lockTimeText: {
      fontSize: 52,
      fontWeight: '800',
      marginTop: 24,
      letterSpacing: -3,
      fontVariant: ['tabular-nums'],
    },
    lockCycleInfo: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 12,
      marginBottom: 32,
    },
    lockCycleText: {
      fontSize: 15,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    lockPauseButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 14,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 3},
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 6,
    },
    lockPauseButtonText: {
      fontSize: 17,
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: 0.3,
    },
    // Unlock Prompt Styles
    unlockPromptOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    unlockPromptContent: {
      width: '85%',
      borderRadius: 20,
      padding: 28,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 10,
    },
    unlockPromptTitle: {
      fontSize: 22,
      fontWeight: '700',
      marginTop: 20,
      marginBottom: 12,
      letterSpacing: -0.5,
    },
    unlockPromptMessage: {
      fontSize: 15,
      fontWeight: '500',
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 28,
    },
    unlockPromptButtons: {
      flexDirection: 'row',
      gap: 12,
      width: '100%',
    },
    unlockPromptButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    unlockCancelButton: {
      borderWidth: 1,
      borderColor: isDark ? '#3A3A3A' : '#E0E0E0',
    },
    unlockConfirmButton: {
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    unlockCancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: 0.3,
    },
    unlockConfirmButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: 0.3,
    },
    // App Blocker Styles
    permissionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
      gap: 8,
      marginTop: 8,
    },
    permissionButtonText: {
      fontSize: 14,
      fontWeight: '600',
      letterSpacing: 0.2,
    },
    permissionGranted: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
      gap: 8,
      marginTop: 8,
    },
    permissionGrantedText: {
      fontSize: 14,
      fontWeight: '600',
      letterSpacing: 0.2,
    },
    selectAppsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
      gap: 8,
      marginTop: 8,
    },
    selectAppsButtonText: {
      fontSize: 14,
      fontWeight: '600',
      letterSpacing: 0.2,
    },
    appSelectorContent: {
      width: '90%',
      height: '80%',
      borderRadius: 20,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 10,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
    },
    loadingText: {
      fontSize: 14,
      fontWeight: '500',
    },
    appListContent: {
      paddingVertical: 8,
    },
    appItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 14,
      borderRadius: 12,
    },
    appItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    appItemInfo: {
      flex: 1,
      gap: 4,
    },
    appItemName: {
      fontSize: 15,
      fontWeight: '600',
      letterSpacing: 0.2,
    },
    appItemPackage: {
      fontSize: 12,
      fontWeight: '400',
    },
    appSelectorDoneButton: {
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 16,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    appSelectorDoneButtonText: {
      fontSize: 17,
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },
  });

export default PomodoroScreen;
