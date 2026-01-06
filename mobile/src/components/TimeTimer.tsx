import React from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import Svg, {Circle, Path, G, Text as SvgText} from 'react-native-svg';

interface TimeTimerProps {
  size: number;
  progress: number; // 0 to 1
  color: string;
  backgroundColor: string;
  timeText: string; // 시간 텍스트 (예: "25:00")
  totalSeconds: number; // 전체 시간 (초 단위)
  onProgressChange?: (progress: number) => void;
  isRunning?: boolean; // 재생 중 여부
  onPlayPause?: () => void; // 재생/일시정지 콜백
  showButton?: boolean; // 버튼 표시 여부 (기본: true)
}

const TimeTimer: React.FC<TimeTimerProps> = ({
  size,
  progress,
  color,
  backgroundColor,
  timeText: _timeText,
  totalSeconds,
  onProgressChange,
  isRunning = false,
  onPlayPause,
  showButton = true,
}) => {
  const center = size / 2;
  const radius = size * 0.35; // 시계가 화면에 잘 맞도록 크기 조정

  // Calculate the end angle based on progress (0 = top, clockwise)
  // Progress 1 = full circle, Progress 0 = no fill
  const angle = progress * 360;

  // Create the arc path for the colored disk
  const createArcPath = () => {
    if (progress === 0) {return '';}
    if (progress >= 1) {
      // Full circle
      return `M ${center},${center - radius}
              A ${radius},${radius} 0 0,1 ${center},${center + radius}
              A ${radius},${radius} 0 0,1 ${center},${center - radius} Z`;
    }

    // Convert angle to radians
    const endAngle = (angle - 90) * (Math.PI / 180);
    const endX = center + radius * Math.cos(endAngle);
    const endY = center + radius * Math.sin(endAngle);

    // Large arc flag: 1 if angle > 180
    const largeArcFlag = angle > 180 ? 1 : 0;

    return `M ${center},${center}
            L ${center},${center - radius}
            A ${radius},${radius} 0 ${largeArcFlag},1 ${endX},${endY}
            Z`;
  };

  // Generate hour markers (12 positions) - Time Timer style: outside the circle only
  const generateMarkers = () => {
    const markers = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i * 30 - 90) * (Math.PI / 180);
      const innerRadius = radius; // 원 테두리에서 시작
      const outerRadius = radius * 1.08; // 원 밖으로 살짝만 나감 (줄임)

      const x1 = center + innerRadius * Math.cos(angle);
      const y1 = center + innerRadius * Math.sin(angle);
      const x2 = center + outerRadius * Math.cos(angle);
      const y2 = center + outerRadius * Math.sin(angle);

      markers.push(
        <G key={i}>
          <Path
            d={`M ${x1},${y1} L ${x2},${y2}`}
            stroke="#CCCCCC"
            strokeWidth={i === 0 ? 3 : 2}
            strokeLinecap="round"
          />
        </G>
      );
    }
    return markers;
  };

  // Generate minute tick marks (60 positions, skip hour positions) - outside the circle only
  const generateMinuteTicks = () => {
    const ticks = [];
    for (let i = 0; i < 60; i++) {
      if (i % 5 === 0) {continue;} // Skip hour markers

      const angle = (i * 6 - 90) * (Math.PI / 180);
      const innerRadius = radius; // 원 테두리에서 시작
      const outerRadius = radius * 1.04; // 원 밖으로 조금만 나감 (줄임)

      const x1 = center + innerRadius * Math.cos(angle);
      const y1 = center + innerRadius * Math.sin(angle);
      const x2 = center + outerRadius * Math.cos(angle);
      const y2 = center + outerRadius * Math.sin(angle);

      ticks.push(
        <Path
          key={i}
          d={`M ${x1},${y1} L ${x2},${y2}`}
          stroke="#E0E0E0"
          strokeWidth={0.8}
          strokeLinecap="round"
        />
      );
    }
    return ticks;
  };

  // Generate time labels based on total duration (12 divisions)
  const generateNumbers = () => {
    const labels = [];
    const totalMinutes = Math.floor(totalSeconds / 60);

    for (let i = 0; i < 12; i++) {
      // Calculate time for this position (0분부터 시작, 12등분)
      const timeAtPosition = Math.round((totalMinutes / 12) * i);

      // Start from top (12 o'clock = 0분) and go clockwise
      const angle = (i * 30 - 90) * (Math.PI / 180);
      const labelRadius = radius * 1.22; // 눈금선과 겹치지 않도록 더 바깥으로 배치
      const x = center + labelRadius * Math.cos(angle);
      const y = center + labelRadius * Math.sin(angle);

      labels.push(
        <SvgText
          key={i}
          x={x}
          y={y}
          fontSize={size * 0.045}
          fontWeight="600"
          fill="#666666"
          textAnchor="middle"
          alignmentBaseline="middle">
          {timeAtPosition}
        </SvgText>
      );
    }
    return labels;
  };

  const handleTouch = (event: any) => {
    if (!onProgressChange) {return;}

    const {locationX, locationY} = event.nativeEvent;
    const centerX = size / 2;
    const centerY = size / 2;

    // Calculate angle from touch position
    const dx = locationX - centerX;
    const dy = locationY - centerY;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);

    // Adjust angle to start from top (12 o'clock position)
    angle = angle + 90;
    if (angle < 0) {angle += 360;}

    // Convert angle to progress (0-1)
    const newProgress = 1 - (angle / 360);
    onProgressChange(Math.max(0, Math.min(1, newProgress)));
  };

  return (
    <View style={[styles.container, {width: size, height: size}]}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill={backgroundColor}
        />

        {/* Minute tick marks */}
        {generateMinuteTicks()}

        {/* Hour markers */}
        {generateMarkers()}

        {/* Time remaining (colored disk) */}
        <Path
          d={createArcPath()}
          fill={color}
          opacity={1}
        />

        {/* Center circle - 버튼용으로 크기 키움 */}
        <Circle
          cx={center}
          cy={center}
          r={size * 0.15}
          fill={backgroundColor}
          stroke="#CCCCCC"
          strokeWidth={2}
        />

        {/* Play/Pause icon in center */}
        {showButton && onPlayPause && (
          <>
            {isRunning ? (
              // Pause icon (두 개의 세로 막대)
              <G>
                <Path
                  d={`M ${center - size * 0.035},${center - size * 0.05} L ${center - size * 0.035},${center + size * 0.05}`}
                  stroke={color}
                  strokeWidth={size * 0.025}
                  strokeLinecap="round"
                />
                <Path
                  d={`M ${center + size * 0.035},${center - size * 0.05} L ${center + size * 0.035},${center + size * 0.05}`}
                  stroke={color}
                  strokeWidth={size * 0.025}
                  strokeLinecap="round"
                />
              </G>
            ) : (
              // Play icon (삼각형)
              <Path
                d={`M ${center - size * 0.03},${center - size * 0.05} L ${center - size * 0.03},${center + size * 0.05} L ${center + size * 0.05},${center} Z`}
                fill={color}
              />
            )}
          </>
        )}

        {/* Numbers */}
        {generateNumbers()}
      </Svg>

      {/* Center button touch area */}
      {showButton && onPlayPause && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onPlayPause}
          style={{
            position: 'absolute',
            width: size * 0.3,
            height: size * 0.3,
            borderRadius: (size * 0.3) / 2,
            top: center - (size * 0.3) / 2,
            left: center - (size * 0.3) / 2,
            zIndex: 10,
          }}
        />
      )}

      {/* Touch overlay - SVG 위에 투명한 터치 영역 */}
      {onProgressChange && (
        <View
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={handleTouch}
          onResponderMove={handleTouch}
          style={{
            position: 'absolute',
            width: size,
            height: size,
            top: 0,
            left: 0,
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TimeTimer;
