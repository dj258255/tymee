import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  InteractionManager,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import {useThemeStore} from '../store/themeStore';
import {safeGetColorScheme, safeAddAppearanceListener} from '../utils/appearance';
import Icon from '@react-native-vector-icons/ionicons';
import ProfileCard from '../components/ProfileCard';
import {sp, hp, fp, iconSize} from '../utils/responsive';
import {PanGestureHandler, PanGestureHandlerGestureEvent, State} from 'react-native-gesture-handler';


type TabType = 'community' | 'group';
type BoardCategory = 'all' | 'free' | 'study' | 'qna' | 'tips' | 'anonymous' | 'anon_free';
type GroupDetailTab = 'info' | 'members' | 'board';
type StudyTimeFilter = 'today' | 'week' | 'month';

interface BoardInfo {
  id: BoardCategory;
  name: string;
  icon: string;
  color: string;
  isAnonymous?: boolean;
}

interface UserInfo {
  nickname: string;
  level: number;
  tier: string;
  title: string;
  profileImageUrl?: string;
  isAnonymous?: boolean;
}

interface Post {
  id: string;
  author: UserInfo;
  title: string;
  content: string;
  likes: number;
  comments: number;
  time: string;
  category: BoardCategory;
}

interface GroupMember {
  id: string;
  nickname: string;
  level: number;
  tier?: string;
  profileImageUrl?: string;
  // 공부 시간 (분 단위)
  todayStudyTime?: number;
  weekStudyTime?: number;
  monthStudyTime?: number;
}

interface GroupRoom {
  id: string;
  name: string;
  description: string;
  members: number;
  maxMembers: number;
  thumbnail: string;
  isActive: boolean;
  isJoined?: boolean; // 내가 가입한 그룹 여부
  memberList?: GroupMember[];
  // 상세 정보
  category?: string;
  createdAt?: string;
  leaderName?: string;
  totalStudyTime?: number; // 누적 공부 시간 (분)
  avgDailyTime?: number; // 일평균 공부 시간 (분)
  rules?: string[];
  joinConditions?: string[];
}


const DETAIL_TABS: GroupDetailTab[] = ['info', 'members', 'board'];
const SWIPE_THRESHOLD = 50;

const GroupScreen: React.FC = () => {
  const [systemColorScheme, setSystemColorScheme] = useState<'light' | 'dark'>('light');
  const [selectedTab, setSelectedTab] = useState<TabType>('community');
  const [selectedBoard, setSelectedBoard] = useState<BoardCategory>('all');
  const [selectedGroup, setSelectedGroup] = useState<GroupRoom | null>(null);
  const [groupDetailTab, setGroupDetailTab] = useState<GroupDetailTab>('info');
  const [studyTimeFilter, setStudyTimeFilter] = useState<StudyTimeFilter>('today');
  const swipeTranslateX = useRef(new Animated.Value(0)).current;

  const handleDetailSwipe = (event: PanGestureHandlerGestureEvent) => {
    const {translationX} = event.nativeEvent;
    // 스와이프 중에 살짝 움직이는 피드백
    swipeTranslateX.setValue(translationX * 0.1);
  };

  const handleDetailSwipeEnd = (event: PanGestureHandlerGestureEvent) => {
    const {translationX, state} = event.nativeEvent;

    if (state === State.END) {
      swipeTranslateX.setValue(0);

      const currentIndex = DETAIL_TABS.indexOf(groupDetailTab);

      if (translationX < -SWIPE_THRESHOLD && currentIndex < DETAIL_TABS.length - 1) {
        // 왼쪽으로 스와이프 -> 다음 탭
        setGroupDetailTab(DETAIL_TABS[currentIndex + 1]);
      } else if (translationX > SWIPE_THRESHOLD && currentIndex > 0) {
        // 오른쪽으로 스와이프 -> 이전 탭
        setGroupDetailTab(DETAIL_TABS[currentIndex - 1]);
      }
    }
  };

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

  // 게시판 카테고리 정보
  const boardCategories: BoardInfo[] = [
    {id: 'all', name: '전체', icon: 'apps', color: '#007AFF'},
    {id: 'free', name: '자유', icon: 'chatbubbles', color: '#34C759'},
    {id: 'study', name: '공부인증', icon: 'camera', color: '#FF9500'},
    {id: 'qna', name: 'Q&A', icon: 'help-circle', color: '#AF52DE'},
    {id: 'tips', name: '꿀팁', icon: 'bulb', color: '#FFCC00'},
    {id: 'anonymous', name: '익명고민', icon: 'eye-off', color: '#8E8E93', isAnonymous: true},
    {id: 'anon_free', name: '익명자유', icon: 'chatbox', color: '#636366', isAnonymous: true},
  ];

  // 커뮤니티 게시글 예시 데이터
  const communityPosts: Post[] = [
    {
      id: '1',
      author: {
        nickname: '공부왕',
        level: 35,
        tier: '학사 III',
        title: '열공러',
      },
      title: '오늘 5시간 공부 완료!',
      content: '드디어 목표 달성했어요. 다들 화이팅!',
      likes: 24,
      comments: 8,
      time: '10분 전',
      category: 'study',
    },
    {
      id: '2',
      author: {
        nickname: '열공러',
        level: 48,
        tier: '석사 II',
        title: '꿀팁장인',
      },
      title: '효과적인 암기법 공유',
      content: '제가 사용하는 암기법인데 정말 효과적이에요...',
      likes: 56,
      comments: 15,
      time: '1시간 전',
      category: 'tips',
    },
    {
      id: '3',
      author: {
        nickname: '수험생123',
        level: 22,
        tier: '학사 I',
        title: '집중왕',
      },
      title: '집중력 높이는 방법',
      content: '포모도로 기법으로 집중력이 정말 좋아졌어요!',
      likes: 89,
      comments: 23,
      time: '3시간 전',
      category: 'free',
    },
    {
      id: '4',
      author: {
        nickname: '익명',
        level: 0,
        tier: '',
        title: '',
        isAnonymous: true,
      },
      title: '공부가 너무 힘들어요...',
      content: '요즘 슬럼프가 와서 아무것도 손에 안 잡혀요 ㅠㅠ',
      likes: 45,
      comments: 32,
      time: '2시간 전',
      category: 'anonymous',
    },
    {
      id: '5',
      author: {
        nickname: '궁금이',
        level: 15,
        tier: '고등학생',
        title: '질문왕',
      },
      title: '수학 공부법 추천해주세요',
      content: '수학이 너무 어려워요. 좋은 공부법 있을까요?',
      likes: 12,
      comments: 18,
      time: '4시간 전',
      category: 'qna',
    },
    {
      id: '6',
      author: {
        nickname: '익명',
        level: 0,
        tier: '',
        title: '',
        isAnonymous: true,
      },
      title: '오늘 있었던 일...',
      content: '그냥 아무말이나 하고 싶어서 씁니다',
      likes: 8,
      comments: 5,
      time: '5시간 전',
      category: 'anon_free',
    },
  ];

  // 선택된 게시판에 따라 게시글 필터링
  const filteredPosts = selectedBoard === 'all'
    ? communityPosts
    : communityPosts.filter(post => post.category === selectedBoard);

  // 게시판 카테고리 정보 가져오기
  const getCategoryInfo = (categoryId: BoardCategory): BoardInfo => {
    return boardCategories.find(b => b.id === categoryId) || boardCategories[0];
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

  // 모임방 예시 데이터
  const groupRooms: GroupRoom[] = [
    {
      id: '0',
      name: '정보처리기사 합격반',
      description: '정보처리기사 필기/실기 함께 준비해요!',
      members: 12,
      maxMembers: 20,
      thumbnail: '💻',
      isActive: true,
      isJoined: true, // 내가 가입한 그룹
      category: '자격증',
      createdAt: '2024.11.01',
      leaderName: 'IT마스터',
      totalStudyTime: 18500,
      avgDailyTime: 150,
      rules: [
        '매일 최소 2시간 공부 인증',
        '기출문제 풀이 공유 필수',
        '질문에 성실히 답변하기',
        '시험 일정 공유하기',
      ],
      joinConditions: [
        '정보처리기사 준비 중인 분',
        '꾸준히 공부할 의지가 있는 분',
      ],
      memberList: [
        {id: 'm0', nickname: 'IT마스터', level: 48, tier: '석사 II', todayStudyTime: 180, weekStudyTime: 1120, monthStudyTime: 4800},
        {id: 'm1', nickname: '코딩왕', level: 35, tier: '석사 I', todayStudyTime: 150, weekStudyTime: 980, monthStudyTime: 4200},
        {id: 'm2', nickname: '알고리즘', level: 30, tier: '학사 III', todayStudyTime: 120, weekStudyTime: 840, monthStudyTime: 3600},
        {id: 'm3', nickname: '데이터베이스', level: 28, tier: '학사 III', todayStudyTime: 90, weekStudyTime: 720, monthStudyTime: 3000},
        {id: 'm4', nickname: '네트워크', level: 25, tier: '학사 II', todayStudyTime: 100, weekStudyTime: 680, monthStudyTime: 2800},
        {id: 'm5', nickname: '보안전문', level: 32, tier: '학사 III', todayStudyTime: 140, weekStudyTime: 900, monthStudyTime: 3900},
        {id: 'm6', nickname: '개발자꿈', level: 20, tier: '학사 I', todayStudyTime: 80, weekStudyTime: 560, monthStudyTime: 2400},
        {id: 'm7', nickname: '기사합격', level: 40, tier: '석사 I', todayStudyTime: 160, weekStudyTime: 1050, monthStudyTime: 4500},
        {id: 'm8', nickname: 'SQL고수', level: 27, tier: '학사 II', todayStudyTime: 110, weekStudyTime: 750, monthStudyTime: 3200},
        {id: 'm9', nickname: '프로그래머', level: 33, tier: '석사 I', todayStudyTime: 130, weekStudyTime: 880, monthStudyTime: 3800},
        {id: 'm10', nickname: '나', level: 22, tier: '학사 II', todayStudyTime: 95, weekStudyTime: 620, monthStudyTime: 2600},
        {id: 'm11', nickname: '정처기도전', level: 18, tier: '학사 I', todayStudyTime: 70, weekStudyTime: 480, monthStudyTime: 2000},
      ],
    },
    {
      id: '1',
      name: '아침 7시 스터디',
      description: '매일 아침 7시에 함께 공부해요',
      members: 8,
      maxMembers: 10,
      thumbnail: '🌅',
      isActive: true,
      category: '공시/취업',
      createdAt: '2024.10.15',
      leaderName: '공부왕',
      totalStudyTime: 12450,
      avgDailyTime: 180,
      rules: [
        '매일 아침 7시 출석 필수',
        '인증샷 하루 1회 이상 업로드',
        '무단 결석 3회 시 자동 퇴장',
        '서로 존중하는 대화',
      ],
      joinConditions: [
        '레벨 20 이상',
        '주 5일 이상 활동 가능',
        '아침형 인간',
      ],
      memberList: [
        {id: 'm1', nickname: '공부왕', level: 42, tier: '석사 II', todayStudyTime: 185, weekStudyTime: 1260, monthStudyTime: 5400},
        {id: 'm2', nickname: '열공이', level: 35, tier: '석사 I', todayStudyTime: 120, weekStudyTime: 980, monthStudyTime: 4200},
        {id: 'm3', nickname: '새벽형', level: 28, tier: '학사 III', todayStudyTime: 90, weekStudyTime: 720, monthStudyTime: 3100},
        {id: 'm4', nickname: '일찍이', level: 31, tier: '학사 III', todayStudyTime: 150, weekStudyTime: 840, monthStudyTime: 3600},
        {id: 'm5', nickname: '모닝콜', level: 25, tier: '학사 II', todayStudyTime: 60, weekStudyTime: 540, monthStudyTime: 2400},
        {id: 'm6', nickname: '해뜨미', level: 38, tier: '석사 I', todayStudyTime: 200, weekStudyTime: 1100, monthStudyTime: 4800},
        {id: 'm7', nickname: '새벽별', level: 22, tier: '학사 I', todayStudyTime: 45, weekStudyTime: 420, monthStudyTime: 1800},
        {id: 'm8', nickname: '아침햇살', level: 29, tier: '학사 III', todayStudyTime: 110, weekStudyTime: 680, monthStudyTime: 2900},
      ],
    },
    {
      id: '2',
      name: '수능 D-100 파이팅',
      description: '수능까지 함께 달려요!',
      members: 15,
      maxMembers: 20,
      thumbnail: '📚',
      isActive: true,
      category: '수능/입시',
      createdAt: '2024.08.01',
      leaderName: '수능천재',
      totalStudyTime: 28900,
      avgDailyTime: 240,
      rules: [
        '매일 최소 4시간 공부 인증',
        '서로 응원하는 댓글 달기',
        '수능 관련 정보 공유',
      ],
      joinConditions: [
        '고3 또는 N수생',
        '수능까지 열심히 달릴 각오',
      ],
      memberList: [
        {id: 'm4', nickname: '수능천재', level: 55, tier: '박사', todayStudyTime: 300, weekStudyTime: 1680, monthStudyTime: 7200},
        {id: 'm5', nickname: '국영수', level: 38, tier: '석사 I', todayStudyTime: 240, weekStudyTime: 1400, monthStudyTime: 6000},
        {id: 'm6', nickname: '파이팅', level: 22, tier: '학사 II', todayStudyTime: 180, weekStudyTime: 1050, monthStudyTime: 4500},
        {id: 'm7', nickname: '대학가자', level: 18, tier: '고등학생', todayStudyTime: 210, weekStudyTime: 1260, monthStudyTime: 5400},
      ],
    },
    {
      id: '3',
      name: '영어 회화 스터디',
      description: '영어로만 대화하는 스터디',
      members: 6,
      maxMembers: 8,
      thumbnail: '🗣️',
      isActive: false,
      category: '어학',
      createdAt: '2024.09.20',
      leaderName: '토익왕',
      totalStudyTime: 5600,
      avgDailyTime: 90,
      rules: [
        '모임 내 영어로만 대화',
        '주 3회 이상 참여',
      ],
      joinConditions: [
        '토익 700점 이상 또는 동등 수준',
        '영어 회화에 관심 있는 분',
      ],
      memberList: [
        {id: 'm8', nickname: '토익왕', level: 45, tier: '석사 II', todayStudyTime: 75, weekStudyTime: 450, monthStudyTime: 1800},
        {id: 'm9', nickname: 'English', level: 32, tier: '학사 III', todayStudyTime: 60, weekStudyTime: 380, monthStudyTime: 1500},
        {id: 'm10', nickname: '영어맨', level: 28, tier: '학사 II', todayStudyTime: 45, weekStudyTime: 320, monthStudyTime: 1200},
        {id: 'm11', nickname: '스피킹', level: 35, tier: '학사 III', todayStudyTime: 90, weekStudyTime: 520, monthStudyTime: 2100},
        {id: 'm12', nickname: '리스닝', level: 22, tier: '학사 I', todayStudyTime: 30, weekStudyTime: 280, monthStudyTime: 1100},
        {id: 'm13', nickname: '영작러', level: 40, tier: '석사 I', todayStudyTime: 100, weekStudyTime: 600, monthStudyTime: 2400},
      ],
    },
  ];

  // 모임 게시판 예시 데이터 (타입을 BoardPost로 변경하여 GroupPost와 구분)
  interface BoardPost {
    id: string;
    authorNickname: string;
    authorLevel?: number;
    authorTier?: string;
    title: string;
    content: string;
    time: string;
    isPinned: boolean;
    likes: number;
    comments: number;
  }

  const boardPosts: BoardPost[] = [
    {id: 'p1', authorNickname: '공부왕', authorLevel: 42, authorTier: '석사 II', title: '이번 주 공부 목표 공유해요!', content: '저는 이번 주 수학 2단원 끝내기가 목표입니다.', time: '1시간 전', isPinned: true, likes: 8, comments: 12},
    {id: 'p2', authorNickname: '공부왕', authorLevel: 42, authorTier: '석사 II', title: '모임 규칙 안내', content: '새로 오신 분들을 위해 규칙 안내드립니다. 반드시 읽어주세요!', time: '1일 전', isPinned: true, likes: 15, comments: 3},
    {id: 'p3', authorNickname: '열공이', authorLevel: 35, authorTier: '석사 I', title: '오늘 공부 인증합니다', content: '오늘 4시간 공부 완료!', time: '2시간 전', isPinned: false, likes: 15, comments: 5},
    {id: 'p4', authorNickname: '새벽형', authorLevel: 28, authorTier: '학사 III', title: '좋은 강의 추천', content: '이 강의 진짜 좋아요 추천드립니다', time: '3시간 전', isPinned: false, likes: 22, comments: 8},
    {id: 'p5', authorNickname: '모닝콜', authorLevel: 25, authorTier: '학사 II', title: '질문있어요!', content: '이 문제 어떻게 푸나요?', time: '5시간 전', isPinned: false, likes: 3, comments: 7},
  ];

  // 게시글 정렬: 핀 고정된 것 먼저, 그 다음 시간순
  const sortedBoardPosts = [...boardPosts].sort((a, b) => {
    if (a.isPinned && !b.isPinned) {return -1;}
    if (!a.isPinned && b.isPinned) {return 1;}
    return 0;
  });

  const renderCommunity = () => (
    <View style={styles.tabContent}>
      {/* 게시판 카테고리 탭 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.boardTabs, {backgroundColor: isDark ? '#1A1A1A' : '#F8F8F8'}]}
        contentContainerStyle={styles.boardTabsContent}>
        {boardCategories.map(board => {
          const isSelected = selectedBoard === board.id;
          return (
            <TouchableOpacity
              key={board.id}
              style={[
                styles.boardTab,
                isSelected && styles.boardTabSelected,
                isSelected && {backgroundColor: board.color + '20', borderColor: board.color},
              ]}
              onPress={() => setSelectedBoard(board.id)}>
              <Icon
                name={board.icon as any}
                size={iconSize(16)}
                color={isSelected ? board.color : (isDark ? '#888888' : '#666666')}
              />
              <Text style={[
                styles.boardTabText,
                {color: isDark ? '#888888' : '#666666'},
                isSelected && {color: board.color, fontWeight: '700'},
              ]}>
                {board.name}
              </Text>
              {board.isAnonymous && (
                <View style={[styles.anonymousBadge, {backgroundColor: board.color}]}>
                  <Text style={styles.anonymousBadgeText}>익명</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 게시글 목록 */}
      <ScrollView
        style={styles.postsScrollView}
        contentContainerStyle={{paddingBottom: 100}}
        showsVerticalScrollIndicator={false}>
        <View style={styles.postsContainer}>
          {filteredPosts.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="document-text-outline" size={iconSize(48)} color={isDark ? '#3A3A3A' : '#E0E0E0'} />
              <Text style={[styles.emptyStateText, {color: isDark ? '#666666' : '#999999'}]}>
                아직 게시글이 없어요
              </Text>
            </View>
          ) : (
            filteredPosts.map(post => {
              const categoryInfo = getCategoryInfo(post.category);
              return (
                <TouchableOpacity
                  key={post.id}
                  style={[styles.postCard, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
                  {/* 카테고리 뱃지 */}
                  <View style={[styles.categoryBadge, {backgroundColor: categoryInfo.color + '20'}]}>
                    <Icon name={categoryInfo.icon as any} size={iconSize(12)} color={categoryInfo.color} />
                    <Text style={[styles.categoryBadgeText, {color: categoryInfo.color}]}>
                      {categoryInfo.name}
                    </Text>
                  </View>

                  {/* 작성자 정보 */}
                  <View style={styles.postHeader}>
                    <View style={styles.authorInfo}>
                      <ProfileCard
                        isDark={isDark}
                        size="mini"
                        user={post.author}
                        hideFrame
                      />
                    </View>
                    <View style={styles.postHeaderRight}>
                      <Text style={[styles.postTime, {color: isDark ? '#666666' : '#999999'}]}>
                        {post.time}
                      </Text>
                      <TouchableOpacity>
                        <Icon name="ellipsis-horizontal" size={iconSize(20)} color={isDark ? '#999999' : '#666666'} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* 게시글 내용 */}
                  <View style={styles.postContent}>
                    <Text style={[styles.postTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                      {post.title}
                    </Text>
                    <Text style={[styles.postText, {color: isDark ? '#CCCCCC' : '#666666'}]} numberOfLines={2}>
                      {post.content}
                    </Text>
                  </View>

                  {/* 좋아요/댓글 */}
                  <View style={styles.postActions}>
                    <TouchableOpacity style={styles.actionButton}>
                      <Icon name="heart-outline" size={iconSize(18)} color={isDark ? '#999999' : '#666666'} />
                      <Text style={[styles.actionText, {color: isDark ? '#999999' : '#666666'}]}>
                        {post.likes}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                      <Icon name="chatbubble-outline" size={iconSize(18)} color={isDark ? '#999999' : '#666666'} />
                      <Text style={[styles.actionText, {color: isDark ? '#999999' : '#666666'}]}>
                        {post.comments}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* 글쓰기 버튼 */}
      <TouchableOpacity style={[styles.fab, {backgroundColor: getCategoryInfo(selectedBoard).color}]}>
        <Icon name="create" size={iconSize(24)} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  // 시간 포맷팅 함수
  const formatStudyTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}시간 ${mins}분`;
    }
    return `${mins}분`;
  };

  // 모임 상세보기 렌더링
  const renderGroupDetail = () => {
    if (!selectedGroup) {return null;}

    return (
      <View style={styles.tabContent}>
        {/* 헤더 */}
        <View style={[styles.detailHeader, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setSelectedGroup(null);
              setGroupDetailTab('info');
            }}>
            <Icon name="arrow-back" size={iconSize(24)} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
          </TouchableOpacity>
          <View style={styles.detailHeaderInfo}>
            <Text style={styles.detailThumbnail}>{selectedGroup.thumbnail}</Text>
            <View>
              <Text style={[styles.detailTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                {selectedGroup.name}
              </Text>
              <Text style={[styles.detailSubtitle, {color: isDark ? '#999999' : '#666666'}]}>
                {selectedGroup.members}/{selectedGroup.maxMembers}명 참여중
              </Text>
            </View>
          </View>
          <TouchableOpacity>
            <Icon name="ellipsis-vertical" size={iconSize(20)} color={isDark ? '#999999' : '#666666'} />
          </TouchableOpacity>
        </View>

        {/* 탭 */}
        <View style={[styles.detailTabs, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
          {[
            {id: 'info' as GroupDetailTab, label: '정보', icon: 'information-circle-outline'},
            {id: 'members' as GroupDetailTab, label: '멤버', icon: 'people-outline'},
            {id: 'board' as GroupDetailTab, label: '게시판', icon: 'chatbubbles-outline'},
          ].map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.detailTab,
                groupDetailTab === tab.id && styles.detailTabActive,
                groupDetailTab === tab.id && {borderBottomColor: '#007AFF'},
              ]}
              onPress={() => setGroupDetailTab(tab.id)}>
              <Icon
                name={tab.icon as any}
                size={iconSize(18)}
                color={groupDetailTab === tab.id ? '#007AFF' : (isDark ? '#666666' : '#999999')}
              />
              <Text style={[
                styles.detailTabText,
                {color: isDark ? '#666666' : '#999999'},
                groupDetailTab === tab.id && {color: '#007AFF', fontWeight: '700'},
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 탭 콘텐츠 - 스와이프로 탭 전환 */}
        <PanGestureHandler
          onGestureEvent={handleDetailSwipe}
          onHandlerStateChange={handleDetailSwipeEnd}
          minDist={20}>
          <Animated.View style={{flex: 1, transform: [{translateX: swipeTranslateX}]}}>
            <ScrollView
              style={styles.detailContent}
              contentContainerStyle={{padding: sp(16), paddingBottom: hp(100)}}
              showsVerticalScrollIndicator={false}>

          {groupDetailTab === 'info' && (
            <>
              {/* 모임 정보 카드 */}
              <View style={[styles.infoCard, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
                <View style={styles.infoCardHeader}>
                  <Icon name="information-circle" size={iconSize(20)} color="#007AFF" />
                  <Text style={[styles.infoCardTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                    모임 정보
                  </Text>
                </View>
                <View style={styles.infoCardContent}>
                  <View style={[styles.infoItemCard, {borderColor: isDark ? '#2A2A2A' : '#E8E8E8'}]}>
                    <Text style={[styles.infoItemLabel, {color: isDark ? '#999999' : '#666666'}]}>카테고리</Text>
                    <Text style={[styles.infoItemValue, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>{selectedGroup.category}</Text>
                  </View>
                  <View style={[styles.infoItemCard, {borderColor: isDark ? '#2A2A2A' : '#E8E8E8'}]}>
                    <Text style={[styles.infoItemLabel, {color: isDark ? '#999999' : '#666666'}]}>개설일</Text>
                    <Text style={[styles.infoItemValue, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>{selectedGroup.createdAt}</Text>
                  </View>
                  <View style={[styles.infoItemCard, {borderColor: isDark ? '#2A2A2A' : '#E8E8E8'}]}>
                    <Text style={[styles.infoItemLabel, {color: isDark ? '#999999' : '#666666'}]}>모임장</Text>
                    <Text style={[styles.infoItemValue, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>{selectedGroup.leaderName}</Text>
                  </View>
                  <View style={[styles.infoItemCard, {borderColor: isDark ? '#2A2A2A' : '#E8E8E8'}]}>
                    <Text style={[styles.infoItemLabel, {color: isDark ? '#999999' : '#666666'}]}>소개</Text>
                    <Text style={[styles.infoItemValue, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>{selectedGroup.description}</Text>
                  </View>
                </View>
              </View>

              {/* 모임 통계 카드 */}
              <View style={[styles.infoCard, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
                <View style={styles.infoCardHeader}>
                  <Icon name="stats-chart" size={iconSize(20)} color="#4CAF50" />
                  <Text style={[styles.infoCardTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                    모임 통계
                  </Text>
                </View>
                <View style={styles.statsGrid}>
                  <View style={[styles.statItemCard, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderColor: isDark ? '#2A2A2A' : '#E8E8E8'}]}>
                    <Icon name="people" size={iconSize(24)} color="#2196F3" />
                    <Text style={[styles.statValue, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                      {selectedGroup.members}/{selectedGroup.maxMembers}
                    </Text>
                    <Text style={[styles.statLabel, {color: isDark ? '#999999' : '#666666'}]}>멤버</Text>
                  </View>
                  <View style={[styles.statItemCard, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderColor: isDark ? '#2A2A2A' : '#E8E8E8'}]}>
                    <Icon name="time-outline" size={iconSize(24)} color="#4CAF50" />
                    <Text style={[styles.statValue, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                      {formatStudyTime(selectedGroup.totalStudyTime || 0)}
                    </Text>
                    <Text style={[styles.statLabel, {color: isDark ? '#999999' : '#666666'}]}>총 공부시간</Text>
                  </View>
                </View>
                <View style={styles.statsGrid}>
                  <View style={[styles.statItemCard, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderColor: isDark ? '#2A2A2A' : '#E8E8E8'}]}>
                    <Icon name="flame" size={iconSize(24)} color="#FF9800" />
                    <Text style={[styles.statValue, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                      {formatStudyTime((selectedGroup.avgDailyTime || 0) * 7)}
                    </Text>
                    <Text style={[styles.statLabel, {color: isDark ? '#999999' : '#666666'}]}>이번 주</Text>
                  </View>
                  <View style={[styles.statItemCard, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderColor: isDark ? '#2A2A2A' : '#E8E8E8'}]}>
                    <Icon name="trending-up" size={iconSize(24)} color="#E91E63" />
                    <Text style={[styles.statValue, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                      {formatStudyTime(selectedGroup.avgDailyTime || 0)}
                    </Text>
                    <Text style={[styles.statLabel, {color: isDark ? '#999999' : '#666666'}]}>평균/주</Text>
                  </View>
                </View>
              </View>

              {/* 모임 규칙 카드 */}
              <View style={[styles.infoCard, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
                <View style={styles.infoCardHeader}>
                  <Icon name="shield-checkmark" size={iconSize(20)} color="#FF5722" />
                  <Text style={[styles.infoCardTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                    모임 규칙
                  </Text>
                </View>
                <View style={styles.rulesList}>
                  {selectedGroup.rules?.map((rule, index) => (
                    <View key={index} style={styles.ruleItem}>
                      <View style={[styles.ruleBullet, {backgroundColor: '#FF5722'}]}>
                        <Text style={styles.ruleBulletText}>{index + 1}</Text>
                      </View>
                      <Text style={[styles.ruleText, {color: isDark ? '#CCCCCC' : '#333333'}]}>{rule}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* 가입 조건 카드 */}
              <View style={[styles.infoCard, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
                <View style={styles.infoCardHeader}>
                  <Icon name="checkmark-circle" size={iconSize(20)} color="#4CAF50" />
                  <Text style={[styles.infoCardTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                    가입 조건
                  </Text>
                </View>
                <View style={styles.conditionsList}>
                  {selectedGroup.joinConditions?.map((condition, index) => (
                    <View key={index} style={styles.conditionItem}>
                      <Icon name="checkmark" size={iconSize(16)} color="#4CAF50" />
                      <Text style={[styles.conditionText, {color: isDark ? '#CCCCCC' : '#333333'}]}>{condition}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}

          {groupDetailTab === 'members' && (
            <>
              {/* 그룹 평균 통계 카드 */}
              {(() => {
                const members = selectedGroup.memberList || [];
                const memberCount = members.length;
                const avgToday = memberCount > 0
                  ? Math.round(members.reduce((sum, m) => sum + (m.todayStudyTime || 0), 0) / memberCount)
                  : 0;
                const avgWeek = memberCount > 0
                  ? Math.round(members.reduce((sum, m) => sum + (m.weekStudyTime || 0), 0) / memberCount)
                  : 0;
                const avgMonth = memberCount > 0
                  ? Math.round(members.reduce((sum, m) => sum + (m.monthStudyTime || 0), 0) / memberCount)
                  : 0;
                const avgValue = studyTimeFilter === 'today' ? avgToday : studyTimeFilter === 'week' ? avgWeek : avgMonth;
                return (
                  <View style={[styles.groupAverageCard, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
                    <View style={styles.groupAverageHeader}>
                      <Icon name="stats-chart" size={iconSize(18)} color="#007AFF" />
                      <Text style={[styles.groupAverageTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                        모임 평균 공부시간
                      </Text>
                    </View>
                    {/* 필터 선택 탭 */}
                    <View style={styles.studyTimeFilterTabs}>
                      {[
                        {id: 'today' as StudyTimeFilter, label: '오늘'},
                        {id: 'week' as StudyTimeFilter, label: '이번주'},
                        {id: 'month' as StudyTimeFilter, label: '이번달'},
                      ].map((filter) => (
                        <TouchableOpacity
                          key={filter.id}
                          style={[
                            styles.studyTimeFilterTab,
                            {
                              backgroundColor: studyTimeFilter === filter.id
                                ? '#007AFF'
                                : isDark ? '#333333' : '#F0F0F0',
                            },
                          ]}
                          onPress={() => setStudyTimeFilter(filter.id)}>
                          <Text
                            style={[
                              styles.studyTimeFilterTabText,
                              {
                                color: studyTimeFilter === filter.id
                                  ? '#FFFFFF'
                                  : isDark ? '#AAAAAA' : '#666666',
                              },
                            ]}>
                            {filter.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {/* 평균 시간 표시 */}
                    <View style={styles.groupAverageValue}>
                      <Text style={[styles.groupAvgBigValue, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                        {formatStudyTime(avgValue)}
                      </Text>
                    </View>
                  </View>
                );
              })()}

              {/* 멤버 목록 */}
              <View style={[styles.membersList, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
                {selectedGroup.memberList?.map((member, index) => {
                  const tierStyle = getTierStyle(member.tier);
                  const isLeader = member.nickname === selectedGroup.leaderName;
                  return (
                    <React.Fragment key={member.id}>
                      <View style={styles.memberItemExpanded}>
                        <View style={styles.memberTop}>
                          <View style={styles.memberLeft}>
                            <View style={[
                              styles.memberAvatar,
                              {backgroundColor: tierStyle.color},
                            ]}>
                              <Icon name="person" size={iconSize(20)} color="#FFFFFF" />
                              {isLeader && (
                                <View style={styles.leaderBadge}>
                                  <Icon name="star" size={iconSize(10)} color="#FFD700" />
                                </View>
                              )}
                            </View>
                            <View style={styles.memberInfo}>
                              <View style={styles.memberNameRow}>
                                <Text style={[styles.memberName, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                                  {member.nickname}
                                </Text>
                                {isLeader && (
                                  <View style={[styles.leaderTag, {backgroundColor: '#FFD700'}]}>
                                    <Text style={styles.leaderTagText}>모임장</Text>
                                  </View>
                                )}
                              </View>
                              <Text style={[styles.memberLevel, {color: tierStyle.color}]}>
                                Lv.{member.level} • {member.tier}
                              </Text>
                            </View>
                          </View>
                          <TouchableOpacity>
                            <Icon name="ellipsis-horizontal" size={iconSize(20)} color={isDark ? '#666666' : '#AAAAAA'} />
                          </TouchableOpacity>
                        </View>
                        {/* 멤버 공부시간 표시 - 필터에 따라 하나만 */}
                        <View style={[styles.memberStudyTimeSingle, {backgroundColor: isDark ? '#252525' : '#F5F5F5'}]}>
                          <Text style={[styles.memberStudyTimeValue, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                            {formatStudyTime(
                              studyTimeFilter === 'today' ? (member.todayStudyTime || 0) :
                              studyTimeFilter === 'week' ? (member.weekStudyTime || 0) :
                              (member.monthStudyTime || 0)
                            )}
                          </Text>
                        </View>
                      </View>
                      {index < (selectedGroup.memberList?.length || 0) - 1 && (
                        <View style={[styles.memberDivider, {backgroundColor: isDark ? '#2A2A2A' : '#E0E0E0'}]} />
                      )}
                    </React.Fragment>
                  );
                })}
              </View>
            </>
          )}

          {groupDetailTab === 'board' && (
            <>
              {/* 고정된 게시글이 있으면 먼저 표시 */}
              {sortedBoardPosts.filter(p => p.isPinned).length > 0 && (
                <View style={[styles.pinnedSection, {backgroundColor: isDark ? '#1A1A1A' : '#F8F8F8'}]}>
                  <View style={styles.pinnedSectionHeader}>
                    <Icon name="pin" size={iconSize(16)} color="#FF9800" />
                    <Text style={[styles.pinnedSectionTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                      고정 게시글
                    </Text>
                  </View>
                  {sortedBoardPosts.filter(p => p.isPinned).map(post => {
                    const postTierStyle = getTierStyle(post.authorTier);
                    return (
                      <TouchableOpacity
                        key={post.id}
                        style={[styles.boardPostCard, styles.pinnedPostCard, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
                        <View style={styles.boardPostHeader}>
                          <View style={styles.boardPostAuthorInfo}>
                            {/* 작성자 아바타 */}
                            <View style={[styles.boardPostAvatar, {borderColor: postTierStyle.color}]}>
                              <Icon name="person" size={iconSize(14)} color="#9E9E9E" />
                              {post.authorLevel && (
                                <View style={[styles.boardPostLevelBadge, {backgroundColor: postTierStyle.color}]}>
                                  <Text style={styles.boardPostLevelText}>{post.authorLevel}</Text>
                                </View>
                              )}
                            </View>
                            <View>
                              <Text style={[styles.boardPostAuthorName, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                                {post.authorNickname}
                              </Text>
                              {post.authorTier && (
                                <View style={[styles.boardPostTierBadge, {backgroundColor: postTierStyle.bgColor}]}>
                                  <Text style={[styles.boardPostTierText, {color: postTierStyle.color}]}>
                                    {post.authorTier}
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                          </View>
                        <View style={styles.pinnedTitleRow}>
                          <View style={[styles.pinnedTag, {backgroundColor: '#FF9800'}]}>
                            <Icon name="pin" size={iconSize(10)} color="#FFFFFF" />
                            <Text style={styles.pinnedTagText}>고정됨</Text>
                          </View>
                          <Text style={[styles.boardPostTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A', flex: 1}]}>
                            {post.title}
                          </Text>
                        </View>
                        <Text style={[styles.boardPostContent, {color: isDark ? '#AAAAAA' : '#666666'}]} numberOfLines={2}>
                          {post.content}
                        </Text>
                        <View style={styles.boardPostMeta}>
                          <Text style={[styles.boardPostTime, {color: isDark ? '#666666' : '#AAAAAA'}]}>
                            {post.time}
                          </Text>
                          <View style={styles.boardPostStats}>
                            <View style={styles.boardPostStat}>
                              <Icon name="heart-outline" size={iconSize(14)} color={isDark ? '#666666' : '#AAAAAA'} />
                              <Text style={[styles.boardPostStatText, {color: isDark ? '#666666' : '#AAAAAA'}]}>{post.likes}</Text>
                            </View>
                            <View style={styles.boardPostStat}>
                              <Icon name="chatbubble-outline" size={iconSize(14)} color={isDark ? '#666666' : '#AAAAAA'} />
                              <Text style={[styles.boardPostStatText, {color: isDark ? '#666666' : '#AAAAAA'}]}>{post.comments}</Text>
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* 일반 게시글 */}
              {sortedBoardPosts.filter(p => !p.isPinned).map(post => {
                const postTierStyle = getTierStyle(post.authorTier);
                return (
                  <TouchableOpacity
                    key={post.id}
                    style={[styles.boardPostCard, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
                    <View style={styles.boardPostHeader}>
                      <View style={styles.boardPostAuthorInfo}>
                        {/* 작성자 아바타 */}
                        <View style={[styles.boardPostAvatar, {borderColor: postTierStyle.color}]}>
                          <Icon name="person" size={iconSize(14)} color="#9E9E9E" />
                          {post.authorLevel && (
                            <View style={[styles.boardPostLevelBadge, {backgroundColor: postTierStyle.color}]}>
                              <Text style={styles.boardPostLevelText}>{post.authorLevel}</Text>
                            </View>
                          )}
                        </View>
                        <View>
                          <Text style={[styles.boardPostAuthorName, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                            {post.authorNickname}
                          </Text>
                          {post.authorTier && (
                            <View style={[styles.boardPostTierBadge, {backgroundColor: postTierStyle.bgColor}]}>
                              <Text style={[styles.boardPostTierText, {color: postTierStyle.color}]}>
                                {post.authorTier}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <TouchableOpacity>
                        <Icon name="ellipsis-horizontal" size={iconSize(18)} color={isDark ? '#666666' : '#AAAAAA'} />
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.boardPostTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                      {post.title}
                    </Text>
                    <Text style={[styles.boardPostContent, {color: isDark ? '#AAAAAA' : '#666666'}]} numberOfLines={2}>
                      {post.content}
                    </Text>
                    <View style={styles.boardPostMeta}>
                      <Text style={[styles.boardPostTime, {color: isDark ? '#666666' : '#AAAAAA'}]}>
                        {post.time}
                      </Text>
                      <View style={styles.boardPostStats}>
                        <View style={styles.boardPostStat}>
                          <Icon name="heart-outline" size={iconSize(14)} color={isDark ? '#666666' : '#AAAAAA'} />
                          <Text style={[styles.boardPostStatText, {color: isDark ? '#666666' : '#AAAAAA'}]}>{post.likes}</Text>
                        </View>
                        <View style={styles.boardPostStat}>
                          <Icon name="chatbubble-outline" size={iconSize(14)} color={isDark ? '#666666' : '#AAAAAA'} />
                          <Text style={[styles.boardPostStatText, {color: isDark ? '#666666' : '#AAAAAA'}]}>{post.comments}</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}
            </ScrollView>
          </Animated.View>
        </PanGestureHandler>

        {/* 글쓰기 플로팅 버튼 - 게시판 탭일 때만 표시 */}
        {groupDetailTab === 'board' && (
          <TouchableOpacity style={[styles.fab, {backgroundColor: '#007AFF'}]}>
            <Icon name="create" size={iconSize(24)} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderGroup = () => {
    const myGroups = groupRooms.filter(room => room.isJoined);
    const otherGroups = groupRooms.filter(room => !room.isJoined);

    return (
    <ScrollView style={styles.tabContent} contentContainerStyle={{paddingBottom: 100}} showsVerticalScrollIndicator={false}>
      {/* 내가 가입한 모임 */}
      {myGroups.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Icon name="checkmark-circle" size={iconSize(18)} color="#4CAF50" />
            <Text style={[styles.sectionTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
              내 모임
            </Text>
          </View>
          <View style={styles.groupsContainer}>
            {myGroups.map(room => (
              <TouchableOpacity
                key={room.id}
                style={[styles.groupCard, styles.myGroupCard, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderColor: '#4CAF50'}]}
                onPress={() => setSelectedGroup(room)}>
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

                  {/* 멤버 프로필 */}
                  {room.memberList && room.memberList.length > 0 && (
                    <View style={styles.memberAvatars}>
                      {room.memberList.slice(0, 4).map((member, idx) => {
                        const memberTierStyle = getTierStyle(member.tier);
                        return (
                          <View
                            key={member.id}
                            style={[
                              styles.memberAvatarContainer,
                              {marginLeft: idx > 0 ? -sp(8) : 0, zIndex: room.memberList!.length - idx},
                            ]}>
                            <View style={[
                              styles.memberAvatarBorder,
                              {
                                borderColor: memberTierStyle.color,
                                shadowColor: memberTierStyle.color,
                              },
                            ]}>
                              <View style={[
                                styles.memberAvatarInner,
                                {backgroundColor: '#E0E0E0'},
                              ]}>
                                <Icon
                                  name="person"
                                  size={iconSize(14)}
                                  color="#9E9E9E"
                                />
                              </View>
                            </View>
                            <View style={[styles.memberLevelBadge, {backgroundColor: memberTierStyle.color}]}>
                              <Text style={styles.memberLevelText}>{member.level}</Text>
                            </View>
                          </View>
                        );
                      })}
                      {room.members > 4 && (
                        <View style={[styles.memberMoreBadge, {backgroundColor: isDark ? '#3A3A3A' : '#E0E0E0'}]}>
                          <Text style={[styles.memberMoreText, {color: isDark ? '#FFFFFF' : '#666666'}]}>
                            +{room.members - 4}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* 멤버 수 */}
                  <View style={styles.groupMeta}>
                    <Icon name="people" size={iconSize(16)} color={isDark ? '#999999' : '#666666'} />
                    <Text style={[styles.groupMembers, {color: isDark ? '#999999' : '#666666'}]}>
                      {room.members}/{room.maxMembers}명
                    </Text>
                  </View>
                </View>

                {/* 입장 버튼 */}
                <TouchableOpacity style={[styles.joinButton, {backgroundColor: '#4CAF50'}]}>
                  <Text style={styles.joinButtonText}>입장</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* 다른 모임 */}
      <View style={styles.sectionHeader}>
        <Icon name="people" size={iconSize(18)} color={isDark ? '#999999' : '#666666'} />
        <Text style={[styles.sectionTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
          추천 모임
        </Text>
      </View>
      <View style={styles.groupsContainer}>
        {otherGroups.map(room => (
          <TouchableOpacity
            key={room.id}
            style={[styles.groupCard, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}
            onPress={() => setSelectedGroup(room)}>
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

              {/* 멤버 프로필 (사각형, 티어 테두리, 우상단 레벨) */}
              {room.memberList && room.memberList.length > 0 && (
                <View style={styles.memberAvatars}>
                  {room.memberList.slice(0, 4).map((member, idx) => {
                    const memberTierStyle = getTierStyle(member.tier);
                    return (
                      <View
                        key={member.id}
                        style={[
                          styles.memberAvatarContainer,
                          {marginLeft: idx > 0 ? -sp(8) : 0, zIndex: room.memberList!.length - idx},
                        ]}>
                        <View style={[
                          styles.memberAvatarBorder,
                          {
                            borderColor: memberTierStyle.color,
                            shadowColor: memberTierStyle.color,
                          },
                        ]}>
                          <View style={[
                            styles.memberAvatarInner,
                            {backgroundColor: '#E0E0E0'},
                          ]}>
                            <Icon
                              name="person"
                              size={iconSize(14)}
                              color="#9E9E9E"
                            />
                          </View>
                        </View>
                        {/* 레벨 뱃지 (우상단) */}
                        <View style={[styles.memberLevelBadge, {backgroundColor: memberTierStyle.color}]}>
                          <Text style={styles.memberLevelText}>{member.level}</Text>
                        </View>
                      </View>
                    );
                  })}
                  {room.members > 4 && (
                    <View style={[styles.memberMoreBadge, {backgroundColor: isDark ? '#3A3A3A' : '#E0E0E0'}]}>
                      <Text style={[styles.memberMoreText, {color: isDark ? '#FFFFFF' : '#666666'}]}>
                        +{room.members - 4}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* 멤버 수 */}
              <View style={styles.groupMeta}>
                <Icon name="people" size={iconSize(16)} color={isDark ? '#999999' : '#666666'} />
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
        <Icon name="add-circle-outline" size={iconSize(24)} color="#007AFF" />
        <Text style={[styles.createGroupText, {color: '#007AFF'}]}>새 모임 만들기</Text>
      </TouchableOpacity>
    </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: isDark ? '#121212' : '#FAFAFA'}]}>
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
            size={iconSize(20)}
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
            size={iconSize(20)}
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
      </View>

      {/* 탭 콘텐츠 */}
      {selectedTab === 'community' && renderCommunity()}
      {selectedTab === 'group' && !selectedGroup && renderGroup()}
      {selectedTab === 'group' && selectedGroup && renderGroupDetail()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: sp(20),
    paddingTop: hp(16),
    paddingBottom: hp(16),
  },
  title: {
    fontSize: fp(28),
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
    paddingVertical: hp(16),
    gap: sp(6),
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: fp(14),
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  // 커뮤니티 스타일
  boardTabs: {
    maxHeight: hp(50),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  boardTabsContent: {
    paddingHorizontal: sp(12),
    gap: sp(8),
    alignItems: 'center',
  },
  boardTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(12),
    paddingVertical: hp(8),
    borderRadius: sp(20),
    gap: sp(6),
    borderWidth: 1,
    borderColor: 'transparent',
  },
  boardTabSelected: {
    borderWidth: 1,
  },
  boardTabText: {
    fontSize: fp(13),
    fontWeight: '600',
  },
  anonymousBadge: {
    paddingHorizontal: sp(4),
    paddingVertical: hp(2),
    borderRadius: sp(4),
    marginLeft: sp(2),
  },
  anonymousBadgeText: {
    fontSize: fp(8),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  postsScrollView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp(60),
  },
  emptyStateText: {
    fontSize: fp(14),
    marginTop: hp(12),
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: sp(8),
    paddingVertical: hp(4),
    borderRadius: sp(8),
    gap: sp(4),
    marginBottom: hp(12),
  },
  categoryBadgeText: {
    fontSize: fp(11),
    fontWeight: '700',
  },
  anonymousAvatar: {
    width: sp(36),
    height: sp(36),
    borderRadius: sp(18),
    justifyContent: 'center',
    alignItems: 'center',
  },
  postsContainer: {
    padding: sp(16),
    paddingBottom: hp(100),
  },
  postCard: {
    borderRadius: sp(16),
    padding: sp(16),
    marginBottom: hp(12),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: sp(2)},
    shadowOpacity: 0.05,
    shadowRadius: sp(8),
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp(12),
  },
  postHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
  },
  authorInfo: {
    flex: 1,
  },
  avatar: {
    fontSize: fp(32),
  },
  authorName: {
    fontSize: fp(14),
    fontWeight: '700',
  },
  postTime: {
    fontSize: fp(11),
    marginTop: hp(2),
  },
  postContent: {
    marginBottom: hp(12),
  },
  postTitle: {
    fontSize: fp(16),
    fontWeight: '700',
    marginBottom: hp(8),
  },
  postText: {
    fontSize: fp(14),
    lineHeight: hp(20),
  },
  postActions: {
    flexDirection: 'row',
    gap: sp(16),
    paddingTop: hp(12),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(6),
  },
  actionText: {
    fontSize: fp(14),
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: sp(20),
    bottom: hp(20),
    width: sp(56),
    height: sp(56),
    borderRadius: sp(28),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: sp(4)},
    shadowOpacity: 0.3,
    shadowRadius: sp(8),
    elevation: 8,
  },
  // 모임 스타일
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
    paddingHorizontal: sp(16),
    paddingTop: hp(16),
    paddingBottom: hp(8),
  },
  sectionTitle: {
    fontSize: fp(16),
    fontWeight: '700',
  },
  groupsContainer: {
    padding: sp(16),
    paddingTop: 0,
    paddingBottom: hp(16),
  },
  groupCard: {
    flexDirection: 'row',
    borderRadius: sp(16),
    padding: sp(16),
    marginBottom: hp(12),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: sp(2)},
    shadowOpacity: 0.05,
    shadowRadius: sp(8),
    elevation: 2,
    alignItems: 'center',
  },
  myGroupCard: {
    borderWidth: 2,
  },
  groupThumbnail: {
    width: sp(60),
    height: sp(60),
    borderRadius: sp(12),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  groupThumbnailEmoji: {
    fontSize: fp(28),
  },
  activeBadge: {
    position: 'absolute',
    bottom: hp(-4),
    paddingHorizontal: sp(6),
    paddingVertical: hp(2),
    borderRadius: sp(8),
  },
  activeBadgeText: {
    fontSize: fp(8),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  groupInfo: {
    flex: 1,
    marginLeft: sp(16),
  },
  groupName: {
    fontSize: fp(16),
    fontWeight: '700',
    marginBottom: hp(4),
  },
  groupDescription: {
    fontSize: fp(12),
    marginBottom: hp(8),
  },
  // 멤버 아바타 스타일 (사각형, 티어 테두리, 우상단 레벨)
  memberAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(8),
  },
  memberAvatarContainer: {
    position: 'relative',
  },
  memberAvatarBorder: {
    width: sp(32),
    height: sp(32),
    borderRadius: sp(8),
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: {width: 0, height: 1},
    elevation: 2,
    backgroundColor: '#FFFFFF',
  },
  memberAvatarInner: {
    width: sp(26),
    height: sp(26),
    borderRadius: sp(6),
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberLevelBadge: {
    position: 'absolute',
    top: -sp(4),
    right: -sp(4),
    minWidth: sp(16),
    height: sp(14),
    borderRadius: sp(7),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: sp(3),
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  memberLevelText: {
    color: '#FFFFFF',
    fontSize: fp(8),
    fontWeight: '800',
  },
  memberMoreBadge: {
    width: sp(32),
    height: sp(32),
    borderRadius: sp(8),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -sp(8),
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  memberMoreText: {
    fontSize: fp(10),
    fontWeight: '700',
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(4),
  },
  groupMembers: {
    fontSize: fp(12),
    fontWeight: '600',
  },
  joinButton: {
    paddingHorizontal: sp(16),
    paddingVertical: hp(8),
    borderRadius: sp(12),
  },
  joinButtonText: {
    fontSize: fp(14),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  createGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: sp(16),
    marginBottom: hp(20),
    paddingVertical: hp(16),
    borderRadius: sp(12),
    gap: sp(8),
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  createGroupText: {
    fontSize: fp(16),
    fontWeight: '700',
  },
  // 모임 상세보기 스타일
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(16),
    paddingVertical: hp(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    gap: sp(12),
  },
  backButton: {
    padding: sp(4),
  },
  detailHeaderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(12),
  },
  detailThumbnail: {
    fontSize: fp(28),
  },
  detailTitle: {
    fontSize: fp(18),
    fontWeight: '700',
  },
  detailSubtitle: {
    fontSize: fp(12),
    marginTop: hp(2),
  },
  detailTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  detailTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(14),
    gap: sp(6),
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  detailTabActive: {
    borderBottomWidth: 2,
  },
  detailTabText: {
    fontSize: fp(13),
    fontWeight: '600',
  },
  detailContent: {
    flex: 1,
  },
  // 정보 카드 스타일
  infoCard: {
    borderRadius: sp(16),
    marginBottom: hp(16),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: sp(2)},
    shadowOpacity: 0.08,
    shadowRadius: sp(8),
    elevation: 3,
    overflow: 'hidden',
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(16),
    paddingVertical: hp(14),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    gap: sp(10),
  },
  infoCardTitle: {
    fontSize: fp(16),
    fontWeight: '700',
  },
  infoCardContent: {
    padding: sp(12),
    gap: sp(10),
  },
  infoItemCard: {
    borderWidth: 1,
    borderRadius: sp(12),
    padding: sp(14),
    gap: hp(4),
  },
  infoItemLabel: {
    fontSize: fp(12),
    fontWeight: '500',
  },
  infoItemValue: {
    fontSize: fp(15),
    fontWeight: '600',
  },
  // 통계 그리드
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: sp(12),
    paddingVertical: sp(6),
    gap: sp(10),
  },
  statItemCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: hp(20),
    borderRadius: sp(12),
    borderWidth: 1,
    gap: hp(8),
  },
  statValue: {
    fontSize: fp(16),
    fontWeight: '700',
  },
  statLabel: {
    fontSize: fp(12),
  },
  // 규칙 리스트
  rulesList: {
    padding: sp(16),
    paddingTop: hp(8),
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp(12),
    gap: sp(12),
  },
  ruleBullet: {
    width: sp(22),
    height: sp(22),
    borderRadius: sp(11),
    justifyContent: 'center',
    alignItems: 'center',
  },
  ruleBulletText: {
    color: '#FFFFFF',
    fontSize: fp(11),
    fontWeight: '700',
  },
  ruleText: {
    flex: 1,
    fontSize: fp(14),
    lineHeight: hp(20),
  },
  // 가입 조건 리스트
  conditionsList: {
    padding: sp(16),
    paddingTop: hp(8),
  },
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(10),
    gap: sp(10),
  },
  conditionText: {
    flex: 1,
    fontSize: fp(14),
  },
  // 멤버 리스트 스타일
  membersList: {
    borderRadius: sp(16),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: sp(2)},
    shadowOpacity: 0.08,
    shadowRadius: sp(8),
    elevation: 3,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: sp(16),
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(12),
    flex: 1,
  },
  memberAvatar: {
    width: sp(44),
    height: sp(44),
    borderRadius: sp(22),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  leaderBadge: {
    position: 'absolute',
    bottom: -sp(2),
    right: -sp(2),
    width: sp(18),
    height: sp(18),
    borderRadius: sp(9),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  memberInfo: {
    flex: 1,
    gap: hp(4),
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
  },
  memberName: {
    fontSize: fp(15),
    fontWeight: '700',
  },
  leaderTag: {
    paddingHorizontal: sp(6),
    paddingVertical: hp(2),
    borderRadius: sp(6),
  },
  leaderTagText: {
    fontSize: fp(10),
    fontWeight: '700',
    color: '#1A1A1A',
  },
  memberLevel: {
    fontSize: fp(12),
    fontWeight: '600',
  },
  memberDivider: {
    height: 1,
    marginLeft: sp(72),
  },
  // 그룹 평균 통계 스타일
  groupAverageCard: {
    borderRadius: sp(16),
    padding: sp(16),
    marginBottom: sp(16),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: sp(2)},
    shadowOpacity: 0.08,
    shadowRadius: sp(8),
    elevation: 3,
  },
  groupAverageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
    marginBottom: sp(12),
  },
  groupAverageTitle: {
    fontSize: fp(15),
    fontWeight: '700',
  },
  groupAverageStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  groupAvgStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: hp(4),
  },
  groupAvgStatLabel: {
    fontSize: fp(12),
    fontWeight: '500',
  },
  groupAvgStatValue: {
    fontSize: fp(16),
    fontWeight: '700',
  },
  groupAvgDivider: {
    width: 1,
    height: sp(30),
  },
  studyTimeFilterTabs: {
    flexDirection: 'row',
    gap: sp(8),
    marginBottom: hp(12),
  },
  studyTimeFilterTab: {
    flex: 1,
    paddingVertical: hp(8),
    borderRadius: sp(8),
    alignItems: 'center',
  },
  studyTimeFilterTabText: {
    fontSize: fp(13),
    fontWeight: '600',
  },
  groupAverageValue: {
    alignItems: 'center',
    paddingVertical: hp(8),
  },
  groupAvgBigValue: {
    fontSize: fp(24),
    fontWeight: '700',
  },
  memberStudyTimeSingle: {
    marginTop: sp(12),
    padding: sp(10),
    borderRadius: sp(10),
    alignItems: 'center',
  },
  // 확장된 멤버 아이템 스타일
  memberItemExpanded: {
    padding: sp(16),
  },
  memberTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberStudyTimes: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: sp(12),
    padding: sp(12),
    borderRadius: sp(10),
  },
  memberStudyTimeItem: {
    alignItems: 'center',
    gap: hp(2),
  },
  memberStudyTimeLabel: {
    fontSize: fp(11),
    fontWeight: '500',
  },
  memberStudyTimeValue: {
    fontSize: fp(13),
    fontWeight: '700',
  },
  // 게시판 스타일
  boardPostCard: {
    borderRadius: sp(16),
    padding: sp(16),
    marginBottom: hp(12),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: sp(2)},
    shadowOpacity: 0.08,
    shadowRadius: sp(8),
    elevation: 3,
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: sp(6),
    paddingVertical: hp(3),
    borderRadius: sp(6),
    gap: sp(3),
  },
  pinnedText: {
    fontSize: fp(11),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pinnedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
  },
  pinnedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(8),
    paddingVertical: hp(4),
    borderRadius: sp(6),
    gap: sp(4),
  },
  pinnedTagText: {
    fontSize: fp(11),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  boardPostTitle: {
    fontSize: fp(16),
    fontWeight: '700',
    marginBottom: hp(6),
  },
  boardPostContent: {
    fontSize: fp(14),
    lineHeight: hp(20),
    marginBottom: hp(12),
  },
  boardPostMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
  },
  boardPostAuthor: {
    fontSize: fp(12),
    fontWeight: '600',
  },
  boardPostTime: {
    fontSize: fp(11),
    flex: 1,
  },
  boardPostStats: {
    flexDirection: 'row',
    gap: sp(12),
  },
  boardPostStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(4),
  },
  boardPostStatText: {
    fontSize: fp(12),
  },
  // 고정 게시글 섹션
  pinnedSection: {
    borderRadius: sp(16),
    padding: sp(12),
    marginBottom: hp(16),
  },
  pinnedSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
    marginBottom: hp(12),
    paddingHorizontal: sp(4),
  },
  pinnedSectionTitle: {
    fontSize: fp(14),
    fontWeight: '700',
  },
  pinnedPostCard: {
    marginBottom: hp(8),
  },
  // 게시글 헤더 (작성자 정보)
  boardPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(12),
  },
  boardPostAuthorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(10),
  },
  boardPostAvatar: {
    width: sp(36),
    height: sp(36),
    borderRadius: sp(10),
    borderWidth: 2,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  boardPostLevelBadge: {
    position: 'absolute',
    top: -sp(4),
    right: -sp(4),
    minWidth: sp(16),
    height: sp(14),
    borderRadius: sp(7),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: sp(3),
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  boardPostLevelText: {
    color: '#FFFFFF',
    fontSize: fp(8),
    fontWeight: '800',
  },
  boardPostAuthorName: {
    fontSize: fp(14),
    fontWeight: '700',
  },
  boardPostTierBadge: {
    paddingHorizontal: sp(6),
    paddingVertical: hp(2),
    borderRadius: sp(4),
    marginTop: hp(2),
  },
  boardPostTierText: {
    fontSize: fp(10),
    fontWeight: '600',
  },
});

export default GroupScreen;
