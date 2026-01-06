import React, {useRef, useEffect, useState} from 'react';
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

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const TAB_BAR_WIDTH = SCREEN_WIDTH - 40;
const TAB_BAR_HEIGHT = 70;
const PADDING = 8;
const BUBBLE_HEIGHT = 90; // 물방울 높이 (플로팅바보다 크게)
const BUBBLE_EXTRA_WIDTH = 30; // 물방울 추가 너비

const FloatingTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const tabCount = state.routes.length;
  const tabWidth = TAB_BAR_WIDTH / tabCount;

  const bubbleLeft = useRef(new Animated.Value(PADDING)).current;
  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const bubbleWave1 = useRef(new Animated.Value(0)).current;
  const bubbleWave2 = useRef(new Animated.Value(0)).current;
  const [isDragging, setIsDragging] = useState(false);
  const [currentBubbleIndex, setCurrentBubbleIndex] = useState(state.index);
  const [bubblePosition, setBubblePosition] = useState(PADDING);

  // 물방울 파장 애니메이션 (키네틱 효과)
  useEffect(() => {
    if (isDragging) {
      // 첫 번째 파장
      Animated.loop(
        Animated.sequence([
          Animated.timing(bubbleWave1, {
            toValue: 1,
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.timing(bubbleWave1, {
            toValue: 0,
            duration: 800,
            useNativeDriver: false,
          }),
        ])
      ).start();

      // 두 번째 파장 (위상차)
      Animated.loop(
        Animated.sequence([
          Animated.timing(bubbleWave2, {
            toValue: 1,
            duration: 600,
            useNativeDriver: false,
          }),
          Animated.timing(bubbleWave2, {
            toValue: 0,
            duration: 600,
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      bubbleWave1.setValue(0);
      bubbleWave2.setValue(0);
    }
  }, [isDragging, bubbleWave1, bubbleWave2]);

  useEffect(() => {
    // 탭이 변경되면 인덱스만 업데이트 (물방울은 드래그 시에만 표시)
    setCurrentBubbleIndex(state.index);
  }, [state.index]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        // 화면 절대 위치에서 탭바 시작 위치(20)를 뺌
        const pageX = evt.nativeEvent.pageX;
        const touchX = pageX - 20; // container left offset

        // 현재 어느 탭 위에 있는지 계산
        const index = Math.floor(touchX / tabWidth);
        const clampedIndex = Math.max(0, Math.min(tabCount - 1, index));

        setCurrentBubbleIndex(clampedIndex);
        setIsDragging(true);

        // 물방울을 터치한 위치로 즉시 이동 (손가락 중심에 맞춤)
        const bubbleWidth = tabWidth + BUBBLE_EXTRA_WIDTH;
        const bubbleTargetLeft = touchX - (bubbleWidth / 2);
        const clampedLeft = Math.max(PADDING, Math.min(TAB_BAR_WIDTH - bubbleWidth - PADDING, bubbleTargetLeft));

        bubbleLeft.setValue(clampedLeft);
        setBubblePosition(clampedLeft);

        Animated.spring(bubbleOpacity, {
          toValue: 1,
          useNativeDriver: false,
          friction: 8,
          tension: 100,
        }).start();
      },
      onPanResponderMove: (evt) => {
        const pageX = evt.nativeEvent.pageX;
        const touchX = pageX - 20;

        // 현재 어느 탭 위에 있는지 계산
        const index = Math.floor(touchX / tabWidth);
        setCurrentBubbleIndex(Math.max(0, Math.min(tabCount - 1, index)));

        // 물방울을 터치한 위치로 이동
        const bubbleWidth = tabWidth + BUBBLE_EXTRA_WIDTH;
        const bubbleTargetLeft = touchX - (bubbleWidth / 2);
        const clampedLeft = Math.max(PADDING, Math.min(TAB_BAR_WIDTH - bubbleWidth - PADDING, bubbleTargetLeft));

        bubbleLeft.setValue(clampedLeft);
        setBubblePosition(clampedLeft);
      },
      onPanResponderRelease: (evt) => {
        const pageX = evt.nativeEvent.pageX;
        const touchX = pageX - 20;

        const newIndex = Math.floor(touchX / tabWidth);
        const clampedIndex = Math.max(0, Math.min(tabCount - 1, newIndex));

        // 물방울만 사라지게 (위치는 변경 안함)
        Animated.spring(bubbleOpacity, {
          toValue: 0,
          useNativeDriver: false,
          friction: 8,
          tension: 100,
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

  return (
    <View style={styles.container}>
      <View style={styles.tabBar} {...panResponder.panHandlers}>
        {/* 반투명 배경 */}
        <View style={styles.blurBackground} />

        {/* 탭 아이템들 */}
        {state.routes.map((route, index) => {
          const {options} = descriptors[route.key];
          const isFocused = state.index === index;

          // 드래그 중일 때는 물방울 위치의 탭만 강조 (isUnderBubble은 향후 사용 예정)
          void (isDragging && currentBubbleIndex === index);

          let iconName: string;
          if (route.name === 'Timer') {
            iconName = 'timer';
          } else if (route.name === 'Store') {
            iconName = 'storefront';
          } else if (route.name === 'Group') {
            iconName = 'people';
          } else if (route.name === 'StudyRecord') {
            iconName = 'book';
          } else if (route.name === 'More') {
            iconName = 'ellipsis-horizontal-circle';
          } else {
            iconName = 'help';
          }

          const label = options.tabBarLabel?.toString() || route.name;

          return (
            <TouchableOpacity
              key={route.key}
              activeOpacity={0.8}
              onPress={() => handleTabPress(index)}
              style={styles.tab}>
              <View style={[
                styles.tabContent,
                isFocused && !isDragging && styles.tabContentActive,
              ]}>
                <Icon
                  name={iconName}
                  size={isFocused && !isDragging ? 28 : 26}
                  color={isFocused && !isDragging ? '#007AFF' : '#999999'}
                />
                <Text
                  style={[
                    styles.label,
                    {
                      color: isFocused && !isDragging ? '#007AFF' : '#999999',
                      fontSize: isFocused && !isDragging ? 12 : 11,
                    },
                  ]}>
                  {label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* 투명한 물방울 (돋보기 효과) - 드래그 중에만 표시 */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.bubble,
            {
              width: tabWidth + BUBBLE_EXTRA_WIDTH,
              left: bubbleLeft,
              opacity: bubbleOpacity,
            },
          ]}>
          {/* 가장자리 흐림 효과를 위한 그라디언트 레이어 */}
          <View style={styles.bubbleGradient} />
          {/* 물방울 안에 파란색 아이콘들 복제 */}
          <View style={styles.bubbleContent}>
            {state.routes.map((route, index) => {
              let iconName: string;
              if (route.name === 'Timer') {
                iconName = 'timer';
              } else if (route.name === 'Store') {
                iconName = 'storefront';
              } else if (route.name === 'Group') {
                iconName = 'people';
              } else if (route.name === 'StudyRecord') {
                iconName = 'book';
              } else if (route.name === 'More') {
                iconName = 'ellipsis-horizontal-circle';
              } else {
                iconName = 'help';
              }

              const {options} = descriptors[route.key];
              const label = options.tabBarLabel?.toString() || route.name;

              // 각 탭의 중심 위치 계산
              const tabCenterX = index * tabWidth + tabWidth / 2;
              // 물방울의 중심 위치 계산
              const bubbleCenterX = bubblePosition + (tabWidth + BUBBLE_EXTRA_WIDTH) / 2;
              // 탭 중심에서 물방울 중심까지의 거리
              const offsetX = tabCenterX - bubbleCenterX;

              return (
                <View
                  key={route.key}
                  style={[
                    styles.bubbleIcon,
                    {
                      left: offsetX,
                      width: tabWidth,
                    },
                  ]}>
                  <Icon
                    name={iconName}
                    size={32}
                    color="#007AFF"
                  />
                  <Text style={styles.bubbleLabel}>
                    {label}
                  </Text>
                </View>
              );
            })}
          </View>
        </Animated.View>
      </View>
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
    overflow: 'visible',
  },
  blurBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 35,
  },
  bubble: {
    position: 'absolute',
    top: -10, // 위아래로 튀어나오도록
    height: BUBBLE_HEIGHT,
    borderRadius: BUBBLE_HEIGHT / 2,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#FFFFFF',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.9,
    shadowRadius: 25,
    elevation: 10,
    overflow: 'hidden',
  },
  bubbleGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BUBBLE_HEIGHT / 2,
    borderWidth: 8,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  tabContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 30,
  },
  tabContentActive: {
    backgroundColor: 'rgba(200, 200, 200, 0.3)',
  },
  label: {
    marginTop: 4,
    fontWeight: '600',
  },
  bubbleContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    borderRadius: BUBBLE_HEIGHT / 2,
  },
  bubbleIcon: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{scale: 1.1}],
  },
  bubbleLabel: {
    marginTop: 4,
    fontWeight: '600',
    fontSize: 12,
    color: '#007AFF',
  },
});

export default FloatingTabBar;
