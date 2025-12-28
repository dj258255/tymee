import React from 'react';
import {View, Text, StyleSheet, ViewStyle} from 'react-native';
import {StudyRecordTheme} from '../themes/studyRecordThemes';
import {sp, hp, fp} from '../utils/responsive';

interface NotebookCardProps {
  theme: StudyRecordTheme;
  isDark: boolean;
  children: React.ReactNode;
  title?: string;
  style?: ViewStyle;
  showTape?: boolean;
  tapeColor?: string;
  rightAction?: React.ReactNode;
}

const NotebookCard: React.FC<NotebookCardProps> = ({
  theme,
  isDark,
  children,
  title,
  style,
  showTape = true,
  tapeColor,
  rightAction,
}) => {
  const cardBg = isDark ? theme.card.dark : theme.card.light;
  const borderColor = isDark
    ? theme.card.borderColor.dark
    : theme.card.borderColor.light;

  const cardStyle: ViewStyle = {
    backgroundColor: cardBg,
    borderRadius: theme.card.borderRadius,
    borderWidth: theme.card.borderWidth,
    borderColor: borderColor,
    ...(theme.card.shadow && {
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 3},
      shadowOpacity: isDark ? 0.35 : 0.12,
      shadowRadius: 10,
      elevation: 4,
    }),
  };

  // 테이프 색상들
  const tapeColors = ['#FFE4B5', '#FFB6C1', '#B0E0E6', '#98FB98', '#DDA0DD'];
  const selectedTapeColor = tapeColor || tapeColors[Math.floor(Math.random() * tapeColors.length)];

  return (
    <View style={[styles.container, cardStyle, style]}>
      {/* 마스킹 테이프 장식 */}
      {theme.card.tapeDecoration && showTape && (
        <View style={styles.tapeContainer}>
          <View
            style={[
              styles.tape,
              {
                backgroundColor: selectedTapeColor,
                transform: [{rotate: '-3deg'}],
                left: 20,
              },
            ]}
          />
          <View
            style={[
              styles.tape,
              {
                backgroundColor: selectedTapeColor,
                transform: [{rotate: '2deg'}],
                right: 20,
              },
            ]}
          />
        </View>
      )}

      {/* 제목 */}
      {title && (
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.title,
                {color: isDark ? '#E0D5C8' : '#5C4A3D'},
                theme.header.handwritten && styles.handwrittenTitle,
              ]}>
              {title}
            </Text>
            {rightAction && <View style={styles.rightAction}>{rightAction}</View>}
          </View>
          {theme.header.underline && (
            <View
              style={[
                styles.underline,
                {backgroundColor: isDark ? '#4A3F35' : '#D4C4B0'},
                theme.header.underlineStyle === 'wavy' && styles.wavyUnderline,
                theme.header.underlineStyle === 'double' && styles.doubleUnderline,
              ]}
            />
          )}
        </View>
      )}

      {/* 컨텐츠 */}
      <View style={styles.content}>{children}</View>

      {/* 종이 질감 효과 (subtle noise overlay) */}
      {theme.card.paperTexture && (
        <View style={styles.paperTexture} pointerEvents="none" />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: sp(16),
    marginHorizontal: sp(16),
    marginVertical: hp(8),
    position: 'relative',
    overflow: 'hidden',
  },
  tapeContainer: {
    position: 'absolute',
    top: hp(-8),
    left: 0,
    right: 0,
    height: hp(24),
    zIndex: 10,
  },
  tape: {
    position: 'absolute',
    width: sp(60),
    height: hp(20),
    opacity: 0.7,
  },
  titleContainer: {
    marginBottom: hp(12),
    paddingBottom: hp(8),
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: fp(18),
    fontWeight: '700',
    flex: 1,
  },
  rightAction: {
    marginLeft: sp(12),
  },
  handwrittenTitle: {
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  underline: {
    height: hp(2),
    marginTop: hp(6),
    borderRadius: sp(1),
  },
  wavyUnderline: {
    height: hp(3),
    // 실제 웨이브는 SVG로 구현 필요, 여기선 단순화
  },
  doubleUnderline: {
    height: hp(4),
    borderTopWidth: 1,
    borderBottomWidth: 1,
    backgroundColor: 'transparent',
  },
  content: {
    zIndex: 1,
  },
  paperTexture: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.03,
    backgroundColor: '#8B7355',
  },
});

export default NotebookCard;
