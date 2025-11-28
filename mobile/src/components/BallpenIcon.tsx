import React from 'react';
import Svg, {Defs, LinearGradient, Stop, G, Path, Rect} from 'react-native-svg';

interface BallpenIconProps {
  size?: number;
}

const BallpenIcon: React.FC<BallpenIconProps> = ({size = 24}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 62 62" fill="none">
      <Defs>
        <LinearGradient id="penBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#7EB6FF" />
          <Stop offset="100%" stopColor="#4A9AFF" />
        </LinearGradient>
        <LinearGradient id="penTop" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#A8D4FF" />
          <Stop offset="100%" stopColor="#7EB6FF" />
        </LinearGradient>
      </Defs>

      {/* 볼펜 그룹 (왼쪽 아래 방향) */}
      <G transform="translate(31, 31) rotate(45) translate(-31, -31)">
        {/* 볼펜 뚜껑/클립 부분 (상단 둥글게) */}
        <Path d="M23,14 L23,8 Q23,2 31,2 Q39,2 39,8 L39,14 L23,14 Z" fill="url(#penTop)" />

        {/* 클립 */}
        <Rect x="38" y="4" width="3" height="14" rx="1" fill="#E0E0E0" />

        {/* 그립 밴드 */}
        <Rect x="21" y="14" width="20" height="8" rx="1" fill="#E0E0E0" />

        {/* 볼펜 몸체 */}
        <Rect x="23" y="22" width="16" height="28" fill="url(#penBody)" />

        {/* 펜촉 콘 부분 */}
        <Path d="M23,50 L27,58 L35,58 L39,50 Z" fill="#E0E0E0" />

        {/* 펜촉 팁 */}
        <Rect x="29" y="58" width="4" height="3" rx="1" fill="#505050" />
      </G>
    </Svg>
  );
};

export default BallpenIcon;
