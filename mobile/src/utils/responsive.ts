import {Dimensions} from 'react-native';

// 기준 디자인 크기 (iPhone 14 기준)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

// 화면 비율 계산
const widthRatio = SCREEN_WIDTH / BASE_WIDTH;
const heightRatio = SCREEN_HEIGHT / BASE_HEIGHT;

// 평균 비율 (균형잡힌 스케일링)
const scale = (widthRatio + heightRatio) / 2;

/**
 * 너비 기준 반응형 크기
 * 주로 가로 방향 요소에 사용 (버튼 너비, 마진 등)
 */
export const wp = (size: number): number => {
  return Math.round(size * widthRatio);
};

/**
 * 높이 기준 반응형 크기
 * 주로 세로 방향 요소에 사용 (높이, 패딩 등)
 */
export const hp = (size: number): number => {
  return Math.round(size * heightRatio);
};

/**
 * 균형잡힌 반응형 크기
 * 아이콘, 폰트 등 비율 유지가 필요한 요소에 사용
 */
export const sp = (size: number): number => {
  return Math.round(size * scale);
};

/**
 * 폰트 크기 (PixelRatio 고려)
 * 접근성 설정을 반영한 폰트 크기
 */
export const fp = (size: number): number => {
  // 폰트 스케일 제한 (너무 크거나 작지 않도록)
  const minScale = 0.8;
  const maxScale = 1.3;
  const clampedScale = Math.min(Math.max(scale, minScale), maxScale);
  return Math.round(size * clampedScale);
};

/**
 * 아이콘 크기
 * 최소/최대 크기 제한이 있는 스케일링
 */
export const iconSize = (size: number): number => {
  const scaled = size * scale;
  // 아이콘은 너무 작거나 크면 안됨
  const min = size * 0.75;
  const max = size * 1.5;
  return Math.round(Math.min(Math.max(scaled, min), max));
};

/**
 * 버튼/터치 영역 크기
 * 최소 터치 영역 44px 보장
 */
export const touchSize = (size: number): number => {
  const scaled = size * scale;
  // 최소 터치 영역 보장
  return Math.round(Math.max(scaled, 44));
};

/**
 * 테두리 반경
 */
export const borderRadius = (size: number): number => {
  return Math.round(size * scale);
};

/**
 * 화면 정보
 */
export const screen = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmall: SCREEN_WIDTH < 375,
  isMedium: SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414,
  isLarge: SCREEN_WIDTH >= 414 && SCREEN_WIDTH < 768,
  isTablet: SCREEN_WIDTH >= 768,
  widthRatio,
  heightRatio,
  scale,
};

/**
 * 디바이스 타입별 값 반환
 */
export const deviceValue = <T>(options: {
  small?: T;
  medium?: T;
  large?: T;
  tablet?: T;
  default: T;
}): T => {
  if (screen.isSmall && options.small !== undefined) {return options.small;}
  if (screen.isMedium && options.medium !== undefined) {return options.medium;}
  if (screen.isLarge && options.large !== undefined) {return options.large;}
  if (screen.isTablet && options.tablet !== undefined) {return options.tablet;}
  return options.default;
};

export default {
  wp,
  hp,
  sp,
  fp,
  iconSize,
  touchSize,
  borderRadius,
  screen,
  deviceValue,
};
