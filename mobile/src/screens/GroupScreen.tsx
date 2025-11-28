import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  InteractionManager,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useThemeStore} from '../store/themeStore';
import {safeGetColorScheme, safeAddAppearanceListener} from '../utils/appearance';
import Icon from '@react-native-vector-icons/ionicons';

type TabType = 'community' | 'group' | 'competition';

interface Post {
  id: string;
  author: string;
  avatar: string;
  title: string;
  content: string;
  likes: number;
  comments: number;
  time: string;
}

interface GroupRoom {
  id: string;
  name: string;
  description: string;
  members: number;
  maxMembers: number;
  thumbnail: string;
  isActive: boolean;
}

const GroupScreen: React.FC = () => {
  const {t} = useTranslation();
  const [systemColorScheme, setSystemColorScheme] = useState<'light' | 'dark'>('light');
  const [selectedTab, setSelectedTab] = useState<TabType>('community');

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setSystemColorScheme(safeGetColorScheme());
    });

    const subscription = safeAddAppearanceListener((colorScheme) => {
      setSystemColorScheme(colorScheme);
    });

    return () => {
      task.cancel();
      subscription?.remove();
    };
  }, []);

  const {themeMode} = useThemeStore();

  const isDark =
    themeMode === 'system'
      ? systemColorScheme === 'dark'
      : themeMode === 'dark';

  // 커뮤니티 게시글 예시 데이터
  const communityPosts: Post[] = [
    {
      id: '1',
      author: '공부왕',
      avatar: '👨‍🎓',
      title: '오늘 5시간 공부 완료!',
      content: '드디어 목표 달성했어요. 다들 화이팅!',
      likes: 24,
      comments: 8,
      time: '10분 전',
    },
    {
      id: '2',
      author: '열공러',
      avatar: '👩‍💻',
      title: '효과적인 암기법 공유',
      content: '제가 사용하는 암기법인데 정말 효과적이에요...',
      likes: 56,
      comments: 15,
      time: '1시간 전',
    },
    {
      id: '3',
      author: '수험생123',
      avatar: '🎯',
      title: '집중력 높이는 방법',
      content: '포모도로 기법으로 집중력이 정말 좋아졌어요!',
      likes: 89,
      comments: 23,
      time: '3시간 전',
    },
  ];

  // 모임방 예시 데이터
  const groupRooms: GroupRoom[] = [
    {
      id: '1',
      name: '아침 7시 스터디',
      description: '매일 아침 7시에 함께 공부해요',
      members: 8,
      maxMembers: 10,
      thumbnail: '🌅',
      isActive: true,
    },
    {
      id: '2',
      name: '수능 D-100 파이팅',
      description: '수능까지 함께 달려요!',
      members: 15,
      maxMembers: 20,
      thumbnail: '📚',
      isActive: true,
    },
    {
      id: '3',
      name: '영어 회화 스터디',
      description: '영어로만 대화하는 스터디',
      members: 6,
      maxMembers: 8,
      thumbnail: '🗣️',
      isActive: false,
    },
  ];

  const renderCommunity = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.postsContainer}>
        {communityPosts.map(post => (
          <TouchableOpacity
            key={post.id}
            style={[styles.postCard, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
            {/* 작성자 정보 */}
            <View style={styles.postHeader}>
              <View style={styles.authorInfo}>
                <Text style={styles.avatar}>{post.avatar}</Text>
                <View>
                  <Text style={[styles.authorName, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                    {post.author}
                  </Text>
                  <Text style={[styles.postTime, {color: isDark ? '#666666' : '#999999'}]}>
                    {post.time}
                  </Text>
                </View>
              </View>
              <TouchableOpacity>
                <Icon name="ellipsis-horizontal" size={20} color={isDark ? '#999999' : '#666666'} />
              </TouchableOpacity>
            </View>

            {/* 게시글 내용 */}
            <View style={styles.postContent}>
              <Text style={[styles.postTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                {post.title}
              </Text>
              <Text style={[styles.postText, {color: isDark ? '#CCCCCC' : '#666666'}]}>
                {post.content}
              </Text>
            </View>

            {/* 좋아요/댓글 */}
            <View style={styles.postActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Icon name="heart-outline" size={20} color={isDark ? '#999999' : '#666666'} />
                <Text style={[styles.actionText, {color: isDark ? '#999999' : '#666666'}]}>
                  {post.likes}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Icon name="chatbubble-outline" size={20} color={isDark ? '#999999' : '#666666'} />
                <Text style={[styles.actionText, {color: isDark ? '#999999' : '#666666'}]}>
                  {post.comments}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* 글쓰기 버튼 */}
      <TouchableOpacity style={[styles.fab, {backgroundColor: '#007AFF'}]}>
        <Icon name="create" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </ScrollView>
  );

  const renderGroup = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.groupsContainer}>
        {groupRooms.map(room => (
          <TouchableOpacity
            key={room.id}
            style={[styles.groupCard, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
            {/* 썸네일 */}
            <View style={[styles.groupThumbnail, {backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5'}]}>
              <Text style={styles.groupThumbnailEmoji}>{room.thumbnail}</Text>
              {room.isActive && (
                <View style={[styles.activeBadge, {backgroundColor: '#4CAF50'}]}>
                  <Text style={styles.activeBadgeText}>활동중</Text>
                </View>
              )}
            </View>

            {/* 모임 정보 */}
            <View style={styles.groupInfo}>
              <Text style={[styles.groupName, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                {room.name}
              </Text>
              <Text style={[styles.groupDescription, {color: isDark ? '#999999' : '#666666'}]}>
                {room.description}
              </Text>

              {/* 멤버 수 */}
              <View style={styles.groupMeta}>
                <Icon name="people" size={16} color={isDark ? '#999999' : '#666666'} />
                <Text style={[styles.groupMembers, {color: isDark ? '#999999' : '#666666'}]}>
                  {room.members}/{room.maxMembers}명
                </Text>
              </View>
            </View>

            {/* 참여 버튼 */}
            <TouchableOpacity style={[styles.joinButton, {backgroundColor: '#007AFF'}]}>
              <Text style={styles.joinButtonText}>참여</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>

      {/* 모임 만들기 버튼 */}
      <TouchableOpacity style={[styles.createGroupButton, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
        <Icon name="add-circle-outline" size={24} color="#007AFF" />
        <Text style={[styles.createGroupText, {color: '#007AFF'}]}>새 모임 만들기</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderCompetition = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={[styles.comingSoon, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
        <Icon name="trophy-outline" size={64} color={isDark ? '#3A3A3A' : '#E0E0E0'} />
        <Text style={[styles.comingSoonTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
          경쟁 모드
        </Text>
        <Text style={[styles.comingSoonText, {color: isDark ? '#666666' : '#999999'}]}>
          친구들과 학습 시간을 경쟁하고{'\n'}랭킹을 확인해보세요
        </Text>
        <View style={[styles.comingSoonBadge, {backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5'}]}>
          <Text style={[styles.comingSoonBadgeText, {color: isDark ? '#999999' : '#666666'}]}>
            준비중
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: isDark ? '#121212' : '#FAFAFA'}]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={[styles.title, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
          {t('group.title')}
        </Text>
      </View>

      {/* 탭 */}
      <View style={[styles.tabs, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'community' && styles.tabActive,
            selectedTab === 'community' && {borderBottomColor: '#007AFF'},
          ]}
          onPress={() => setSelectedTab('community')}>
          <Icon
            name="chatbubbles"
            size={20}
            color={selectedTab === 'community' ? '#007AFF' : (isDark ? '#666666' : '#999999')}
          />
          <Text style={[
            styles.tabText,
            {color: isDark ? '#666666' : '#999999'},
            selectedTab === 'community' && {color: '#007AFF', fontWeight: '700'},
          ]}>
            커뮤니티
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'group' && styles.tabActive,
            selectedTab === 'group' && {borderBottomColor: '#007AFF'},
          ]}
          onPress={() => setSelectedTab('group')}>
          <Icon
            name="people"
            size={20}
            color={selectedTab === 'group' ? '#007AFF' : (isDark ? '#666666' : '#999999')}
          />
          <Text style={[
            styles.tabText,
            {color: isDark ? '#666666' : '#999999'},
            selectedTab === 'group' && {color: '#007AFF', fontWeight: '700'},
          ]}>
            모임
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'competition' && styles.tabActive,
            selectedTab === 'competition' && {borderBottomColor: '#007AFF'},
          ]}
          onPress={() => setSelectedTab('competition')}>
          <Icon
            name="trophy"
            size={20}
            color={selectedTab === 'competition' ? '#007AFF' : (isDark ? '#666666' : '#999999')}
          />
          <Text style={[
            styles.tabText,
            {color: isDark ? '#666666' : '#999999'},
            selectedTab === 'competition' && {color: '#007AFF', fontWeight: '700'},
          ]}>
            경쟁
          </Text>
        </TouchableOpacity>
      </View>

      {/* 탭 콘텐츠 */}
      {selectedTab === 'community' && renderCommunity()}
      {selectedTab === 'group' && renderGroup()}
      {selectedTab === 'competition' && renderCompetition()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  // 커뮤니티 스타일
  postsContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  postCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    fontSize: 32,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
  },
  postTime: {
    fontSize: 12,
    marginTop: 2,
  },
  postContent: {
    marginBottom: 12,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  postText: {
    fontSize: 14,
    lineHeight: 20,
  },
  postActions: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  // 모임 스타일
  groupsContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  groupCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  groupThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  groupThumbnailEmoji: {
    fontSize: 28,
  },
  activeBadge: {
    position: 'absolute',
    bottom: -4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  activeBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  groupInfo: {
    flex: 1,
    marginLeft: 16,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 12,
    marginBottom: 8,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  groupMembers: {
    fontSize: 12,
    fontWeight: '600',
  },
  joinButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  createGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  createGroupText: {
    fontSize: 16,
    fontWeight: '700',
  },
  // 경쟁 (준비중) 스타일
  comingSoon: {
    margin: 20,
    marginTop: 60,
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    gap: 16,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  comingSoonText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  comingSoonBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
    marginTop: 8,
  },
  comingSoonBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

export default GroupScreen;
