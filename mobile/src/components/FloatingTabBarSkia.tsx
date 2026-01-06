import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  LayoutChangeEvent,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {BlurView} from '@react-native-community/blur';
import {
  Canvas,
  Skia,
  Shader,
  vec,
} from '@shopify/react-native-skia';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  useDerivedValue,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import {sp, hp, iconSize, fp} from '../utils/responsive';
import {useNavigationStore, CommunitySubTab, MainTab} from '../store/navigationStore';
import {usePomodoroStore} from '../store/pomodoroStore';
import {TabName} from '../types/pomodoro';

const TAB_BAR_HEIGHT = hp(70);

// Brand Colors - Blue theme
const BRAND_BLUE = '#42A5F5';
const INACTIVE_GRAY = '#8E8E93';

// 햅틱 피드백 옵션
const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

// 햅틱 피드백 트리거 함수
const triggerHaptic = (type: 'light' | 'medium' | 'selection' = 'light') => {
  const feedbackType = type === 'light' ? 'impactLight' : type === 'medium' ? 'impactMedium' : 'selection';
  ReactNativeHapticFeedback.trigger(feedbackType, hapticOptions);
};

// Simple gradient shader for frosted glass
const glassShader = Skia.RuntimeEffect.Make(`
uniform vec2 resolution;

vec4 main(vec2 fragCoord) {
  vec2 uv = fragCoord / resolution;

  // Simple white gradient - almost fully transparent
  float gradient = mix(0.02, 0.03, uv.y);

  return vec4(1.0, 1.0, 1.0, gradient);
}
`)!;

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedIcon = Animated.createAnimatedComponent(Icon);

// 기본 탭 설정
const MAIN_TABS = [
  {name: 'Timer', icon: 'timer', label: '타이머'},
  {name: 'StudyRecord', icon: 'book', label: '공부기록'},
  {name: 'Community', icon: 'chatbubbles', label: '커뮤니티'},
  {name: 'More', icon: 'ellipsis-horizontal-circle', label: '더보기'},
];

// 커뮤니티 서브탭 설정
const COMMUNITY_SUB_TABS: {name: CommunitySubTab; icon: string; label: string}[] = [
  {name: 'Feed', icon: 'newspaper', label: '피드'},
  {name: 'Matching', icon: 'git-compare', label: '매칭'},
  {name: 'Group', icon: 'people', label: '모임'},
  {name: 'Friends', icon: 'person-add', label: '친구'},
];

const FloatingTabBarSkia: React.FC<BottomTabBarProps> = ({
  state,
  // descriptors is provided by BottomTabBarProps but not used in this component
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  descriptors: _descriptors,
  navigation,
}) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const {isCommunityMode, activeCommunityTab, exitCommunityMode, setCommunityTab} = useNavigationStore();
  const {isRunning, mode, settings} = usePomodoroStore();

  // 탭이 차단되었는지 확인
  // 집중모드 + 타이머 실행 중 + FOCUS 모드 + 해당 탭이 차단 목록에 있으면 차단
  const isTabBlocked = useCallback((tabName: string): boolean => {
    if (settings.appMode !== 'CONCENTRATION') {return false;}
    if (!isRunning) {return false;}
    if (mode !== 'FOCUS') {return false;}
    return settings.blockedTabs.includes(tabName as TabName);
  }, [settings.appMode, settings.blockedTabs, isRunning, mode]);

  // 드래그용 콜백 함수들 (runOnJS에서 사용)
  const enterCommunityModeCallback = useCallback((fromTab?: MainTab) => {
    useNavigationStore.getState().enterCommunityMode(fromTab);
  }, []);

  // 드래그로 커뮤니티 진입 시 사용하는 딜레이 콜백
  const enterCommunityModeWithDelay = useCallback(() => {
    setTimeout(() => {
      useNavigationStore.getState().enterCommunityMode(undefined);
    }, 100);
  }, []);

  const navigateCallback = useCallback((tabName: string) => {
    // 탭이 차단되었으면 이동하지 않음
    const pomodoroState = usePomodoroStore.getState();
    const {settings: s, isRunning: running, mode: m} = pomodoroState;
    if (s.appMode === 'CONCENTRATION' && running && m === 'FOCUS' && s.blockedTabs.includes(tabName as TabName)) {
      return;
    }
    // 드래그로 탭 변경 시 햅틱 피드백
    triggerHaptic('light');
    navigation.navigate(tabName);
  }, [navigation]);

  const setCommunityTabCallback = useCallback((tab: CommunitySubTab) => {
    // 드래그로 서브탭 변경 시 햅틱 피드백
    triggerHaptic('light');
    useNavigationStore.getState().setCommunityTab(tab);
  }, []);

  // 현재 모드에 따른 탭 개수
  const tabCount = isCommunityMode ? COMMUNITY_SUB_TABS.length + 1 : MAIN_TABS.length; // +1 for back button
  const tabWidth = containerWidth > 0 ? (containerWidth - 16) / tabCount : 0;

  // 모드 전환 애니메이션
  const modeTransition = useSharedValue(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    modeTransition.value = withSpring(isCommunityMode ? 1 : 0, {
      damping: 20,
      stiffness: 150,
    }, () => {
      runOnJS(setIsTransitioning)(false);
    });
  }, [isCommunityMode, modeTransition]);

  // Handle layout to get actual width
  const onContainerLayout = useCallback((event: LayoutChangeEvent) => {
    const {width} = event.nativeEvent.layout;
    setContainerWidth(width);
  }, []);

  // 현재 선택된 인덱스 계산
  const getCurrentIndex = () => {
    if (isCommunityMode) {
      const subTabIndex = COMMUNITY_SUB_TABS.findIndex(tab => tab.name === activeCommunityTab);
      return subTabIndex + 1; // +1 because back button is at index 0
    }
    // 메인 탭에서 현재 route 찾기
    const currentRoute = state.routes[state.index].name;
    return MAIN_TABS.findIndex(tab => tab.name === currentRoute);
  };

  const currentIndex = getCurrentIndex();

  // Animated indicator position
  const indicatorX = useSharedValue(currentIndex * tabWidth);
  const indicatorScale = useSharedValue(1);
  const indicatorWidth = useSharedValue(tabWidth);

  // Update indicator when tab/mode changes
  useEffect(() => {
    if (tabWidth > 0) {
      indicatorX.value = withSpring(currentIndex * tabWidth, {
        damping: 20,
        stiffness: 120,
        mass: 0.8,
      });
      indicatorWidth.value = tabWidth;
    }
  }, [currentIndex, tabWidth, isCommunityMode, indicatorX, indicatorWidth]);

  // Animated indicator style
  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {translateX: indicatorX.value + 8},
        {scaleX: indicatorScale.value},
        {scaleY: indicatorScale.value},
      ],
      width: indicatorWidth.value,
    };
  });

  // 메인탭 컨테이너 애니메이션 (서브탭으로 전환 시 왼쪽으로 사라짐)
  const mainTabsAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(modeTransition.value, [0, 0.5, 1], [1, 0, 0]),
      transform: [
        {translateX: interpolate(modeTransition.value, [0, 1], [0, -50])},
        {scale: interpolate(modeTransition.value, [0, 1], [1, 0.9])},
      ],
    };
  });

  // 서브탭 컨테이너 애니메이션 (메인탭에서 전환 시 오른쪽에서 나타남)
  const subTabsAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(modeTransition.value, [0, 0.5, 1], [0, 0, 1]),
      transform: [
        {translateX: interpolate(modeTransition.value, [0, 1], [50, 0])},
        {scale: interpolate(modeTransition.value, [0, 1], [0.9, 1])},
      ],
    };
  });

  // 현재 메인 탭 이름 가져오기
  const getCurrentMainTab = (): MainTab => {
    const currentRoute = state.routes[state.index]?.name;
    return (currentRoute as MainTab) || 'StudyRecord';
  };

  // 메인 탭 프레스 핸들러
  const handleMainTabPress = (tabName: string, _index: number) => {
    // 탭이 차단되었으면 이동하지 않음
    if (isTabBlocked(tabName)) {
      return;
    }

    // 햅틱 피드백 (살짝 가벼운 진동)
    triggerHaptic('light');

    if (tabName === 'Community') {
      // 커뮤니티 탭 누르면 커뮤니티 모드로 전환, 현재 탭 저장
      const currentTab = getCurrentMainTab();
      useNavigationStore.getState().enterCommunityMode(currentTab !== 'Community' ? currentTab : undefined);
      navigation.navigate('Community');
    } else {
      navigation.navigate(tabName);
    }
  };

  // 커뮤니티 서브탭 프레스 핸들러
  const handleSubTabPress = (subTab: CommunitySubTab) => {
    // 햅틱 피드백 (살짝 가벼운 진동)
    triggerHaptic('light');
    setCommunityTab(subTab);
  };

  // 뒤로가기 핸들러
  const handleBackPress = () => {
    // 햅틱 피드백 (살짝 가벼운 진동)
    triggerHaptic('light');
    const prevTab = exitCommunityMode();
    // 이전 탭으로 돌아가기
    navigation.navigate(prevTab);
  };

  return (
    <>
      {/* 광고 배너 영역 - 하단 고정 */}
      <View style={styles.adBannerContainer}>
        <View style={styles.adBannerPlaceholder}>
          {/* 광고가 로드될 공간 - 스켈레톤 */}
        </View>
      </View>

      <View style={styles.container} onLayout={onContainerLayout}>
        {/* Blur Effect */}
        <BlurView
        style={styles.blurContainer}
        blurType={Platform.OS === 'ios' ? 'light' : 'light'}
        blurAmount={Platform.OS === 'ios' ? 12 : 8}
        reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.5)"
      />

      {/* Skia Canvas with gradient overlay */}
      {containerWidth > 0 && (
        <Canvas style={styles.canvasBackground} pointerEvents="none">
          <Shader source={glassShader} uniforms={{resolution: vec(containerWidth, TAB_BAR_HEIGHT)}} />
        </Canvas>
      )}

      {/* Liquid morphing indicator */}
      {containerWidth > 0 && !isCommunityMode && (
        <Animated.View style={[styles.liquidIndicator, indicatorStyle]} pointerEvents="none" />
      )}

      {/* 커뮤니티 모드 인디케이터 (뒤로가기 제외) */}
      {containerWidth > 0 && isCommunityMode && currentIndex > 0 && (
        <Animated.View style={[styles.liquidIndicator, indicatorStyle]} pointerEvents="none" />
      )}

      {/* Tab Items - 전환 중에만 둘 다 렌더링, 아니면 해당 모드만 */}
      <View style={styles.tabBar}>
        {/* 메인 탭 모드 - 전환 중이거나 메인 모드일 때만 렌더링 */}
        {(isTransitioning || !isCommunityMode) && (
          <Animated.View style={[styles.tabBarInner, isCommunityMode && styles.tabBarAbsolute, mainTabsAnimatedStyle]} pointerEvents={isCommunityMode ? 'none' : 'auto'}>
            {MAIN_TABS.map((tab, idx) => {
              const isFocused = !isCommunityMode && currentIndex === idx;
              return (
                <MainTabItem
                  key={tab.name}
                  tab={tab}
                  index={idx}
                  isFocused={isFocused}
                  onPress={() => handleMainTabPress(tab.name, idx)}
                  tabWidth={tabWidth}
                  tabCount={MAIN_TABS.length}
                  indicatorX={indicatorX}
                  indicatorScale={indicatorScale}
                  indicatorWidth={indicatorWidth}
                  enterCommunityModeCallback={enterCommunityModeCallback}
                  enterCommunityModeWithDelay={enterCommunityModeWithDelay}
                  navigateCallback={navigateCallback}
                  getCurrentMainTab={getCurrentMainTab}
                />
              );
            })}
          </Animated.View>
        )}

        {/* 커뮤니티 서브탭 모드 - 전환 중이거나 서브탭 모드일 때만 렌더링 */}
        {(isTransitioning || isCommunityMode) && (
          <Animated.View style={[styles.tabBarInner, !isCommunityMode && styles.tabBarAbsolute, subTabsAnimatedStyle]} pointerEvents={isCommunityMode ? 'auto' : 'none'}>
            {/* 뒤로가기 버튼 */}
            <TouchableOpacity
              style={[styles.tab, styles.backTab]}
              onPress={handleBackPress}
              activeOpacity={0.7}>
              <View style={styles.backButton}>
                <Icon name="arrow-back" size={iconSize(24)} color={INACTIVE_GRAY} />
              </View>
            </TouchableOpacity>

            {/* 커뮤니티 서브탭들 */}
            {COMMUNITY_SUB_TABS.map((tab, index) => {
              const isActive = activeCommunityTab === tab.name;
              const actualIndex = index + 1; // 뒤로가기 버튼이 0번이므로
              return (
                <SubTabItem
                  key={tab.name}
                  tab={tab}
                  index={actualIndex}
                  isFocused={isActive}
                  onPress={() => handleSubTabPress(tab.name)}
                  tabWidth={tabWidth}
                  tabCount={COMMUNITY_SUB_TABS.length + 1}
                  indicatorX={indicatorX}
                  indicatorScale={indicatorScale}
                  indicatorWidth={indicatorWidth}
                  setCommunityTabCallback={setCommunityTabCallback}
                />
              );
            })}
          </Animated.View>
        )}
      </View>
    </View>
    </>
  );
};

// 서브탭 아이템 컴포넌트 (커뮤니티 서브탭용 드래그 지원)
const SubTabItem: React.FC<{
  tab: {name: CommunitySubTab; icon: string; label: string};
  index: number;
  isFocused: boolean;
  onPress: () => void;
  tabWidth: number;
  tabCount: number;
  indicatorX: Animated.SharedValue<number>;
  indicatorScale: Animated.SharedValue<number>;
  indicatorWidth: Animated.SharedValue<number>;
  setCommunityTabCallback: (tab: CommunitySubTab) => void;
}> = ({tab, index, isFocused, onPress, tabWidth, tabCount, indicatorX, indicatorScale, indicatorWidth, setCommunityTabCallback}) => {
  const scale = useSharedValue(1);
  const rippleScale = useSharedValue(0);
  const rippleOpacity = useSharedValue(0);
  const startX = useSharedValue(0);
  const hasMoved = useSharedValue(false);
  const isDragging = useSharedValue(false);
  const visualHoverIndex = useSharedValue(index);

  const panGesture = Gesture.Pan()
    .onBegin((e) => {
      startX.value = e.x;
      hasMoved.value = false;
      isDragging.value = false;

      scale.value = withSpring(0.95, {
        damping: 15,
        stiffness: 150,
      });

      rippleScale.value = 0;
      rippleOpacity.value = 0.3;
      rippleScale.value = withTiming(1, {duration: 400});
      rippleOpacity.value = withTiming(0, {duration: 400});
    })
    .onUpdate((e) => {
      const deltaX = e.x - startX.value;

      if (Math.abs(deltaX) > 10) {
        hasMoved.value = true;
        isDragging.value = true;

        // 뒤로가기 버튼(0)을 제외한 영역에서만 드래그
        const absoluteFingerX = e.x + index * tabWidth;
        const indicatorCenterX = absoluteFingerX - tabWidth / 2;
        // 최소 1 (뒤로가기 버튼 제외), 양쪽 끝에 동일한 여백을 위해 오른쪽 최대값 조정
        const maxX = (tabCount - 1) * tabWidth - 8;
        const clampedX = Math.max(tabWidth, Math.min(indicatorCenterX, maxX));
        const targetIndex = Math.floor(absoluteFingerX / tabWidth);
        const clampedIndex = Math.max(1, Math.min(tabCount - 1, targetIndex));

        visualHoverIndex.value = clampedIndex;

        indicatorX.value = withSpring(clampedX, {
          damping: 25,
          stiffness: 300,
          mass: 0.4,
        });

        const distanceFromCenter = Math.abs((clampedX % tabWidth) - tabWidth / 2);
        const stretchFactor = 1 + (distanceFromCenter / tabWidth) * 0.3;

        indicatorScale.value = withSpring(1, {
          damping: 20,
          stiffness: 250,
        });

        indicatorWidth.value = withSpring(tabWidth * stretchFactor, {
          damping: 25,
          stiffness: 280,
        });
      }
    })
    .onEnd((e) => {
      scale.value = withSpring(1, {
        damping: 12,
        stiffness: 120,
      });

      if (hasMoved.value && isDragging.value) {
        const absoluteX = e.x + index * tabWidth;
        const targetIndex = Math.floor(absoluteX / tabWidth);
        // 뒤로가기 버튼(0)을 제외하고 1~4 범위
        const clampedIndex = Math.max(1, Math.min(tabCount - 1, targetIndex));
        const targetTab = COMMUNITY_SUB_TABS[clampedIndex - 1]; // -1 because back button is at 0

        if (targetTab) {
          runOnJS(setCommunityTabCallback)(targetTab.name);
        }

        indicatorX.value = withSpring(clampedIndex * tabWidth, {
          damping: 20,
          stiffness: 140,
          mass: 0.8,
        });
      } else {
        runOnJS(onPress)();
      }

      indicatorScale.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      });

      indicatorWidth.value = withSpring(tabWidth, {
        damping: 20,
        stiffness: 160,
      });

      isDragging.value = false;
      hasMoved.value = false;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  const rippleStyle = useAnimatedStyle(() => ({
    transform: [{scale: rippleScale.value}],
    opacity: rippleOpacity.value,
  }));

  const isVisuallyFocused = useDerivedValue(() => {
    const dragging = isDragging.value;
    const hoverIdx = visualHoverIndex.value;
    return isFocused || (dragging && hoverIdx === index);
  });

  const tabOpacity = useDerivedValue(() => {
    const dragging = isDragging.value;
    const hoverIdx = visualHoverIndex.value;
    if (dragging && isFocused && hoverIdx !== index) {
      return 0.3;
    }
    return 1;
  });

  const iconColorStyle = useAnimatedStyle(() => ({
    color: isVisuallyFocused.value ? BRAND_BLUE : INACTIVE_GRAY,
  }));

  const labelColorStyle = useAnimatedStyle(() => ({
    color: isVisuallyFocused.value ? BRAND_BLUE : INACTIVE_GRAY,
    fontWeight: isVisuallyFocused.value ? '600' : '500',
  }));

  const tabContainerStyle = useAnimatedStyle(() => ({
    opacity: tabOpacity.value,
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <AnimatedTouchableOpacity
        style={[styles.tab, animatedStyle]}
        onPress={onPress}
        activeOpacity={0.7}>
        <Animated.View style={[styles.ripple, rippleStyle]} />
        <Animated.View style={[styles.tabContentContainer, tabContainerStyle]}>
          <View style={styles.iconContainer}>
            <AnimatedIcon
              name={tab.icon}
              size={iconSize(24)}
              style={iconColorStyle}
            />
          </View>
          <Animated.Text
            style={[styles.label, labelColorStyle]}
            numberOfLines={1}>
            {tab.label}
          </Animated.Text>
        </Animated.View>
      </AnimatedTouchableOpacity>
    </GestureDetector>
  );
};

// 메인 탭 아이템 컴포넌트
const MainTabItem: React.FC<{
  tab: {name: string; icon: string; label: string};
  index: number;
  isFocused: boolean;
  onPress: () => void;
  tabWidth: number;
  tabCount: number;
  indicatorX: Animated.SharedValue<number>;
  indicatorScale: Animated.SharedValue<number>;
  indicatorWidth: Animated.SharedValue<number>;
  enterCommunityModeCallback: (fromTab?: MainTab) => void;
  enterCommunityModeWithDelay: () => void;
  navigateCallback: (tabName: string) => void;
  getCurrentMainTab: () => MainTab;
}> = ({tab, index, isFocused, onPress, tabWidth, tabCount, indicatorX, indicatorScale, indicatorWidth, navigateCallback, enterCommunityModeWithDelay}) => {
  const scale = useSharedValue(1);
  const rippleScale = useSharedValue(0);
  const rippleOpacity = useSharedValue(0);
  const startX = useSharedValue(0);
  const hasMoved = useSharedValue(false);
  const isDragging = useSharedValue(false);
  const dragStartIndex = useSharedValue(index);
  const visualHoverIndex = useSharedValue(index);

  const panGesture = Gesture.Pan()
    .onBegin((e) => {
      startX.value = e.x;
      hasMoved.value = false;
      isDragging.value = false;
      dragStartIndex.value = index;

      scale.value = withSpring(0.95, {
        damping: 15,
        stiffness: 150,
      });

      rippleScale.value = 0;
      rippleOpacity.value = 0.3;
      rippleScale.value = withTiming(1, {duration: 400});
      rippleOpacity.value = withTiming(0, {duration: 400});
    })
    .onUpdate((e) => {
      const deltaX = e.x - startX.value;

      if (Math.abs(deltaX) > 10) {
        hasMoved.value = true;
        isDragging.value = true;

        const absoluteFingerX = e.x + index * tabWidth;
        const indicatorCenterX = absoluteFingerX - tabWidth / 2;
        // 양쪽 끝에 동일한 여백을 위해 오른쪽 최대값 조정 (왼쪽과 대칭)
        const maxX = (tabCount - 1) * tabWidth - 8;
        const clampedX = Math.max(0, Math.min(indicatorCenterX, maxX));
        const targetIndex = Math.floor(absoluteFingerX / tabWidth);
        const clampedIndex = Math.max(0, Math.min(tabCount - 1, targetIndex));

        visualHoverIndex.value = clampedIndex;

        indicatorX.value = withSpring(clampedX, {
          damping: 25,
          stiffness: 300,
          mass: 0.4,
        });

        const distanceFromCenter = Math.abs((clampedX % tabWidth) - tabWidth / 2);
        const stretchFactor = 1 + (distanceFromCenter / tabWidth) * 0.3;

        indicatorScale.value = withSpring(1, {
          damping: 20,
          stiffness: 250,
        });

        indicatorWidth.value = withSpring(tabWidth * stretchFactor, {
          damping: 25,
          stiffness: 280,
        });
      }
    })
    .onEnd((e) => {
      scale.value = withSpring(1, {
        damping: 12,
        stiffness: 120,
      });

      if (hasMoved.value && isDragging.value) {
        const absoluteX = e.x + index * tabWidth;
        const targetIndex = Math.floor(absoluteX / tabWidth);
        const clampedIndex = Math.max(0, Math.min(tabCount - 1, targetIndex));
        const targetTab = MAIN_TABS[clampedIndex];

        if (targetTab && targetTab.name === 'Community') {
          // 커뮤니티로 드래그 이동 시, 먼저 navigate 후 약간의 딜레이를 두고 커뮤니티 모드 활성화
          // 이렇게 하면 드래그 제스처가 완전히 끝난 후에 UI가 전환됨
          runOnJS(navigateCallback)('Community');
          runOnJS(enterCommunityModeWithDelay)();
        } else if (targetTab) {
          runOnJS(navigateCallback)(targetTab.name);
        }

        indicatorX.value = withSpring(clampedIndex * tabWidth, {
          damping: 20,
          stiffness: 140,
          mass: 0.8,
        });
      } else {
        runOnJS(onPress)();
      }

      indicatorScale.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      });

      indicatorWidth.value = withSpring(tabWidth, {
        damping: 20,
        stiffness: 160,
      });

      isDragging.value = false;
      hasMoved.value = false;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  const rippleStyle = useAnimatedStyle(() => ({
    transform: [{scale: rippleScale.value}],
    opacity: rippleOpacity.value,
  }));

  const isVisuallyFocused = useDerivedValue(() => {
    const dragging = isDragging.value;
    const hoverIdx = visualHoverIndex.value;
    return isFocused || (dragging && hoverIdx === index);
  });

  const tabOpacity = useDerivedValue(() => {
    const dragging = isDragging.value;
    const hoverIdx = visualHoverIndex.value;
    if (dragging && isFocused && hoverIdx !== index) {
      return 0.3;
    }
    return 1;
  });

  const iconColorStyle = useAnimatedStyle(() => ({
    color: isVisuallyFocused.value ? BRAND_BLUE : INACTIVE_GRAY,
  }));

  const labelColorStyle = useAnimatedStyle(() => ({
    color: isVisuallyFocused.value ? BRAND_BLUE : INACTIVE_GRAY,
    fontWeight: isVisuallyFocused.value ? '600' : '500',
  }));

  const tabContainerStyle = useAnimatedStyle(() => ({
    opacity: tabOpacity.value,
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <AnimatedTouchableOpacity
        style={[styles.tab, animatedStyle]}
        onPress={onPress}
        activeOpacity={0.7}>
        <Animated.View style={[styles.ripple, rippleStyle]} />
        <Animated.View style={[styles.tabContentContainer, tabContainerStyle]}>
          <View style={styles.iconContainer}>
            <AnimatedIcon
              name={tab.icon}
              size={iconSize(24)}
              style={iconColorStyle}
            />
          </View>
          <Animated.Text
            style={[styles.label, labelColorStyle]}
            numberOfLines={1}>
            {tab.label}
          </Animated.Text>
        </Animated.View>
      </AnimatedTouchableOpacity>
    </GestureDetector>
  );
};

// 광고 배너 높이 (얇고 긴 배너)
const AD_BANNER_HEIGHT = hp(50);

const styles = StyleSheet.create({
  // 광고 배너 컨테이너 - 화면 맨 하단
  adBannerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: AD_BANNER_HEIGHT,
    backgroundColor: 'rgba(245, 245, 245, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
  },
  adBannerPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(230, 230, 230, 0.5)',
  },
  container: {
    position: 'absolute',
    bottom: hp(20) + AD_BANNER_HEIGHT, // 광고 배너 높이만큼 위로 올림
    left: sp(20),
    right: sp(20),
    height: TAB_BAR_HEIGHT,
    borderRadius: sp(35),
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: sp(4)},
    shadowOpacity: 0.12,
    shadowRadius: sp(16),
    elevation: 8,
    overflow: 'hidden',
  },
  blurContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  canvasBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  liquidIndicator: {
    position: 'absolute',
    top: sp(5),
    height: hp(60),
    backgroundColor: 'rgba(66, 165, 245, 0.08)',
    borderRadius: sp(30),
  },
  tabBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(8),
  },
  tabBarInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabBarAbsolute: {
    position: 'absolute',
    left: sp(8),
    right: sp(8),
    top: 0,
    bottom: 0,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(8),
  },
  backTab: {
    // 동일한 flex: 1 유지 (인디케이터 위치 계산을 위해)
  },
  backButton: {
    width: sp(44),
    height: sp(44),
    borderRadius: sp(22),
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ripple: {
    position: 'absolute',
    width: sp(50),
    height: hp(60),
    borderRadius: sp(30),
    backgroundColor: BRAND_BLUE,
  },
  iconContainer: {
    width: sp(40),
    height: sp(40),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: sp(20),
  },
  label: {
    fontSize: fp(10),
    marginTop: hp(2),
    textAlign: 'center',
  },
});

export default FloatingTabBarSkia;
