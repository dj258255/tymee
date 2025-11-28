import React from 'react';
import {View, Text, StyleSheet, Dimensions} from 'react-native';
import Svg from 'react-native-svg';
import {Segment} from './Segment';
import {useTimerStore} from '../../store/timerStore';
import {THEMES, DEFAULT_THEME} from '../../constants/themes';

const {width} = Dimensions.get('window');
const TIMER_SIZE = Math.min(width * 0.8, 400);
const RADIUS = TIMER_SIZE / 2 - 40;
const STROKE_WIDTH = 24;
const GAP = 8;

export const RingTimer: React.FC = () => {
  const {segments, currentSegment, status, totalMinutes} = useTimerStore();
  const theme = THEMES[DEFAULT_THEME];

  const svgSize = (RADIUS + STROKE_WIDTH) * 2;

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      {/* Ring */}
      <View style={styles.ringContainer}>
        <Svg width={svgSize} height={svgSize}>
          {segments.map(segment => (
            <Segment
              key={segment.index}
              segment={segment}
              radius={RADIUS}
              strokeWidth={STROKE_WIDTH}
              gap={GAP}
              theme={theme}
            />
          ))}
        </Svg>

        {/* Center Content */}
        <View style={styles.centerContent}>
          <RemainingTimeDisplay theme={theme} />
          {status !== 'idle' && (
            <>
              <Text style={[styles.segmentText, {color: theme.colors.textSecondary}]}>
                {currentSegment + 1} / 12
              </Text>
              <Text style={[styles.durationText, {color: theme.colors.textSecondary}]}>
                {totalMinutes}분 타이머
              </Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

const RemainingTimeDisplay: React.FC<{theme: typeof THEMES.oceanBlue}> = ({
  theme,
}) => {
  const getRemainingMs = useTimerStore(state => state.getRemainingMs);
  const status = useTimerStore(state => state.status);

  if (status === 'idle') {
    return (
      <Text style={[styles.timeText, {color: theme.colors.textSecondary}]}>
        시작하기
      </Text>
    );
  }

  const remainingMs = getRemainingMs();
  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);

  return (
    <Text style={[styles.timeText, {color: theme.colors.text}]}>
      {minutes.toString().padStart(2, '0')}:
      {seconds.toString().padStart(2, '0')}
    </Text>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 48,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  segmentText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 8,
  },
  durationText: {
    fontSize: 16,
    marginTop: 4,
  },
});
