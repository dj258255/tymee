import React, {useRef, useState} from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {Canvas, Circle, BlurMask} from '@shopify/react-native-skia';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const TAB_BAR_WIDTH = SCREEN_WIDTH - 40;
const TAB_BAR_HEIGHT = 70;
const PADDING = 8;

const FloatingTabBarSkia: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const tabCount = state.routes.length;
  const tabWidth = TAB_BAR_WIDTH / tabCount;

  const [isDragging, setIsDragging] = useState(false);
  const [bubbleX, setBubbleX] = useState(0);
  const bubbleOpacity = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const touchX = evt.nativeEvent.pageX - 20; // 20은 container left
        setBubbleX(touchX);
        setIsDragging(true);

        Animated.spring(bubbleOpacity, {
          toValue: 1,
          useNativeDriver: false,
        }).start();
      },
      onPanResponderMove: (evt) => {
        const touchX = evt.nativeEvent.pageX - 20;
        setBubbleX(touchX);
      },
      onPanResponderRelease: (evt) => {
        const touchX = evt.nativeEvent.pageX - 20;
        const newIndex = Math.floor(touchX / tabWidth);
        const clampedIndex = Math.max(0, Math.min(tabCount - 1, newIndex));

        Animated.spring(bubbleOpacity, {
          toValue: 0,
          useNativeDriver: false,
        }).start(() => {
          setIsDragging(false);
        });

        if (clampedIndex !== state.index) {
          navigation.navigate(state.routes[clampedIndex].name);
        }
      },
    })
  ).current;

  const handleTabPress = (index: number) => {
    if (index !== state.index) {
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

  return (
    <View style={styles.container}>
      <View style={styles.tabBar} {...panResponder.panHandlers}>
        {/* 배경 */}
        <View style={styles.background} />

        {/* 탭 아이템들 */}
        {state.routes.map((route, index) => {
          const {options} = descriptors[route.key];
          const isFocused = state.index === index;
          const iconName = getIconName(route.name);
          const label = options.tabBarLabel?.toString() || route.name;

          return (
            <TouchableOpacity
              key={route.key}
              activeOpacity={0.8}
              onPress={() => handleTabPress(index)}
              style={styles.tab}>
              <Icon
                name={iconName}
                size={isFocused ? 28 : 26}
                color={isFocused ? '#007AFF' : '#999999'}
              />
              <Text
                style={[
                  styles.label,
                  {
                    color: isFocused ? '#007AFF' : '#999999',
                    fontSize: isFocused ? 12 : 11,
                  },
                ]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 물방울 효과 */}
      {isDragging && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.bubbleContainer,
            {opacity: bubbleOpacity},
          ]}>
          <Canvas style={StyleSheet.absoluteFill}>
            {/* 외곽 글로우 */}
            <Circle
              cx={bubbleX}
              cy={50}
              r={65}
              color="rgba(255, 255, 255, 0.3)">
              <BlurMask blur={20} style="normal" />
            </Circle>

            {/* 메인 물방울 */}
            <Circle
              cx={bubbleX}
              cy={50}
              r={50}
              color="rgba(255, 255, 255, 0.7)">
              <BlurMask blur={10} style="normal" />
            </Circle>

            {/* 테두리 */}
            <Circle
              cx={bubbleX}
              cy={50}
              r={50}
              color="rgba(255, 255, 255, 0.9)"
              style="stroke"
              strokeWidth={3}>
              <BlurMask blur={5} style="normal" />
            </Circle>
          </Canvas>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  tabBar: {
    width: TAB_BAR_WIDTH,
    height: TAB_BAR_HEIGHT,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderRadius: 35,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
    paddingHorizontal: PADDING,
    paddingVertical: PADDING,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 35,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    marginTop: 4,
    fontWeight: '600',
  },
  bubbleContainer: {
    position: 'absolute',
    left: 0,
    top: -15,
    width: TAB_BAR_WIDTH,
    height: 100,
    zIndex: 10,
  },
});

export default FloatingTabBarSkia;
