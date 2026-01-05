import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
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
  AppState,
  AppStateStatus,
  PermissionsAndroid,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/ionicons';
import {usePomodoroStore} from '../store/pomodoroStore';
import {useThemeStore} from '../store/themeStore';
import TimeTimer from '../components/TimeTimer';
import {TimerMode, TabName, AlarmSoundType} from '../types/pomodoro';
import AlarmService, {ALARM_SOUNDS, AlarmSound} from '../modules/AlarmService';
import {safeGetColorScheme, safeAddAppearanceListener} from '../utils/appearance';
import AppBlocker from '../modules/AppBlocker';
import LiveActivity, {LiveActivityTimerMode, LiveActivityColors} from '../modules/LiveActivity';
import FocusTimer, {FocusTimerColors} from '../modules/FocusTimer';
import ScreenLock from '../modules/ScreenLock';
import {getPomodoroTheme} from '../themes/pomodoroThemes';
import {sp, hp, fp, iconSize, touchSize} from '../utils/responsive';
import {getStyles} from './PomodoroScreen.styles';
import {REWARD_CONFIG} from '../store/currencyStore';

const PomodoroScreen: React.FC = () => {
  const [systemColorScheme, setSystemColorScheme] = useState<'light' | 'dark'>('light');
  const [showControls, setShowControls] = useState(false);
  const [showTimerSettings, setShowTimerSettings] = useState(false);
  const [tempFocusDuration, setTempFocusDuration] = useState('25');
  const [tempBreakDuration, setTempBreakDuration] = useState('5');
  const [tempCycleCount, setTempCycleCount] = useState('4');
  const [tempAppMode, setTempAppMode] = useState<'FREE' | 'CONCENTRATION'>('FREE');
  const [tempBlockedTabs, setTempBlockedTabs] = useState<TabName[]>(['Matching', 'Community', 'StudyRecord', 'More']);
  const [tempBlockedApps, setTempBlockedApps] = useState<string[]>([]);
  const [showUnlockPrompt, setShowUnlockPrompt] = useState(false);
  const [showAppSelector, setShowAppSelector] = useState(false);
  const [installedApps, setInstalledApps] = useState<Array<{packageName: string; appName: string}>>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [appBlockerPermission, setAppBlockerPermission] = useState<string>('notDetermined');
  const [accessibilityPermission, setAccessibilityPermission] = useState(false);

  // 화면 잠금 감지 상태
  const [isScreenLocked, setIsScreenLocked] = useState(false);
  const [isScreenDimmed, setIsScreenDimmed] = useState(false); // 화면 어둡게 (잠금 버튼)
  const [showMemoModal, setShowMemoModal] = useState(false); // 세션 메모 모달
  const [sessionMemo, setSessionMemo] = useState(''); // 세션 메모 입력값
  const [showTimerHelpModal, setShowTimerHelpModal] = useState(false); // 타이머 도움말 모달
  const [showModeChangeConfirm, setShowModeChangeConfirm] = useState(false); // 집중→자유 모드 전환 확인 모달
  const [pendingModeChange, setPendingModeChange] = useState<'FREE' | 'CONCENTRATION' | null>(null); // 대기 중인 모드 변경
  const [showLockSettingsModal, setShowLockSettingsModal] = useState(false); // 집중모드 시작 전 잠금 설정 모달
  const [tempLockEnabled, setTempLockEnabled] = useState(false); // 임시 잠금 활성화 여부 (기본 off)
  const [tempStartBlockedTabs, setTempStartBlockedTabs] = useState<TabName[]>([]); // 시작 시 차단할 탭 (기본 없음)

  // 알람 설정 state
  const [tempAlarmEnabled, setTempAlarmEnabled] = useState(true);
  const [tempAlarmSound, setTempAlarmSound] = useState<AlarmSoundType | string>('default');
  const [tempAlarmVibration, setTempAlarmVibration] = useState(true);
  const [tempBreakAlarmEnabled, setTempBreakAlarmEnabled] = useState(true);
  const [timerSettingsView, setTimerSettingsView] = useState<'main' | 'alarmSound'>('main');
  const [alarmSounds, setAlarmSounds] = useState<AlarmSound[]>(ALARM_SOUNDS);

  // Live Activity 상태 (iOS)
  const [liveActivitySupported, setLiveActivitySupported] = useState(false);
  const liveActivityActive = useRef(false);

  // Android 알림 상태
  const [androidTimerSupported, setAndroidTimerSupported] = useState(false);
  const androidTimerActive = useRef(false);

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
  // 뽀모도로 세션은 pomodoroStore에서 가져옴
  const pomodoroSessions = usePomodoroStore(state => state.sessions);

  const isDark =
    themeMode === 'system'
      ? systemColorScheme === 'dark'
      : themeMode === 'dark';

  // 오늘 집중 세션 통계
  const todayString = new Date().toISOString().split('T')[0];
  const todayFocusSessions = pomodoroSessions.filter(s => {
    const sessionDate = new Date(s.startTime).toISOString().split('T')[0];
    return sessionDate === todayString && s.mode === 'FOCUS';
  });
  const todayTotalMinutes = todayFocusSessions.reduce((sum, s) => {
    const duration = (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 60000;
    return sum + Math.round(duration);
  }, 0);
  const todayCompletedSessions = todayFocusSessions.filter(s => s.completed).length;
  const {width, height} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isLandscape = width > height;

  const {
    mode,
    timeLeft,
    isRunning,
    completedCycles,
    currentCycle,
    settings,
    isFullscreen,
    pendingSessionId,
    setTimeLeft,
    setIsRunning,
    setIsFullscreen,
    tick,
    reset,
    setMode,
    updateSettings,
    addMemoToSession,
    clearPendingSession,
  } = usePomodoroStore();

  // Initialize temp values from settings
  useEffect(() => {
    setTempFocusDuration((settings.focusDuration || 25).toString());
    setTempBreakDuration((settings.breakDuration || 5).toString());
    setTempCycleCount((settings.cycleCount || 4).toString());
    setTempAppMode(settings.appMode || 'FREE');
    setTempBlockedTabs(settings.blockedTabs || ['Matching', 'Community', 'StudyRecord', 'More']);
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

  // Live Activity 지원 확인 (iOS)
  useEffect(() => {
    const checkLiveActivitySupport = async () => {
      if (Platform.OS === 'ios') {
        const supported = await LiveActivity.isActivitySupported();
        setLiveActivitySupported(supported);
      }
    };
    checkLiveActivitySupport();
  }, []);

  // 알람 사운드 목록 초기화
  useEffect(() => {
    const loadAlarmSounds = () => {
      const sounds = AlarmService.getAllSounds();
      setAlarmSounds(sounds);
    };
    loadAlarmSounds();
  }, []);

  // Android 타이머 알림 지원 확인
  useEffect(() => {
    const checkAndroidTimerSupport = async () => {
      if (Platform.OS === 'android') {
        const supported = await FocusTimer.isSupported();
        console.log('Android Timer Supported:', supported);
        setAndroidTimerSupported(supported);
      }
    };
    checkAndroidTimerSupport();
  }, []);

  // Live Activity 시작/종료/업데이트 관리 - iOS
  // ref를 사용하여 timeLeft의 최신 값을 항상 참조
  const timeLeftRef = useRef(timeLeft);
  timeLeftRef.current = timeLeft;

  // 타이머 시작 시점의 초기 시간 저장 (Live Activity의 targetDuration으로 사용)
  const initialTimeLeftRef = useRef<number | null>(null);

  // Live Activity 시작 시점의 endTime 저장 (시간 동기화용)
  const liveActivityEndTimeRef = useRef<number | null>(null);

  // 타이머가 멈춰있고 timeLeft가 변경되면 초기값 업데이트 (설정 변경 시)
  useEffect(() => {
    if (!isRunning) {
      initialTimeLeftRef.current = timeLeft;
      console.log(`⏱️ Initial timeLeft updated: ${timeLeft}s`);
    }
  }, [timeLeft, isRunning]);


  // 알림/Live Activity에 전달할 모드 계산
  // - 자유 모드(appMode='FREE'):
  //   - 집중시간(mode='FOCUS'): 'FREE_FOCUS' (빨강)
  //   - 휴식시간(mode='BREAK'): 'FREE_BREAK' (초록)
  // - 집중 모드(appMode='CONCENTRATION'): mode(FOCUS/BREAK) 그대로 전달
  const getNotificationTimerMode = (): LiveActivityTimerMode => {
    if (settings.appMode === 'FREE') {
      return mode === 'FOCUS' ? 'FREE_FOCUS' : 'FREE_BREAK';
    }
    return mode; // 'FOCUS' 또는 'BREAK'
  };

  // 테마 색상 가져오기
  const getThemeColors = (): LiveActivityColors & FocusTimerColors => {
    const theme = getPomodoroTheme(settings.pomodoroTheme || 'default');
    return {
      focusColor: theme.focusColor,
      breakColor: theme.breakColor,
    };
  };

  // 이전 isRunning 값 추적
  const prevIsRunningForLiveActivity = useRef<boolean | null>(null);

  useEffect(() => {
    const manageLiveActivity = async () => {
      if (Platform.OS !== 'ios') return;

      const wasRunning = prevIsRunningForLiveActivity.current;
      // settings에서 직접 시간 계산 (store의 timeLeft가 아닌 설정값 기준)
      const configuredDuration = mode === 'FOCUS'
        ? settings.focusDuration * 60
        : settings.breakDuration * 60;

      console.log(`[LA Debug] isRunning=${isRunning}, wasRunning=${wasRunning}, timeLeft=${timeLeft}, configuredDuration=${configuredDuration}s, liveActivitySupported=${liveActivitySupported}, liveActivityActive=${liveActivityActive.current}`);

      // isRunning 상태 변화가 있을 때만 처리 (매초 timeLeft 변화는 무시)
      const isRunningChanged = wasRunning !== isRunning;

      // liveActivitySupported가 아직 false면 대기
      if (!liveActivitySupported) {
        prevIsRunningForLiveActivity.current = isRunning;
        return;
      }

      const liveActivityMode = getNotificationTimerMode();

      if (isRunning && !liveActivityActive.current) {
        // 타이머가 실행 중인데 Live Activity가 없으면 시작
        // 시작 시점: timeLeft가 totalDuration과 같을 때 시작하는 것이 정상
        // 하지만 이미 진행 중이면 timeLeft < configuredDuration일 수 있음
        const totalDuration = configuredDuration; // 설정된 전체 시간
        const currentTimeLeft = timeLeft; // 현재 남은 시간

        try {
          // 기존 Activity 종료 (있으면)
          await LiveActivity.endActivity();

          // 새로 시작 - 현재 남은 시간과 설정된 전체 시간을 각각 전달
          const themeColors = getThemeColors();
          console.log(`🚀 Starting Live Activity: currentTimeLeft=${currentTimeLeft}s, totalDuration=${totalDuration}s, mode=${liveActivityMode}, focusDuration=${settings.focusDuration}min`);
          await LiveActivity.startActivity(liveActivityMode, currentTimeLeft, themeColors, totalDuration);
          liveActivityActive.current = true;
          // 시작 시점의 총 시간 저장 (일시정지/재개 시 참조)
          initialTimeLeftRef.current = totalDuration;
          // endTime 저장 (시간 동기화용) - 현재 시간 + 남은 시간
          liveActivityEndTimeRef.current = Date.now() + currentTimeLeft * 1000;
        } catch (error) {
          console.log('Failed to start Live Activity:', error);
        }
      } else if (!isRunning && wasRunning === true && liveActivityActive.current && isRunningChanged) {
        // 일시정지: Live Activity 업데이트 (종료하지 않음)
        console.log(`⏸️ Pausing Live Activity: timeLeft=${timeLeft}s`);
        LiveActivity.updateActivity(timeLeft, false).catch(() => {});
        // 일시정지 시 endTime 초기화 (재개 시 다시 계산)
        liveActivityEndTimeRef.current = null;
      } else if (isRunning && wasRunning === false && liveActivityActive.current && isRunningChanged) {
        // 재개: 설정이 변경되었는지 확인
        const savedInitialTime = initialTimeLeftRef.current;
        const settingsChanged = savedInitialTime !== null &&
          Math.abs(savedInitialTime - configuredDuration) > 5; // 설정값 변경 여부 체크

        if (settingsChanged) {
          // 설정이 변경됨 -> Live Activity 재시작
          console.log(`🔄 Settings changed (${savedInitialTime}s -> ${configuredDuration}s), restarting Live Activity`);
          try {
            await LiveActivity.endActivity();
            const themeColors = getThemeColors();
            await LiveActivity.startActivity(liveActivityMode, timeLeft, themeColors, configuredDuration);
            initialTimeLeftRef.current = configuredDuration;
            // 새 endTime 저장
            liveActivityEndTimeRef.current = Date.now() + timeLeft * 1000;
          } catch (error) {
            console.log('Failed to restart Live Activity:', error);
          }
        } else {
          // 설정 변경 없음 -> 단순 재개
          console.log(`▶️ Resuming Live Activity: timeLeft=${timeLeft}s`);
          LiveActivity.updateActivity(timeLeft, true).catch(() => {});
          // 재개 시 새 endTime 저장
          liveActivityEndTimeRef.current = Date.now() + timeLeft * 1000;
        }
      }

      // 상태 업데이트는 마지막에
      prevIsRunningForLiveActivity.current = isRunning;
    };
    manageLiveActivity();
  }, [isRunning, liveActivitySupported, mode, settings.appMode, settings.focusDuration, settings.breakDuration, timeLeft]);

  // 타이머 완료 또는 리셋 시 Live Activity 종료
  useEffect(() => {
    if (!liveActivitySupported || Platform.OS !== 'ios') return;

    // timeLeft가 0이면 종료
    if (timeLeft === 0 && liveActivityActive.current) {
      LiveActivity.endActivity().catch(() => {});
      liveActivityActive.current = false;
      prevIsRunningForLiveActivity.current = null;
    }
  }, [timeLeft, liveActivitySupported]);

  // 설정 변경 시 Live Activity 종료 (일시정지 상태에서 설정 변경하면 초기화)
  // 이전 설정값 추적
  const prevSettingsRef = useRef({
    focusDuration: settings.focusDuration,
    breakDuration: settings.breakDuration,
  });

  useEffect(() => {
    if (!liveActivitySupported || Platform.OS !== 'ios') return;

    const prevSettings = prevSettingsRef.current;
    const settingsChanged =
      prevSettings.focusDuration !== settings.focusDuration ||
      prevSettings.breakDuration !== settings.breakDuration;

    // 설정이 변경되었고, 타이머가 멈춰있고, Live Activity가 활성화되어 있으면 종료
    if (settingsChanged && !isRunning && liveActivityActive.current) {
      console.log(`🔧 Settings changed while paused, ending Live Activity`);
      LiveActivity.endActivity().catch(() => {});
      liveActivityActive.current = false;
      prevIsRunningForLiveActivity.current = null;
      initialTimeLeftRef.current = null; // 초기 시간도 리셋
    }

    // 현재 설정값 저장
    prevSettingsRef.current = {
      focusDuration: settings.focusDuration,
      breakDuration: settings.breakDuration,
    };
  }, [settings.focusDuration, settings.breakDuration, isRunning, liveActivitySupported]);

  // iOS: Live Activity는 ProgressView(timerInterval:)과 Text(timerInterval:)을 사용하여
  // iOS가 자동으로 실시간 업데이트하므로 매초 업데이트가 필요 없음
  // 일시정지/재개 시에만 상태 업데이트 필요 (위의 manageLiveActivity에서 처리)

  // iOS: 앱이 포그라운드로 돌아올 때 시간 동기화
  // Live Activity의 endTime 기준으로 앱의 timeLeft를 맞춤 (시간 오차 방지)
  useEffect(() => {
    if (!liveActivitySupported || Platform.OS !== 'ios') return;

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isRunning && liveActivityActive.current) {
        const isActive = await LiveActivity.isActivityActive();

        if (isActive && liveActivityEndTimeRef.current) {
          // Live Activity가 활성화되어 있으면 endTime 기준으로 앱 타이머 동기화
          const now = Date.now();
          const remainingMs = liveActivityEndTimeRef.current - now;
          const syncedTimeLeft = Math.max(0, Math.ceil(remainingMs / 1000));

          const currentTimeLeft = timeLeftRef.current;
          const timeDiff = Math.abs(syncedTimeLeft - currentTimeLeft);

          // 1초 이상 차이나면 동기화
          if (timeDiff >= 1 && syncedTimeLeft > 0) {
            console.log(`🔄 Syncing app timer with Live Activity: ${currentTimeLeft}s -> ${syncedTimeLeft}s (diff: ${timeDiff}s)`);
            setTimeLeft(syncedTimeLeft);
          }
        } else if (!isActive && liveActivityActive.current) {
          // Live Activity가 사라졌으면 (시스템이 종료했을 수 있음) 다시 시작
          const currentTimeLeft = timeLeftRef.current;
          const liveActivityMode = getNotificationTimerMode();
          const themeColors = getThemeColors();
          const totalDuration = initialTimeLeftRef.current || currentTimeLeft;

          console.log(`📱 App became active, restarting Live Activity: currentTimeLeft=${currentTimeLeft}s, totalDuration=${totalDuration}s`);
          try {
            await LiveActivity.startActivity(liveActivityMode, currentTimeLeft, themeColors, totalDuration);
            // 새 endTime 저장
            liveActivityEndTimeRef.current = Date.now() + currentTimeLeft * 1000;
          } catch (error) {
            console.log('Failed to restart Live Activity:', error);
          }
        } else if (!isActive) {
          liveActivityActive.current = false;
          liveActivityEndTimeRef.current = null;
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [liveActivitySupported, isRunning, setTimeLeft]);

  // Android 알림 시작/종료/업데이트 관리
  const prevAndroidIsRunningRef = useRef<boolean | null>(null);

  useEffect(() => {
    // Android 알림 권한 요청 함수
    const requestNotificationPermission = async (): Promise<boolean> => {
      if (Platform.OS !== 'android') return true;
      if (Platform.Version < 33) return true; // Android 13 미만은 권한 불필요

      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: '알림 권한 필요',
            message: '타이머 진행 상태를 알림으로 표시하려면 알림 권한이 필요합니다.',
            buttonPositive: '허용',
            buttonNegative: '거부',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (error) {
        console.log('Notification permission error:', error);
        return false;
      }
    };

    const manageAndroidTimer = async () => {
      console.log('manageAndroidTimer:', { androidTimerSupported, platform: Platform.OS, isRunning });
      if (!androidTimerSupported || Platform.OS !== 'android') return;

      const wasRunning = prevAndroidIsRunningRef.current;
      const currentTimeLeft = timeLeftRef.current;
      prevAndroidIsRunningRef.current = isRunning;

      console.log('Android timer state:', { wasRunning, isRunning, currentTimeLeft, initialTimeLeft: initialTimeLeftRef.current, androidTimerActive: androidTimerActive.current });

      if (isRunning && !androidTimerActive.current) {
        // 처음 시작: 현재 timeLeft를 초기값으로 저장
        initialTimeLeftRef.current = currentTimeLeft;
        const targetDuration = currentTimeLeft;

        const notificationMode = getNotificationTimerMode();
        const themeColors = getThemeColors();
        console.log('Starting Android timer with targetDuration:', targetDuration, 'mode:', notificationMode, 'colors:', themeColors);
        const hasPermission = await requestNotificationPermission();
        console.log('Notification permission:', hasPermission);
        try {
          await FocusTimer.startTimer(notificationMode, targetDuration, currentTimeLeft, themeColors);
          console.log('Android timer started successfully');
          androidTimerActive.current = true;
        } catch (error) {
          console.log('Failed to start Android timer:', error);
        }
      } else if (isRunning && wasRunning === false && androidTimerActive.current) {
        // 재개: initialTimeLeft와 currentTimeLeft가 다르면 새로 시작 (설정 변경됨)
        if (initialTimeLeftRef.current !== null &&
            Math.abs(initialTimeLeftRef.current - currentTimeLeft) > 5) {
          // 설정이 변경됨 -> Service 재시작
          const notificationMode = getNotificationTimerMode();
          const themeColors = getThemeColors();
          console.log('Settings changed, restarting timer with new targetDuration:', currentTimeLeft);
          await FocusTimer.stopTimer();
          initialTimeLeftRef.current = currentTimeLeft;
          await FocusTimer.startTimer(notificationMode, currentTimeLeft, currentTimeLeft, themeColors);
        } else {
          FocusTimer.resumeTimer().catch(() => {});
        }
      } else if (!isRunning && wasRunning === true && androidTimerActive.current) {
        // 일시정지
        FocusTimer.pauseTimer().catch(() => {});
      }
    };
    manageAndroidTimer();
  }, [isRunning, androidTimerSupported, mode]);

  // Android 타이머 완료 시 종료
  useEffect(() => {
    if (!androidTimerSupported || Platform.OS !== 'android') return;

    if (timeLeft === 0 && androidTimerActive.current) {
      FocusTimer.stopTimer().catch(() => {});
      androidTimerActive.current = false;
      prevAndroidIsRunningRef.current = null;
      initialTimeLeftRef.current = null;
    }
    // Service가 자체적으로 타이머를 돌리므로 매초 업데이트 불필요
  }, [timeLeft, androidTimerSupported]);

  const handleSaveTimerSettings = async () => {
    const focus = parseInt(tempFocusDuration) || 25;
    const breakTime = parseInt(tempBreakDuration) || 5;
    const cycles = parseInt(tempCycleCount) || 4;

    // 집중모드 → 자유모드 전환 시 확인 모달
    if (settings.appMode === 'CONCENTRATION' && tempAppMode === 'FREE') {
      // 설정 모달을 먼저 닫고 확인 모달을 띄움
      setShowTimerSettings(false);
      setTimeout(() => {
        setPendingModeChange('FREE');
        setShowModeChangeConfirm(true);
      }, 100);
      return;
    }

    // 설정 저장 실행
    await applyTimerSettings(focus, breakTime, cycles, tempAppMode);
  };

  const applyTimerSettings = async (
    focus: number,
    breakTime: number,
    cycles: number,
    appMode: 'FREE' | 'CONCENTRATION'
  ) => {
    // 집중모드로 전환 시 FOCUS 모드로 변경
    if (appMode === 'CONCENTRATION' && settings.appMode !== 'CONCENTRATION') {
      setMode('FOCUS');
    }

    // updateSettings가 appMode 변경 시 자동으로 currentCycle: 1, isRunning: false, timeLeft를 설정
    updateSettings({
      appMode: appMode,
      focusDuration: focus,
      breakDuration: breakTime,
      cycleCount: cycles,
      blockedTabs: tempBlockedTabs,
      blockedApps: tempBlockedApps,
      // 알람 설정 저장
      alarmEnabled: tempAlarmEnabled,
      alarmSound: tempAlarmSound,
      alarmVibration: tempAlarmVibration,
      breakAlarmEnabled: tempBreakAlarmEnabled,
    });

    // 앱 차단 설정 적용
    if (appMode === 'CONCENTRATION' && tempBlockedApps.length > 0) {
      try {
        await AppBlocker.blockApps(tempBlockedApps);
      } catch (error) {
        console.log('Failed to apply app blocking:', error);
      }
    }

    setShowTimerSettings(false);
  };

  const handleConfirmModeChange = async () => {
    const focus = parseInt(tempFocusDuration) || 25;
    const breakTime = parseInt(tempBreakDuration) || 5;
    const cycles = parseInt(tempCycleCount) || 4;

    // 타이머 정지
    setIsRunning(false);

    await applyTimerSettings(focus, breakTime, cycles, 'FREE');
    setShowModeChangeConfirm(false);
    setPendingModeChange(null);
  };

  const handleCancelModeChange = () => {
    setTempAppMode('CONCENTRATION'); // 원래대로 복원
    setShowModeChangeConfirm(false);
    setPendingModeChange(null);
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
      case 'Matching': return '매칭';
      case 'Community': return '커뮤니티';
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

  // 화면 잠금 감지 (AppState) + 백그라운드 타이머 보정
  const appState = useRef(AppState.currentState);
  const wasRunningBeforeLock = useRef(false);
  const backgroundStartTime = useRef<number | null>(null);
  const timeLeftWhenBackground = useRef<number>(0);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // 화면이 꺼짐 (background/inactive)
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        if (isRunning) {
          // 백그라운드 진입 시간과 남은 시간 기록
          backgroundStartTime.current = Date.now();
          timeLeftWhenBackground.current = timeLeft;
          wasRunningBeforeLock.current = true;
          setIsScreenLocked(true);
        }
      }
      // 화면이 켜짐 (active)
      else if (nextAppState === 'active' && appState.current !== 'active') {
        // 백그라운드에서 경과한 시간 계산 및 타이머 보정
        if (backgroundStartTime.current && wasRunningBeforeLock.current) {
          const elapsedSeconds = Math.floor((Date.now() - backgroundStartTime.current) / 1000);
          const newTimeLeft = Math.max(0, timeLeftWhenBackground.current - elapsedSeconds);
          setTimeLeft(newTimeLeft);

          backgroundStartTime.current = null;
          setIsScreenLocked(false);
          wasRunningBeforeLock.current = false;
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [isRunning, timeLeft, setTimeLeft]);

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

  // 집중 세션 완료 시 메모 모달 표시
  useEffect(() => {
    if (pendingSessionId) {
      setSessionMemo('');
      setShowMemoModal(true);
    }
  }, [pendingSessionId]);

  // 메모 저장 핸들러
  const handleSaveMemo = () => {
    if (pendingSessionId) {
      if (sessionMemo.trim()) {
        addMemoToSession(pendingSessionId, sessionMemo.trim());
      } else {
        clearPendingSession();
      }
    }
    setShowMemoModal(false);
    setSessionMemo('');
  };

  // 메모 건너뛰기 핸들러
  const handleSkipMemo = () => {
    clearPendingSession();
    setShowMemoModal(false);
    setSessionMemo('');
  };

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
    // 테마에서 색상 가져오기
    const themeColors = getThemeColors();
    switch (currentMode) {
      case 'FOCUS':
        return themeColors.focusColor;
      case 'BREAK':
        return themeColors.breakColor;
    }
  };

  const progress = timeLeft / getTotalDuration(); // 남은 시간의 비율 (1 -> 0으로 감소)
  const currentColor = getModeColor(mode);

  // 집중 모드 + 잠금 활성화 + 집중 시간일 때 잠금 상태
  const isLocked = settings.appMode === 'CONCENTRATION' && settings.lockEnabled && mode === 'FOCUS' && isRunning;

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

  // 타이머 시작/일시정지 핸들러
  const handlePlayPause = () => {
    // 이미 실행 중이면 그냥 일시정지
    if (isRunning) {
      setIsRunning(false);
      return;
    }

    // 집중모드이고 FOCUS 모드일 때 시작 전 잠금 설정 모달 표시
    if (settings.appMode === 'CONCENTRATION' && mode === 'FOCUS') {
      // 이전 설정값 유지 (기본값: false)
      setTempLockEnabled(settings.lockEnabled ?? false);
      setTempStartBlockedTabs(settings.blockedTabs);
      setShowLockSettingsModal(true);
      return;
    }

    // 자유모드면 바로 시작
    setIsRunning(true);
  };

  // 잠금 설정 확인 후 타이머 시작
  const handleConfirmStart = () => {
    // 설정 업데이트 (잠금 활성화 여부 및 차단 탭 적용)
    // appMode(집중/자유)는 유지하고, lockEnabled와 blockedTabs 변경
    // 탭 차단은 lockEnabled와 별개로 항상 저장
    updateSettings({
      lockEnabled: tempLockEnabled,
      blockedTabs: tempStartBlockedTabs,
    });
    setShowLockSettingsModal(false);
    setIsRunning(true);
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

  // 일반 화면 가로모드 레이아웃
  if (isLandscape && !isFullscreen) {
    const safeWidth = width - insets.left - insets.right;
    const landscapeTimerSize = Math.min(height * 0.65, safeWidth * 0.35);

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar hidden={false} />
        {/* 상단 버튼 - 전체화면 전환 */}
        <View style={styles.landscapeTopButtons}>
          <TouchableOpacity
            style={[styles.landscapeTopButton, {backgroundColor: isDark ? '#2A2A2A' : '#F0F0F0'}]}
            onPress={() => setIsFullscreen(true)}>
            <Icon
              name="expand"
              size={iconSize(20)}
              color={isDark ? '#AAAAAA' : '#666666'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.landscapeContainer}>
          {/* 왼쪽: 타이머 */}
          <View style={styles.landscapeLeftSection}>
            <View style={styles.landscapeTimerContainer}>
              <TimeTimer
                size={landscapeTimerSize}
                progress={progress}
                color={currentColor}
                backgroundColor={isDark ? '#F5F5F5' : '#FFFFFF'}
                timeText={formatTime(timeLeft)}
                totalSeconds={getTotalDuration()}
                isRunning={isRunning}
                onPlayPause={handlePlayPause}
                showButton={true}
              />
              <Text style={[styles.landscapeTimeText, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                {formatTime(timeLeft)}
              </Text>
            </View>
          </View>

          {/* 오른쪽: 컨트롤 */}
          <View style={styles.landscapeRightSection}>
            <View style={styles.landscapeControlsContainer}>
              {/* 모드 선택 */}
              {settings.appMode === 'FREE' ? (
                <View style={styles.landscapeModeSelect}>
                  <TouchableOpacity
                    style={[
                      styles.landscapeModeButton,
                      {
                        backgroundColor: mode === 'FOCUS' ? currentColor : (isDark ? '#252525' : '#F5F5F5'),
                      }
                    ]}
                    onPress={() => !isRunning && setMode('FOCUS')}
                    disabled={isRunning}>
                    <Icon
                      name="flame"
                      size={iconSize(14)}
                      color={mode === 'FOCUS' ? '#FFFFFF' : (isDark ? '#666666' : '#999999')}
                    />
                    <Text style={[
                      styles.timerModeText,
                      {color: mode === 'FOCUS' ? '#FFFFFF' : (isDark ? '#666666' : '#999999')}
                    ]}>
                      집중
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.landscapeModeButton,
                      {
                        backgroundColor: mode === 'BREAK' ? '#4CAF50' : (isDark ? '#252525' : '#F5F5F5'),
                      }
                    ]}
                    onPress={() => !isRunning && setMode('BREAK')}
                    disabled={isRunning}>
                    <Icon
                      name="cafe"
                      size={iconSize(14)}
                      color={mode === 'BREAK' ? '#FFFFFF' : (isDark ? '#666666' : '#999999')}
                    />
                    <Text style={[
                      styles.timerModeText,
                      {color: mode === 'BREAK' ? '#FFFFFF' : (isDark ? '#666666' : '#999999')}
                    ]}>
                      휴식
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={[styles.concentrationStatus, {backgroundColor: currentColor, marginBottom: hp(16)}]}>
                  <Icon
                    name={mode === 'FOCUS' ? 'flame' : 'cafe'}
                    size={iconSize(14)}
                    color="#FFFFFF"
                  />
                  <Text style={styles.concentrationStatusText}>
                    {mode === 'FOCUS' ? '집중' : '휴식'} {currentCycle}/{settings.cycleCount}
                  </Text>
                </View>
              )}

              {/* 컨트롤 버튼 */}
              <View style={styles.landscapeControls}>
                <TouchableOpacity
                  style={[styles.landscapeButton, {backgroundColor: currentColor}]}
                  onPress={() => setIsRunning(!isRunning)}>
                  <Text style={styles.buttonText}>
                    {isRunning ? '일시정지' : '시작'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.landscapeButton, {backgroundColor: isDark ? '#2A2A2A' : '#EFEFEF'}]}
                  onPress={reset}>
                  <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                    초기화
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

      </SafeAreaView>
    );
  }

  // 전체화면 모드일 때
  if (isFullscreen) {
    // 화면 크기 계산 - Safe Area 고려
    const safeWidth = width - (isLandscape ? insets.left + insets.right : 0);
    const safeHeight = height - (isLandscape ? 0 : insets.top + insets.bottom);
    const effectiveWidth = isLandscape ? safeWidth : Math.min(width, height);
    const effectiveHeight = isLandscape ? Math.min(width, height) : safeHeight;

    // 반응형 폰트 크기
    const timeFontSize = isLandscape ? effectiveHeight * 0.25 : effectiveWidth * 0.2;
    const dateFontSize = isLandscape ? effectiveHeight * 0.05 : effectiveWidth * 0.04;
    const timerSize = isLandscape ? effectiveHeight * 0.7 : effectiveWidth * 0.88;

    return (
      <TouchableOpacity
        style={[
          styles.fullscreenContainer,
          isLandscape && {
            paddingLeft: insets.left,
            paddingRight: insets.right,
          }
        ]}
        activeOpacity={1}
        onPress={handleScreenPress}>
        <StatusBar hidden={true} />

        <View style={[
          styles.fullscreenContent,
          !isLandscape && styles.fullscreenContentPortrait,
          isLandscape && {paddingHorizontal: 20}
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
                  onPlayPause={handlePlayPause}
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
                  onPlayPause={handlePlayPause}
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
        {/* 모드 선택 영역 */}
        <View style={styles.modeSelectArea}>
          {settings.appMode === 'FREE' ? (
            /* 자유모드: 집중/휴식 버튼 2개 */
            <View style={styles.timerModeRow}>
              <TouchableOpacity
                style={[
                  styles.timerModeButton,
                  mode === 'FOCUS' && styles.timerModeButtonActive,
                  {
                    backgroundColor: mode === 'FOCUS' ? currentColor : (isDark ? '#252525' : '#F5F5F5'),
                  }
                ]}
                onPress={() => !isRunning && setMode('FOCUS')}
                disabled={isRunning}>
                <Icon
                  name="flame"
                  size={iconSize(16)}
                  color={mode === 'FOCUS' ? '#FFFFFF' : (isDark ? '#666666' : '#999999')}
                />
                <Text style={[
                  styles.timerModeText,
                  {color: mode === 'FOCUS' ? '#FFFFFF' : (isDark ? '#666666' : '#999999')}
                ]}>
                  집중시간
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.timerModeButton,
                  mode === 'BREAK' && styles.timerModeButtonActive,
                  {
                    backgroundColor: mode === 'BREAK' ? '#4CAF50' : (isDark ? '#252525' : '#F5F5F5'),
                  }
                ]}
                onPress={() => !isRunning && setMode('BREAK')}
                disabled={isRunning}>
                <Icon
                  name="cafe"
                  size={iconSize(16)}
                  color={mode === 'BREAK' ? '#FFFFFF' : (isDark ? '#666666' : '#999999')}
                />
                <Text style={[
                  styles.timerModeText,
                  {color: mode === 'BREAK' ? '#FFFFFF' : (isDark ? '#666666' : '#999999')}
                ]}>
                  휴식시간
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* 집중모드: 현재 상태 텍스트만 표시 */
            <View style={[
              styles.concentrationStatus,
              {backgroundColor: currentColor}
            ]}>
              <Icon
                name={mode === 'FOCUS' ? 'flame' : 'cafe'}
                size={iconSize(16)}
                color="#FFFFFF"
              />
              <Text style={styles.concentrationStatusText}>
                {mode === 'FOCUS' ? '집중' : '휴식'} {currentCycle}/{settings.cycleCount}
              </Text>
            </View>
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
              size={iconSize(24)}
              color={isDark ? '#AAAAAA' : '#666666'}
            />
          </TouchableOpacity>
          {/* 시간 설정 버튼 - 타이머 원 기준 오른쪽 위 */}
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => {
              // 현재 설정값으로 temp 변수들 초기화
              setTempFocusDuration(settings.focusDuration.toString());
              setTempBreakDuration(settings.breakDuration.toString());
              setTempCycleCount(settings.cycleCount.toString());
              setTempAppMode(settings.appMode);
              setTempBlockedTabs(settings.blockedTabs || []);
              setTempBlockedApps(settings.blockedApps || []);
              // 알람 설정 초기화
              setTempAlarmEnabled(settings.alarmEnabled);
              setTempAlarmSound(settings.alarmSound);
              setTempAlarmVibration(settings.alarmVibration);
              setTempBreakAlarmEnabled(settings.breakAlarmEnabled);
              // 뷰 초기화
              setTimerSettingsView('main');
              setShowTimerSettings(true);
            }}
            disabled={isRunning}>
            <Icon
              name="settings-outline"
              size={iconSize(24)}
              color={isRunning ? (isDark ? '#3A3A3A' : '#CCCCCC') : (isDark ? '#AAAAAA' : '#666666')}
            />
          </TouchableOpacity>
          <TimeTimer
            size={sp(320)}
            progress={progress}
            color={currentColor}
            backgroundColor={isDark ? '#F5F5F5' : '#FFFFFF'}
            timeText={formatTime(timeLeft)}
            totalSeconds={getTotalDuration()}
            isRunning={isRunning}
            onPlayPause={handlePlayPause}
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

        {/* 오늘의 집중 통계 - 집중모드일 때만 표시 */}
        {settings.appMode === 'CONCENTRATION' && (
          <View style={[styles.todayStatsCard, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
            <View style={styles.todayStatsRow}>
              <View style={styles.todayStatItem}>
                <Icon name="time-outline" size={iconSize(18)} color={currentColor} />
                <Text style={[styles.todayStatValue, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                  {todayTotalMinutes >= 60
                    ? `${Math.floor(todayTotalMinutes / 60)}h ${todayTotalMinutes % 60}m`
                    : `${todayTotalMinutes}m`}
                </Text>
                <Text style={[styles.todayStatLabel, {color: isDark ? '#888888' : '#666666'}]}>
                  오늘 집중
                </Text>
              </View>
              <View style={[styles.todayStatDivider, {backgroundColor: isDark ? '#333333' : '#E5E5E5'}]} />
              <View style={styles.todayStatItem}>
                <Icon name="checkmark-circle-outline" size={iconSize(18)} color="#4CAF50" />
                <Text style={[styles.todayStatValue, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                  {todayCompletedSessions}
                </Text>
                <Text style={[styles.todayStatLabel, {color: isDark ? '#888888' : '#666666'}]}>
                  완료 세션
                </Text>
              </View>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Timer Settings Modal */}
      <Modal
        visible={showTimerSettings}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          if (showTimerHelpModal) {
            setShowTimerHelpModal(false);
          } else if (timerSettingsView === 'alarmSound') {
            setTimerSettingsView('main');
          } else {
            setShowTimerSettings(false);
            setTimerSettingsView('main');
          }
        }}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Text style={[styles.modalTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                  {showTimerHelpModal ? '포모도로 타이머 안내' : timerSettingsView === 'alarmSound' ? '알람 사운드 선택' : '타이머 설정'}
                </Text>
                {!showTimerHelpModal && timerSettingsView === 'main' && (
                  <TouchableOpacity
                    style={styles.timerHelpButton}
                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                    onPress={() => setShowTimerHelpModal(true)}>
                    <Icon name="help-circle-outline" size={iconSize(24)} color={isDark ? '#888888' : '#999999'} />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity onPress={() => {
                if (showTimerHelpModal) {
                  setShowTimerHelpModal(false);
                } else if (timerSettingsView === 'alarmSound') {
                  setTimerSettingsView('main');
                } else {
                  setShowTimerSettings(false);
                  setTimerSettingsView('main');
                }
              }}>
                <Icon name={showTimerHelpModal || timerSettingsView === 'alarmSound' ? 'arrow-back' : 'close'} size={iconSize(28)} color={isDark ? '#AAAAAA' : '#666666'} />
              </TouchableOpacity>
            </View>

            {/* Help Content or Settings */}
            {showTimerHelpModal ? (
              <>
                <ScrollView style={styles.timerHelpModalBody} showsVerticalScrollIndicator={false}>
                  <View style={[styles.timerHelpCard, {backgroundColor: isDark ? '#2A2A2A' : '#F8F8F8'}]}>
                    <View style={styles.timerHelpIconRow}>
                      <Text style={styles.timerHelpEmoji}>⏱️</Text>
                      <Text style={[styles.timerHelpCardTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                        25분은 그냥 참고용이에요
                      </Text>
                    </View>
                    <Text style={[styles.timerHelpCardText, {color: isDark ? '#BBBBBB' : '#666666'}]}>
                      기본 설정인 25분/5분은 일반적인 가이드일 뿐이에요.{'\n'}
                      자신에게 맞는 시간을 찾아보세요!
                    </Text>
                  </View>

                  <View style={[styles.timerHelpCard, {backgroundColor: isDark ? '#2A2A2A' : '#F8F8F8'}]}>
                    <View style={styles.timerHelpIconRow}>
                      <Text style={styles.timerHelpEmoji}>👤</Text>
                      <Text style={[styles.timerHelpCardTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                        사람마다 달라요
                      </Text>
                    </View>
                    <Text style={[styles.timerHelpCardText, {color: isDark ? '#BBBBBB' : '#666666'}]}>
                      • 2시간 집중 + 30분 휴식{'\n'}
                      • 50분 집중 + 10분 휴식{'\n'}
                      • 15분 집중 + 5분 휴식{'\n\n'}
                      어떤 방식이든 괜찮아요. 알아서 조절하면 돼요!
                    </Text>
                  </View>

                  <View style={[styles.timerHelpCard, {backgroundColor: isDark ? '#2A2A2A' : '#F8F8F8'}]}>
                    <View style={styles.timerHelpIconRow}>
                      <Text style={styles.timerHelpEmoji}>💡</Text>
                      <Text style={[styles.timerHelpCardTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                        핵심은 사고방식이에요
                      </Text>
                    </View>
                    <Text style={[styles.timerHelpCardText, {color: isDark ? '#BBBBBB' : '#666666'}]}>
                      포모도로의 진짜 가치는 '집중 시간'과 '휴식 시간'을{'\n'}
                      의식적으로 구분하는 것이에요.{'\n\n'}
                      집중할 땐 집중하고, 쉴 땐 확실히 쉬세요!
                    </Text>
                  </View>
                </ScrollView>

                <TouchableOpacity
                  style={[styles.timerHelpCloseButton, {backgroundColor: currentColor}]}
                  onPress={() => setShowTimerHelpModal(false)}>
                  <Text style={styles.timerHelpCloseButtonText}>확인</Text>
                </TouchableOpacity>
              </>
            ) : timerSettingsView === 'alarmSound' ? (
              <View style={{maxHeight: hp(400)}}>
                <ScrollView style={{marginBottom: hp(16)}} showsVerticalScrollIndicator={false}>
                  {alarmSounds.map((sound) => (
                    <TouchableOpacity
                      key={sound.id}
                      style={[styles.alarmSoundItem, {
                        backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                        marginBottom: hp(10),
                        borderRadius: sp(12),
                        borderWidth: tempAlarmSound === sound.id ? 2 : 1,
                        borderColor: tempAlarmSound === sound.id ? currentColor : (isDark ? '#404040' : '#E0E0E0'),
                      }]}
                      onPress={() => {
                        setTempAlarmSound(sound.id);
                        AlarmService.previewSound(sound.id);
                      }}
                      onLongPress={() => {
                        if (sound.isCustom) {
                          Alert.alert(
                            '사운드 삭제',
                            `"${sound.name}" 사운드를 삭제하시겠습니까?`,
                            [
                              {text: '취소', style: 'cancel'},
                              {
                                text: '삭제',
                                style: 'destructive',
                                onPress: async () => {
                                  const removed = await AlarmService.removeCustomSound(sound.id);
                                  if (removed) {
                                    setAlarmSounds(AlarmService.getAllSounds());
                                    if (tempAlarmSound === sound.id) {
                                      setTempAlarmSound('default');
                                    }
                                  }
                                },
                              },
                            ]
                          );
                        }
                      }}>
                      <View style={{flex: 1}}>
                        <Text style={[styles.alarmSoundName, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                          {sound.name}
                        </Text>
                        <Text style={[styles.alarmSoundDescription, {color: isDark ? '#888888' : '#999999'}]}>
                          {sound.description}
                          {sound.isCustom ? ' (길게 눌러 삭제)' : ''}
                        </Text>
                      </View>
                      {tempAlarmSound === sound.id && (
                        <Icon name="checkmark" size={iconSize(22)} color={currentColor} />
                      )}
                    </TouchableOpacity>
                  ))}
                  {/* 커스텀 사운드 추가 버튼 */}
                  <TouchableOpacity
                    style={[styles.alarmSoundItem, {
                      borderStyle: 'dashed',
                      borderWidth: 1,
                      borderColor: isDark ? '#444444' : '#CCCCCC',
                      marginTop: hp(8),
                    }]}
                    onPress={async () => {
                      const newSound = await AlarmService.addCustomSound();
                      if (newSound) {
                        setAlarmSounds(AlarmService.getAllSounds());
                        setTempAlarmSound(newSound.id);
                      }
                    }}>
                    <Icon name="add-circle-outline" size={iconSize(24)} color={isDark ? '#888888' : '#666666'} style={{marginRight: sp(12)}} />
                    <View style={{flex: 1}}>
                      <Text style={[styles.alarmSoundName, {color: isDark ? '#AAAAAA' : '#666666'}]}>
                        내 사운드 추가
                      </Text>
                      <Text style={[styles.alarmSoundDescription, {color: isDark ? '#666666' : '#999999'}]}>
                        기기에서 오디오 파일 선택
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* 도움말 */}
                  <View style={{
                    marginTop: hp(16),
                    padding: sp(12),
                    backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5',
                    borderRadius: sp(8),
                  }}>
                    <Text style={{
                      fontSize: fp(12),
                      color: isDark ? '#888888' : '#666666',
                      lineHeight: fp(18),
                    }}>
                      알람음은 미디어 볼륨으로 재생됩니다. 이어폰 연결 시 이어폰으로만 소리가 나며, 미디어 볼륨을 0으로 설정하면 소리가 나지 않습니다.
                    </Text>
                    <Text style={{
                      fontSize: fp(11),
                      color: isDark ? '#666666' : '#888888',
                      marginTop: hp(8),
                      lineHeight: fp(16),
                    }}>
                      • 기본 알림: 미디어 볼륨으로 알람음 재생{'\n'}
                      • 진동만: 소리 없이 진동만{'\n'}
                      • 완전 무음: 소리와 진동 모두 없음{'\n'}
                      • 백그라운드에서는 시스템 알림음이 사용됩니다
                    </Text>
                    <Text style={{
                      fontSize: fp(11),
                      color: isDark ? '#666666' : '#888888',
                      marginTop: hp(8),
                    }}>
                      커스텀 사운드는 길게 눌러 삭제할 수 있습니다.
                    </Text>
                  </View>
                </ScrollView>
                <TouchableOpacity
                  style={[styles.modalSaveButton, {backgroundColor: currentColor}]}
                  onPress={() => setTimerSettingsView('main')}>
                  <Text style={styles.modalSaveButtonText}>확인</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
            <ScrollView
              style={styles.settingsInputContainer}
              showsVerticalScrollIndicator={false}>
              {/* 타이머 모드 그룹 */}
              <View style={[styles.settingGroup, {backgroundColor: isDark ? '#2A2A2A' : '#F8F8F8'}]}>
                <Text style={[styles.settingGroupTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
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
                          : (isDark ? '#3A3A3A' : '#EEEEEE'),
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
                          : (isDark ? '#3A3A3A' : '#EEEEEE'),
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

              {/* 시간 설정 그룹 */}
              <View style={[styles.settingGroup, {backgroundColor: isDark ? '#2A2A2A' : '#F8F8F8'}]}>
                <Text style={[styles.settingGroupTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                  시간 설정
                </Text>
                {/* Focus Duration */}
                <View style={styles.settingItemInGroup}>
                  <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                    <Text style={[styles.settingLabel, {color: isDark ? '#CCCCCC' : '#666666'}]}>
                      집중 시간 (분)
                    </Text>
                    {/* 연필 보상 표시 - 레이블 바로 옆 */}
                    <View style={{flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#3A3A3A' : '#FFF8E1', paddingHorizontal: sp(8), paddingVertical: sp(4), borderRadius: sp(8), gap: sp(4), marginLeft: sp(8)}}>
                      <Icon name="pencil" size={iconSize(12)} color="#FFB300" />
                      <Text style={{color: '#FFB300', fontSize: fp(11), fontWeight: '600'}}>
                        +{Math.min(360, Math.round((parseInt(tempFocusDuration) || 0) * REWARD_CONFIG.pomodoro.pencilsPerMinute))}
                      </Text>
                    </View>
                  </View>
                  <TextInput
                    style={[styles.settingInput, {
                      backgroundColor: isDark ? '#3A3A3A' : '#FFFFFF',
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

                <View style={[styles.settingDivider, {backgroundColor: isDark ? '#3A3A3A' : '#E0E0E0'}]} />

                {/* Break Duration */}
                <View style={styles.settingItemInGroup}>
                  <Text style={[styles.settingLabel, {color: isDark ? '#CCCCCC' : '#666666'}]}>
                    휴식 시간 (분)
                  </Text>
                  <TextInput
                    style={[styles.settingInput, {
                      backgroundColor: isDark ? '#3A3A3A' : '#FFFFFF',
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
                  <>
                    <View style={[styles.settingDivider, {backgroundColor: isDark ? '#3A3A3A' : '#E0E0E0'}]} />
                    <View style={styles.settingItemInGroup}>
                      <Text style={[styles.settingLabel, {color: isDark ? '#CCCCCC' : '#666666'}]}>
                        반복 횟수
                      </Text>
                      <TextInput
                        style={[styles.settingInput, {
                          backgroundColor: isDark ? '#3A3A3A' : '#FFFFFF',
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
                  </>
                )}
              </View>

              {/* 알람 설정 그룹 */}
              <View style={[styles.settingGroup, {backgroundColor: isDark ? '#2A2A2A' : '#F8F8F8'}]}>
                <Text style={[styles.settingGroupTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                  알람 설정
                </Text>

                {/* 집중 완료 알람 */}
                <View style={styles.settingItemInGroup}>
                  <Text style={[styles.settingLabel, {color: isDark ? '#CCCCCC' : '#666666'}]}>
                    집중 완료 알람
                  </Text>
                  <TouchableOpacity
                    style={[styles.toggleButton, {
                      backgroundColor: tempAlarmEnabled ? currentColor : (isDark ? '#3A3A3A' : '#E0E0E0'),
                    }]}
                    onPress={() => setTempAlarmEnabled(!tempAlarmEnabled)}>
                    <View style={[styles.toggleKnob, {
                      transform: [{translateX: tempAlarmEnabled ? sp(20) : sp(0)}],
                      backgroundColor: '#FFFFFF',
                    }]} />
                  </TouchableOpacity>
                </View>

                <View style={[styles.settingDivider, {backgroundColor: isDark ? '#3A3A3A' : '#E0E0E0'}]} />

                {/* 휴식 완료 알람 */}
                <View style={styles.settingItemInGroup}>
                  <Text style={[styles.settingLabel, {color: isDark ? '#CCCCCC' : '#666666'}]}>
                    휴식 완료 알람
                  </Text>
                  <TouchableOpacity
                    style={[styles.toggleButton, {
                      backgroundColor: tempBreakAlarmEnabled ? currentColor : (isDark ? '#3A3A3A' : '#E0E0E0'),
                    }]}
                    onPress={() => setTempBreakAlarmEnabled(!tempBreakAlarmEnabled)}>
                    <View style={[styles.toggleKnob, {
                      transform: [{translateX: tempBreakAlarmEnabled ? sp(20) : sp(0)}],
                      backgroundColor: '#FFFFFF',
                    }]} />
                  </TouchableOpacity>
                </View>

                <View style={[styles.settingDivider, {backgroundColor: isDark ? '#3A3A3A' : '#E0E0E0'}]} />

                {/* 알람 사운드 */}
                <TouchableOpacity
                  style={styles.settingItemInGroup}
                  onPress={() => setTimerSettingsView('alarmSound')}>
                  <Text style={[styles.settingLabel, {color: isDark ? '#CCCCCC' : '#666666'}]}>
                    알람 사운드
                  </Text>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Text style={{color: isDark ? '#888888' : '#999999', fontSize: fp(14), marginRight: sp(8)}}>
                      {alarmSounds.find(s => s.id === tempAlarmSound)?.name || '기본 알림'}
                    </Text>
                    <Icon name="chevron-forward" size={iconSize(18)} color={isDark ? '#666666' : '#999999'} />
                  </View>
                </TouchableOpacity>

                <View style={[styles.settingDivider, {backgroundColor: isDark ? '#3A3A3A' : '#E0E0E0'}]} />

                {/* 진동 */}
                <View style={styles.settingItemInGroup}>
                  <Text style={[styles.settingLabel, {color: isDark ? '#CCCCCC' : '#666666'}]}>
                    진동
                  </Text>
                  <TouchableOpacity
                    style={[styles.toggleButton, {
                      backgroundColor: tempAlarmVibration ? currentColor : (isDark ? '#3A3A3A' : '#E0E0E0'),
                    }]}
                    onPress={() => setTempAlarmVibration(!tempAlarmVibration)}>
                    <View style={[styles.toggleKnob, {
                      transform: [{translateX: tempAlarmVibration ? sp(20) : sp(0)}],
                      backgroundColor: '#FFFFFF',
                    }]} />
                  </TouchableOpacity>
                </View>
              </View>

            </ScrollView>

            {/* Save button */}
            <TouchableOpacity
              style={[styles.modalSaveButton, {backgroundColor: currentColor}]}
              onPress={handleSaveTimerSettings}>
              <Text style={styles.modalSaveButtonText}>저장</Text>
            </TouchableOpacity>
            </>
            )}
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
            {/* Timer Display with TouchableOpacity wrapper */}
            <View style={styles.lockTimerContainer}>
              <TimeTimer
                size={sp(280)}
                progress={progress}
                color={currentColor}
                backgroundColor={isDark ? '#F5F5F5' : '#FFFFFF'}
                timeText={formatTime(timeLeft)}
                totalSeconds={getTotalDuration()}
                isRunning={isRunning}
                showButton={true}
                onPlayPause={() => setShowUnlockPrompt(true)}
              />
            </View>

            {/* Time Text */}
            <Text style={[styles.lockTimeText, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
              {formatTime(timeLeft)}
            </Text>

            {/* Screen Lock Button */}
            <TouchableOpacity
              style={[styles.screenLockButton, {backgroundColor: isDark ? '#2A2A2A' : '#F0F0F0'}]}
              onPress={async () => {
                const success = await ScreenLock.lockScreen();
                if (success) {
                  setIsScreenDimmed(true);
                }
              }}>
              <Icon name="moon" size={iconSize(20)} color={isDark ? '#AAAAAA' : '#666666'} />
              <Text style={[styles.screenLockButtonText, {color: isDark ? '#AAAAAA' : '#666666'}]}>
                화면 끄기
              </Text>
            </TouchableOpacity>

            {/* Screen Dimmed Overlay - 화면 끄기 상태 */}
            {isScreenDimmed && (
              <TouchableOpacity
                style={styles.screenDimmedOverlay}
                activeOpacity={1}
                onPress={async () => {
                  await ScreenLock.unlockScreen();
                  setIsScreenDimmed(false);
                }}>
                <Text style={styles.screenDimmedText}>화면을 터치하면 켜집니다</Text>
              </TouchableOpacity>
            )}

            {/* Unlock Confirmation Prompt - Lock Screen 내부에 배치 */}
            {showUnlockPrompt && (
              <View style={styles.unlockPromptOverlay}>
                <View style={[styles.unlockPromptContent, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
                  <Icon name="alert-circle" size={iconSize(56)} color="#FF5252" />
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
            )}
          </View>
        </Modal>
      )}

      {/* Lock Settings Modal - 집중모드 시작 전 잠금 설정 */}
      <Modal
        visible={showLockSettingsModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowLockSettingsModal(false)}>
        <View style={styles.unlockPromptOverlay}>
          {(() => {
            const themeColors = getThemeColors();
            return (
          <View style={[styles.lockSettingsContent, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
            <View style={styles.lockSettingsHeader}>
              <Icon name="timer" size={iconSize(32)} color={themeColors.focusColor} />
              <Text style={[styles.lockSettingsTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                집중 시작
              </Text>
            </View>

            <Text style={[styles.lockSettingsDesc, {color: isDark ? '#AAAAAA' : '#666666'}]}>
              {settings.focusDuration}분 동안 집중합니다
            </Text>

            {/* 잠금 모드 토글 */}
            <TouchableOpacity
              style={[
                styles.lockSettingsOption,
                {
                  backgroundColor: tempLockEnabled
                    ? (isDark ? 'rgba(255, 82, 82, 0.15)' : 'rgba(255, 82, 82, 0.1)')
                    : (isDark ? '#2A2A2A' : '#F5F5F5'),
                  borderColor: tempLockEnabled ? themeColors.focusColor : 'transparent',
                },
              ]}
              onPress={() => setTempLockEnabled(!tempLockEnabled)}>
              <View style={styles.lockSettingsOptionLeft}>
                <Icon
                  name={tempLockEnabled ? 'lock-closed' : 'lock-open'}
                  size={iconSize(22)}
                  color={tempLockEnabled ? themeColors.focusColor : (isDark ? '#666666' : '#999999')}
                />
                <View>
                  <Text style={[styles.lockSettingsOptionTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                    잠금 모드
                  </Text>
                  <Text style={[styles.lockSettingsOptionDesc, {color: isDark ? '#888888' : '#999999'}]}>
                    집중 중 다른 탭 이동 제한
                  </Text>
                </View>
              </View>
              <Icon
                name={tempLockEnabled ? 'checkmark-circle' : 'ellipse-outline'}
                size={iconSize(24)}
                color={tempLockEnabled ? themeColors.focusColor : (isDark ? '#666666' : '#CCCCCC')}
              />
            </TouchableOpacity>

            {/* 차단할 탭 선택 (항상 표시) */}
            <View style={styles.lockSettingsTabs}>
              <Text style={[styles.lockSettingsSubtitle, {color: isDark ? '#AAAAAA' : '#666666'}]}>
                차단할 탭
              </Text>
              <View style={styles.lockSettingsTabsRow}>
                {(['StudyRecord', 'Community', 'More'] as TabName[]).map(tab => {
                  const isBlocked = tempStartBlockedTabs.includes(tab);
                  const tabLabels: Record<TabName, string> = {
                    Timer: '타이머',
                    StudyRecord: '공부기록',
                    Community: '커뮤니티',
                    Matching: '매칭',
                    More: '더보기',
                  };
                  return (
                    <TouchableOpacity
                      key={tab}
                      style={[
                        styles.lockSettingsTabChip,
                        {
                          backgroundColor: isBlocked
                            ? (isDark ? 'rgba(255, 82, 82, 0.2)' : 'rgba(255, 82, 82, 0.15)')
                            : (isDark ? '#2A2A2A' : '#F0F0F0'),
                          borderColor: isBlocked ? themeColors.focusColor : 'transparent',
                        },
                      ]}
                      onPress={() => {
                        if (isBlocked) {
                          setTempStartBlockedTabs(tempStartBlockedTabs.filter(t => t !== tab));
                        } else {
                          setTempStartBlockedTabs([...tempStartBlockedTabs, tab]);
                        }
                      }}>
                      <Icon
                        name={isBlocked ? 'lock-closed' : 'lock-open-outline'}
                        size={iconSize(14)}
                        color={isBlocked ? themeColors.focusColor : (isDark ? '#888888' : '#999999')}
                      />
                      <Text style={[
                        styles.lockSettingsTabChipText,
                        {color: isBlocked ? themeColors.focusColor : (isDark ? '#AAAAAA' : '#666666')},
                      ]}>
                        {tabLabels[tab]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 앱 차단 */}
            <TouchableOpacity
              style={[
                styles.lockSettingsOption,
                {
                  backgroundColor: settings.appBlockEnabled
                    ? (isDark ? 'rgba(255, 82, 82, 0.15)' : 'rgba(255, 82, 82, 0.1)')
                    : (isDark ? '#2A2A2A' : '#F5F5F5'),
                  borderColor: settings.appBlockEnabled ? themeColors.focusColor : 'transparent',
                },
              ]}
              onPress={() => {
                if (appBlockerPermission !== 'approved') {
                  requestUsageStatsPermission();
                } else {
                  updateSettings({appBlockEnabled: !settings.appBlockEnabled});
                }
              }}>
              <View style={styles.lockSettingsOptionLeft}>
                <Icon
                  name="apps"
                  size={iconSize(22)}
                  color={settings.appBlockEnabled ? themeColors.focusColor : (isDark ? '#666666' : '#999999')}
                />
                <View>
                  <Text style={[styles.lockSettingsOptionTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                    앱 차단
                  </Text>
                  <Text style={[styles.lockSettingsOptionDesc, {color: isDark ? '#888888' : '#999999'}]}>
                    {appBlockerPermission !== 'approved' ? '권한 필요' : '선택한 앱 실행 제한'}
                  </Text>
                </View>
              </View>
              <Icon
                name={settings.appBlockEnabled && appBlockerPermission === 'approved' ? 'checkmark-circle' : 'ellipse-outline'}
                size={iconSize(24)}
                color={settings.appBlockEnabled && appBlockerPermission === 'approved' ? themeColors.focusColor : (isDark ? '#666666' : '#CCCCCC')}
              />
            </TouchableOpacity>

            {/* 버튼들 */}
            <View style={styles.lockSettingsButtons}>
              <TouchableOpacity
                style={[styles.lockSettingsButton, styles.lockSettingsCancelButton, {backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5'}]}
                onPress={() => setShowLockSettingsModal(false)}>
                <Text style={[styles.lockSettingsCancelText, {color: isDark ? '#AAAAAA' : '#666666'}]}>
                  취소
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.lockSettingsButton, {backgroundColor: themeColors.focusColor}]}
                onPress={handleConfirmStart}>
                <Icon name="play" size={iconSize(18)} color="#FFFFFF" />
                <Text style={styles.lockSettingsStartText}>시작하기</Text>
              </TouchableOpacity>
            </View>
          </View>
            );
          })()}
        </View>
      </Modal>

      {/* Mode Change Confirmation Modal - 집중모드 → 자유모드 전환 확인 */}
      <Modal
        visible={showModeChangeConfirm}
        animationType="fade"
        transparent={true}
        onRequestClose={handleCancelModeChange}>
        <View style={styles.unlockPromptOverlay}>
          <View style={[styles.unlockPromptContent, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
            <Icon name="warning" size={iconSize(56)} color="#FF9500" />
            <Text style={[styles.unlockPromptTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
              집중모드를 해제하시겠습니까?
            </Text>
            <Text style={[styles.unlockPromptMessage, {color: isDark ? '#AAAAAA' : '#666666'}]}>
              아직 {settings.cycleCount - currentCycle + 1}개의 세션이 남아있습니다!{'\n'}
              지금 해제하면 진행 중인 집중이 초기화됩니다.
            </Text>
            <View style={styles.unlockPromptButtons}>
              <TouchableOpacity
                style={[styles.unlockPromptButton, styles.unlockCancelButton, {backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5'}]}
                onPress={handleCancelModeChange}>
                <Text style={[styles.unlockCancelButtonText, {color: isDark ? '#AAAAAA' : '#666666'}]}>
                  취소
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.unlockPromptButton, {backgroundColor: '#FF9500'}]}
                onPress={handleConfirmModeChange}>
                <Text style={styles.unlockConfirmButtonText}>해제하기</Text>
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
                <Icon name="close" size={iconSize(28)} color={isDark ? '#AAAAAA' : '#666666'} />
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
                          size={iconSize(20)}
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
                        <Icon name="checkmark-circle" size={iconSize(24)} color="#FF5252" />
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

      {/* 세션 메모 모달 */}
      <Modal
        visible={showMemoModal}
        animationType="fade"
        transparent={true}
        onRequestClose={handleSkipMemo}>
        <View style={styles.focusResultOverlay}>
          <View style={[styles.focusResultContent, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
            {/* 아이콘 & 타이틀 */}
            <View style={[styles.memoIconContainer, {backgroundColor: currentColor + '20'}]}>
              <Icon name="pencil" size={iconSize(28)} color={currentColor} />
            </View>
            <Text style={[styles.focusResultTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
              집중 완료!
            </Text>
            <Text style={[styles.memoSubtitle, {color: isDark ? '#888888' : '#666666'}]}>
              이번 집중에서 무엇을 했나요?
            </Text>

            {/* 메모 입력 */}
            <TextInput
              style={[styles.memoInput, {
                backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
                color: isDark ? '#FFFFFF' : '#1A1A1A',
                borderColor: isDark ? '#3A3A3A' : '#E0E0E0',
              }]}
              placeholder="예: 수학 문제 풀이, 영어 단어 암기..."
              placeholderTextColor={isDark ? '#666666' : '#999999'}
              value={sessionMemo}
              onChangeText={setSessionMemo}
              multiline
              maxLength={100}
              textAlignVertical="top"
            />
            <Text style={[styles.memoCharCount, {color: isDark ? '#666666' : '#999999'}]}>
              {sessionMemo.length}/100
            </Text>

            {/* 버튼들 */}
            <View style={styles.memoButtons}>
              <TouchableOpacity
                style={[styles.memoSkipButton, {backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5'}]}
                onPress={handleSkipMemo}>
                <Text style={[styles.memoSkipButtonText, {color: isDark ? '#888888' : '#666666'}]}>
                  건너뛰기
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.memoSaveButton, {backgroundColor: currentColor}]}
                onPress={handleSaveMemo}>
                <Text style={styles.memoSaveButtonText}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default PomodoroScreen;
