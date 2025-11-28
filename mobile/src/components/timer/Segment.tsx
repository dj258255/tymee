import React from 'react';
import Svg, {Path} from 'react-native-svg';
import {SegmentInfo} from '../../types/timer';
import {Theme} from '../../constants/themes';

interface SegmentProps {
  segment: SegmentInfo;
  radius: number;
  strokeWidth: number;
  gap: number;
  theme: Theme;
}

export const Segment: React.FC<SegmentProps> = ({
  segment,
  radius,
  strokeWidth,
  gap,
  theme,
}) => {
  const {angle, status, progress} = segment;

  // Calculate path
  const centerX = radius + strokeWidth;
  const centerY = radius + strokeWidth;

  // Account for gap
  const gapAngle = gap / (2 * Math.PI * radius) * 360;
  const startAngle = angle.start + gapAngle - 90; // -90 to start from top
  const endAngle = angle.end - gapAngle - 90;

  // For running segment, adjust end angle based on progress
  const actualEndAngle =
    status === 'running'
      ? startAngle + (endAngle - startAngle) * (progress / 100)
      : endAngle;

  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (actualEndAngle * Math.PI) / 180;

  const x1 = centerX + radius * Math.cos(startRad);
  const y1 = centerY + radius * Math.sin(startRad);
  const x2 = centerX + radius * Math.cos(endRad);
  const y2 = centerY + radius * Math.sin(endRad);

  const largeArcFlag = actualEndAngle - startAngle > 180 ? 1 : 0;

  const pathData = `
    M ${x1} ${y1}
    A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
  `;

  // Color based on status
  let color: string;
  switch (status) {
    case 'completed':
      color = theme.colors.completed;
      break;
    case 'running':
      color = theme.colors.running;
      break;
    default:
      color = theme.colors.idle;
  }

  return (
    <Path
      d={pathData}
      stroke={color}
      strokeWidth={strokeWidth}
      fill="none"
      strokeLinecap="round"
    />
  );
};
