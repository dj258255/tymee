import React from 'react';
import {View, StyleSheet, Dimensions} from 'react-native';
import {Canvas, Line, vec, Circle} from '@shopify/react-native-skia';
import {StudyRecordTheme} from '../themes/studyRecordThemes';
import {sp} from '../utils/responsive';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

interface NotebookBackgroundProps {
  theme: StudyRecordTheme;
  isDark: boolean;
  children: React.ReactNode;
}

const NotebookBackground: React.FC<NotebookBackgroundProps> = ({
  theme,
  isDark,
  children,
}) => {
  const bgColor = isDark ? theme.background.dark : theme.background.light;
  const patternColor = theme.background.patternColor
    ? isDark
      ? theme.background.patternColor.dark
      : theme.background.patternColor.light
    : 'transparent';
  const marginColor = theme.decorations.marginLineColor
    ? isDark
      ? theme.decorations.marginLineColor.dark
      : theme.decorations.marginLineColor.light
    : 'transparent';

  const spacing = theme.background.patternSpacing || 20;
  const pattern = theme.background.pattern || 'none';

  // 그리드 라인 생성
  const renderGridPattern = () => {
    const lines: JSX.Element[] = [];

    // 가로 라인
    for (let y = 0; y < SCREEN_HEIGHT; y += spacing) {
      lines.push(
        <Line
          key={`h-${y}`}
          p1={vec(0, y)}
          p2={vec(SCREEN_WIDTH, y)}
          color={patternColor}
          strokeWidth={0.5}
        />
      );
    }

    // 세로 라인
    for (let x = 0; x < SCREEN_WIDTH; x += spacing) {
      lines.push(
        <Line
          key={`v-${x}`}
          p1={vec(x, 0)}
          p2={vec(x, SCREEN_HEIGHT)}
          color={patternColor}
          strokeWidth={0.5}
        />
      );
    }

    return lines;
  };

  // 줄 무늬 생성
  const renderLinesPattern = () => {
    const lines: JSX.Element[] = [];

    for (let y = 0; y < SCREEN_HEIGHT; y += spacing) {
      lines.push(
        <Line
          key={`line-${y}`}
          p1={vec(0, y)}
          p2={vec(SCREEN_WIDTH, y)}
          color={patternColor}
          strokeWidth={0.5}
        />
      );
    }

    return lines;
  };

  // 도트 패턴 생성
  const renderDotsPattern = () => {
    const dots: JSX.Element[] = [];

    for (let y = spacing; y < SCREEN_HEIGHT; y += spacing) {
      for (let x = spacing; x < SCREEN_WIDTH; x += spacing) {
        dots.push(
          <Circle
            key={`dot-${x}-${y}`}
            cx={x}
            cy={y}
            r={1}
            color={patternColor}
          />
        );
      }
    }

    return dots;
  };

  const renderPattern = () => {
    switch (pattern) {
      case 'grid':
        return renderGridPattern();
      case 'lines':
        return renderLinesPattern();
      case 'dots':
        return renderDotsPattern();
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: bgColor}]}>
      {/* 배경 패턴 */}
      {pattern !== 'none' && (
        <Canvas style={styles.patternCanvas} pointerEvents="none">
          {renderPattern()}
          {/* 왼쪽 마진 라인 (빨간 세로줄) */}
          {theme.decorations.marginLine && (
            <Line
              p1={vec(sp(40), 0)}
              p2={vec(sp(40), SCREEN_HEIGHT)}
              color={marginColor}
              strokeWidth={1}
            />
          )}
        </Canvas>
      )}

      {/* 컨텐츠 */}
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  patternCanvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
  },
});

export default NotebookBackground;
