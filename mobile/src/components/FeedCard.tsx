import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image, ViewStyle} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import {FeedItem} from '../store/communityStore';
import {sp, hp, fp, iconSize} from '../utils/responsive';

// 티어별 스타일 (학업 스타일)
const getTierStyle = (tier?: string) => {
  const tierLower = tier?.toLowerCase() || '';

  // 박사 등급
  if (tierLower.includes('명예박사')) {
    return {color: '#FFD700', bgColor: '#FFFDE7', icon: 'school'};
  } else if (tierLower.includes('박사') || tierLower.includes('doctor')) {
    return {color: '#9C27B0', bgColor: '#F3E5F5', icon: 'school'};
  // 석사 등급
  } else if (tierLower.includes('석사') || tierLower.includes('master')) {
    return {color: '#00BCD4', bgColor: '#E0F7FA', icon: 'library'};
  // 학사 등급
  } else if (tierLower.includes('학사') || tierLower.includes('bachelor')) {
    return {color: '#4CAF50', bgColor: '#E8F5E9', icon: 'book'};
  // 학생 등급
  } else if (tierLower.includes('고등') || tierLower.includes('high')) {
    return {color: '#FF9800', bgColor: '#FFF3E0', icon: 'pencil'};
  } else if (tierLower.includes('중학') || tierLower.includes('middle')) {
    return {color: '#78909C', bgColor: '#ECEFF1', icon: 'pencil'};
  } else if (tierLower.includes('초등') || tierLower.includes('elementary')) {
    return {color: '#A1887F', bgColor: '#EFEBE9', icon: 'pencil'};
  }
  return {color: '#9E9E9E', bgColor: '#F5F5F5', icon: 'ribbon'};
};

// 티어별 테두리 스타일 (카드용)
const getTierBorderStyle = (tier?: string): ViewStyle => {
  const tierStyle = getTierStyle(tier);
  if (tier && tier !== '') {
    return {
      borderWidth: 2,
      borderColor: tierStyle.color,
      shadowColor: tierStyle.color,
      shadowOpacity: 0.3,
      shadowRadius: 6,
      shadowOffset: {width: 0, height: 2},
      elevation: 4,
    };
  }
  return {};
};

interface FeedCardProps {
  feed: FeedItem;
  isDark: boolean;
  onLike: () => void;
  onComment: () => void;
  onPress: () => void;
}

const FeedCard: React.FC<FeedCardProps> = ({
  feed,
  isDark,
  onLike,
  onComment,
  onPress,
}) => {
  const cardBg = isDark ? '#1E1E1E' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#1A1A1A';
  const subtextColor = isDark ? '#8E8E93' : '#8E8E93';
  const borderColor = isDark ? '#2C2C2E' : '#E5E5EA';
  const accentColor = '#007AFF';

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

  // 공부 시간 포맷
  const formatStudyTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h}시간 ${m > 0 ? `${m}분` : ''}`;
    return `${m}분`;
  };

  // 카테고리 배지
  const getCategoryBadge = () => {
    switch (feed.category) {
      case 'study_done':
        return {label: '오공완', color: '#4CAF50', icon: 'checkmark-circle'};
      case 'study_group':
        return {label: '스터디', color: '#FF9500', icon: 'people'};
      case 'free':
        return {label: '자유', color: '#8E8E93', icon: 'chatbubble'};
      default:
        return null;
    }
  };

  const badge = getCategoryBadge();

  // 티어 스타일
  const tierStyle = getTierStyle(feed.author.tier);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {backgroundColor: cardBg, borderColor},
      ]}
      onPress={onPress}
      activeOpacity={0.7}>
      {/* 헤더 - 작성자 정보 + 카테고리 배지 */}
      <View style={styles.header}>
        <View style={styles.authorSection}>
          {/* 아바타 컨테이너 (사각형, 티어 테두리, 우상단 레벨) */}
          <View style={styles.avatarContainer}>
            <View style={[
              styles.avatarBorder,
              {
                borderColor: tierStyle.color,
                borderWidth: 2,
                shadowColor: tierStyle.color,
                shadowOpacity: 0.3,
              },
            ]}>
              <View style={[styles.avatar, {backgroundColor: '#E0E0E0'}]}>
                {feed.author.profileImageUrl ? (
                  <Image source={{uri: feed.author.profileImageUrl}} style={styles.avatarImage} />
                ) : (
                  <Icon name="person" size={iconSize(18)} color="#9E9E9E" />
                )}
              </View>
            </View>
            {/* 우상단 레벨 배지 */}
            {feed.author.level && (
              <View style={[styles.levelBadgeTopRight, {backgroundColor: tierStyle.color}]}>
                <Text style={styles.levelBadgeText}>{feed.author.level}</Text>
              </View>
            )}
          </View>
          <View style={styles.authorInfo}>
            <View style={styles.authorTopRow}>
              <Text style={[styles.authorName, {color: textColor}]}>
                {feed.author.nickname}
              </Text>
              {/* 티어 배지 */}
              {feed.author.tier && (
                <View style={[styles.tierBadge, {backgroundColor: tierStyle.bgColor}]}>
                  <Icon name={tierStyle.icon as any} size={iconSize(10)} color={tierStyle.color} />
                  <Text style={[styles.tierText, {color: tierStyle.color}]}>
                    {feed.author.tier}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.authorBottomRow}>
              {feed.author.title && (
                <View style={[styles.titleBadge, {backgroundColor: isDark ? '#2A1A2A' : '#F3E5F5'}]}>
                  <Icon name="ribbon" size={iconSize(10)} color="#9C27B0" />
                  <Text style={[styles.titleText, {color: isDark ? '#CE93D8' : '#9C27B0'}]}>
                    {feed.author.title}
                  </Text>
                </View>
              )}
              <Text style={[styles.timeText, {color: subtextColor}]}>
                {formatTime(feed.createdAt)}
              </Text>
            </View>
          </View>
        </View>
        {badge && (
          <View style={[styles.categoryBadge, {backgroundColor: badge.color + '20'}]}>
            <Icon name={badge.icon as any} size={iconSize(12)} color={badge.color} />
            <Text style={[styles.categoryText, {color: badge.color}]}>{badge.label}</Text>
          </View>
        )}
      </View>

      {/* 컨텐츠 */}
      <Text style={[styles.content, {color: textColor}]}>{feed.content}</Text>

      {/* 오공완 카드 */}
      {feed.studyDoneData && (
        <View style={[styles.studyDoneCard, {backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5'}]}>
          <View style={styles.studyDoneHeader}>
            <View style={styles.studyDoneTime}>
              <Icon name="time" size={iconSize(18)} color={accentColor} />
              <Text style={[styles.studyDoneTimeText, {color: textColor}]}>
                {formatStudyTime(feed.studyDoneData.totalMinutes)}
              </Text>
            </View>
            {feed.studyDoneData.streak && feed.studyDoneData.streak > 1 && (
              <View style={[styles.streakBadge, {backgroundColor: '#FF9500'}]}>
                <Icon name="flame" size={iconSize(12)} color="#FFFFFF" />
                <Text style={styles.streakText}>{feed.studyDoneData.streak}일</Text>
              </View>
            )}
          </View>
          <View style={styles.subjectList}>
            {feed.studyDoneData.subjects.map((subject, index) => (
              <View key={index} style={styles.subjectItem}>
                <View style={[styles.subjectDot, {backgroundColor: subject.color}]} />
                <Text style={[styles.subjectName, {color: subtextColor}]}>
                  {subject.name}
                </Text>
                <Text style={[styles.subjectTime, {color: textColor}]}>
                  {formatStudyTime(subject.minutes)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 스터디 모집 카드 */}
      {feed.studyGroupData && (
        <View style={[styles.studyGroupCard, {backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5'}]}>
          <Text style={[styles.studyGroupTitle, {color: textColor}]}>
            {feed.studyGroupData.title}
          </Text>
          <Text style={[styles.studyGroupDesc, {color: subtextColor}]} numberOfLines={2}>
            {feed.studyGroupData.description}
          </Text>
          <View style={styles.studyGroupFooter}>
            <View style={styles.memberInfo}>
              <Icon name="people" size={iconSize(14)} color={subtextColor} />
              <Text style={[styles.memberText, {color: subtextColor}]}>
                {feed.studyGroupData.currentMembers}/{feed.studyGroupData.maxMembers}명
              </Text>
            </View>
            <View style={styles.tagList}>
              {feed.studyGroupData.tags.slice(0, 2).map((tag, index) => (
                <View key={index} style={[styles.tag, {backgroundColor: accentColor + '15'}]}>
                  <Text style={[styles.tagText, {color: accentColor}]}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* 이미지 */}
      {feed.image && (
        <Image source={{uri: feed.image}} style={styles.feedImage} resizeMode="cover" />
      )}

      {/* 액션 바 */}
      <View style={[styles.actionBar, {borderTopColor: borderColor}]}>
        <TouchableOpacity style={styles.actionButton} onPress={onLike}>
          <Icon
            name={feed.isLiked ? 'heart' : 'heart-outline'}
            size={iconSize(20)}
            color={feed.isLiked ? '#FF3B30' : subtextColor}
          />
          <Text style={[styles.actionText, {color: feed.isLiked ? '#FF3B30' : subtextColor}]}>
            {feed.likes}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onComment}>
          <Icon name="chatbubble-outline" size={iconSize(20)} color={subtextColor} />
          <Text style={[styles.actionText, {color: subtextColor}]}>{feed.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="share-outline" size={iconSize(20)} color={subtextColor} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: sp(16),
    marginVertical: hp(6),
    borderRadius: sp(16),
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: sp(14),
    paddingBottom: hp(10),
  },
  authorSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: sp(10),
  },
  avatarBorder: {
    width: sp(42),
    height: sp(42),
    borderRadius: sp(10),
    justifyContent: 'center',
    alignItems: 'center',
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
  },
  avatar: {
    width: sp(38),
    height: sp(38),
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
  authorInfo: {
    flex: 1,
  },
  authorTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(6),
    flexWrap: 'wrap',
  },
  authorName: {
    fontSize: fp(14),
    fontWeight: '600',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(6),
    paddingVertical: hp(2),
    borderRadius: sp(8),
    gap: sp(3),
  },
  tierText: {
    fontSize: fp(10),
    fontWeight: '600',
  },
  authorBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(6),
    marginTop: hp(4),
    flexWrap: 'wrap',
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(3),
    paddingHorizontal: sp(6),
    paddingVertical: hp(2),
    borderRadius: sp(6),
  },
  titleText: {
    fontSize: fp(9),
    fontWeight: '600',
  },
  timeText: {
    fontSize: fp(10),
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(8),
    paddingVertical: hp(4),
    borderRadius: sp(10),
    gap: sp(4),
  },
  categoryText: {
    fontSize: fp(11),
    fontWeight: '600',
  },
  content: {
    fontSize: fp(14),
    lineHeight: fp(20),
    paddingHorizontal: sp(14),
    paddingBottom: hp(12),
  },
  studyDoneCard: {
    marginHorizontal: sp(14),
    marginBottom: hp(12),
    padding: sp(12),
    borderRadius: sp(12),
  },
  studyDoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(10),
  },
  studyDoneTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(6),
  },
  studyDoneTimeText: {
    fontSize: fp(18),
    fontWeight: '700',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(8),
    paddingVertical: hp(4),
    borderRadius: sp(10),
    gap: sp(4),
  },
  streakText: {
    color: '#FFFFFF',
    fontSize: fp(11),
    fontWeight: '700',
  },
  subjectList: {
    gap: hp(6),
  },
  subjectItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectDot: {
    width: sp(8),
    height: sp(8),
    borderRadius: sp(4),
    marginRight: sp(8),
  },
  subjectName: {
    fontSize: fp(12),
    flex: 1,
  },
  subjectTime: {
    fontSize: fp(12),
    fontWeight: '600',
  },
  studyGroupCard: {
    marginHorizontal: sp(14),
    marginBottom: hp(12),
    padding: sp(12),
    borderRadius: sp(12),
  },
  studyGroupTitle: {
    fontSize: fp(15),
    fontWeight: '700',
    marginBottom: hp(4),
  },
  studyGroupDesc: {
    fontSize: fp(13),
    lineHeight: fp(18),
    marginBottom: hp(10),
  },
  studyGroupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(4),
  },
  memberText: {
    fontSize: fp(12),
  },
  tagList: {
    flexDirection: 'row',
    gap: sp(6),
  },
  tag: {
    paddingHorizontal: sp(8),
    paddingVertical: hp(3),
    borderRadius: sp(8),
  },
  tagText: {
    fontSize: fp(11),
    fontWeight: '500',
  },
  feedImage: {
    width: '100%',
    height: hp(200),
    marginBottom: hp(12),
  },
  actionBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: hp(10),
    paddingHorizontal: sp(14),
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: sp(20),
    gap: sp(6),
  },
  actionText: {
    fontSize: fp(13),
    fontWeight: '500',
  },
});

export default FeedCard;
