import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import {FeedItem, CardFrameType} from '../store/communityStore';
import {sp, hp, fp, iconSize} from '../utils/responsive';

interface PostListItemProps {
  post: FeedItem;
  isDark: boolean;
  onPress: () => void;
  highlightQuery?: string;
}

// 카드 프레임별 테두리 스타일 (isDark 파라미터 추가)
const getFrameBorderStyle = (frame?: CardFrameType, isDark?: boolean) => {
  switch (frame) {
    case 'fire':
      return {
        borderWidth: 2,
        borderColor: '#FF4500',
        shadowColor: '#FF4500',
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 5,
      };
    case 'neon':
      return {
        borderWidth: 2,
        borderColor: '#FF00FF',
        shadowColor: '#FF00FF',
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 5,
      };
    case 'space':
      return {
        borderWidth: 2,
        borderColor: '#6B5BFF',
        shadowColor: '#6B5BFF',
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 5,
      };
    case 'diamond':
      return {
        borderWidth: 2,
        borderColor: '#00CED1',
        shadowColor: '#00CED1',
        shadowOpacity: 0.35,
        shadowRadius: 5,
        elevation: 4,
      };
    case 'gold':
      return {
        borderWidth: 1.5,
        borderColor: '#FFD700',
        shadowColor: '#FFD700',
        shadowOpacity: 0.25,
        shadowRadius: 3,
        elevation: 2,
      };
    case 'silver':
      return {
        borderWidth: 1,
        borderColor: '#C0C0C0',
        shadowColor: '#C0C0C0',
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 1,
      };
    case 'bronze':
      return {
        borderWidth: 1.5,
        borderColor: '#CD7F32',
        shadowColor: '#CD7F32',
        shadowOpacity: 0.25,
        shadowRadius: 3,
        elevation: 2,
      };
    case 'default':
    default:
      // 기본 프레임도 테두리 표시
      return {
        borderWidth: 1,
        borderColor: isDark ? '#2C2C2E' : '#E5E5EA',
      };
  }
};

// 레벨 테두리 색상 (프레임 기반)
const getLevelBorderColor = (frame?: CardFrameType) => {
  switch (frame) {
    case 'fire':
      return '#FF4500';
    case 'neon':
      return '#FF00FF';
    case 'space':
      return '#6B5BFF';
    case 'diamond':
      return '#00CED1';
    case 'gold':
      return '#FFD700';
    case 'silver':
      return '#C0C0C0';
    case 'bronze':
      return '#CD7F32';
    default:
      return '#007AFF';
  }
};

// 티어별 스타일 (ProfileCard와 동일)
const getTierStyle = (tier?: string) => {
  switch (tier) {
    case '명예박사':
      return {color: '#FFD700', bgColor: '#FFF8E1'};
    case '박사':
      return {color: '#9C27B0', bgColor: '#F3E5F5'};
    case '석사 III':
      return {color: '#00BCD4', bgColor: '#E0F7FA'};
    case '석사 II':
      return {color: '#00ACC1', bgColor: '#E0F7FA'};
    case '석사 I':
      return {color: '#0097A7', bgColor: '#E0F7FA'};
    case '학사 III':
      return {color: '#4CAF50', bgColor: '#E8F5E9'};
    case '학사 II':
      return {color: '#43A047', bgColor: '#E8F5E9'};
    case '학사 I':
      return {color: '#388E3C', bgColor: '#E8F5E9'};
    case '고등학생':
      return {color: '#FF9800', bgColor: '#FFF3E0'};
    case '중학생':
      return {color: '#78909C', bgColor: '#ECEFF1'};
    case '초등학생':
      return {color: '#A1887F', bgColor: '#EFEBE9'};
    default:
      return {color: '#9E9E9E', bgColor: '#F5F5F5'};
  }
};

const PostListItem: React.FC<PostListItemProps> = ({post, isDark, onPress, highlightQuery}) => {
  const textColor = isDark ? '#FFFFFF' : '#1A1A1A';
  const subtextColor = isDark ? '#8E8E93' : '#8E8E93';
  const cardBg = isDark ? '#1E1E1E' : '#FFFFFF';
  const highlightColor = '#FFEB3B';

  // 검색어 하이라이트 텍스트 렌더링
  const renderHighlightedText = (text: string, color: string, style: any) => {
    if (!highlightQuery || !text) {
      return <Text style={[style, {color}]} numberOfLines={1}>{text}</Text>;
    }

    const lowerText = text.toLowerCase();
    const lowerQuery = highlightQuery.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (index === -1) {
      return <Text style={[style, {color}]} numberOfLines={1}>{text}</Text>;
    }

    const before = text.slice(0, index);
    const match = text.slice(index, index + highlightQuery.length);
    const after = text.slice(index + highlightQuery.length);

    return (
      <Text style={[style, {color}]} numberOfLines={1}>
        {before}
        <Text style={{backgroundColor: highlightColor, color: '#000'}}>{match}</Text>
        {after}
      </Text>
    );
  };

  // 시간 포맷
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return new Date(date).toLocaleDateString('ko-KR');
  };

  // 프레임 기반 스타일 (isDark 전달)
  const frameBorderStyle = getFrameBorderStyle(post.author.cardFrame, isDark);
  const tierStyle = getTierStyle(post.author.tier);
  return (
    <TouchableOpacity
      style={[
        styles.container,
        {backgroundColor: cardBg},
        frameBorderStyle,
      ]}
      onPress={onPress}
      activeOpacity={0.7}>
      {/* 아바타 (사각형, 티어 테두리, 우상단 레벨) */}
      <View style={styles.avatarContainer}>
        <View style={[
          styles.avatarBorder,
          {
            borderColor: tierStyle.color,
            shadowColor: tierStyle.color,
          },
        ]}>
          <View style={[styles.avatar, {backgroundColor: '#E0E0E0'}]}>
            {post.author.profileImageUrl ? (
              <Image source={{uri: post.author.profileImageUrl}} style={styles.avatarImage} />
            ) : (
              <Icon name="person" size={iconSize(16)} color="#9E9E9E" />
            )}
          </View>
        </View>
        {/* 레벨 뱃지 (우상단) */}
        {post.author.level && (
          <View style={[
            styles.levelBadgeTopRight,
            {backgroundColor: tierStyle.color},
          ]}>
            <Text style={styles.levelBadgeText}>{post.author.level}</Text>
          </View>
        )}
      </View>

      {/* 컨텐츠 영역 */}
      <View style={styles.content}>
        {/* 제목 */}
        {renderHighlightedText(post.title || post.content, textColor, styles.title)}

        {/* 작성자 정보 + 메타 */}
        <View style={styles.meta}>
          {/* 뱃지들 (아이콘 컴포넌트 사용) */}
          {post.author.badges && post.author.badges.length > 0 && (
            <View style={styles.badgesRow}>
              {post.author.badges.slice(0, 3).map((badge) => (
                <View
                  key={badge.id}
                  style={[styles.badgeIcon, {backgroundColor: badge.color + '20'}]}>
                  <Icon
                    name={(badge.icon as any) || 'star'}
                    size={iconSize(10)}
                    color={badge.color}
                  />
                </View>
              ))}
            </View>
          )}
          {renderHighlightedText(post.author.nickname, textColor, styles.author)}
          {/* 티어 배지 */}
          {post.author.tier && (
            <View style={[styles.tierBadge, {backgroundColor: tierStyle.bgColor}]}>
              <Text style={[styles.tierText, {color: tierStyle.color}]}>
                {post.author.tier}
              </Text>
            </View>
          )}
          <Text style={[styles.dot, {color: subtextColor}]}>·</Text>
          <Text style={[styles.time, {color: subtextColor}]}>
            {formatTime(post.createdAt)}
          </Text>
        </View>
      </View>

      {/* 우측: 좋아요/댓글 + 화살표 */}
      <View style={styles.rightSection}>
        <View style={styles.stats}>
          <Icon name="heart" size={iconSize(12)} color={subtextColor} />
          <Text style={[styles.statText, {color: subtextColor}]}>{post.likes}</Text>
          <Icon name="chatbubble" size={iconSize(12)} color={subtextColor} style={styles.statIcon} />
          <Text style={[styles.statText, {color: subtextColor}]}>{post.comments}</Text>
        </View>
        <Icon name="chevron-forward" size={iconSize(16)} color={subtextColor} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: sp(12),
    paddingVertical: hp(12),
    marginHorizontal: sp(12),
    marginVertical: hp(4),
    borderRadius: sp(12),
    // borderWidth는 frameBorderStyle에서 동적으로 적용
    shadowOffset: {width: 0, height: 1},
    overflow: 'visible',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: sp(10),
  },
  avatarBorder: {
    width: sp(40),
    height: sp(40),
    borderRadius: sp(10),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
    elevation: 3,
  },
  avatar: {
    width: sp(34),
    height: sp(34),
    borderRadius: sp(8),
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  levelBadgeTopRight: {
    position: 'absolute',
    top: -sp(4),
    right: -sp(4),
    minWidth: sp(18),
    height: sp(16),
    borderRadius: sp(8),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: sp(4),
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  levelBadgeText: {
    fontSize: fp(9),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(2),
    marginRight: sp(4),
  },
  badgeIcon: {
    width: sp(16),
    height: sp(16),
    borderRadius: sp(4),
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginRight: sp(8),
  },
  title: {
    fontSize: fp(14),
    fontWeight: '600',
    marginBottom: hp(4),
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: sp(4),
  },
  author: {
    fontSize: fp(12),
    fontWeight: '600',
  },
  tierBadge: {
    paddingHorizontal: sp(5),
    paddingVertical: hp(1),
    borderRadius: sp(4),
  },
  tierText: {
    fontSize: fp(9),
    fontWeight: '600',
  },
  dot: {
    fontSize: fp(12),
  },
  time: {
    fontSize: fp(11),
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    marginLeft: sp(8),
  },
  statText: {
    fontSize: fp(11),
    marginLeft: sp(3),
  },
});

export default PostListItem;
