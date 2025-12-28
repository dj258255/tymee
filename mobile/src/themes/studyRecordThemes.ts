// 공부기록 화면 테마 시스템
// 나중에 다른 테마 추가 가능 (minimal, colorful, retro 등)

export type StudyRecordThemeType = 'notebook' | 'default';

export interface StudyRecordTheme {
  id: StudyRecordThemeType;
  name: string;

  // 배경
  background: {
    light: string;
    dark: string;
    pattern?: 'grid' | 'lines' | 'dots' | 'none';
    patternColor?: {light: string; dark: string};
    patternSpacing?: number;
  };

  // 카드 스타일
  card: {
    light: string;
    dark: string;
    borderRadius: number;
    borderWidth: number;
    borderColor: {light: string; dark: string};
    shadow: boolean;
    // 노트 스타일 옵션
    paperTexture?: boolean;
    tapeDecoration?: boolean;
    cornerFold?: boolean;
  };

  // 텍스트 색상
  text: {
    primary: {light: string; dark: string};
    secondary: {light: string; dark: string};
    accent: {light: string; dark: string};
  };

  // 액센트/강조 색상
  colors: {
    accent: string;
    success: string;
    warning: string;
    error: string;
    sunday: string;
    saturday: string;
  };

  // 헤더/타이틀 스타일
  header: {
    fontFamily?: string;
    handwritten?: boolean;
    underline?: boolean;
    underlineStyle?: 'solid' | 'wavy' | 'double';
  };

  // 체크박스 스타일
  checkbox: {
    style: 'circle' | 'square' | 'rounded';
    borderWidth: number;
    checkStyle: 'check' | 'fill' | 'cross';
  };

  // 진행바 스타일
  progressBar: {
    height: number;
    borderRadius: number;
    style: 'solid' | 'striped' | 'gradient';
    background: {light: string; dark: string};
  };

  // 그리드 스타일 (텐미닛 플래너용)
  grid: {
    borderWidth: number;
    borderRadius: number;
    gap: number;
    emptyBlock: {light: string; dark: string};
  };

  // 장식 요소
  decorations: {
    showPencilIcon?: boolean;
    showPaperClip?: boolean;
    showStickers?: boolean;
    marginLine?: boolean;
    marginLineColor?: {light: string; dark: string};
    holesPunch?: boolean;
  };

  // ========== 컴포넌트별 스타일 (확장성) ==========

  // 할일 탭 스타일
  task: {
    item: {
      borderRadius: number;
      padding: number;
      marginBottom: number;
      borderWidth: number;
      shadow: boolean;
      // 포스트잇 스타일 옵션
      postItStyle?: boolean;
      rotationRange?: number; // 회전 각도 범위 (deg)
    };
    colors: string[]; // 포스트잇/태그 색상 팔레트
    badge: {
      borderRadius: number;
      fontWeight: string;
    };
  };

  // 시간표 탭 스타일
  timetable: {
    cell: {
      borderRadius: number;
      borderWidth: number;
      minHeight: number;
    };
    header: {
      height: number;
      fontWeight: string;
    };
    timeColumn: {
      width: number;
      fontSize: number;
    };
    filled: {
      opacity: number;
      borderStyle: 'solid' | 'dashed' | 'none';
    };
  };

  // 집중 탭 스타일
  focus: {
    sessionCard: {
      borderRadius: number;
      borderWidth: number;
      shadow: boolean;
      postItStyle?: boolean;
    };
    goalCard: {
      borderRadius: number;
      padding: number;
    };
    badge: {
      borderRadius: number;
    };
    colors: string[]; // 세션 카드 색상 팔레트
  };

  // 통계 탭 스타일
  stats: {
    chartContainer: {
      borderRadius: number;
      padding: number;
    };
    legend: {
      dotSize: number;
      fontSize: number;
    };
    value: {
      fontSize: number;
      fontWeight: string;
    };
    barChart: {
      borderRadius: number;
      gap: number;
    };
    // 오늘의 기록 섹션 카드
    dailySection: {
      borderRadius: number;
      borderWidth: number;
      padding: number;
      shadow?: boolean; // 그림자 사용 여부
      comment: { light: string; dark: string; border: { light: string; dark: string }; accent?: { light: string; dark: string } };
      task: { light: string; dark: string; border: { light: string; dark: string }; accent?: { light: string; dark: string } };
      memo: { light: string; dark: string; border: { light: string; dark: string }; accent?: { light: string; dark: string } };
    };
    // 공부 메모 카드
    memoCard: {
      borderRadius: number;
      borderWidth: number;
      padding: number;
      shadow?: boolean;
      useSubjectColor: boolean; // true: 과목 색상 사용, false: 통일 색상
      defaultColor: { light: string; dark: string; border: { light: string; dark: string } };
    };
  };

  // 탭바 스타일
  tabBar: {
    borderRadius: number;
    indicatorStyle: 'underline' | 'pill' | 'none';
    indicatorHeight: number;
  };

  // 버튼 스타일
  button: {
    borderRadius: number;
    fontWeight: string;
    shadow: boolean;
  };

  // 입력 필드 스타일
  input: {
    borderRadius: number;
    borderWidth: number;
    borderStyle: 'solid' | 'dashed' | 'none';
  };

  // 모달 스타일
  modal: {
    borderRadius: number;
    shadow: boolean;
  };
}

// ============ 노트북 테마 ============
export const notebookTheme: StudyRecordTheme = {
  id: 'notebook',
  name: '공책',

  background: {
    light: '#FDF8F3', // 약간 누런 종이색
    dark: '#1A1816',
    pattern: 'grid',
    patternColor: {light: '#E8DFD5', dark: '#2A2520'},
    patternSpacing: 20,
  },

  card: {
    light: '#FFFEFA',
    dark: '#242220',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: {light: '#D4C4B0', dark: '#3A3530'},
    shadow: false,
    paperTexture: true,
    tapeDecoration: true,
    cornerFold: false,
  },

  text: {
    primary: {light: '#5C4A3D', dark: '#E0D5C8'},
    secondary: {light: '#8B7355', dark: '#8B7355'},
    accent: {light: '#4A90A4', dark: '#4A90A4'},
  },

  colors: {
    accent: '#4A90A4',
    success: '#4A7C59',
    warning: '#C17F59',
    error: '#C15959',
    sunday: '#C17F59',
    saturday: '#4A90A4',
  },

  header: {
    handwritten: true,
    underline: true,
    underlineStyle: 'wavy',
  },

  checkbox: {
    style: 'square',
    borderWidth: 2,
    checkStyle: 'check',
  },

  progressBar: {
    height: 8,
    borderRadius: 2,
    style: 'solid',
    background: {light: '#E8DFD5', dark: '#3A3530'},
  },

  grid: {
    borderWidth: 1,
    borderRadius: 2,
    gap: 1,
    emptyBlock: {light: '#FDF8F3', dark: '#2A2520'},
  },

  decorations: {
    showPencilIcon: true,
    showPaperClip: false,
    showStickers: false,
    marginLine: true,
    marginLineColor: {light: '#FFCCCB', dark: '#4A2020'},
    holesPunch: false,
  },

  // 컴포넌트별 스타일 - 노트북
  task: {
    item: {
      borderRadius: 2,
      padding: 12,
      marginBottom: 8,
      borderWidth: 0,
      shadow: true,
      postItStyle: true,
      rotationRange: 1.5,
    },
    colors: [
      '#FBF0C4', '#F5E0C8', '#D8ECD5', '#DAE8F2', '#E8DCF0', '#F5E0DC',
      '#E8F0D8', '#F0E8D8', '#D8E8F0', '#F0D8E8',
    ],
    badge: {
      borderRadius: 2,
      fontWeight: '600',
    },
  },

  timetable: {
    cell: {
      borderRadius: 2,
      borderWidth: 1,
      minHeight: 24,
    },
    header: {
      height: 32,
      fontWeight: '600',
    },
    timeColumn: {
      width: 36,
      fontSize: 10,
    },
    filled: {
      opacity: 0.85,
      borderStyle: 'none',
    },
  },

  focus: {
    sessionCard: {
      borderRadius: 2,
      borderWidth: 0,
      shadow: true,
      postItStyle: true,
    },
    goalCard: {
      borderRadius: 4,
      padding: 16,
    },
    badge: {
      borderRadius: 2,
    },
    colors: [
      '#FBF0C4', '#F5E0C8', '#D8ECD5', '#DAE8F2', '#E8DCF0', '#F5E0DC',
    ],
  },

  stats: {
    chartContainer: {
      borderRadius: 4,
      padding: 16,
    },
    legend: {
      dotSize: 8,
      fontSize: 11,
    },
    value: {
      fontSize: 24,
      fontWeight: '700',
    },
    barChart: {
      borderRadius: 2,
      gap: 4,
    },
    dailySection: {
      borderRadius: 4,
      borderWidth: 1,
      padding: 12,
      comment: {
        light: '#FDF5F0',
        dark: '#2A2320',
        border: { light: '#E8D0C0', dark: '#4A3A30' },
      },
      task: {
        light: '#F0F5ED',
        dark: '#202520',
        border: { light: '#C8D8C0', dark: '#3A4A35' },
      },
      memo: {
        light: '#F0F2F8',
        dark: '#202225',
        border: { light: '#C8D0E0', dark: '#35384A' },
      },
    },
    memoCard: {
      borderRadius: 4,
      borderWidth: 1,
      padding: 12,
      useSubjectColor: true,
      defaultColor: {
        light: '#FDF8F3',
        dark: '#242220',
        border: { light: '#D4C4B0', dark: '#3A3530' },
      },
    },
  },

  tabBar: {
    borderRadius: 0,
    indicatorStyle: 'underline',
    indicatorHeight: 2,
  },

  button: {
    borderRadius: 4,
    fontWeight: '600',
    shadow: false,
  },

  input: {
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: 'dashed',
  },

  modal: {
    borderRadius: 8,
    shadow: true,
  },
};

// ============ 기본 테마 ============
export const defaultTheme: StudyRecordTheme = {
  id: 'default',
  name: '기본',

  background: {
    light: '#FAFAFA',
    dark: '#121212',
    pattern: 'none',
  },

  card: {
    light: '#FFFFFF',
    dark: '#1E1E1E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: {light: '#E8E8E8', dark: '#2E2E2E'},
    shadow: true,
    paperTexture: false,
    tapeDecoration: false,
    cornerFold: false,
  },

  text: {
    primary: {light: '#1A1A1A', dark: '#FFFFFF'},
    secondary: {light: '#8E8E93', dark: '#8E8E93'},
    accent: {light: '#007AFF', dark: '#0A84FF'},
  },

  colors: {
    accent: '#007AFF',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    sunday: '#FF3B30',
    saturday: '#007AFF',
  },

  header: {
    handwritten: false,
    underline: false,
  },

  checkbox: {
    style: 'rounded',
    borderWidth: 2,
    checkStyle: 'check',
  },

  progressBar: {
    height: 6,
    borderRadius: 3,
    style: 'solid',
    background: {light: '#E5E5EA', dark: '#3A3A3C'},
  },

  grid: {
    borderWidth: 0.5,
    borderRadius: 4,
    gap: 2,
    emptyBlock: {light: '#F5F5F5', dark: '#2C2C2E'},
  },

  decorations: {
    showPencilIcon: false,
    showPaperClip: false,
    showStickers: false,
    marginLine: false,
    holesPunch: false,
  },

  // 컴포넌트별 스타일 - 기본
  task: {
    item: {
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      shadow: true,
      postItStyle: false,
      rotationRange: 0,
    },
    colors: [
      '#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', '#5856D6',
      '#FF2D55', '#00C7BE', '#FF6B6B', '#4A90A4',
    ],
    badge: {
      borderRadius: 8,
      fontWeight: '600',
    },
  },

  timetable: {
    cell: {
      borderRadius: 4,
      borderWidth: 0.5,
      minHeight: 28,
    },
    header: {
      height: 36,
      fontWeight: '600',
    },
    timeColumn: {
      width: 40,
      fontSize: 11,
    },
    filled: {
      opacity: 0.9,
      borderStyle: 'solid',
    },
  },

  focus: {
    sessionCard: {
      borderRadius: 12,
      borderWidth: 1,
      shadow: true,
      postItStyle: false,
    },
    goalCard: {
      borderRadius: 16,
      padding: 20,
    },
    badge: {
      borderRadius: 12,
    },
    colors: [
      '#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', '#5856D6',
    ],
  },

  stats: {
    chartContainer: {
      borderRadius: 16,
      padding: 20,
    },
    legend: {
      dotSize: 10,
      fontSize: 12,
    },
    value: {
      fontSize: 28,
      fontWeight: '800',
    },
    barChart: {
      borderRadius: 4,
      gap: 6,
    },
    dailySection: {
      borderRadius: 16,
      borderWidth: 0,
      padding: 16,
      shadow: true, // 기본 테마는 그림자 사용
      comment: {
        light: '#FFFFFF',
        dark: '#2D2D35',
        border: { light: '#FFE5E5', dark: '#4A3535' },
        accent: { light: '#FF6B6B', dark: '#FF8A8A' }, // 왼쪽 악센트 라인 색상
      },
      task: {
        light: '#FFFFFF',
        dark: '#2D3530',
        border: { light: '#D5F5D5', dark: '#354A35' },
        accent: { light: '#4CD964', dark: '#5AE472' },
      },
      memo: {
        light: '#FFFFFF',
        dark: '#2D2D38',
        border: { light: '#D5E0F5', dark: '#35354A' },
        accent: { light: '#5AC8FA', dark: '#6AD4FF' },
      },
    },
    memoCard: {
      borderRadius: 14,
      borderWidth: 0,
      padding: 16,
      shadow: true,
      useSubjectColor: true,
      defaultColor: {
        light: '#FFFFFF',
        dark: '#2D2D35',
        border: { light: '#E8E8F0', dark: '#3A3A4A' },
      },
    },
  },

  tabBar: {
    borderRadius: 8,
    indicatorStyle: 'pill',
    indicatorHeight: 3,
  },

  button: {
    borderRadius: 12,
    fontWeight: '600',
    shadow: true,
  },

  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'solid',
  },

  modal: {
    borderRadius: 20,
    shadow: true,
  },
};

// 테마 목록
export const studyRecordThemes: Record<StudyRecordThemeType, StudyRecordTheme> = {
  default: defaultTheme,
  notebook: notebookTheme,
};

// 테마 가져오기
export const getStudyRecordTheme = (themeId: StudyRecordThemeType): StudyRecordTheme => {
  return studyRecordThemes[themeId] || defaultTheme;
};

// ========== 테마 유틸리티 함수 ==========

// 테마에 따른 색상 가져오기
export const getThemeColor = (
  theme: StudyRecordTheme,
  isDark: boolean,
  colorKey: 'primary' | 'secondary' | 'accent'
): string => {
  return isDark ? theme.text[colorKey].dark : theme.text[colorKey].light;
};

// 테마에 따른 배경색 가져오기
export const getThemeBackground = (theme: StudyRecordTheme, isDark: boolean): string => {
  return isDark ? theme.background.dark : theme.background.light;
};

// 테마에 따른 카드 배경색 가져오기
export const getCardBackground = (theme: StudyRecordTheme, isDark: boolean): string => {
  return isDark ? theme.card.dark : theme.card.light;
};

// 포스트잇 색상 가져오기 (인덱스 기반)
export const getPostItColor = (
  theme: StudyRecordTheme,
  index: number,
  isDark: boolean
): {bg: string; border: string} => {
  const colors = theme.task.colors;
  const baseColor = colors[index % colors.length];

  if (theme.task.item.postItStyle) {
    // 포스트잇 스타일: 파스텔 배경 + 어두운 테두리
    return {
      bg: isDark ? adjustColorForDark(baseColor) : baseColor,
      border: darkenColor(baseColor, 0.2),
    };
  }

  // 기본 스타일: 투명 배경 + 색상 테두리
  return {
    bg: isDark ? baseColor + '15' : baseColor + '10',
    border: baseColor,
  };
};

// 세션 카드 색상 가져오기
export const getSessionCardColor = (
  theme: StudyRecordTheme,
  index: number,
  isDark: boolean
): {bg: string; border: string} => {
  const colors = theme.focus.colors;
  const baseColor = colors[index % colors.length];

  if (theme.focus.sessionCard.postItStyle) {
    return {
      bg: isDark ? adjustColorForDark(baseColor) : baseColor,
      border: darkenColor(baseColor, 0.2),
    };
  }

  return {
    bg: isDark ? baseColor + '15' : baseColor + '10',
    border: baseColor + '30',
  };
};

// 회전 각도 계산 (포스트잇 스타일용)
export const getRotation = (theme: StudyRecordTheme, index: number): number => {
  const range = theme?.task?.item?.rotationRange || 0;
  if (range === 0) return 0;
  return index % 2 === 0 ? -range : range;
};

// 어두운 색상으로 변환 (다크모드용)
const adjustColorForDark = (color: string): string => {
  // 파스텔 색상을 다크모드에 맞게 어둡게 조정
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // 밝기를 40%로 줄임
  const factor = 0.4;
  const newR = Math.round(r * factor);
  const newG = Math.round(g * factor);
  const newB = Math.round(b * factor);

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
};

// 색상 어둡게 만들기
const darkenColor = (color: string, factor: number): string => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  const newR = Math.round(r * (1 - factor));
  const newG = Math.round(g * (1 - factor));
  const newB = Math.round(b * (1 - factor));

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
};

// 테마별 그림자 스타일
export const getThemeShadow = (theme: StudyRecordTheme, isDark: boolean) => {
  if (!theme.card.shadow) {
    return {};
  }

  return {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 8,
    elevation: 4,
  };
};

// 포스트잇 그림자 스타일
export const getPostItShadow = (isDark: boolean) => ({
  shadowColor: '#000',
  shadowOffset: {width: 2, height: 2},
  shadowOpacity: isDark ? 0.3 : 0.15,
  shadowRadius: 3,
  elevation: 3,
});
