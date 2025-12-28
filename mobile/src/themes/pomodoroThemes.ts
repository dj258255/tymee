// 뽀모도로 타이머 테마 시스템
// 타이머 UI 및 Dynamic Island / Android 알림에 사용

export type PomodoroThemeType = 'default' | 'ocean' | 'forest' | 'sunset' | 'lavender' | 'mint';

export interface PomodoroTheme {
  id: PomodoroThemeType;
  name: string;

  // 집중 시간 색상
  focusColor: string;

  // 휴식 시간 색상
  breakColor: string;

  // 타이머 배경 색상
  timerBackground: {
    light: string;
    dark: string;
  };

  // 테마 미리보기용 그라디언트 (선택)
  previewGradient?: string[];
}

// ============ 타이머 색상 팔레트 ============
export interface TimerColor {
  id: string;
  name: string;
  color: string;
}

// 집중/휴식 타이머에 사용할 수 있는 색상 팔레트
export const timerColorPalette: TimerColor[] = [
  // 빨강 계열
  {id: 'red', name: '레드', color: '#FF5252'},
  {id: 'coral', name: '코랄', color: '#FF7043'},
  {id: 'rose', name: '로즈', color: '#E91E63'},

  // 주황/노랑 계열
  {id: 'orange', name: '오렌지', color: '#FF9800'},
  {id: 'amber', name: '앰버', color: '#FFC107'},
  {id: 'gold', name: '골드', color: '#FFD700'},

  // 초록 계열
  {id: 'green', name: '그린', color: '#4CAF50'},
  {id: 'teal', name: '틸', color: '#009688'},
  {id: 'mint', name: '민트', color: '#26A69A'},
  {id: 'forest', name: '포레스트', color: '#2E7D32'},

  // 파랑 계열
  {id: 'blue', name: '블루', color: '#2196F3'},
  {id: 'sky', name: '스카이', color: '#03A9F4'},
  {id: 'ocean', name: '오션', color: '#0077B6'},
  {id: 'navy', name: '네이비', color: '#1A237E'},

  // 보라 계열
  {id: 'purple', name: '퍼플', color: '#9C27B0'},
  {id: 'lavender', name: '라벤더', color: '#7B2CBF'},
  {id: 'violet', name: '바이올렛', color: '#673AB7'},

  // 핑크 계열
  {id: 'pink', name: '핑크', color: '#FF4081'},
  {id: 'magenta', name: '마젠타', color: '#E040FB'},

  // 그레이 계열
  {id: 'gray', name: '그레이', color: '#607D8B'},
  {id: 'charcoal', name: '차콜', color: '#37474F'},
];

// 색상 ID로 색상 정보 가져오기
export const getTimerColor = (colorId: string): TimerColor => {
  return timerColorPalette.find(c => c.id === colorId) || timerColorPalette[0];
};

// ============ 기본 테마 ============
export const defaultTheme: PomodoroTheme = {
  id: 'default',
  name: '기본',
  focusColor: '#FF5252',  // 빨강
  breakColor: '#2196F3',  // 파랑
  timerBackground: {
    light: '#FFFFFF',
    dark: '#F5F5F5',
  },
  previewGradient: ['#FF5252', '#2196F3'],
};

// ============ 오션 테마 ============
export const oceanTheme: PomodoroTheme = {
  id: 'ocean',
  name: '오션',
  focusColor: '#0077B6',  // 딥 블루
  breakColor: '#48CAE4',  // 스카이 블루
  timerBackground: {
    light: '#FFFFFF',
    dark: '#F0F8FF',
  },
  previewGradient: ['#0077B6', '#48CAE4'],
};

// ============ 포레스트 테마 ============
export const forestTheme: PomodoroTheme = {
  id: 'forest',
  name: '포레스트',
  focusColor: '#2D6A4F',  // 딥 그린
  breakColor: '#74C69D',  // 민트 그린
  timerBackground: {
    light: '#FFFFFF',
    dark: '#F1F8E9',
  },
  previewGradient: ['#2D6A4F', '#74C69D'],
};

// ============ 선셋 테마 ============
export const sunsetTheme: PomodoroTheme = {
  id: 'sunset',
  name: '선셋',
  focusColor: '#E85D04',  // 오렌지
  breakColor: '#FAA307',  // 골드
  timerBackground: {
    light: '#FFFFFF',
    dark: '#FFF8E1',
  },
  previewGradient: ['#E85D04', '#FAA307'],
};

// ============ 라벤더 테마 ============
export const lavenderTheme: PomodoroTheme = {
  id: 'lavender',
  name: '라벤더',
  focusColor: '#7B2CBF',  // 퍼플
  breakColor: '#C77DFF',  // 라벤더
  timerBackground: {
    light: '#FFFFFF',
    dark: '#F3E5F5',
  },
  previewGradient: ['#7B2CBF', '#C77DFF'],
};

// ============ 민트 테마 ============
export const mintTheme: PomodoroTheme = {
  id: 'mint',
  name: '민트',
  focusColor: '#00897B',  // 틸
  breakColor: '#80CBC4',  // 민트
  timerBackground: {
    light: '#FFFFFF',
    dark: '#E0F2F1',
  },
  previewGradient: ['#00897B', '#80CBC4'],
};

// 테마 목록
export const pomodoroThemes: Record<PomodoroThemeType, PomodoroTheme> = {
  default: defaultTheme,
  ocean: oceanTheme,
  forest: forestTheme,
  sunset: sunsetTheme,
  lavender: lavenderTheme,
  mint: mintTheme,
};

// 테마 목록 배열 (선택 UI용)
export const pomodoroThemeList: PomodoroTheme[] = [
  defaultTheme,
  oceanTheme,
  forestTheme,
  sunsetTheme,
  lavenderTheme,
  mintTheme,
];

// 테마 가져오기
export const getPomodoroTheme = (themeId: PomodoroThemeType): PomodoroTheme => {
  return pomodoroThemes[themeId] || defaultTheme;
};

// 색상 코드에서 RGB 값 추출 (네이티브 모듈 전달용)
export const hexToRgb = (hex: string): {r: number; g: number; b: number} | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
};
