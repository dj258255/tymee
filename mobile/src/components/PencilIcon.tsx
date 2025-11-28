import React from 'react';
import Svg, {Defs, LinearGradient, Stop, G, Path, Rect, Polygon} from 'react-native-svg';

interface PencilIconProps {
  size?: number;
}

const PencilIcon: React.FC<PencilIconProps> = ({size = 24}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 62 62" fill="none">
      <Defs>
        <LinearGradient id="pencilBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FED76A" />
          <Stop offset="100%" stopColor="#FFC233" />
        </LinearGradient>
        <LinearGradient id="eraserGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#FF9EAF" />
          <Stop offset="100%" stopColor="#FF7A93" />
        </LinearGradient>
      </Defs>

      {/* 연필 그룹 (왼쪽 아래 방향) */}
      <G transform="translate(31, 31) rotate(45) translate(-31, -31)">
        {/* 지우개 (상단만 둥글게) */}
        <Path d="M23,14 L23,8 Q23,2 31,2 Q39,2 39,8 L39,14 L23,14 Z" fill="url(#eraserGrad)" />

        {/* 금속 밴드 */}
        <Rect x="21" y="14" width="20" height="8" rx="1" fill="#E0E0E0" />

        {/* 연필 몸체 */}
        <Rect x="23" y="22" width="16" height="28" fill="url(#pencilBody)" />

        {/* 깎인 부분 */}
        <Polygon points="23,50 31,60 39,50" fill="#FFE4C4" />

        {/* 연필심 */}
        <Polygon points="29,54 31,60 33,54" fill="#505050" />
      </G>
    </Svg>
  );
};

export default PencilIcon;
