import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Animated, Image} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import {sp, hp, fp, iconSize as responsiveIconSize} from '../utils/responsive';

// 카드 프레임 타입 (상점에서 구매 가능)
export type CardFrameType = 'default' | 'bronze' | 'silver' | 'gold' | 'diamond' | 'neon' | 'space' | 'fire';

// 칭호 정보 (나중에 커스텀 이미지로 확장)
export interface TitleInfo {
  name: string;
  icon?: string; // 나중에 PNG/SVG URL로 변경
  iconType?: 'ionicon' | 'image' | 'lottie'; // 아이콘 타입
  color?: string; // 칭호별 고유 색상
}

// 카드 테마 (배경 + 테두리 세트, 나중에 애니메이션으로 확장)
export interface CardTheme {
  frameType: CardFrameType;
  backgroundImage?: string; // 배경 이미지 URL
  borderAnimation?: string; // Lottie 애니메이션 URL
  isAnimated?: boolean; // 애니메이션 여부
  backgroundColor?: string; // 사용자 커스텀 배경색
  borderColor?: string; // 사용자 커스텀 테두리색
}

// 뱃지 정보
export interface BadgeInfo {
  id: string;
  icon: string;
  color: string;
}

interface UserInfo {
  nickname: string;
  level: number;
  tier?: string;
  tierRP?: number; // 티어 RP
  maxRP?: number; // 다음 티어까지 필요한 RP
  title?: TitleInfo | string; // 칭호 (문자열 또는 TitleInfo 객체)
  bio?: string; // 자기소개
  profileImageUrl?: string; // 프로필 이미지 URL
  isAnonymous?: boolean;
  cardTheme?: CardTheme; // 카드 테마 (배경 + 테두리 세트)
  cardFrame?: CardFrameType; // 단순 프레임 (cardTheme 없을 때 사용)
  badges?: BadgeInfo[]; // 대표 뱃지 (최대 3개)
}

interface ProfileCardProps {
  isDark: boolean;
  onPress?: () => void;
  size?: 'tiny' | 'mini' | 'small' | 'large' | 'cam';
  user?: UserInfo;
  hideFrame?: boolean;
}

export const defaultUser: UserInfo = {
  nickname: '열공러',
  level: 15,
  tier: '학사 II',
  tierRP: 1250,
  maxRP: 2000,
  title: '꾸준한 학습자',
  bio: '매일 조금씩 성장하는 중입니다',
  profileImageUrl: undefined,
  cardFrame: 'default',
  badges: [
    {id: 'steady', icon: 'fitness', color: '#2196F3'},
  ],
};

// 카드 프레임 스타일 정의 (상점 구매용)
// 순서: 기본 -> 동색 -> 은색 -> 황금 -> 보석 -> 네온 -> 우주 -> 불꽃
export const CARD_FRAMES: Record<CardFrameType, {
  name: string;
  borderColor: string;
  borderWidth: number;
  shadowColor: string;
  shadowOpacity: number;
  glowColor: string;
  backgroundColor?: string; // 프레임 전용 배경색
  price?: number; // 연필 가격
  ballpenPrice?: number; // 볼펜 가격
}> = {
  default: {
    name: '기본',
    borderColor: '#E0E0E0', // 연한 회색 (라이트모드 기준)
    borderWidth: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    glowColor: 'transparent',
  },
  bronze: {
    name: '동색 프레임',
    borderColor: '#CD7F32',
    borderWidth: 3,
    shadowColor: '#CD7F32',
    shadowOpacity: 0.5,
    glowColor: '#EFEBE9',
    price: 1500,
  },
  silver: {
    name: '실버 프레임',
    borderColor: '#C0C0C0',
    borderWidth: 3,
    shadowColor: '#C0C0C0',
    shadowOpacity: 0.5,
    glowColor: '#F5F5F5',
    price: 2000,
  },
  gold: {
    name: '골드 프레임',
    borderColor: '#FFD700',
    borderWidth: 3,
    shadowColor: '#FFD700',
    shadowOpacity: 0.5,
    glowColor: '#FFF8DC',
    price: 3000,
  },
  diamond: {
    name: '다이아몬드',
    borderColor: '#00CED1',
    borderWidth: 4,
    shadowColor: '#00CED1',
    shadowOpacity: 0.7,
    glowColor: '#E0FFFF',
    price: 5000,
  },
  neon: {
    name: '네온 프레임',
    borderColor: '#FF00FF',
    borderWidth: 3,
    shadowColor: '#FF00FF',
    shadowOpacity: 0.9,
    glowColor: '#FF00FF',
    backgroundColor: '#2D1B4E', // 보라빛 어두운 배경
    ballpenPrice: 120,
  },
  space: {
    name: '우주 프레임',
    borderColor: '#6B5BFF',
    borderWidth: 3,
    shadowColor: '#6B5BFF',
    shadowOpacity: 0.8,
    glowColor: '#0D0D2B',
    backgroundColor: '#0D0D2B',
    ballpenPrice: 80,
  },
  fire: {
    name: '불꽃 프레임',
    borderColor: '#FF4500',
    borderWidth: 4,
    shadowColor: '#FF4500',
    shadowOpacity: 0.8,
    glowColor: '#FF4500',
    backgroundColor: '#3D1A00', // 진한 주황빛 갈색
    ballpenPrice: 200,
  },
};

// 레벨에 따른 아바타 테두리 스타일 (자동 적용)
// 레벨 구간: 학업 스타일 (초등학생 → 명예박사)
export const AVATAR_FRAME_DATA = [
  {range: '1~10', minLevel: 1, maxLevel: 10, name: '초등학생', borderColor: '#A1887F', borderWidth: 2, shadowColor: '#8D6E63', shadowOpacity: 0.1},
  {range: '11~20', minLevel: 11, maxLevel: 20, name: '중학생', borderColor: '#78909C', borderWidth: 2, shadowColor: '#546E7A', shadowOpacity: 0.3},
  {range: '21~30', minLevel: 21, maxLevel: 30, name: '고등학생', borderColor: '#FF9800', borderWidth: 2, shadowColor: '#F57C00', shadowOpacity: 0.4},
  {range: '31~40', minLevel: 31, maxLevel: 40, name: '학사 I', borderColor: '#388E3C', borderWidth: 2, shadowColor: '#2E7D32', shadowOpacity: 0.5},
  {range: '41~50', minLevel: 41, maxLevel: 50, name: '학사 II', borderColor: '#43A047', borderWidth: 2, shadowColor: '#388E3C', shadowOpacity: 0.5},
  {range: '51~60', minLevel: 51, maxLevel: 60, name: '학사 III', borderColor: '#4CAF50', borderWidth: 2, shadowColor: '#43A047', shadowOpacity: 0.6},
  {range: '61~70', minLevel: 61, maxLevel: 70, name: '석사 I', borderColor: '#0097A7', borderWidth: 2, shadowColor: '#00838F', shadowOpacity: 0.6},
  {range: '71~80', minLevel: 71, maxLevel: 80, name: '석사 II', borderColor: '#00ACC1', borderWidth: 2, shadowColor: '#0097A7', shadowOpacity: 0.7},
  {range: '81~90', minLevel: 81, maxLevel: 90, name: '석사 III', borderColor: '#00BCD4', borderWidth: 2, shadowColor: '#00ACC1', shadowOpacity: 0.7},
  {range: '91~95', minLevel: 91, maxLevel: 95, name: '박사', borderColor: '#9C27B0', borderWidth: 2, shadowColor: '#7B1FA2', shadowOpacity: 0.8},
  {range: '96~100', minLevel: 96, maxLevel: 100, name: '명예박사', borderColor: '#FFD700', borderWidth: 2, shadowColor: '#FFD700', shadowOpacity: 1.0, glowColor: '#FFF8DC'},
];

export const getLevelFrameStyle = (level: number) => {
  const frameData = AVATAR_FRAME_DATA.find(f => level >= f.minLevel && level <= f.maxLevel) || AVATAR_FRAME_DATA[0];
  return {
    name: frameData.name,
    borderColor: frameData.borderColor,
    borderWidth: frameData.borderWidth,
    shadowColor: frameData.shadowColor,
    shadowOpacity: frameData.shadowOpacity,
    glowColor: (frameData as any).glowColor || 'transparent',
  };
};

// 티어별 색상 (학업 스타일)
const getTierStyle = (tier?: string) => {
  switch (tier) {
    // 박사 등급
    case '명예박사':
      return {color: '#FFD700', bgColor: '#FFF8E1', icon: 'school', rank: 10};
    case '박사':
      return {color: '#9C27B0', bgColor: '#F3E5F5', icon: 'school', rank: 9};
    // 석사 등급
    case '석사 III':
      return {color: '#00BCD4', bgColor: '#E0F7FA', icon: 'library', rank: 8};
    case '석사 II':
      return {color: '#00ACC1', bgColor: '#E0F7FA', icon: 'library', rank: 7};
    case '석사 I':
      return {color: '#0097A7', bgColor: '#E0F7FA', icon: 'library', rank: 6};
    // 학사 등급
    case '학사 III':
      return {color: '#4CAF50', bgColor: '#E8F5E9', icon: 'book', rank: 5};
    case '학사 II':
      return {color: '#43A047', bgColor: '#E8F5E9', icon: 'book', rank: 4};
    case '학사 I':
      return {color: '#388E3C', bgColor: '#E8F5E9', icon: 'book', rank: 3};
    // 학생 등급
    case '고등학생':
      return {color: '#FF9800', bgColor: '#FFF3E0', icon: 'pencil', rank: 2};
    case '중학생':
      return {color: '#78909C', bgColor: '#ECEFF1', icon: 'pencil', rank: 1};
    case '초등학생':
      return {color: '#A1887F', bgColor: '#EFEBE9', icon: 'pencil', rank: 0};
    default:
      return {color: '#9E9E9E', bgColor: '#F5F5F5', icon: 'ribbon', rank: 0};
  }
};

// 칭호 정보 파싱 헬퍼
const getTitleInfo = (title?: TitleInfo | string): {name: string; icon?: string; iconType: 'ionicon' | 'image' | 'lottie'; color: string} | null => {
  if (!title) {return null;}
  if (typeof title === 'string') {
    return {name: title, icon: 'ribbon', iconType: 'ionicon', color: '#9C27B0'};
  }
  return {
    name: title.name,
    icon: title.icon || 'ribbon',
    iconType: title.iconType || 'ionicon',
    color: title.color || '#9C27B0',
  };
};

// 우주 테두리 글로우 애니메이션 컴포넌트
const SpaceBorderGlow: React.FC<{borderRadius: number}> = ({borderRadius}) => {
  const glowOpacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 0.9,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.4,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [glowOpacity]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: borderRadius,
        backgroundColor: 'transparent',
        borderWidth: sp(2),
        borderColor: '#6B5BFF',
        opacity: glowOpacity,
        shadowColor: '#6B5BFF',
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.8,
        shadowRadius: sp(8),
      }}
    />
  );
};

// 네온 글로우 애니메이션 컴포넌트 (사이버펑크 네온시티 느낌)
const NeonGlow: React.FC<{borderRadius: number}> = ({borderRadius}) => {
  const glowOpacity1 = useRef(new Animated.Value(0.5)).current;
  const glowOpacity2 = useRef(new Animated.Value(0.3)).current;
  const glowOpacity3 = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    // 첫 번째 글로우 (핑크/마젠타)
    const animation1 = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity1, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity1, {
          toValue: 0.4,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );

    // 두 번째 글로우 (시안)
    const animation2 = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity2, {
          toValue: 0.9,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity2, {
          toValue: 0.2,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    // 세 번째 글로우 (보라)
    const animation3 = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity3, {
          toValue: 0.9,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity3, {
          toValue: 0.5,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );

    animation1.start();
    animation2.start();
    animation3.start();

    return () => {
      animation1.stop();
      animation2.stop();
      animation3.stop();
    };
  }, [glowOpacity1, glowOpacity2, glowOpacity3]);

  return (
    <>
      {/* 핑크/마젠타 글로우 */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: borderRadius,
          backgroundColor: 'transparent',
          borderWidth: sp(2),
          borderColor: '#FF00FF',
          opacity: glowOpacity1,
          shadowColor: '#FF00FF',
          shadowOffset: {width: 0, height: 0},
          shadowOpacity: 1,
          shadowRadius: sp(12),
        }}
      />
      {/* 시안 글로우 */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: sp(-1),
          left: sp(-1),
          right: sp(-1),
          bottom: sp(-1),
          borderRadius: borderRadius + sp(1),
          backgroundColor: 'transparent',
          borderWidth: sp(1),
          borderColor: '#00FFFF',
          opacity: glowOpacity2,
          shadowColor: '#00FFFF',
          shadowOffset: {width: 0, height: 0},
          shadowOpacity: 0.9,
          shadowRadius: sp(8),
        }}
      />
      {/* 보라 글로우 */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: sp(1),
          left: sp(1),
          right: sp(1),
          bottom: sp(1),
          borderRadius: borderRadius - sp(1),
          backgroundColor: 'transparent',
          borderWidth: sp(1),
          borderColor: '#9D00FF',
          opacity: glowOpacity3,
          shadowColor: '#9D00FF',
          shadowOffset: {width: 0, height: 0},
          shadowOpacity: 0.8,
          shadowRadius: sp(6),
        }}
      />
    </>
  );
};

// 네온 라이트 바 컴포넌트 (네온 사인 효과)
const NeonLightBar: React.FC<{
  style: any;
  color?: string;
  delay?: number;
  duration?: number;
}> = ({style, color = '#FF00FF', delay = 0, duration = 2000}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: duration / 2,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.2,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity, delay, duration]);

  return (
    <Animated.View
      style={[
        styles.neonBar,
        style,
        {
          backgroundColor: color,
          opacity,
          shadowColor: color,
        },
      ]}
    />
  );
};

// 불꽃 파티클 컴포넌트 (불타는 효과)
const FireParticle: React.FC<{
  style: any;
  color?: string;
  delay?: number;
  duration?: number;
}> = ({style, color = '#FF4500', delay = 0, duration = 1500}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: duration * 0.3,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -sp(15),
            duration: duration * 0.3,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: duration * 0.3,
            delay,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0.7,
            duration: duration * 0.4,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -sp(30),
            duration: duration * 0.4,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.8,
            duration: duration * 0.4,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: duration * 0.3,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -sp(45),
            duration: duration * 0.3,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.3,
            duration: duration * 0.3,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.5,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity, translateY, scale, delay, duration]);

  return (
    <Animated.View
      style={[
        styles.fireParticle,
        style,
        {
          backgroundColor: color,
          opacity,
          shadowColor: color,
          transform: [{translateY}, {scale}],
        },
      ]}
    />
  );
};

// 불꽃 글로우 애니메이션 컴포넌트
const FireGlow: React.FC<{borderRadius: number}> = ({borderRadius}) => {
  const glowOpacity1 = useRef(new Animated.Value(0.4)).current;
  const glowOpacity2 = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const animation1 = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity1, {
          toValue: 0.9,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity1, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    const animation2 = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity2, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity2, {
          toValue: 0.5,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    animation1.start();
    animation2.start();

    return () => {
      animation1.stop();
      animation2.stop();
    };
  }, [glowOpacity1, glowOpacity2]);

  return (
    <>
      {/* 오렌지 글로우 */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: borderRadius,
          backgroundColor: 'transparent',
          borderWidth: sp(2),
          borderColor: '#FF4500',
          opacity: glowOpacity1,
          shadowColor: '#FF4500',
          shadowOffset: {width: 0, height: 0},
          shadowOpacity: 1,
          shadowRadius: sp(10),
        }}
      />
      {/* 노란 글로우 */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: sp(-1),
          left: sp(-1),
          right: sp(-1),
          bottom: sp(-1),
          borderRadius: borderRadius + sp(1),
          backgroundColor: 'transparent',
          borderWidth: sp(1),
          borderColor: '#FFD700',
          opacity: glowOpacity2,
          shadowColor: '#FFD700',
          shadowOffset: {width: 0, height: 0},
          shadowOpacity: 0.8,
          shadowRadius: sp(8),
        }}
      />
    </>
  );
};

// 반짝이는 별 컴포넌트
const TwinklingStar: React.FC<{
  style: any;
  color?: string;
  delay?: number;
  duration?: number;
}> = ({style, color = '#FFFFFF', delay = 0, duration = 2000}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: duration / 2,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity, delay, duration]);

  return (
    <Animated.View
      style={[
        styles.star,
        style,
        {
          backgroundColor: color,
          opacity,
          shadowColor: color,
        },
      ]}
    />
  );
};

// 아이콘 렌더링 헬퍼 (나중에 Image, Lottie 추가)
const renderIcon = (
  icon: string,
  iconType: 'ionicon' | 'image' | 'lottie',
  size: number,
  color: string
) => {
  switch (iconType) {
    case 'image':
      // TODO: 나중에 Image 컴포넌트로 렌더링
      // return <Image source={{uri: icon}} style={{width: size, height: size}} />;
      return <Icon name="image" size={size} color={color} />;
    case 'lottie':
      // TODO: 나중에 Lottie 애니메이션으로 렌더링
      // return <LottieView source={{uri: icon}} style={{width: size, height: size}} autoPlay loop />;
      return <Icon name="sparkles" size={size} color={color} />;
    case 'ionicon':
    default:
      return <Icon name={icon as any} size={size} color={color} />;
  }
};

const ProfileCard: React.FC<ProfileCardProps> = ({
  isDark,
  onPress,
  size = 'small',
  user = defaultUser,
  hideFrame: _hideFrame = false,
}) => {
  const isTiny = size === 'tiny';
  const isMini = size === 'mini';
  const isCam = size === 'cam';
  const isLarge = size === 'large';

  const frameStyle = getLevelFrameStyle(user.level);
  const tierStyle = getTierStyle(user.tier);
  const titleInfo = getTitleInfo(user.title);

  // 카드 테마 또는 단순 프레임 사용
  const activeCardFrame = user.cardTheme?.frameType || user.cardFrame || 'default';
  // 선택한 프레임 스타일 가져오기 (default가 아니면 CARD_FRAMES 사용)
  const selectedFrameStyle = activeCardFrame !== 'default' ? CARD_FRAMES[activeCardFrame] : frameStyle;

  // 익명인 경우
  if (user.isAnonymous) {
    return (
      <View style={[styles.anonymousCard, {backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5'}]}>
        <View style={[styles.anonymousAvatar, {backgroundColor: isDark ? '#3A3A3A' : '#E0E0E0'}]}>
          <Icon name="eye-off" size={responsiveIconSize(20)} color={isDark ? '#666666' : '#999999'} />
        </View>
        <Text style={[styles.anonymousName, {color: isDark ? '#999999' : '#666666'}]}>
          익명
        </Text>
      </View>
    );
  }

  // Tiny 사이즈 - 프레임 미리보기용 (아주 작은 카드)
  if (isTiny) {
    const isSpaceFrame = activeCardFrame === 'space';
    const isNeonFrame = activeCardFrame === 'neon';
    const isFireFrame = activeCardFrame === 'fire';
    const isDefaultFrame = activeCardFrame === 'default';
    const frameBackground = CARD_FRAMES[activeCardFrame]?.backgroundColor;
    const cardBgColor = frameBackground || (isDark ? '#1E1E1E' : '#FFFFFF');
    const textColor = (isSpaceFrame || isNeonFrame || isFireFrame) ? '#FFFFFF' : (isDark ? '#FFFFFF' : '#1A1A1A');

    const TinyContent = (
      <View style={[
        styles.tinyCard,
        {
          backgroundColor: cardBgColor,
          borderColor: isDefaultFrame ? (isDark ? '#3A3A3A' : '#E0E0E0') : selectedFrameStyle.borderColor,
          borderWidth: isDefaultFrame ? 1 : selectedFrameStyle.borderWidth,
          shadowColor: selectedFrameStyle.shadowColor,
          shadowOpacity: selectedFrameStyle.shadowOpacity,
        },
      ]}>
        {/* 우주 프레임 별 효과 */}
        {isSpaceFrame && (
          <View style={styles.tinyStarsContainer} pointerEvents="none">
            <TwinklingStar style={{top: '10%', left: '10%', width: sp(2), height: sp(2)}} delay={0} duration={1800} />
            <TwinklingStar style={{top: '15%', right: '15%', width: sp(2), height: sp(2)}} delay={200} duration={2000} />
            <TwinklingStar style={{top: '40%', left: '5%', width: sp(1.5), height: sp(1.5)}} delay={400} duration={1700} />
            <TwinklingStar style={{top: '35%', right: '8%', width: sp(2), height: sp(2)}} delay={600} duration={1900} />
            <TwinklingStar style={{bottom: '25%', left: '12%', width: sp(1.5), height: sp(1.5)}} delay={800} duration={2100} />
            <TwinklingStar style={{bottom: '20%', right: '12%', width: sp(2), height: sp(2)}} delay={1000} duration={1800} />
            {/* 노란 별 */}
            <TwinklingStar style={{top: '55%', left: '20%', width: sp(2.5), height: sp(2.5)}} color="#FFD700" delay={300} duration={2300} />
            <TwinklingStar style={{bottom: '35%', right: '20%', width: sp(2), height: sp(2)}} color="#FFE082" delay={700} duration={2000} />
          </View>
        )}
        {/* 네온 프레임 라이트 효과 */}
        {isNeonFrame && (
          <View style={styles.tinyStarsContainer} pointerEvents="none">
            {/* 네온 라이트 바들 - 사이버펑크 느낌 */}
            <NeonLightBar style={{top: '8%', left: '5%', width: sp(25), height: sp(2)}} color="#FF00FF" delay={0} duration={1600} />
            <NeonLightBar style={{top: '18%', right: '8%', width: sp(20), height: sp(2)}} color="#00FFFF" delay={200} duration={1800} />
            <NeonLightBar style={{bottom: '25%', left: '10%', width: sp(18), height: sp(2)}} color="#9D00FF" delay={400} duration={1400} />
            <NeonLightBar style={{bottom: '12%', right: '5%', width: sp(22), height: sp(2)}} color="#FF00FF" delay={600} duration={2000} />
            {/* 세로 라이트 */}
            <NeonLightBar style={{top: '15%', left: '8%', width: sp(2), height: sp(15)}} color="#00FFFF" delay={300} duration={1700} />
            <NeonLightBar style={{top: '30%', right: '10%', width: sp(2), height: sp(12)}} color="#FF00FF" delay={500} duration={1500} />
          </View>
        )}
        {/* 불꽃 프레임 파티클 효과 */}
        {isFireFrame && (
          <View style={styles.tinyStarsContainer} pointerEvents="none">
            {/* 하단에서 위로 올라오는 불꽃 파티클 */}
            <FireParticle style={{bottom: '10%', left: '10%', width: sp(5), height: sp(5)}} color="#FF4500" delay={0} duration={1400} />
            <FireParticle style={{bottom: '8%', left: '30%', width: sp(6), height: sp(6)}} color="#FF6B00" delay={100} duration={1500} />
            <FireParticle style={{bottom: '12%', left: '50%', width: sp(5), height: sp(5)}} color="#FFD700" delay={200} duration={1300} />
            <FireParticle style={{bottom: '8%', left: '70%', width: sp(6), height: sp(6)}} color="#FF8C00" delay={300} duration={1600} />
            <FireParticle style={{bottom: '10%', right: '10%', width: sp(5), height: sp(5)}} color="#FF4500" delay={400} duration={1400} />
            {/* 2행 */}
            <FireParticle style={{bottom: '22%', left: '20%', width: sp(4), height: sp(4)}} color="#FFD700" delay={150} duration={1500} />
            <FireParticle style={{bottom: '18%', left: '45%', width: sp(5), height: sp(5)}} color="#FF4500" delay={250} duration={1400} />
            <FireParticle style={{bottom: '20%', right: '18%', width: sp(4), height: sp(4)}} color="#FF6B00" delay={350} duration={1600} />
          </View>
        )}
        {/* 아바타 (사각형, 티어 테두리, 우상단 레벨) */}
        <View style={styles.tinyAvatarContainer}>
          <View style={[
            styles.tinyAvatar,
            {
              backgroundColor: '#E0E0E0',
              borderColor: tierStyle.color,
              borderWidth: 2,
              overflow: 'hidden',
            },
          ]}>
            {user.profileImageUrl ? (
              <Image source={{uri: user.profileImageUrl}} style={{width: '100%', height: '100%'}} />
            ) : (
              <Icon name="person" size={responsiveIconSize(14)} color="#9E9E9E" />
            )}
          </View>
          {/* 레벨 뱃지 (우상단) */}
          <View style={[styles.tinyLevelBadge, {backgroundColor: tierStyle.color}]}>
            <Text style={styles.tinyLevelBadgeText}>{user.level}</Text>
          </View>
        </View>
        {/* 닉네임 + 티어 */}
        <Text style={[styles.tinyNickname, {color: textColor}]} numberOfLines={1}>
          {user.nickname}
        </Text>
        {user.tier && (
          <Text style={[styles.tinyTier, {color: tierStyle.color}]}>
            {user.tier}
          </Text>
        )}
      </View>
    );

    // 우주/네온/불꽃 프레임이면 글로우 애니메이션 추가
    const FinalTinyContent = isSpaceFrame ? (
      <View style={{position: 'relative'}}>
        {TinyContent}
        <SpaceBorderGlow borderRadius={sp(12)} />
      </View>
    ) : isNeonFrame ? (
      <View style={{position: 'relative'}}>
        {TinyContent}
        <NeonGlow borderRadius={sp(12)} />
      </View>
    ) : isFireFrame ? (
      <View style={{position: 'relative'}}>
        {TinyContent}
        <FireGlow borderRadius={sp(12)} />
      </View>
    ) : TinyContent;

    if (onPress) {
      return <TouchableOpacity onPress={onPress}>{FinalTinyContent}</TouchableOpacity>;
    }
    return FinalTinyContent;
  }

  // Mini 사이즈 - 피드/댓글용 (사각형, 티어 테두리, 우상단 레벨)
  if (isMini) {
    const MiniContent = (
      <View style={[styles.miniCard, {backgroundColor: 'transparent'}]}>
        {/* 아바타 (사각형, 티어 테두리, 우상단 레벨) */}
        <View style={styles.miniAvatarWrapper}>
          <View style={[
            styles.miniAvatarFrame,
            {
              borderColor: tierStyle.color,
              borderWidth: 2,
              borderRadius: sp(8),
            },
          ]}>
            <View style={[
              styles.miniAvatarInner,
              {backgroundColor: '#E0E0E0', overflow: 'hidden'},
            ]}>
              {user.profileImageUrl ? (
                <Image source={{uri: user.profileImageUrl}} style={{width: '100%', height: '100%'}} />
              ) : (
                <Icon name="person" size={responsiveIconSize(16)} color="#9E9E9E" />
              )}
            </View>
          </View>
          {/* 레벨 뱃지 (우상단) */}
          <View style={[styles.miniLevelBadgeTopRight, {backgroundColor: tierStyle.color}]}>
            <Text style={styles.miniLevelText}>{user.level}</Text>
          </View>
        </View>

        {/* 닉네임 + 티어 */}
        <View style={styles.miniInfo}>
          <View style={styles.miniNameRow}>
            <Text style={[styles.miniName, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]} numberOfLines={1}>
              {user.nickname}
            </Text>
            {user.tier && (
              <View style={[styles.miniTierBadge, {backgroundColor: tierStyle.bgColor}]}>
                <Icon name={tierStyle.icon as any} size={responsiveIconSize(10)} color={tierStyle.color} />
                <Text style={[styles.miniTierText, {color: tierStyle.color}]}>{user.tier}</Text>
              </View>
            )}
          </View>
          {/* 칭호만 표시 (길드 제거) */}
          {titleInfo && (
            <View style={styles.miniSubRow}>
              <View style={[styles.miniTitleBadge, {backgroundColor: isDark ? '#2A1A2A' : '#F3E5F5'}]}>
                {renderIcon(titleInfo.icon || 'ribbon', titleInfo.iconType, responsiveIconSize(9), titleInfo.color)}
                <Text style={[styles.miniTitleText, {color: titleInfo.color}]}>{titleInfo.name}</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    );

    if (onPress) {
      return <TouchableOpacity onPress={onPress}>{MiniContent}</TouchableOpacity>;
    }
    return MiniContent;
  }

  // Cam 사이즈 - 집중모드 캠 아래 프로필용 (사각형, 티어 테두리, 우상단 레벨)
  if (isCam) {
    // 카드 프레임 스타일 (유저가 선택한 프레임 사용)
    const camActiveCardFrame = user.cardTheme?.frameType || user.cardFrame || 'default';
    const camFrameStyle = CARD_FRAMES[camActiveCardFrame];
    const camFrameBorderColor = camActiveCardFrame === 'default'
      ? (isDark ? '#3A3A3A' : '#E0E0E0')
      : camFrameStyle.borderColor;
    const camFrameShadowColor = camFrameStyle.shadowColor;
    const camFrameShadowOpacity = camFrameStyle.shadowOpacity;
    const camFrameBorderWidth = camActiveCardFrame === 'default' ? 2 : camFrameStyle.borderWidth;
    const camAvatarSize = sp(36);

    const CamContent = (
      <View style={[
        styles.camCard,
        {
          borderColor: camFrameBorderColor,
          borderWidth: camFrameBorderWidth,
          shadowColor: camFrameShadowColor,
          shadowOpacity: camFrameShadowOpacity * 0.5,
          backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
        },
      ]}>
        {/* 아바타 + 뱃지 행 */}
        <View style={styles.camAvatarRow}>
          {/* 아바타 (사각형, 티어 테두리, 우상단 레벨) */}
          <View style={styles.camAvatarWrapper}>
            <View style={[
              styles.camLevelFrame,
              {
                width: camAvatarSize,
                height: camAvatarSize,
                borderRadius: sp(8),
                borderColor: tierStyle.color,
                borderWidth: 2,
              },
            ]}>
              <View style={[
                styles.camAvatarInner,
                {
                  width: camAvatarSize - 4,
                  height: camAvatarSize - 4,
                  borderRadius: sp(6),
                  backgroundColor: '#E0E0E0',
                  overflow: 'hidden',
                },
              ]}>
                {user.profileImageUrl ? (
                  <Image source={{uri: user.profileImageUrl}} style={{width: '100%', height: '100%'}} />
                ) : (
                  <Icon name="person" size={responsiveIconSize(14)} color="#9E9E9E" />
                )}
              </View>
            </View>
            {/* 레벨 뱃지 (우상단) */}
            <View style={[styles.camLevelBadgeTopRight, {backgroundColor: tierStyle.color}]}>
              <Text style={styles.camLevelText}>{user.level}</Text>
            </View>
          </View>
          {/* 뱃지들 (최대 3개) */}
          {user.badges && user.badges.length > 0 && (
            <View style={styles.camBadges}>
              {user.badges.slice(0, 3).map((badge) => (
                <View key={badge.id} style={[styles.camBadgeIcon, {backgroundColor: badge.color + '20'}]}>
                  <Icon name={badge.icon as any} size={responsiveIconSize(10)} color={badge.color} />
                </View>
              ))}
            </View>
          )}
        </View>
        {/* 닉네임 */}
        <Text style={[styles.camNickname, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]} numberOfLines={1}>
          {user.nickname}
        </Text>
      </View>
    );

    if (onPress) {
      return <TouchableOpacity onPress={onPress}>{CamContent}</TouchableOpacity>;
    }
    return CamContent;
  }

  // Small/Large - 게임 스타일 프로필 카드
  const avatarSize = sp(isLarge ? 80 : 64);

  // 사용자 커스텀 테마 적용
  const customBgColor = user.cardTheme?.backgroundColor;
  const customBorderColor = user.cardTheme?.borderColor;
  // 프레임 전용 배경색이 있으면 사용, 없으면 기본 배경색
  const frameBackground = CARD_FRAMES[activeCardFrame]?.backgroundColor;
  const cardBgColor = customBgColor || frameBackground || (isDark ? '#1A1A2E' : '#FFFFFF');

  // 기본 프레임이면 심플한 테두리
  const isDefaultFrame = activeCardFrame === 'default';
  const isSpaceFrame = activeCardFrame === 'space';
  const isNeonFrame = activeCardFrame === 'neon';
  const isFireFrame = activeCardFrame === 'fire';
  const cardBorderColor = isDefaultFrame ? (isDark ? '#3A3A3A' : '#E0E0E0') : (customBorderColor || selectedFrameStyle.borderColor);
  // borderWidth를 고정하여 레이아웃 변동 방지
  const cardBorderWidth = 3;

  // 우주/네온/불꽃 프레임이면 텍스트를 밝게
  const textColor = (isSpaceFrame || isNeonFrame || isFireFrame) ? '#FFFFFF' : (isDark ? '#FFFFFF' : '#1A1A1A');
  const subTextColor = isSpaceFrame ? '#B8B8FF' : (isNeonFrame ? '#FF00FF' : (isFireFrame ? '#FFD700' : (isDark ? '#64B5F6' : '#1976D2')));

  const CardContent = (
    <View style={[
      styles.gameCard,
      {
        borderColor: cardBorderColor,
        borderWidth: cardBorderWidth,
        backgroundColor: cardBgColor,
        shadowColor: isDefaultFrame ? '#000' : selectedFrameStyle.shadowColor,
        shadowOpacity: isDefaultFrame ? 0.08 : selectedFrameStyle.shadowOpacity,
      },
    ]}>
      {/* 네온 프레임 라이트 효과 - 그리드 기반 균등 배치 */}
      {isNeonFrame && (
        <View style={styles.starsContainer} pointerEvents="none">
          {/* 1행 가로 라이트 */}
          <NeonLightBar style={{top: '5%', left: '5%', width: sp(35), height: sp(3)}} color="#FF00FF" delay={0} duration={1600} />
          <NeonLightBar style={{top: '8%', left: '50%', width: sp(28), height: sp(3)}} color="#00FFFF" delay={100} duration={1800} />
          <NeonLightBar style={{top: '3%', right: '8%', width: sp(25), height: sp(3)}} color="#9D00FF" delay={200} duration={1400} />
          {/* 2행 가로 라이트 */}
          <NeonLightBar style={{top: '18%', left: '10%', width: sp(22), height: sp(3)}} color="#00FFFF" delay={300} duration={2000} />
          <NeonLightBar style={{top: '22%', left: '45%', width: sp(30), height: sp(3)}} color="#FF00FF" delay={400} duration={1500} />
          <NeonLightBar style={{top: '15%', right: '5%', width: sp(32), height: sp(3)}} color="#9D00FF" delay={500} duration={1700} />
          {/* 3행 가로 라이트 */}
          <NeonLightBar style={{top: '35%', left: '3%', width: sp(40), height: sp(3)}} color="#9D00FF" delay={600} duration={1900} />
          <NeonLightBar style={{top: '38%', left: '55%', width: sp(25), height: sp(3)}} color="#FF00FF" delay={700} duration={1600} />
          <NeonLightBar style={{top: '32%', right: '10%', width: sp(20), height: sp(3)}} color="#00FFFF" delay={800} duration={1800} />
          {/* 4행 가로 라이트 */}
          <NeonLightBar style={{top: '52%', left: '8%', width: sp(28), height: sp(3)}} color="#FF00FF" delay={150} duration={1700} />
          <NeonLightBar style={{top: '48%', left: '48%', width: sp(35), height: sp(3)}} color="#00FFFF" delay={250} duration={1500} />
          <NeonLightBar style={{top: '55%', right: '5%', width: sp(22), height: sp(3)}} color="#9D00FF" delay={350} duration={1900} />
          {/* 5행 가로 라이트 */}
          <NeonLightBar style={{top: '68%', left: '5%', width: sp(32), height: sp(3)}} color="#00FFFF" delay={450} duration={1800} />
          <NeonLightBar style={{top: '72%', left: '50%', width: sp(25), height: sp(3)}} color="#9D00FF" delay={550} duration={1600} />
          <NeonLightBar style={{top: '65%', right: '8%', width: sp(30), height: sp(3)}} color="#FF00FF" delay={650} duration={1700} />
          {/* 6행 가로 라이트 */}
          <NeonLightBar style={{bottom: '10%', left: '10%', width: sp(38), height: sp(3)}} color="#9D00FF" delay={750} duration={1500} />
          <NeonLightBar style={{bottom: '5%', left: '55%', width: sp(22), height: sp(3)}} color="#FF00FF" delay={850} duration={1800} />
          <NeonLightBar style={{bottom: '8%', right: '5%', width: sp(28), height: sp(3)}} color="#00FFFF" delay={950} duration={1600} />
          {/* 세로 라이트 - 좌측 */}
          <NeonLightBar style={{top: '10%', left: '3%', width: sp(3), height: sp(20)}} color="#00FFFF" delay={50} duration={1700} />
          <NeonLightBar style={{top: '40%', left: '8%', width: sp(3), height: sp(18)}} color="#FF00FF" delay={200} duration={1500} />
          <NeonLightBar style={{bottom: '20%', left: '5%', width: sp(3), height: sp(15)}} color="#9D00FF" delay={400} duration={1800} />
          {/* 세로 라이트 - 중앙 */}
          <NeonLightBar style={{top: '5%', left: '35%', width: sp(3), height: sp(22)}} color="#9D00FF" delay={100} duration={1600} />
          <NeonLightBar style={{top: '45%', left: '42%', width: sp(3), height: sp(20)}} color="#00FFFF" delay={350} duration={1900} />
          <NeonLightBar style={{bottom: '15%', left: '38%', width: sp(3), height: sp(18)}} color="#FF00FF" delay={550} duration={1700} />
          {/* 세로 라이트 - 우측 */}
          <NeonLightBar style={{top: '12%', right: '5%', width: sp(3), height: sp(25)}} color="#FF00FF" delay={150} duration={1800} />
          <NeonLightBar style={{top: '50%', right: '10%', width: sp(3), height: sp(16)}} color="#9D00FF" delay={300} duration={1500} />
          <NeonLightBar style={{bottom: '18%', right: '3%', width: sp(3), height: sp(20)}} color="#00FFFF" delay={500} duration={1600} />
        </View>
      )}
      {/* 불꽃 프레임 파티클 효과 */}
      {isFireFrame && (
        <View style={styles.starsContainer} pointerEvents="none">
          {/* 하단에서 위로 올라오는 불꽃 파티클 - 1행 */}
          <FireParticle style={{bottom: '8%', left: '5%', width: sp(8), height: sp(8)}} color="#FF4500" delay={0} duration={1500} />
          <FireParticle style={{bottom: '10%', left: '15%', width: sp(6), height: sp(6)}} color="#FF6B00" delay={100} duration={1400} />
          <FireParticle style={{bottom: '5%', left: '25%', width: sp(10), height: sp(10)}} color="#FFD700" delay={200} duration={1600} />
          <FireParticle style={{bottom: '12%', left: '35%', width: sp(7), height: sp(7)}} color="#FF4500" delay={300} duration={1300} />
          <FireParticle style={{bottom: '8%', left: '45%', width: sp(9), height: sp(9)}} color="#FF8C00" delay={400} duration={1500} />
          <FireParticle style={{bottom: '6%', left: '55%', width: sp(6), height: sp(6)}} color="#FFD700" delay={500} duration={1400} />
          <FireParticle style={{bottom: '10%', left: '65%', width: sp(8), height: sp(8)}} color="#FF4500" delay={600} duration={1600} />
          <FireParticle style={{bottom: '5%', left: '75%', width: sp(10), height: sp(10)}} color="#FF6B00" delay={700} duration={1300} />
          <FireParticle style={{bottom: '8%', right: '5%', width: sp(7), height: sp(7)}} color="#FF8C00" delay={800} duration={1500} />
          {/* 2행 - 약간 위 */}
          <FireParticle style={{bottom: '18%', left: '8%', width: sp(6), height: sp(6)}} color="#FFD700" delay={50} duration={1400} />
          <FireParticle style={{bottom: '22%', left: '20%', width: sp(8), height: sp(8)}} color="#FF4500" delay={150} duration={1500} />
          <FireParticle style={{bottom: '16%', left: '32%', width: sp(5), height: sp(5)}} color="#FF8C00" delay={250} duration={1300} />
          <FireParticle style={{bottom: '20%', left: '48%', width: sp(7), height: sp(7)}} color="#FF6B00" delay={350} duration={1600} />
          <FireParticle style={{bottom: '18%', left: '60%', width: sp(9), height: sp(9)}} color="#FFD700" delay={450} duration={1400} />
          <FireParticle style={{bottom: '22%', left: '72%', width: sp(6), height: sp(6)}} color="#FF4500" delay={550} duration={1500} />
          <FireParticle style={{bottom: '16%', right: '8%', width: sp(8), height: sp(8)}} color="#FF8C00" delay={650} duration={1300} />
          {/* 3행 - 중간 */}
          <FireParticle style={{bottom: '32%', left: '12%', width: sp(5), height: sp(5)}} color="#FF8C00" delay={100} duration={1600} />
          <FireParticle style={{bottom: '28%', left: '28%', width: sp(7), height: sp(7)}} color="#FFD700" delay={200} duration={1400} />
          <FireParticle style={{bottom: '35%', left: '42%', width: sp(6), height: sp(6)}} color="#FF4500" delay={300} duration={1500} />
          <FireParticle style={{bottom: '30%', left: '58%', width: sp(8), height: sp(8)}} color="#FF6B00" delay={400} duration={1300} />
          <FireParticle style={{bottom: '33%', right: '12%', width: sp(5), height: sp(5)}} color="#FFD700" delay={500} duration={1600} />
        </View>
      )}
      {/* 우주 프레임 별 효과 - 6x5 그리드 기반 골고루 배치 */}
      {isSpaceFrame && (
        <View style={styles.starsContainer} pointerEvents="none">
          {/* 1행 (top 5-15%) */}
          <TwinklingStar style={{top: '8%', left: '8%', width: sp(2), height: sp(2)}} delay={0} duration={1800} />
          <TwinklingStar style={{top: '12%', left: '28%', width: sp(3), height: sp(3)}} delay={200} duration={2100} />
          <TwinklingStar style={{top: '6%', left: '48%', width: sp(2), height: sp(2)}} delay={400} duration={1700} />
          <TwinklingStar style={{top: '10%', left: '68%', width: sp(2), height: sp(2)}} delay={600} duration={2000} />
          <TwinklingStar style={{top: '14%', left: '88%', width: sp(3), height: sp(3)}} delay={800} duration={1900} />
          {/* 2행 (top 20-30%) */}
          <TwinklingStar style={{top: '24%', left: '12%', width: sp(2), height: sp(2)}} delay={100} duration={2200} />
          <TwinklingStar style={{top: '28%', left: '38%', width: sp(2), height: sp(2)}} delay={300} duration={1600} />
          <TwinklingStar style={{top: '22%', left: '58%', width: sp(3), height: sp(3)}} delay={500} duration={2300} />
          <TwinklingStar style={{top: '26%', left: '78%', width: sp(2), height: sp(2)}} delay={700} duration={1800} />
          {/* 3행 (top 35-45%) */}
          <TwinklingStar style={{top: '38%', left: '5%', width: sp(3), height: sp(3)}} delay={150} duration={2000} />
          <TwinklingStar style={{top: '42%', left: '25%', width: sp(2), height: sp(2)}} delay={350} duration={1700} />
          <TwinklingStar style={{top: '36%', left: '45%', width: sp(2), height: sp(2)}} delay={550} duration={2100} />
          <TwinklingStar style={{top: '40%', left: '65%', width: sp(3), height: sp(3)}} delay={750} duration={1900} />
          <TwinklingStar style={{top: '44%', left: '85%', width: sp(2), height: sp(2)}} delay={950} duration={2200} />
          {/* 4행 (top 50-60%) */}
          <TwinklingStar style={{top: '54%', left: '15%', width: sp(2), height: sp(2)}} delay={250} duration={1800} />
          <TwinklingStar style={{top: '58%', left: '35%', width: sp(3), height: sp(3)}} delay={450} duration={2000} />
          <TwinklingStar style={{top: '52%', left: '55%', width: sp(2), height: sp(2)}} delay={650} duration={1600} />
          <TwinklingStar style={{top: '56%', left: '75%', width: sp(2), height: sp(2)}} delay={850} duration={2300} />
          {/* 5행 (top 65-80%) */}
          <TwinklingStar style={{top: '68%', left: '8%', width: sp(2), height: sp(2)}} delay={50} duration={2100} />
          <TwinklingStar style={{top: '72%', left: '28%', width: sp(2), height: sp(2)}} delay={450} duration={1700} />
          <TwinklingStar style={{top: '66%', left: '48%', width: sp(3), height: sp(3)}} delay={550} duration={1900} />
          <TwinklingStar style={{top: '74%', left: '68%', width: sp(2), height: sp(2)}} delay={750} duration={2200} />
          <TwinklingStar style={{top: '70%', left: '90%', width: sp(2), height: sp(2)}} delay={950} duration={1800} />
          {/* 6행 (top 80-92%) */}
          <TwinklingStar style={{top: '85%', left: '18%', width: sp(3), height: sp(3)}} delay={350} duration={2000} />
          <TwinklingStar style={{top: '88%', left: '42%', width: sp(2), height: sp(2)}} delay={650} duration={1600} />
          <TwinklingStar style={{top: '82%', left: '62%', width: sp(2), height: sp(2)}} delay={850} duration={2100} />
          <TwinklingStar style={{top: '86%', left: '82%', width: sp(3), height: sp(3)}} delay={1050} duration={1900} />
          {/* 노란 별들 - 골고루 배치 */}
          <TwinklingStar style={{top: '18%', left: '18%', width: sp(4), height: sp(4)}} color="#FFD700" delay={150} duration={2500} />
          <TwinklingStar style={{top: '32%', left: '52%', width: sp(3), height: sp(3)}} color="#FFE082" delay={350} duration={2300} />
          <TwinklingStar style={{top: '48%', left: '42%', width: sp(3), height: sp(3)}} color="#FFF59D" delay={550} duration={2000} />
          <TwinklingStar style={{top: '62%', left: '22%', width: sp(2), height: sp(2)}} color="#FFD700" delay={750} duration={2400} />
          <TwinklingStar style={{top: '78%', left: '52%', width: sp(3), height: sp(3)}} color="#FFE082" delay={950} duration={2100} />
          <TwinklingStar style={{top: '45%', left: '82%', width: sp(2), height: sp(2)}} color="#FFF59D" delay={450} duration={1800} />
        </View>
      )}
      {/* 메인 컨텐츠 */}
      <View style={styles.gameCardContent}>
        {/* 좌측: 아바타 + 레벨 (친구창 스타일 - 사각형, 티어 테두리, 우상단 레벨) */}
        <View style={styles.gameAvatarSection}>
          <View style={[
            styles.gameAvatarFrame,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: sp(10),
              borderColor: tierStyle.color,
              borderWidth: 2,
              shadowColor: tierStyle.color,
              shadowOpacity: 0.5,
            },
          ]}>
            <View style={[
              styles.gameAvatarInner,
              {
                backgroundColor: '#E0E0E0',
                width: avatarSize - 4,
                height: avatarSize - 4,
                borderRadius: sp(8),
                overflow: 'hidden',
              },
            ]}>
              {user.profileImageUrl ? (
                <Image source={{uri: user.profileImageUrl}} style={{width: '100%', height: '100%'}} />
              ) : (
                <Icon name="person" size={responsiveIconSize(isLarge ? 32 : 26)} color="#9E9E9E" />
              )}
            </View>
          </View>
          {/* 레벨 뱃지 (우상단) */}
          <View style={[styles.gameLevelBadgeTopRight, {backgroundColor: tierStyle.color}]}>
            <Text style={styles.gameLevelText}>{user.level}</Text>
          </View>
        </View>

        {/* 우측: 닉네임 박스 + 길드 + 티어 */}
        <View style={styles.gameInfoSection}>
          {/* 닉네임 + 티어 */}
          <View style={styles.nicknameRow}>
            {/* 뱃지 */}
            {user.badges && user.badges.length > 0 && (
              <View style={styles.badgesRow}>
                {user.badges.slice(0, 3).map((badge) => (
                  <View key={badge.id} style={[styles.badgeIcon, {backgroundColor: badge.color + '20'}]}>
                    <Icon name={badge.icon as any} size={responsiveIconSize(12)} color={badge.color} />
                  </View>
                ))}
              </View>
            )}
            <View style={[
              styles.nicknameBox,
              {
                backgroundColor: isSpaceFrame ? 'rgba(255,255,255,0.1)' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'),
                borderColor: isSpaceFrame ? 'rgba(107,91,255,0.4)' : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'),
              },
            ]}>
              <Text
                style={[styles.gameNickname, {color: textColor}]}
                numberOfLines={1}
              >
                {user.nickname}
              </Text>
            </View>
            {/* 티어 배지 (닉네임 오른쪽) */}
            {user.tier && (
              <View style={[styles.tierBadge, {backgroundColor: tierStyle.bgColor}]}>
                <Icon name={tierStyle.icon as any} size={responsiveIconSize(10)} color={tierStyle.color} />
                <Text style={[styles.tierBadgeText, {color: tierStyle.color}]}>{user.tier}</Text>
              </View>
            )}
          </View>


          {/* 자기소개 */}
          {user.bio && (
            <View style={styles.bioContainer}>
              <Text style={[styles.bioText, {color: subTextColor}]} numberOfLines={2}>
                {user.bio}
              </Text>
            </View>
          )}
        </View>

        {/* 화살표 */}
        {onPress && (
          <Icon
            name="chevron-forward"
            size={responsiveIconSize(20)}
            color={isSpaceFrame ? '#6B5BFF' : (isNeonFrame ? '#FF00FF' : (isFireFrame ? '#FF4500' : (isDark ? '#666666' : '#AAAAAA')))}
          />
        )}
      </View>
    </View>
  );

  // 우주/네온/불꽃 프레임이면 글로우 애니메이션 추가
  const FinalContent = (
    <View style={{position: 'relative'}}>
      {CardContent}
      {isSpaceFrame && <SpaceBorderGlow borderRadius={sp(16)} />}
      {isNeonFrame && <NeonGlow borderRadius={sp(16)} />}
      {isFireFrame && <FireGlow borderRadius={sp(16)} />}
    </View>
  );

  if (onPress) {
    return <TouchableOpacity onPress={onPress} activeOpacity={0.8}>{FinalContent}</TouchableOpacity>;
  }
  return FinalContent;
};

const styles = StyleSheet.create({
  // 익명
  anonymousCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(12),
    paddingVertical: hp(8),
    borderRadius: sp(12),
    gap: sp(10),
  },
  anonymousAvatar: {
    width: sp(36),
    height: sp(36),
    borderRadius: sp(18),
    justifyContent: 'center',
    alignItems: 'center',
  },
  anonymousName: {
    fontSize: fp(13),
    fontWeight: '700',
  },

  // Tiny - 프레임 미리보기용
  tinyCard: {
    width: sp(120),
    padding: sp(12),
    borderRadius: sp(12),
    alignItems: 'center',
    shadowOffset: {width: 0, height: sp(2)},
    shadowRadius: sp(6),
    elevation: 3,
  },
  tinyAvatarContainer: {
    position: 'relative',
    marginBottom: sp(8),
  },
  tinyAvatar: {
    width: sp(40),
    height: sp(40),
    borderRadius: sp(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  tinyLevelBadge: {
    position: 'absolute',
    top: -sp(4),
    right: -sp(4),
    minWidth: sp(16),
    height: sp(14),
    borderRadius: sp(7),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: sp(4),
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  tinyLevelBadgeText: {
    color: '#FFFFFF',
    fontSize: fp(8),
    fontWeight: '800',
  },
  tinyNickname: {
    fontSize: fp(12),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: sp(2),
  },
  tinyTier: {
    fontSize: fp(9),
    fontWeight: '600',
  },
  tinyStarsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },

  // Mini
  miniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(10),
  },
  miniAvatarWrapper: {
    position: 'relative',
    marginBottom: sp(6),
  },
  miniAvatarFrame: {
    width: sp(40),
    height: sp(40),
    borderRadius: sp(8),
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: {width: 0, height: sp(2)},
    shadowRadius: sp(4),
    elevation: 3,
    overflow: 'hidden',
  },
  miniAvatarInner: {
    width: sp(36),
    height: sp(36),
    borderRadius: sp(6),
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniLevelBadgeTopRight: {
    position: 'absolute',
    top: -sp(4),
    right: -sp(4),
    minWidth: sp(16),
    height: sp(14),
    borderRadius: sp(7),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: sp(4),
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  miniLevelText: {
    color: '#FFFFFF',
    fontSize: fp(8),
    fontWeight: '800',
  },
  miniInfo: {
    flex: 1,
    gap: sp(4),
  },
  miniNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(6),
    flexWrap: 'wrap',
  },
  miniName: {
    fontSize: fp(13),
    fontWeight: '700',
  },
  miniTierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(3),
    paddingHorizontal: sp(6),
    paddingVertical: sp(2),
    borderRadius: sp(8),
  },
  miniTierText: {
    fontSize: fp(9),
    fontWeight: '700',
  },
  miniSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(6),
    flexWrap: 'wrap',
  },
  miniTitleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(3),
    paddingHorizontal: sp(6),
    paddingVertical: sp(2),
    borderRadius: sp(6),
  },
  miniTitleText: {
    fontSize: fp(9),
    fontWeight: '600',
  },

  // Cam 사이즈 - 집중모드 캠 아래 프로필
  camCard: {
    alignItems: 'center',
    paddingVertical: sp(8),
    paddingHorizontal: sp(10), // 좌우 여백 늘림
    borderRadius: sp(12),
    shadowOffset: {width: 0, height: sp(2)},
    shadowRadius: sp(4),
    elevation: 3,
    width: sp(110), // 캠 박스 너비와 맞춤
  },
  camAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(4),
    marginBottom: sp(2),
  },
  camAvatarWrapper: {
    position: 'relative',
  },
  // 아바타 프레임 (사각형)
  camLevelFrame: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  camAvatarInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 레벨 뱃지 (우상단)
  camLevelBadgeTopRight: {
    position: 'absolute',
    top: -sp(4),
    right: -sp(4),
    minWidth: sp(16),
    height: sp(14),
    borderRadius: sp(7),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: sp(4),
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  camLevelText: {
    color: '#FFFFFF',
    fontSize: fp(8),
    fontWeight: '800',
  },
  camBadges: {
    flexDirection: 'row',
    gap: sp(2),
  },
  camBadgeIcon: {
    width: sp(18),
    height: sp(18),
    borderRadius: sp(4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  camNickname: {
    fontSize: fp(11),
    fontWeight: '700',
    textAlign: 'center',
    maxWidth: sp(76),
  },

  // 게임 스타일 카드
  gameCard: {
    borderRadius: sp(16),
    shadowOffset: {width: 0, height: sp(4)},
    shadowRadius: sp(12),
    elevation: 6,
    overflow: 'hidden',
  },
  gameCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: sp(14),
    paddingTop: sp(16),
    gap: sp(12),
  },
  gameAvatarSection: {
    position: 'relative',
  },
  gameAvatarFrame: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: {width: 0, height: sp(3)},
    shadowRadius: sp(6),
    elevation: 5,
    backgroundColor: '#2A2A3E',
    overflow: 'hidden',
  },
  gameAvatarInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameLevelBadge: {
    position: 'absolute',
    bottom: -sp(6),
    left: '50%',
    transform: [{translateX: -sp(14)}],
    width: sp(28),
    height: sp(18),
    borderRadius: sp(9),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  gameLevelBadgeTopRight: {
    position: 'absolute',
    top: -sp(4),
    right: -sp(4),
    minWidth: sp(22),
    height: sp(18),
    borderRadius: sp(9),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: sp(5),
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  gameLevelText: {
    color: '#FFFFFF',
    fontSize: fp(10),
    fontWeight: '900',
  },
  gameInfoSection: {
    flex: 1,
    gap: sp(6),
  },
  nicknameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: sp(6),
  },
  badgesRow: {
    flexDirection: 'row',
    gap: sp(4),
  },
  badgeIcon: {
    width: sp(24),
    height: sp(24),
    borderRadius: sp(6),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: sp(2),
    elevation: 2,
  },
  nicknameBox: {
    paddingHorizontal: sp(8),
    paddingVertical: sp(4),
    borderRadius: sp(6),
    borderWidth: 1,
  },
  gameNickname: {
    fontSize: fp(13),
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(3),
    paddingHorizontal: sp(6),
    paddingVertical: sp(4),
    borderRadius: sp(6),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  tierBadgeText: {
    fontSize: fp(10),
    fontWeight: '700',
  },
  gameTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(4),
  },
  gameTitleText: {
    fontSize: fp(12),
    fontWeight: '600',
  },
  bioContainer: {
    marginTop: hp(2),
    paddingHorizontal: sp(2),
  },
  bioText: {
    fontSize: fp(11),
    fontWeight: '400',
    fontStyle: 'italic',
    lineHeight: fp(16),
  },
  // 우주 프레임 별 효과
  starsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  star: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: sp(10),
    shadowColor: '#FFFFFF',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.8,
    shadowRadius: sp(3),
  },
  neonBar: {
    position: 'absolute',
    borderRadius: sp(2),
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.9,
    shadowRadius: sp(6),
  },
  fireParticle: {
    position: 'absolute',
    borderRadius: sp(10),
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.9,
    shadowRadius: sp(6),
  },
});

export default ProfileCard;
