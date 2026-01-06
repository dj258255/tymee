import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  InteractionManager,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import {useThemeStore} from '../store/themeStore';
import {useCommunityStore, FeedCategory, FeedItem, Comment, CardFrameType} from '../store/communityStore';
import {useNavigationStore} from '../store/navigationStore';
import {safeGetColorScheme, safeAddAppearanceListener} from '../utils/appearance';
import FeedCard from '../components/FeedCard';
import PostListItem from '../components/PostListItem';
import {sp, hp, fp, iconSize, touchSize} from '../utils/responsive';
import {launchImageLibrary} from 'react-native-image-picker';

// 매칭 화면 컴포넌트 (서브탭용)
import MatchingContent from './MatchingScreen';
// 모임 컴포넌트
import GroupContent from '../components/GroupContent';
// 친구 컴포넌트
import FriendsContent from '../components/FriendsContent';


// 카드 프레임별 테두리 스타일
const getFrameBorderStyle = (frame?: CardFrameType) => {
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
      return {};
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

// 카테고리 정보 (아이콘, 색상, 표시형식 포함)
const BOARD_CATEGORIES: Array<{
  id: FeedCategory;
  label: string;
  icon: string;
  color: string;
  description: string;
  displayType: 'card' | 'list'; // card: 카드형, list: 목록형
}> = [
  {id: 'all', label: '전체', icon: 'grid', color: '#007AFF', description: '모든 게시글', displayType: 'list'},
  {id: 'popular', label: '인기', icon: 'flame', color: '#FF3B30', description: '인기 게시글', displayType: 'list'},
  {id: 'study_done', label: '오공완', icon: 'checkmark-done-circle', color: '#4CAF50', description: '오늘 공부 완료', displayType: 'card'},
  {id: 'general', label: '일반', icon: 'chatbubbles', color: '#8E8E93', description: '자유로운 이야기', displayType: 'list'},
  {id: 'question', label: '질문', icon: 'help-circle', color: '#FF9500', description: '궁금한 것 물어보기', displayType: 'card'},
  {id: 'info', label: '정보', icon: 'information-circle', color: '#5856D6', description: '유용한 정보 공유', displayType: 'card'},
  {id: 'recommend', label: '추천', icon: 'thumbs-up', color: '#FF2D55', description: '좋은 것 추천하기', displayType: 'card'},
  {id: 'success', label: '성공', icon: 'trophy', color: '#FFD700', description: '합격/성공 후기', displayType: 'card'},
  {id: 'study_group', label: '홍보', icon: 'megaphone', color: '#34C759', description: '스터디/강의 홍보', displayType: 'card'},
];

// 글쓰기용 카테고리 (전체, 인기 제외)
const WRITE_CATEGORIES = BOARD_CATEGORIES.filter(cat => cat.id !== 'all' && cat.id !== 'popular');

// 신고 사유 목록
const REPORT_REASONS = [
  {id: 'spam', label: '스팸/광고', icon: 'megaphone-outline'},
  {id: 'abuse', label: '욕설/비하', icon: 'sad-outline'},
  {id: 'adult', label: '음란물/성인 콘텐츠', icon: 'warning-outline'},
  {id: 'fraud', label: '사기/허위 정보', icon: 'alert-outline'},
  {id: 'privacy', label: '개인정보 노출', icon: 'person-outline'},
  {id: 'etc', label: '기타', icon: 'ellipsis-horizontal-outline'},
];


const CommunityScreen: React.FC = () => {
  const [systemColorScheme, setSystemColorScheme] = useState<'light' | 'dark'>('light');
  const [refreshing, setRefreshing] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedFeed, setSelectedFeed] = useState<FeedItem | null>(null);
  const [commentText, setCommentText] = useState('');
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [writeCategory, setWriteCategory] = useState<FeedCategory>('general');
  const [writeTitle, setWriteTitle] = useState('');
  const [writeContent, setWriteContent] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null); // 대댓글 대상
  const [commentImage, setCommentImage] = useState<string | null>(null); // 댓글 이미지
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set()); // 펼쳐진 대댓글
  const [showSearchModal, setShowSearchModal] = useState(false); // 검색 모달
  const [searchQuery, setSearchQuery] = useState(''); // 검색어
  const [searchResults, setSearchResults] = useState<FeedItem[]>([]); // 검색 결과
  const [showPullHint, setShowPullHint] = useState(true); // Pull to refresh 힌트
  const [currentBoard, setCurrentBoard] = useState<FeedCategory | null>(null); // 현재 선택된 게시판 (null이면 메인)
  const [showReportModal, setShowReportModal] = useState(false); // 신고 모달
  const [reportTarget, setReportTarget] = useState<{type: 'post' | 'comment' | 'reply'; id: string; authorName: string} | null>(null); // 신고 대상
  const [selectedReportReason, setSelectedReportReason] = useState<string | null>(null); // 선택된 신고 사유

  // 서브탭 상태
  const {activeCommunityTab, isCommunityMode, enterCommunityMode} = useNavigationStore();

  // 커뮤니티 화면 진입 시 커뮤니티 모드 활성화
  useEffect(() => {
    if (!isCommunityMode) {
      enterCommunityMode();
    }
  }, [isCommunityMode, enterCommunityMode]);

  const {
    setCategory,
    toggleLike,
    getFilteredFeeds,
    getFeedComments,
    addComment,
    addFeed,
    toggleCommentLike,
  } = useCommunityStore();

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

  // 색상 정의
  const bgColor = isDark ? '#1C1C1E' : '#FFFFFF';
  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#1A1A1A';
  const subtextColor = isDark ? '#8E8E93' : '#8E8E93';
  const borderColor = isDark ? '#2C2C2E' : '#E5E5EA';
  const accentColor = '#007AFF';

  const feeds = getFilteredFeeds();

  // 현재 게시판 정보
  const currentBoardInfo = BOARD_CATEGORIES.find(cat => cat.id === currentBoard);

  // 표시할 피드 (인기 게시판은 좋아요순 정렬)
  const displayFeeds = React.useMemo(() => {
    if (currentBoard === 'popular') {
      // 인기 게시판: 좋아요 10개 이상, 좋아요순 정렬
      return [...feeds]
        .filter(f => f.likes >= 10)
        .sort((a, b) => b.likes - a.likes);
    }
    return feeds;
  }, [feeds, currentBoard]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // 실제로는 API 호출
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // 시간 포맷
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) {return '방금 전';}
    if (minutes < 60) {return `${minutes}분 전`;}
    if (hours < 24) {return `${hours}시간 전`;}
    if (days < 7) {return `${days}일 전`;}
    return new Date(date).toLocaleDateString('ko-KR');
  };

  const handleComment = (feed: FeedItem) => {
    setSelectedFeed(feed);
    setShowCommentModal(true);
  };

  const handleSubmitComment = () => {
    if (!selectedFeed || !commentText.trim()) {return;}
    addComment(
      selectedFeed.id,
      commentText.trim(),
      commentImage || undefined,
      replyTo?.id
    );
    setCommentText('');
    setCommentImage(null);
    setReplyTo(null);
  };

  const handleSelectCommentImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 800,
        maxHeight: 800,
      });
      if (result.assets && result.assets[0]?.uri) {
        setCommentImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Image picker error:', error);
    }
  };

  const toggleExpandReplies = (commentId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const handleSubmitPost = () => {
    if (!writeContent.trim()) {return;}

    addFeed({
      category: writeCategory,
      author: {
        id: 'currentUser',
        nickname: '나',
        level: 10,
      },
      title: writeTitle.trim() || undefined,
      content: writeContent.trim(),
    });
    setWriteTitle('');
    setWriteContent('');
    setShowWriteModal(false);
  };

  // 검색 실행
  const handleSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const lowerQuery = query.toLowerCase();
    const allFeeds = useCommunityStore.getState().feeds;
    const results = allFeeds.filter(feed => {
      const matchContent = feed.content.toLowerCase().includes(lowerQuery);
      const matchTitle = feed.title?.toLowerCase().includes(lowerQuery);
      const matchAuthor = feed.author.nickname.toLowerCase().includes(lowerQuery);
      return matchContent || matchTitle || matchAuthor;
    });
    setSearchResults(results);
  }, []);

  // 검색어 변경 시 디바운스 검색
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  // 게시판 진입
  const enterBoard = (category: FeedCategory) => {
    setCurrentBoard(category);
    setCategory(category);
  };

  // 게시판 나가기
  const exitBoard = () => {
    setCurrentBoard(null);
    setCategory('all');
  };

  // 신고 모달 열기
  const openReportModal = (type: 'post' | 'comment' | 'reply', id: string, authorName: string) => {
    setReportTarget({type, id, authorName});
    setSelectedReportReason(null);
    setShowReportModal(true);
  };

  // 신고 제출
  const handleSubmitReport = () => {
    if (!reportTarget || !selectedReportReason) {return;}
    // TODO: 실제 신고 API 호출
    console.log('Report submitted:', reportTarget, selectedReportReason);
    setShowReportModal(false);
    setReportTarget(null);
    setSelectedReportReason(null);
    // 알림 표시 (나중에 Toast로 대체)
  };

  // 메인 헤더 (커뮤니티 메인)
  const renderMainHeader = () => (
    <View style={[styles.headerContainer, {backgroundColor: cardBg, borderBottomColor: borderColor}]}>
      <Text style={[styles.headerTitle, {color: textColor}]}>커뮤니티</Text>
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={[styles.headerIconButton, {backgroundColor: isDark ? '#2C2C2E' : '#F0F0F0'}]}
          onPress={() => setShowSearchModal(true)}>
          <Icon name="search" size={iconSize(18)} color={textColor} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // 게시판 헤더 (뒤로가기 + 글쓰기)
  const renderBoardHeader = () => {
    const currentBoardInfo = BOARD_CATEGORIES.find(cat => cat.id === currentBoard);
    return (
      <View style={[styles.headerContainer, {backgroundColor: cardBg, borderBottomColor: borderColor}]}>
        <View style={styles.boardHeaderLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={exitBoard}>
            <Icon name="chevron-back" size={iconSize(24)} color={textColor} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, {color: textColor}]}>{currentBoardInfo?.label}</Text>
            <Text style={[styles.boardDescription, {color: subtextColor}]}>{currentBoardInfo?.description}</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerIconButton, {backgroundColor: isDark ? '#2C2C2E' : '#F0F0F0'}]}
            onPress={() => setShowSearchModal(true)}>
            <Icon name="search" size={iconSize(18)} color={textColor} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.writeButton, {backgroundColor: accentColor}]}
            onPress={() => {
              if (currentBoard && currentBoard !== 'all') {
                setWriteCategory(currentBoard);
              }
              setShowWriteModal(true);
            }}>
            <Icon name="create-outline" size={iconSize(18)} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // 카테고리 그리드 (메인 화면)
  const renderCategoryGrid = () => (
    <ScrollView
      style={styles.categoryGridContainer}
      contentContainerStyle={styles.categoryGridContent}
      showsVerticalScrollIndicator={false}>
      <View style={styles.categoryGrid}>
        {BOARD_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.categoryCard, {backgroundColor: cardBg}]}
            onPress={() => enterBoard(cat.id)}>
            {/* 게시판형/피드형 아이콘 표시 */}
            <View style={[styles.displayTypeBadge, {backgroundColor: isDark ? '#2C2C2E' : '#F0F0F0'}]}>
              <Icon
                name={cat.displayType === 'list' ? 'list' : 'grid'}
                size={iconSize(12)}
                color={subtextColor}
              />
            </View>
            <View style={[styles.categoryIconWrapper, {backgroundColor: cat.color + '20'}]}>
              <Icon name={cat.icon as any} size={iconSize(28)} color={cat.color} />
            </View>
            <Text style={[styles.categoryCardLabel, {color: textColor}]}>{cat.label}</Text>
            <Text style={[styles.categoryCardDesc, {color: subtextColor}]} numberOfLines={1}>
              {cat.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 인기글 미리보기 */}
      <View style={styles.popularSection}>
        <Text style={[styles.sectionTitle, {color: textColor}]}>인기 게시글</Text>
        {feeds.slice(0, 3).map((feed) => (
          <TouchableOpacity
            key={feed.id}
            style={[styles.popularItem, {backgroundColor: cardBg, borderColor: borderColor}]}
            onPress={() => handleComment(feed)}>
            <View style={styles.popularItemContent}>
              <View style={[styles.popularCategoryBadge, {backgroundColor: BOARD_CATEGORIES.find(c => c.id === feed.category)?.color + '20'}]}>
                <Text style={[styles.popularCategoryText, {color: BOARD_CATEGORIES.find(c => c.id === feed.category)?.color}]}>
                  {BOARD_CATEGORIES.find(c => c.id === feed.category)?.label}
                </Text>
              </View>
              <Text style={[styles.popularTitle, {color: textColor}]} numberOfLines={1}>
                {feed.title || feed.content}
              </Text>
            </View>
            <View style={styles.popularStats}>
              <Icon name="heart" size={iconSize(12)} color="#FF3B30" />
              <Text style={[styles.popularStatText, {color: subtextColor}]}>{feed.likes}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderFeedItem = ({item}: {item: FeedItem}) => (
    <FeedCard
      feed={item}
      isDark={isDark}
      onLike={() => toggleLike(item.id)}
      onComment={() => handleComment(item)}
      onPress={() => handleComment(item)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="chatbubbles-outline" size={iconSize(60)} color={subtextColor} />
      <Text style={[styles.emptyText, {color: subtextColor}]}>
        아직 게시글이 없어요
      </Text>
      <Text style={[styles.emptySubtext, {color: subtextColor}]}>
        첫 번째 글을 작성해보세요!
      </Text>
    </View>
  );

  const comments = selectedFeed ? getFeedComments(selectedFeed.id) : [];

  // 서브탭에 따른 컨텐츠 렌더링
  const renderSubTabContent = () => {
    switch (activeCommunityTab) {
      case 'Matching':
        return <MatchingContent />;
      case 'Group':
        return <GroupContent />;
      case 'Friends':
        return <FriendsContent />;
      case 'Feed':
      default:
        // 기존 피드 화면 (메인 또는 게시판)
        return currentBoard === null ? (
          <>
            {renderMainHeader()}
            {renderCategoryGrid()}
          </>
        ) : (
          <>
            {renderBoardHeader()}
            {currentBoardInfo?.displayType === 'list' ? (
              <FlatList
                data={displayFeeds}
                renderItem={({item}) => (
                  <PostListItem
                    post={item}
                    isDark={isDark}
                    onPress={() => handleComment(item)}
                  />
                )}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.feedList}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={renderEmptyState}
              />
            ) : (
              <FlatList
                data={displayFeeds}
                renderItem={renderFeedItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.feedList}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={() => {
                    setShowPullHint(false);
                    onRefresh();
                  }} />
                }
                ListEmptyComponent={renderEmptyState}
                ListHeaderComponent={
                  showPullHint && displayFeeds.length > 0 ? (
                    <TouchableOpacity
                      style={[styles.pullHint, {backgroundColor: isDark ? '#2C2C2E' : '#F0F0F0'}]}
                      onPress={() => setShowPullHint(false)}>
                      <Icon name="arrow-down" size={iconSize(14)} color={subtextColor} />
                      <Text style={[styles.pullHintText, {color: subtextColor}]}>
                        아래로 당겨서 새로고침
                      </Text>
                      <Icon name="close" size={iconSize(14)} color={subtextColor} />
                    </TouchableOpacity>
                  ) : null
                }
              />
            )}
          </>
        );
    }
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: cardBg}]}>
      {/* 서브탭에 따른 컨텐츠 */}
      {renderSubTabContent()}

      {/* 게시글 상세 + 댓글 모달 */}
      <Modal
        visible={showCommentModal}
        animationType="slide"
        onRequestClose={() => setShowCommentModal(false)}>
        <SafeAreaView style={[styles.modalContainer, {backgroundColor: bgColor}]}>
          <View style={[styles.modalHeader, {backgroundColor: cardBg, borderBottomColor: borderColor}]}>
            <TouchableOpacity onPress={() => setShowCommentModal(false)}>
              <Icon name="close" size={iconSize(24)} color={textColor} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, {color: textColor}]}>게시글</Text>
            <View style={{width: iconSize(24)}} />
          </View>

          {selectedFeed && (
            <FlatList
              style={{flex: 1}}
              data={comments}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.commentList}
              ListHeaderComponent={
                <>
                  {/* 게시글 상세 */}
                  <View style={[
                    styles.postDetail,
                    {
                      backgroundColor: cardBg,
                      borderWidth: 1,
                      borderColor: borderColor,
                    },
                    getFrameBorderStyle(selectedFeed.author.cardFrame),
                  ]}>
                    {/* 작성자 정보 */}
                    <View style={styles.postDetailHeader}>
                      {/* 아바타 with 티어 테두리 */}
                      <View style={styles.postDetailAvatarContainer}>
                        {(() => {
                          const tierStyle = getTierStyle(selectedFeed.author.tier);
                          return (
                            <>
                              <View style={[
                                styles.postDetailAvatarBorder,
                                {
                                  borderColor: tierStyle.color,
                                  shadowColor: tierStyle.color,
                                },
                              ]}>
                                <View style={[styles.postDetailAvatar, {backgroundColor: '#E0E0E0'}]}>
                                  {selectedFeed.author.profileImageUrl ? (
                                    <Image source={{uri: selectedFeed.author.profileImageUrl}} style={styles.postDetailAvatarImage} />
                                  ) : (
                                    <Icon name="person" size={iconSize(20)} color="#9E9E9E" />
                                  )}
                                </View>
                              </View>
                              {/* 레벨 뱃지 (우상단) */}
                              {selectedFeed.author.level && (
                                <View style={[
                                  styles.postDetailLevelCircle,
                                  {
                                    backgroundColor: tierStyle.color,
                                    borderColor: cardBg,
                                  },
                                ]}>
                                  <Text style={styles.postDetailLevelCircleText}>{selectedFeed.author.level}</Text>
                                </View>
                              )}
                            </>
                          );
                        })()}
                      </View>
                      <View style={styles.postDetailAuthorInfo}>
                        <View style={styles.postDetailAuthorRow}>
                          {/* 뱃지들 (아이콘 컴포넌트 사용) */}
                          {selectedFeed.author.badges && selectedFeed.author.badges.length > 0 && (
                            <View style={styles.postDetailBadgesRow}>
                              {selectedFeed.author.badges.slice(0, 3).map((badge) => (
                                <View
                                  key={badge.id}
                                  style={[styles.postDetailBadgeIcon, {backgroundColor: badge.color + '20'}]}>
                                  <Icon
                                    name={(badge.icon as any) || 'star'}
                                    size={iconSize(12)}
                                    color={badge.color}
                                  />
                                </View>
                              ))}
                            </View>
                          )}
                          <Text style={[styles.postDetailAuthorName, {color: textColor}]}>
                            {selectedFeed.author.nickname}
                          </Text>
                        </View>
                      </View>
                      {/* 우측 상단: 시간 */}
                      <View style={styles.postDetailHeaderRight}>
                        <Text style={[styles.postDetailTime, {color: subtextColor}]}>
                          {formatTime(selectedFeed.createdAt)}
                        </Text>
                      </View>
                    </View>

                    {/* 제목 (자유게시판) */}
                    {selectedFeed.title && (
                      <Text style={[styles.postDetailTitle, {color: textColor}]}>
                        {selectedFeed.title}
                      </Text>
                    )}

                    {/* 내용 */}
                    <Text style={[styles.postDetailContent, {color: textColor}]}>
                      {selectedFeed.content}
                    </Text>

                    {/* 오공완 데이터 카드 */}
                    {selectedFeed.studyDoneData && (
                      <View style={[styles.detailStudyCard, {backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5'}]}>
                        <View style={styles.detailStudyHeader}>
                          <View style={styles.detailStudyTime}>
                            <Icon name="time" size={iconSize(20)} color={accentColor} />
                            <Text style={[styles.detailStudyTimeText, {color: textColor}]}>
                              {Math.floor(selectedFeed.studyDoneData.totalMinutes / 60)}시간{' '}
                              {selectedFeed.studyDoneData.totalMinutes % 60 > 0
                                ? `${selectedFeed.studyDoneData.totalMinutes % 60}분`
                                : ''}
                            </Text>
                          </View>
                          {selectedFeed.studyDoneData.streak && selectedFeed.studyDoneData.streak > 1 && (
                            <View style={[styles.detailStreakBadge, {backgroundColor: '#FF9500'}]}>
                              <Icon name="flame" size={iconSize(14)} color="#FFFFFF" />
                              <Text style={styles.detailStreakText}>
                                {selectedFeed.studyDoneData.streak}일 연속
                              </Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.detailSubjectList}>
                          {selectedFeed.studyDoneData.subjects.map((subject, index) => (
                            <View key={index} style={styles.detailSubjectItem}>
                              <View style={[styles.detailSubjectDot, {backgroundColor: subject.color}]} />
                              <Text style={[styles.detailSubjectName, {color: subtextColor}]}>
                                {subject.name}
                              </Text>
                              <Text style={[styles.detailSubjectTime, {color: textColor}]}>
                                {Math.floor(subject.minutes / 60) > 0
                                  ? `${Math.floor(subject.minutes / 60)}시간 `
                                  : ''}
                                {subject.minutes % 60}분
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* 스터디 모집 데이터 카드 */}
                    {selectedFeed.studyGroupData && (
                      <View style={[styles.detailStudyCard, {backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5'}]}>
                        <Text style={[styles.detailGroupTitle, {color: textColor}]}>
                          {selectedFeed.studyGroupData.title}
                        </Text>
                        <Text style={[styles.detailGroupDesc, {color: subtextColor}]}>
                          {selectedFeed.studyGroupData.description}
                        </Text>
                        <View style={styles.detailGroupFooter}>
                          <View style={styles.detailGroupMembers}>
                            <Icon name="people" size={iconSize(16)} color={subtextColor} />
                            <Text style={[styles.detailGroupMemberText, {color: subtextColor}]}>
                              {selectedFeed.studyGroupData.currentMembers}/{selectedFeed.studyGroupData.maxMembers}명
                            </Text>
                          </View>
                          <View style={styles.detailGroupTags}>
                            {selectedFeed.studyGroupData.tags.map((tag, index) => (
                              <View key={index} style={[styles.detailGroupTag, {backgroundColor: accentColor + '15'}]}>
                                <Text style={[styles.detailGroupTagText, {color: accentColor}]}>#{tag}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                        <TouchableOpacity style={[styles.detailJoinButton, {backgroundColor: accentColor}]}>
                          <Text style={styles.detailJoinButtonText}>참여 신청하기</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* 좋아요/댓글 수 */}
                    <View style={[styles.postDetailStats, {borderTopColor: borderColor}]}>
                      <View style={styles.postDetailStatsLeft}>
                        <TouchableOpacity
                          style={styles.postDetailStatButton}
                          onPress={() => toggleLike(selectedFeed.id)}>
                          <Icon
                            name={selectedFeed.isLiked ? 'heart' : 'heart-outline'}
                            size={iconSize(20)}
                            color={selectedFeed.isLiked ? '#FF3B30' : subtextColor}
                          />
                          <Text style={[styles.postDetailStatText, {color: selectedFeed.isLiked ? '#FF3B30' : subtextColor}]}>
                            좋아요 {selectedFeed.likes}
                          </Text>
                        </TouchableOpacity>
                        <View style={styles.postDetailStatButton}>
                          <Icon name="chatbubble-outline" size={iconSize(20)} color={subtextColor} />
                          <Text style={[styles.postDetailStatText, {color: subtextColor}]}>
                            댓글 {selectedFeed.comments}
                          </Text>
                        </View>
                      </View>
                      {/* 신고 버튼 (오른쪽 끝) */}
                      <TouchableOpacity
                        style={styles.postReportButton}
                        onPress={() => openReportModal('post', selectedFeed.id, selectedFeed.author.nickname)}>
                        <Icon name="alert-circle-outline" size={iconSize(18)} color={subtextColor} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* 댓글 섹션 헤더 */}
                  <View style={[styles.commentSectionHeader, {backgroundColor: bgColor, borderBottomColor: borderColor}]}>
                    <View style={styles.commentSectionTitleRow}>
                      <Text style={[styles.commentSectionTitle, {color: textColor}]}>
                        댓글 {comments.length}
                      </Text>
                      <TouchableOpacity style={styles.commentRefreshButton}>
                        <Icon name="refresh" size={iconSize(16)} color={accentColor} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              }
              ListEmptyComponent={
                <View style={styles.emptyComments}>
                  <Text style={[styles.emptyCommentsText, {color: subtextColor}]}>
                    첫 댓글을 남겨보세요
                  </Text>
                </View>
              }
              renderItem={({item}) => (
                <View>
                  {/* 댓글 */}
                  <View style={[
                    styles.commentItem,
                    {backgroundColor: cardBg, borderColor: borderColor},
                    getFrameBorderStyle(item.author.cardFrame),
                  ]}>
                    {/* 아바타 with 티어 테두리 */}
                    <View style={styles.commentAvatarContainer}>
                      {(() => {
                        const tierStyle = getTierStyle(item.author.tier);
                        return (
                          <>
                            <View style={[
                              styles.commentAvatarBorder,
                              {
                                borderColor: tierStyle.color,
                                shadowColor: tierStyle.color,
                              },
                            ]}>
                              <View style={[styles.commentAvatarInner, {backgroundColor: '#E0E0E0'}]}>
                                {item.author.profileImageUrl ? (
                                  <Image source={{uri: item.author.profileImageUrl}} style={styles.commentAvatarImage} />
                                ) : (
                                  <Icon name="person" size={iconSize(14)} color="#9E9E9E" />
                                )}
                              </View>
                            </View>
                            {/* 레벨 뱃지 (우상단) */}
                            {item.author.level && (
                              <View style={[
                                styles.commentLevelCircle,
                                {
                                  backgroundColor: tierStyle.color,
                                  borderColor: cardBg,
                                },
                              ]}>
                                <Text style={styles.commentLevelCircleText}>{item.author.level}</Text>
                              </View>
                            )}
                          </>
                        );
                      })()}
                    </View>
                    <View style={styles.commentContent}>
                      <View style={styles.commentHeader}>
                        {/* 뱃지들 (아이콘) */}
                        {item.author.badges && item.author.badges.length > 0 && (
                          <View style={styles.commentBadgesRow}>
                            {item.author.badges.slice(0, 2).map((badge) => (
                              <View
                                key={badge.id}
                                style={[styles.commentBadgeIcon, {backgroundColor: badge.color + '20'}]}>
                                <Icon
                                  name={(badge.icon as any) || 'star'}
                                  size={iconSize(10)}
                                  color={badge.color}
                                />
                              </View>
                            ))}
                          </View>
                        )}
                        <Text style={[styles.commentAuthor, {color: textColor}]}>
                          {item.author.nickname}
                        </Text>
                        {/* 티어 배지 */}
                        {item.author.tier && (() => {
                          const tierStyle = getTierStyle(item.author.tier);
                          return (
                            <View style={[styles.commentTierBadge, {backgroundColor: tierStyle.bgColor}]}>
                              <Text style={[styles.commentTierText, {color: tierStyle.color}]}>
                                {item.author.tier}
                              </Text>
                            </View>
                          );
                        })()}
                        <Text style={[styles.commentTime, {color: subtextColor}]}>
                          {formatTime(item.createdAt)}
                        </Text>
                      </View>
                      <Text style={[styles.commentText, {color: textColor}]}>
                        {item.content}
                      </Text>
                      {/* 댓글 이미지 */}
                      {item.image && (
                        <Image
                          source={{uri: item.image}}
                          style={styles.commentImage}
                          resizeMode="cover"
                        />
                      )}
                      {/* 댓글 액션 버튼 */}
                      <View style={styles.commentActions}>
                        <View style={styles.commentActionsLeft}>
                          <TouchableOpacity
                            style={styles.commentActionButton}
                            onPress={() => selectedFeed && toggleCommentLike(selectedFeed.id, item.id)}>
                            <Icon
                              name={item.isLiked ? 'heart' : 'heart-outline'}
                              size={iconSize(14)}
                              color={item.isLiked ? '#FF3B30' : subtextColor}
                            />
                            <Text style={[styles.commentActionText, {color: item.isLiked ? '#FF3B30' : subtextColor}]}>
                              {item.likes || 0}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.commentActionButton}
                            onPress={() => setReplyTo(item)}>
                            <Icon name="chatbubble-outline" size={iconSize(14)} color={subtextColor} />
                            <Text style={[styles.commentActionText, {color: subtextColor}]}>
                              답글
                            </Text>
                          </TouchableOpacity>
                          {item.replies && item.replies.length > 0 && (
                            <TouchableOpacity
                              style={styles.commentActionButton}
                              onPress={() => toggleExpandReplies(item.id)}>
                              <Icon
                                name={expandedComments.has(item.id) ? 'chevron-up' : 'chevron-down'}
                                size={iconSize(14)}
                                color={accentColor}
                              />
                              <Text style={[styles.commentActionText, {color: accentColor}]}>
                                답글 {item.replies.length}개
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                        {/* 신고 버튼 (오른쪽 끝) */}
                        <TouchableOpacity
                          style={styles.commentReportButton}
                          onPress={() => openReportModal('comment', item.id, item.author.nickname)}>
                          <Icon name="alert-circle-outline" size={iconSize(14)} color={subtextColor} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {/* 대댓글 목록 */}
                  {expandedComments.has(item.id) && item.replies && item.replies.map((reply) => (
                    <View
                      key={reply.id}
                      style={[
                        styles.replyItem,
                        {backgroundColor: isDark ? '#2A2A2A' : '#F8F8F8', borderColor: borderColor},
                        getFrameBorderStyle(reply.author.cardFrame),
                      ]}>
                      <Icon name="return-down-forward" size={iconSize(14)} color={subtextColor} style={styles.replyIcon} />
                      {/* 대댓글 아바타 with 티어 테두리 */}
                      <View style={styles.replyAvatarContainer}>
                        {(() => {
                          const tierStyle = getTierStyle(reply.author.tier);
                          return (
                            <>
                              <View style={[
                                styles.replyAvatarBorder,
                                {
                                  borderColor: tierStyle.color,
                                  shadowColor: tierStyle.color,
                                },
                              ]}>
                                <View style={[styles.replyAvatarInner, {backgroundColor: '#E0E0E0'}]}>
                                  {reply.author.profileImageUrl ? (
                                    <Image source={{uri: reply.author.profileImageUrl}} style={styles.replyAvatarImage} />
                                  ) : (
                                    <Icon name="person" size={iconSize(10)} color="#9E9E9E" />
                                  )}
                                </View>
                              </View>
                              {reply.author.level && (
                                <View style={[
                                  styles.replyLevelCircle,
                                  {
                                    backgroundColor: tierStyle.color,
                                    borderColor: isDark ? '#2A2A2A' : '#F8F8F8',
                                  },
                                ]}>
                                  <Text style={styles.replyLevelCircleText}>{reply.author.level}</Text>
                                </View>
                              )}
                            </>
                          );
                        })()}
                      </View>
                      <View style={styles.commentContent}>
                        <View style={styles.commentHeader}>
                          {/* 대댓글 뱃지들 */}
                          {reply.author.badges && reply.author.badges.length > 0 && (
                            <View style={styles.replyBadgesRow}>
                              {reply.author.badges.slice(0, 2).map((badge) => (
                                <View
                                  key={badge.id}
                                  style={[styles.replyBadgeIcon, {backgroundColor: badge.color + '20'}]}>
                                  <Icon
                                    name={(badge.icon as any) || 'star'}
                                    size={iconSize(8)}
                                    color={badge.color}
                                  />
                                </View>
                              ))}
                            </View>
                          )}
                          <Text style={[styles.commentAuthor, {color: textColor, fontSize: fp(12)}]}>
                            {reply.author.nickname}
                          </Text>
                          {/* 대댓글 티어 배지 */}
                          {reply.author.tier && (() => {
                            const replyTierStyle = getTierStyle(reply.author.tier);
                            return (
                              <View style={[styles.commentTierBadge, {backgroundColor: replyTierStyle.bgColor}]}>
                                <Text style={[styles.commentTierText, {color: replyTierStyle.color, fontSize: fp(8)}]}>
                                  {reply.author.tier}
                                </Text>
                              </View>
                            );
                          })()}
                          <Text style={[styles.commentTime, {color: subtextColor}]}>
                            {formatTime(reply.createdAt)}
                          </Text>
                        </View>
                        <Text style={[styles.commentText, {color: textColor, fontSize: fp(13)}]}>
                          {reply.content}
                        </Text>
                        {reply.image && (
                          <Image
                            source={{uri: reply.image}}
                            style={[styles.commentImage, {height: hp(100)}]}
                            resizeMode="cover"
                          />
                        )}
                        <View style={styles.commentActions}>
                          <TouchableOpacity
                            style={styles.commentActionButton}
                            onPress={() => selectedFeed && toggleCommentLike(selectedFeed.id, reply.id)}>
                            <Icon
                              name={reply.isLiked ? 'heart' : 'heart-outline'}
                              size={iconSize(12)}
                              color={reply.isLiked ? '#FF3B30' : subtextColor}
                            />
                            <Text style={[styles.commentActionText, {color: reply.isLiked ? '#FF3B30' : subtextColor, fontSize: fp(10)}]}>
                              {reply.likes || 0}
                            </Text>
                          </TouchableOpacity>
                          {/* 대댓글 신고 버튼 (오른쪽 끝) */}
                          <TouchableOpacity
                            style={styles.replyReportButton}
                            onPress={() => openReportModal('reply', reply.id, reply.author.nickname)}>
                            <Icon name="alert-circle-outline" size={iconSize(12)} color={subtextColor} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            />
          )}

          {/* 댓글 입력 */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            style={styles.commentInputWrapper}>
            {/* 대댓글 표시 */}
            {replyTo && (
              <View style={[styles.replyToBar, {backgroundColor: isDark ? '#2A2A2A' : '#F0F0F0'}]}>
                <Text style={[styles.replyToText, {color: subtextColor}]}>
                  @{replyTo.author.nickname}에게 답글 작성 중
                </Text>
                <TouchableOpacity onPress={() => setReplyTo(null)}>
                  <Icon name="close-circle" size={iconSize(18)} color={subtextColor} />
                </TouchableOpacity>
              </View>
            )}
            {/* 이미지 미리보기 */}
            {commentImage && (
              <View style={[styles.commentImagePreview, {backgroundColor: isDark ? '#2A2A2A' : '#F0F0F0'}]}>
                <Image source={{uri: commentImage}} style={styles.commentImagePreviewImg} />
                <TouchableOpacity
                  style={styles.commentImageRemove}
                  onPress={() => setCommentImage(null)}>
                  <Icon name="close-circle" size={iconSize(20)} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            )}
            <View style={[styles.commentInput, {backgroundColor: cardBg, borderTopColor: borderColor}]}>
              <TouchableOpacity
                style={styles.commentImageButton}
                onPress={handleSelectCommentImage}>
                <Icon name="image-outline" size={iconSize(22)} color={subtextColor} />
              </TouchableOpacity>
              <TextInput
                style={[styles.commentTextInput, {color: textColor, backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5'}]}
                placeholder={replyTo ? `@${replyTo.author.nickname}에게 답글...` : '댓글을 입력하세요'}
                placeholderTextColor={subtextColor}
                value={commentText}
                onChangeText={setCommentText}
                multiline
              />
              <TouchableOpacity
                style={[styles.commentSendButton, {backgroundColor: accentColor}]}
                onPress={handleSubmitComment}>
                <Icon name="send" size={iconSize(18)} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>

          {/* 신고 오버레이 (게시글 상세 모달 내부) */}
          {showReportModal && (
            <View style={styles.reportModalOverlay}>
              <TouchableOpacity
                style={styles.reportModalBackdrop}
                activeOpacity={1}
                onPress={() => {
                  setShowReportModal(false);
                  setReportTarget(null);
                  setSelectedReportReason(null);
                }}
              />
              <View style={[styles.reportModalContainer, {backgroundColor: cardBg}]}>
                {/* 헤더 */}
                <View style={[styles.reportModalHeader, {borderBottomColor: borderColor}]}>
                  <Text style={[styles.reportModalTitle, {color: textColor}]}>신고하기</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setShowReportModal(false);
                      setReportTarget(null);
                      setSelectedReportReason(null);
                    }}>
                    <Icon name="close" size={iconSize(24)} color={subtextColor} />
                  </TouchableOpacity>
                </View>

                {/* 신고 대상 정보 */}
                {reportTarget && (
                  <View style={[styles.reportTargetInfo, {backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5'}]}>
                    <Icon
                      name={reportTarget.type === 'post' ? 'document-text' : 'chatbubble'}
                      size={iconSize(16)}
                      color={subtextColor}
                    />
                    <Text style={[styles.reportTargetText, {color: subtextColor}]}>
                      {reportTarget.authorName}님의 {reportTarget.type === 'post' ? '게시글' : reportTarget.type === 'comment' ? '댓글' : '답글'}
                    </Text>
                  </View>
                )}

                {/* 신고 사유 목록 */}
                <View style={styles.reportReasonList}>
                  <Text style={[styles.reportReasonLabel, {color: subtextColor}]}>신고 사유를 선택해주세요</Text>
                  {REPORT_REASONS.map((reason) => (
                    <TouchableOpacity
                      key={reason.id}
                      style={[
                        styles.reportReasonItem,
                        {borderColor: borderColor},
                        selectedReportReason === reason.id && {borderColor: accentColor, backgroundColor: accentColor + '10'},
                      ]}
                      onPress={() => setSelectedReportReason(reason.id)}>
                      <Icon
                        name={reason.icon as any}
                        size={iconSize(20)}
                        color={selectedReportReason === reason.id ? accentColor : subtextColor}
                      />
                      <Text style={[
                        styles.reportReasonText,
                        {color: textColor},
                        selectedReportReason === reason.id && {color: accentColor, fontWeight: '600'},
                      ]}>
                        {reason.label}
                      </Text>
                      {selectedReportReason === reason.id && (
                        <Icon name="checkmark-circle" size={iconSize(20)} color={accentColor} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* 제출 버튼 */}
                <TouchableOpacity
                  style={[
                    styles.reportSubmitButton,
                    {backgroundColor: selectedReportReason ? '#FF3B30' : isDark ? '#3C3C3E' : '#E5E5EA'},
                  ]}
                  onPress={handleSubmitReport}
                  disabled={!selectedReportReason}>
                  <Text style={[
                    styles.reportSubmitText,
                    {color: selectedReportReason ? '#FFFFFF' : subtextColor},
                  ]}>
                    신고하기
                  </Text>
                </TouchableOpacity>

                {/* 안내 문구 */}
                <Text style={[styles.reportNotice, {color: subtextColor}]}>
                  허위 신고 시 서비스 이용이 제한될 수 있습니다
                </Text>
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* 글쓰기 모달 */}
      <Modal
        visible={showWriteModal}
        animationType="slide"
        onRequestClose={() => setShowWriteModal(false)}>
        <SafeAreaView style={[styles.modalContainer, {backgroundColor: bgColor}]}>
          <View style={[styles.modalHeader, {backgroundColor: cardBg, borderBottomColor: borderColor}]}>
            <TouchableOpacity onPress={() => setShowWriteModal(false)}>
              <Text style={[styles.cancelText, {color: subtextColor}]}>취소</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, {color: textColor}]}>글쓰기</Text>
            <TouchableOpacity onPress={handleSubmitPost}>
              <Text style={[styles.submitText, {color: accentColor}]}>완료</Text>
            </TouchableOpacity>
          </View>

          {/* 카테고리 선택 */}
          <View style={[styles.writeCategoryContainer, {backgroundColor: cardBg}]}>
            <Text style={[styles.writeCategoryLabel, {color: subtextColor}]}>카테고리</Text>
            <View style={styles.writeCategoryOptions}>
              {WRITE_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.writeCategoryOption,
                    {borderColor: borderColor},
                    writeCategory === cat.id && {borderColor: accentColor, backgroundColor: accentColor + '10'},
                  ]}
                  onPress={() => setWriteCategory(cat.id)}>
                  <Text
                    style={[
                      styles.writeCategoryOptionText,
                      {color: subtextColor},
                      writeCategory === cat.id && {color: accentColor, fontWeight: '600'},
                    ]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 제목 입력 (선택) */}
          <View style={[styles.writeTitleContainer, {backgroundColor: cardBg, borderBottomColor: borderColor}]}>
            <TextInput
              style={[styles.writeTitleInput, {color: textColor}]}
              placeholder="제목 (선택)"
              placeholderTextColor={subtextColor}
              value={writeTitle}
              onChangeText={setWriteTitle}
              maxLength={50}
            />
          </View>

          {/* 내용 입력 */}
          <View style={[styles.writeContentContainer, {backgroundColor: cardBg}]}>
            <TextInput
              style={[styles.writeTextInput, {color: textColor}]}
              placeholder="무슨 생각을 하고 계신가요?"
              placeholderTextColor={subtextColor}
              value={writeContent}
              onChangeText={setWriteContent}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* 안내 */}
          <View style={styles.writeHint}>
            <Icon name="information-circle-outline" size={iconSize(16)} color={subtextColor} />
            <Text style={[styles.writeHintText, {color: subtextColor}]}>
              오공완은 공부 기록 탭에서 공유할 수 있어요
            </Text>
          </View>
        </SafeAreaView>
      </Modal>

      {/* 검색 모달 */}
      <Modal
        visible={showSearchModal}
        animationType="slide"
        onRequestClose={() => {
          setShowSearchModal(false);
          setSearchQuery('');
          setSearchResults([]);
        }}>
        <SafeAreaView style={[styles.modalContainer, {backgroundColor: bgColor}]}>
          {/* 검색 헤더 */}
          <View style={[styles.searchHeader, {backgroundColor: cardBg, borderBottomColor: borderColor}]}>
            <TouchableOpacity
              onPress={() => {
                setShowSearchModal(false);
                setSearchQuery('');
                setSearchResults([]);
              }}
              style={styles.searchBackButton}>
              <Icon name="arrow-back" size={iconSize(24)} color={textColor} />
            </TouchableOpacity>
            <View style={[styles.searchInputContainer, {backgroundColor: isDark ? '#2C2C2E' : '#F0F0F0'}]}>
              <Icon name="search" size={iconSize(18)} color={subtextColor} />
              <TextInput
                style={[styles.searchInput, {color: textColor}]}
                placeholder="게시글, 작성자 검색"
                placeholderTextColor={subtextColor}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Icon name="close-circle" size={iconSize(18)} color={subtextColor} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* 검색 결과 */}
          {searchQuery.trim() === '' ? (
            <View style={styles.searchGuide}>
              <Icon name="search-outline" size={iconSize(50)} color={subtextColor} />
              <Text style={[styles.searchGuideText, {color: subtextColor}]}>
                검색어를 입력해주세요
              </Text>
              <Text style={[styles.searchGuideSubtext, {color: subtextColor}]}>
                게시글 내용, 제목, 작성자를 검색할 수 있어요
              </Text>
            </View>
          ) : searchResults.length === 0 ? (
            <View style={styles.searchGuide}>
              <Icon name="document-text-outline" size={iconSize(50)} color={subtextColor} />
              <Text style={[styles.searchGuideText, {color: subtextColor}]}>
                검색 결과가 없어요
              </Text>
              <Text style={[styles.searchGuideSubtext, {color: subtextColor}]}>
                다른 검색어로 시도해보세요
              </Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              renderItem={({item}) => (
                <PostListItem
                  post={item}
                  isDark={isDark}
                  onPress={() => {
                    setShowSearchModal(false);
                    setSearchQuery('');
                    setSearchResults([]);
                    handleComment(item);
                  }}
                  highlightQuery={searchQuery}
                />
              )}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.searchResultsList}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <View style={[styles.searchResultsHeader, {borderBottomColor: borderColor}]}>
                  <Text style={[styles.searchResultsCount, {color: subtextColor}]}>
                    검색 결과 {searchResults.length}건
                  </Text>
                </View>
              }
            />
          )}
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: sp(16),
    paddingVertical: hp(12),
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: fp(22),
    fontWeight: '800',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(10),
  },
  headerIconButton: {
    width: touchSize(40),
    height: touchSize(40),
    borderRadius: sp(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  writeButton: {
    width: touchSize(40),
    height: touchSize(40),
    borderRadius: sp(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 게시판 헤더 스타일
  boardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
  },
  backButton: {
    padding: sp(4),
    marginLeft: -sp(8),
  },
  boardDescription: {
    fontSize: fp(12),
    marginTop: hp(2),
  },
  // 카테고리 그리드 스타일
  categoryGridContainer: {
    flex: 1,
  },
  categoryGridContent: {
    padding: sp(16),
    paddingBottom: hp(100),
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sp(12),
  },
  categoryCard: {
    width: '47%',
    padding: sp(16),
    borderRadius: sp(16),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  displayTypeBadge: {
    position: 'absolute',
    top: sp(10),
    right: sp(10),
    width: sp(22),
    height: sp(22),
    borderRadius: sp(6),
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIconWrapper: {
    width: sp(52),
    height: sp(52),
    borderRadius: sp(14),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(12),
  },
  categoryCardLabel: {
    fontSize: fp(16),
    fontWeight: '700',
    marginBottom: hp(4),
  },
  categoryCardDesc: {
    fontSize: fp(12),
  },
  // 인기글 섹션
  popularSection: {
    marginTop: hp(24),
  },
  sectionTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    marginBottom: hp(12),
  },
  popularItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: sp(14),
    borderRadius: sp(12),
    borderWidth: 1,
    marginBottom: hp(8),
  },
  popularItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(10),
  },
  popularCategoryBadge: {
    paddingHorizontal: sp(8),
    paddingVertical: hp(4),
    borderRadius: sp(6),
  },
  popularCategoryText: {
    fontSize: fp(11),
    fontWeight: '600',
  },
  popularTitle: {
    flex: 1,
    fontSize: fp(14),
    fontWeight: '500',
  },
  popularStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(4),
  },
  popularStatText: {
    fontSize: fp(12),
  },
  // 검색 스타일
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(12),
    paddingVertical: hp(10),
    borderBottomWidth: 1,
    gap: sp(10),
  },
  searchBackButton: {
    padding: sp(4),
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(12),
    paddingVertical: hp(10),
    borderRadius: sp(10),
    gap: sp(8),
  },
  searchInput: {
    flex: 1,
    fontSize: fp(15),
    padding: 0,
  },
  searchGuide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: hp(12),
  },
  searchGuideText: {
    fontSize: fp(16),
    fontWeight: '600',
  },
  searchGuideSubtext: {
    fontSize: fp(14),
  },
  searchResultsList: {
    paddingBottom: hp(20),
  },
  searchResultsHeader: {
    paddingHorizontal: sp(16),
    paddingVertical: hp(10),
    borderBottomWidth: 1,
  },
  searchResultsCount: {
    fontSize: fp(13),
    fontWeight: '500',
  },
  // Pull to Refresh 힌트
  pullHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp(8),
    marginHorizontal: sp(16),
    marginVertical: hp(8),
    paddingVertical: hp(10),
    paddingHorizontal: sp(16),
    borderRadius: sp(12),
  },
  pullHintText: {
    fontSize: fp(12),
    fontWeight: '500',
  },
  // 게시판 컨테이너
  boardContainer: {
    flex: 1,
  },
  feedList: {
    paddingVertical: hp(8),
    paddingBottom: hp(100),
  },
  listContainer: {
    flex: 1,
  },
  postList: {
    paddingBottom: hp(20),
  },
  listHeader: {
    paddingHorizontal: sp(16),
    paddingVertical: hp(10),
    borderBottomWidth: 1,
  },
  listHeaderText: {
    fontSize: fp(12),
    fontWeight: '500',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp(12),
    paddingHorizontal: sp(16),
    borderTopWidth: 1,
    gap: sp(4),
    marginBottom: hp(80),
  },
  pageButton: {
    width: sp(36),
    height: sp(36),
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  pageButtonDisabled: {
    opacity: 0.4,
  },
  pageNumbers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(4),
    marginHorizontal: sp(8),
  },
  pageNumber: {
    width: sp(32),
    height: sp(32),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: sp(16),
  },
  pageNumberText: {
    fontSize: fp(14),
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: hp(100),
  },
  emptyText: {
    fontSize: fp(16),
    fontWeight: '600',
    marginTop: hp(16),
  },
  emptySubtext: {
    fontSize: fp(14),
    marginTop: hp(4),
  },
  // 모달 스타일
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: sp(16),
    paddingVertical: hp(12),
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: fp(16),
    fontWeight: '700',
  },
  cancelText: {
    fontSize: fp(14),
  },
  submitText: {
    fontSize: fp(14),
    fontWeight: '600',
  },
  originalPost: {
    padding: sp(16),
    borderBottomWidth: 1,
  },
  originalAuthor: {
    fontSize: fp(14),
    fontWeight: '600',
    marginBottom: hp(4),
  },
  originalContent: {
    fontSize: fp(13),
    lineHeight: fp(18),
  },
  // 게시글 상세 스타일
  postDetail: {
    padding: sp(16),
    marginHorizontal: sp(12),
    marginTop: hp(12),
    borderRadius: sp(16),
    shadowOffset: {width: 0, height: 2},
  },
  postDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(16),
  },
  postDetailAvatarContainer: {
    position: 'relative',
  },
  postDetailAvatarBorder: {
    width: sp(48),
    height: sp(48),
    borderRadius: sp(10),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: 'transparent',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
    elevation: 3,
  },
  postDetailAvatar: {
    width: sp(43),
    height: sp(43),
    borderRadius: sp(8),
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  postDetailAvatarImage: {
    width: '100%',
    height: '100%',
  },
  postDetailLevelCircle: {
    position: 'absolute',
    top: -hp(4),
    right: -sp(6),
    minWidth: sp(20),
    height: sp(18),
    borderRadius: sp(9),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    paddingHorizontal: sp(4),
  },
  postDetailLevelCircleText: {
    fontSize: fp(9),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  postDetailBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(3),
    marginRight: sp(4),
  },
  postDetailBadgeIcon: {
    width: sp(20),
    height: sp(20),
    borderRadius: sp(5),
    justifyContent: 'center',
    alignItems: 'center',
  },
  postDetailAvatarText: {
    fontSize: fp(18),
    fontWeight: '700',
  },
  postDetailAuthorInfo: {
    marginLeft: sp(12),
    flex: 1,
  },
  postDetailAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
  },
  postDetailAuthorName: {
    fontSize: fp(15),
    fontWeight: '600',
  },
  postDetailTierBadge: {
    paddingHorizontal: sp(6),
    paddingVertical: hp(2),
    borderRadius: sp(8),
  },
  postDetailTierText: {
    fontSize: fp(11),
    fontWeight: '600',
  },
  postDetailSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(6),
    marginTop: hp(4),
    flexWrap: 'wrap',
  },
  postDetailTitleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(3),
    paddingHorizontal: sp(6),
    paddingVertical: hp(2),
    borderRadius: sp(6),
  },
  postDetailTitleText: {
    fontSize: fp(10),
    fontWeight: '600',
  },
  postDetailTime: {
    fontSize: fp(11),
  },
  postDetailTitle: {
    fontSize: fp(20),
    fontWeight: '700',
    marginBottom: hp(12),
    lineHeight: fp(28),
  },
  postDetailContent: {
    fontSize: fp(15),
    lineHeight: fp(24),
    marginBottom: hp(16),
  },
  // 오공완/스터디 데이터 카드
  detailStudyCard: {
    padding: sp(14),
    borderRadius: sp(12),
    marginBottom: hp(16),
  },
  detailStudyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(12),
  },
  detailStudyTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
  },
  detailStudyTimeText: {
    fontSize: fp(18),
    fontWeight: '700',
  },
  detailStreakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(10),
    paddingVertical: hp(5),
    borderRadius: sp(12),
    gap: sp(4),
  },
  detailStreakText: {
    color: '#FFFFFF',
    fontSize: fp(12),
    fontWeight: '700',
  },
  detailSubjectList: {
    gap: hp(8),
  },
  detailSubjectItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailSubjectDot: {
    width: sp(10),
    height: sp(10),
    borderRadius: sp(5),
    marginRight: sp(10),
  },
  detailSubjectName: {
    fontSize: fp(14),
    flex: 1,
  },
  detailSubjectTime: {
    fontSize: fp(14),
    fontWeight: '600',
  },
  detailGroupTitle: {
    fontSize: fp(16),
    fontWeight: '700',
    marginBottom: hp(6),
  },
  detailGroupDesc: {
    fontSize: fp(14),
    lineHeight: fp(20),
    marginBottom: hp(12),
  },
  detailGroupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(12),
  },
  detailGroupMembers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(6),
  },
  detailGroupMemberText: {
    fontSize: fp(13),
  },
  detailGroupTags: {
    flexDirection: 'row',
    gap: sp(6),
  },
  detailGroupTag: {
    paddingHorizontal: sp(8),
    paddingVertical: hp(4),
    borderRadius: sp(8),
  },
  detailGroupTagText: {
    fontSize: fp(12),
    fontWeight: '500',
  },
  detailJoinButton: {
    paddingVertical: hp(12),
    borderRadius: sp(10),
    alignItems: 'center',
  },
  detailJoinButtonText: {
    color: '#FFFFFF',
    fontSize: fp(14),
    fontWeight: '600',
  },
  postDetailStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: hp(12),
    borderTopWidth: 1,
  },
  postDetailStatsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(20),
  },
  postReportButton: {
    padding: sp(4),
  },
  postDetailStatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(6),
  },
  postDetailStatText: {
    fontSize: fp(13),
    fontWeight: '500',
  },
  commentSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: sp(12),
    marginTop: hp(12),
    paddingHorizontal: sp(16),
    paddingVertical: hp(12),
    borderBottomWidth: 1,
    borderRadius: sp(12),
  },
  commentSectionTitle: {
    fontSize: fp(14),
    fontWeight: '600',
  },
  commentSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
  },
  commentRefreshButton: {
    padding: sp(2),
  },
  // 게시글 상세 우측 상단
  postDetailHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
    marginLeft: 'auto',
  },
  commentList: {
    paddingHorizontal: sp(4),
    paddingBottom: hp(16),
  },
  emptyComments: {
    paddingVertical: hp(40),
    alignItems: 'center',
    marginHorizontal: sp(12),
  },
  emptyCommentsText: {
    fontSize: fp(14),
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: hp(12),
    paddingHorizontal: sp(12),
    marginHorizontal: sp(12),
    marginTop: hp(8),
    borderRadius: sp(12),
    borderWidth: 1,
    overflow: 'visible',
  },
  commentAvatar: {
    width: sp(32),
    height: sp(32),
    borderRadius: sp(16),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: sp(10),
  },
  commentAvatarContainer: {
    position: 'relative',
    marginRight: sp(10),
    marginBottom: hp(6),
  },
  commentAvatarBorder: {
    width: sp(34),
    height: sp(34),
    borderRadius: sp(8),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
    elevation: 3,
  },
  commentAvatarInner: {
    width: sp(30),
    height: sp(30),
    borderRadius: sp(6),
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  commentAvatarImage: {
    width: '100%',
    height: '100%',
  },
  commentLevelCircle: {
    position: 'absolute',
    top: -hp(3),
    right: -sp(4),
    minWidth: sp(16),
    height: sp(14),
    borderRadius: sp(7),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    paddingHorizontal: sp(3),
  },
  commentLevelCircleText: {
    fontSize: fp(7),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  commentBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(2),
    marginRight: sp(4),
  },
  commentBadgeIcon: {
    width: sp(16),
    height: sp(16),
    borderRadius: sp(4),
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentReportButton: {
    padding: sp(2),
    marginLeft: sp(4),
  },
  commentAvatarText: {
    fontSize: fp(12),
    fontWeight: '700',
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(4),
    flexWrap: 'wrap',
    gap: sp(4),
  },
  commentAuthor: {
    fontSize: fp(13),
    fontWeight: '600',
  },
  commentLevelBadge: {
    paddingHorizontal: sp(4),
    paddingVertical: hp(1),
    borderRadius: sp(4),
  },
  commentLevelText: {
    fontSize: fp(9),
    fontWeight: '600',
  },
  commentTierBadge: {
    paddingHorizontal: sp(4),
    paddingVertical: hp(1),
    borderRadius: sp(4),
  },
  commentTierText: {
    fontSize: fp(9),
    fontWeight: '600',
  },
  commentTime: {
    fontSize: fp(11),
    marginLeft: 'auto',
  },
  commentText: {
    fontSize: fp(13),
    lineHeight: fp(18),
  },
  commentImage: {
    width: '100%',
    height: hp(150),
    borderRadius: sp(10),
    marginTop: hp(8),
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hp(8),
  },
  commentActionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(16),
  },
  commentActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(4),
  },
  commentActionText: {
    fontSize: fp(11),
  },
  replyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: hp(10),
    paddingHorizontal: sp(12),
    marginHorizontal: sp(12),
    marginLeft: sp(32),
    marginTop: hp(4),
    borderRadius: sp(10),
    borderWidth: 1,
  },
  replyIcon: {
    marginRight: sp(6),
    marginTop: hp(4),
  },
  replyAvatar: {
    width: sp(26),
    height: sp(26),
    borderRadius: sp(13),
  },
  replyAvatarContainer: {
    position: 'relative',
    marginRight: sp(8),
  },
  replyAvatarBorder: {
    width: sp(26),
    height: sp(26),
    borderRadius: sp(6),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: {width: 0, height: 1},
    elevation: 2,
  },
  replyAvatarInner: {
    width: sp(23),
    height: sp(23),
    borderRadius: sp(5),
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  replyAvatarImage: {
    width: '100%',
    height: '100%',
  },
  replyLevelCircle: {
    position: 'absolute',
    top: -hp(2),
    right: -sp(3),
    minWidth: sp(12),
    height: sp(11),
    borderRadius: sp(5.5),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: sp(2),
  },
  replyLevelCircleText: {
    fontSize: fp(6),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  replyBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(2),
    marginRight: sp(3),
  },
  replyBadgeIcon: {
    width: sp(14),
    height: sp(14),
    borderRadius: sp(3),
    justifyContent: 'center',
    alignItems: 'center',
  },
  replyReportButton: {
    padding: sp(2),
    marginLeft: 'auto',
  },
  replyToBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sp(16),
    paddingVertical: hp(8),
  },
  replyToText: {
    fontSize: fp(12),
  },
  commentImagePreview: {
    paddingHorizontal: sp(16),
    paddingVertical: hp(8),
  },
  commentImagePreviewImg: {
    width: sp(80),
    height: sp(80),
    borderRadius: sp(8),
  },
  commentImageRemove: {
    position: 'absolute',
    top: hp(4),
    left: sp(84),
  },
  commentImageButton: {
    padding: sp(6),
  },
  commentInputWrapper: {
    // 하단에 자연스럽게 배치
  },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: sp(12),
    borderTopWidth: 1,
    gap: sp(10),
  },
  commentTextInput: {
    flex: 1,
    paddingHorizontal: sp(14),
    paddingVertical: hp(10),
    borderRadius: sp(20),
    fontSize: fp(14),
    maxHeight: hp(100),
  },
  commentSendButton: {
    width: sp(36),
    height: sp(36),
    borderRadius: sp(18),
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 글쓰기 모달
  writeCategoryContainer: {
    padding: sp(16),
  },
  writeCategoryLabel: {
    fontSize: fp(12),
    fontWeight: '600',
    marginBottom: hp(10),
  },
  writeCategoryOptions: {
    flexDirection: 'row',
    gap: sp(8),
  },
  writeCategoryOption: {
    paddingHorizontal: sp(14),
    paddingVertical: hp(8),
    borderRadius: sp(16),
    borderWidth: 1,
  },
  writeCategoryOptionText: {
    fontSize: fp(13),
  },
  writeTitleContainer: {
    paddingHorizontal: sp(16),
    paddingVertical: hp(12),
    borderBottomWidth: 1,
  },
  writeTitleInput: {
    fontSize: fp(16),
    fontWeight: '600',
  },
  writeContentContainer: {
    flex: 1,
    padding: sp(16),
  },
  writeTextInput: {
    flex: 1,
    fontSize: fp(15),
    lineHeight: fp(22),
  },
  writeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: sp(16),
    gap: sp(6),
  },
  writeHintText: {
    fontSize: fp(12),
  },
  boardList: {
    paddingBottom: hp(20),
  },
  boardListHeader: {
    paddingHorizontal: sp(16),
    paddingVertical: hp(10),
    borderBottomWidth: 1,
  },
  boardListHeaderText: {
    fontSize: fp(12),
    fontWeight: '500',
  },
  boardEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: hp(100),
    gap: hp(12),
  },
  boardEmptyText: {
    fontSize: fp(15),
    fontWeight: '500',
  },
  boardEmptyButton: {
    paddingHorizontal: sp(20),
    paddingVertical: hp(12),
    borderRadius: sp(12),
    marginTop: hp(8),
  },
  boardEmptyButtonText: {
    color: '#FFFFFF',
    fontSize: fp(14),
    fontWeight: '600',
  },
  // 서브탭 플레이스홀더 스타일
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: sp(40),
    gap: hp(12),
  },
  placeholderTitle: {
    fontSize: fp(22),
    fontWeight: '700',
    marginTop: hp(16),
  },
  placeholderDesc: {
    fontSize: fp(14),
    textAlign: 'center',
    lineHeight: fp(20),
  },
  // 신고 모달 스타일
  reportModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: sp(20),
    zIndex: 1000,
  },
  reportModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  reportModalContainer: {
    width: '100%',
    maxWidth: sp(360),
    borderRadius: sp(20),
    overflow: 'hidden',
  },
  reportModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: sp(16),
    borderBottomWidth: 1,
  },
  reportModalTitle: {
    fontSize: fp(18),
    fontWeight: '700',
  },
  reportTargetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
    marginHorizontal: sp(16),
    marginTop: hp(12),
    padding: sp(12),
    borderRadius: sp(10),
  },
  reportTargetText: {
    fontSize: fp(13),
  },
  reportReasonList: {
    padding: sp(16),
  },
  reportReasonLabel: {
    fontSize: fp(13),
    marginBottom: hp(12),
  },
  reportReasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(12),
    padding: sp(14),
    borderRadius: sp(12),
    borderWidth: 1,
    marginBottom: hp(8),
  },
  reportReasonText: {
    flex: 1,
    fontSize: fp(14),
  },
  reportSubmitButton: {
    marginHorizontal: sp(16),
    paddingVertical: hp(14),
    borderRadius: sp(12),
    alignItems: 'center',
  },
  reportSubmitText: {
    fontSize: fp(15),
    fontWeight: '600',
  },
  reportNotice: {
    fontSize: fp(11),
    textAlign: 'center',
    paddingVertical: hp(16),
  },
});

export default CommunityScreen;
