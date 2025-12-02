import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {BlurView} from '@react-native-community/blur';
import {
  Canvas,
  RoundedRect,
  LinearGradient,
  vec,
  Circle,
  Skia,
  Shader,
  Fill,
  useValue,
} from '@shopify/react-native-skia';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  useDerivedValue,
  runOnJS,
} from 'react-native-reanimated';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const TAB_BAR_WIDTH = SCREEN_WIDTH - 40;
const TAB_BAR_HEIGHT = 70;

// Brand Colors - Blue theme
const BRAND_BLUE = '#42A5F5';
const INACTIVE_GRAY = '#8E8E93';

// Simple gradient shader for frosted glass
const glassShader = Skia.RuntimeEffect.Make(`
uniform vec2 resolution;

vec4 main(vec2 fragCoord) {
  vec2 uv = fragCoord / resolution;

  // Simple white gradient - almost fully transparent
  float gradient = mix(0.02, 0.03, uv.y);

  return vec4(1.0, 1.0, 1.0, gradient);
}
`)!

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedIcon = Animated.createAnimatedComponent(Icon);

const FloatingTabBarSkia: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const tabCount = state.routes.length;
  const tabWidth = (TAB_BAR_WIDTH - 16) / tabCount; // 8px padding on each side

  // Animated indicator position and morphing
  const indicatorX = useSharedValue(state.index * tabWidth);
  const indicatorScale = useSharedValue(1);
  const indicatorWidth = useSharedValue(tabWidth);
  const isDragging = useSharedValue(false);
  const dragStartIndex = useSharedValue(state.index);
  const visualHoverIndex = useSharedValue(state.index); // Visual-only hover state

  // Update indicator position when tab changes (only when not dragging)
  React.useEffect(() => {
    if (!isDragging.value) {
      indicatorX.value = withSpring(state.index * tabWidth, {
        damping: 20,
        stiffness: 120,
        mass: 0.8,
      });
      visualHoverIndex.value = state.index;
    }
  }, [state.index, tabWidth]);

  const handleTabPress = (index: number) => {
    if (index !== state.index && !isDragging.value) {
      navigation.navigate(state.routes[index].name);
    }
  };

  const getIconName = (routeName: string): string => {
    switch (routeName) {
      case 'Timer':
        return 'timer';
      case 'Store':
        return 'storefront';
      case 'Group':
        return 'people';
      case 'StudyRecord':
        return 'book';
      case 'More':
        return 'ellipsis-horizontal-circle';
      default:
        return 'help';
    }
  };

  // Animated indicator style - this is the liquid morphing blue background
  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {translateX: indicatorX.value + 8}, // Account for container padding
        {scaleX: indicatorScale.value},
        {scaleY: indicatorScale.value},
      ],
      width: indicatorWidth.value,
    };
  });

  return (
    <View style={styles.container}>
      {/* Blur Effect - positioned absolutely behind everything */}
      <BlurView
        style={styles.blurContainer}
        blurType={Platform.OS === 'ios' ? 'light' : 'light'}
        blurAmount={Platform.OS === 'ios' ? 12 : 8}
        reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.5)"
      />

      {/* Skia Canvas with gradient overlay on blur */}
      <Canvas style={styles.canvasBackground} pointerEvents="none">
        <Shader source={glassShader} uniforms={{resolution: vec(TAB_BAR_WIDTH, TAB_BAR_HEIGHT)}} />
      </Canvas>

      {/* Liquid morphing blue indicator - flows between tabs */}
      <Animated.View style={[styles.liquidIndicator, indicatorStyle]} pointerEvents="none" />

      {/* Tab Items Container - on top, not affected by blur */}
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const {options} = descriptors[route.key];
          const isFocused = state.index === index;
          const iconName = getIconName(route.name);
          const label = options.tabBarLabel?.toString() || route.name;

          return (
            <TabItem
              key={route.key}
              route={route}
              index={index}
              isFocused={isFocused}
              iconName={iconName}
              label={label}
              onPress={() => handleTabPress(index)}
              tabWidth={tabWidth}
              tabCount={tabCount}
              indicatorX={indicatorX}
              indicatorScale={indicatorScale}
              indicatorWidth={indicatorWidth}
              isDragging={isDragging}
              dragStartIndex={dragStartIndex}
              visualHoverIndex={visualHoverIndex}
              navigation={navigation}
              routes={state.routes}
            />
          );
        })}
      </View>
    </View>
  );
};

// Separate TabItem component with animations
const TabItem: React.FC<{
  route: any;
  index: number;
  isFocused: boolean;
  iconName: string;
  label: string;
  onPress: () => void;
  tabWidth: number;
  tabCount: number;
  indicatorX: Animated.SharedValue<number>;
  indicatorScale: Animated.SharedValue<number>;
  indicatorWidth: Animated.SharedValue<number>;
  isDragging: Animated.SharedValue<boolean>;
  dragStartIndex: Animated.SharedValue<number>;
  visualHoverIndex: Animated.SharedValue<number>;
  navigation: any;
  routes: any[];
}> = ({route, index, isFocused, iconName, label, onPress, tabWidth, tabCount, indicatorX, indicatorScale, indicatorWidth, isDragging, dragStartIndex, visualHoverIndex, navigation, routes}) => {
  const scale = useSharedValue(1);
  const rippleScale = useSharedValue(0);
  const rippleOpacity = useSharedValue(0);
  const startX = useSharedValue(0);
  const hasMoved = useSharedValue(false);

  // Gesture handler for cross-platform drag support
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

      // Ripple effect
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

        // Calculate absolute position from gesture - finger position is center
        const fingerX = e.x + index * tabWidth;
        const centerOffset = tabWidth / 2;
        const indicatorCenterX = fingerX - centerOffset;

        const clampedX = Math.max(0, Math.min(indicatorCenterX, tabCount * tabWidth - tabWidth));

        // Calculate target index during drag - VISUAL ONLY
        const targetIndex = Math.round((fingerX) / tabWidth);
        const clampedIndex = Math.max(0, Math.min(tabCount - 1, targetIndex));

        // Update visual hover index only (no navigation)
        visualHoverIndex.value = clampedIndex;

        // Smoothly follow finger position (finger at center)
        indicatorX.value = withSpring(clampedX, {
          damping: 25,
          stiffness: 300,
          mass: 0.4,
        });

        // Smooth morphing during drag
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
        const targetIndex = Math.round(absoluteX / tabWidth);
        const clampedIndex = Math.max(0, Math.min(tabCount - 1, targetIndex));

        // Navigate only at the end of drag
        runOnJS(navigation.navigate)(routes[clampedIndex].name);

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

  // Derive visual focus state - true if either actually focused OR being hovered during drag
  const isVisuallyFocused = useDerivedValue(() => {
    const dragging = isDragging.value;
    const hoverIdx = visualHoverIndex.value;
    return isFocused || (dragging && hoverIdx === index);
  });

  // During drag, fade out the original tab
  const tabOpacity = useDerivedValue(() => {
    const dragging = isDragging.value;
    const hoverIdx = visualHoverIndex.value;
    if (dragging && isFocused && hoverIdx !== index) {
      return 0.3; // Fade out original tab during drag
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
        {/* Ripple effect background */}
        <Animated.View style={[styles.ripple, rippleStyle]} />

        {/* Tab content with opacity animation */}
        <Animated.View style={[styles.tabContentContainer, tabContainerStyle]}>
          {/* Icon container - NO background, indicator is separate */}
          <View style={styles.iconContainer}>
            <AnimatedIcon
              name={iconName}
              size={24}
              style={iconColorStyle}
            />
          </View>

          {/* Label */}
          <Animated.Text
            style={[
              styles.label,
              labelColorStyle,
            ]}
            numberOfLines={1}>
            {label}
          </Animated.Text>
        </Animated.View>
      </AnimatedTouchableOpacity>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    height: TAB_BAR_HEIGHT,
    borderRadius: 35,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden', // Clip blur and canvas to rounded corners
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
    top: 5,
    height: 60,
    backgroundColor: 'rgba(66, 165, 245, 0.08)',
    borderRadius: 30,
  },
  tabBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabContentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ripple: {
    position: 'absolute',
    width: 50,
    height: 60,
    borderRadius: 30,
    backgroundColor: BRAND_BLUE,
  },
  iconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  label: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
});

export default FloatingTabBarSkia;
