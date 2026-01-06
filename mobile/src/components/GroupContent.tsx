import React, {useState, useCallback, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Modal,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  Animated,
  Dimensions,
  Switch,
} from 'react-native';
import {PanGestureHandler, State} from 'react-native-gesture-handler';
import Icon from '@react-native-vector-icons/ionicons';
import {useThemeStore} from '../store/themeStore';
import {useNavigationStore} from '../store/navigationStore';
import {
  useGroupStore,
  Group,
  GroupCategory,
  GROUP_CATEGORIES,
  GroupNotice,
} from '../store/groupStore';
import {safeGetColorScheme, safeAddAppearanceListener} from '../utils/appearance';
import {sp, hp, fp, iconSize, touchSize} from '../utils/responsive';
import TimeTimer from './TimeTimer';
import ProfileCard, {CardFrameType} from './ProfileCard';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

type StudyRoomType = 'free' | 'focus' | null;

// 티어별 색상 (학업 스타일)
const getTierColor = (tier?: string) => {
  switch (tier) {
    // 박사 등급
    case '명예박사':
      return '#FFD700';
    case '박사':
      return '#9C27B0';
    // 석사 등급
    case '석사 III':
    case '석사 II':
    case '석사 I':
      return '#00BCD4';
    // 학사 등급
    case '학사 III':
    case '학사 II':
    case '학사 I':
      return '#4CAF50';
    // 학생 등급
    case '고등학생':
      return '#FF9800';
    case '중학생':
      return '#78909C';
    case '초등학생':
      return '#A1887F';
    default:
      return '#9E9E9E';
  }
};

// 공부시간 포맷
const formatStudyTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}시간 ${mins > 0 ? `${mins}분` : ''}`;
  }
  return `${mins}분`;
};

// 날짜 범위 계산 헬퍼
const getDateRangeInfo = (periodType: 'day' | 'week' | 'month', offset: number) => {
  const now = new Date();
  let startDate: Date;
  let endDate: Date;
  let displayText: string;

  if (periodType === 'day') {
    const date = new Date(now);
    date.setDate(date.getDate() + offset);
    startDate = date;
    endDate = date;
    if (offset === 0) {
      displayText = '오늘';
    } else if (offset === -1) {
      displayText = '어제';
    } else {
      displayText = `${date.getMonth() + 1}월 ${date.getDate()}일`;
    }
  } else if (periodType === 'week') {
    const weekStart = new Date(now);
    const dayOfWeek = weekStart.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    weekStart.setDate(weekStart.getDate() + mondayOffset + (offset * 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    startDate = weekStart;
    endDate = weekEnd;
    if (offset === 0) {
      displayText = '이번 주';
    } else if (offset === -1) {
      displayText = '지난 주';
    } else {
      displayText = `${weekStart.getMonth() + 1}/${weekStart.getDate()} - ${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`;
    }
  } else {
    const monthDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
    startDate = monthDate;
    endDate = monthEnd;
    if (offset === 0) {
      displayText = '이번 달';
    } else if (offset === -1) {
      displayText = '지난 달';
    } else {
      displayText = `${monthDate.getFullYear()}년 ${monthDate.getMonth() + 1}월`;
    }
  }

  return { startDate, endDate, displayText };
};

const GroupContent: React.FC = () => {
  const [systemColorScheme, setSystemColorScheme] = useState<'light' | 'dark'>('light');
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'info' | 'members' | 'board' | 'chat' | 'study'>('info');
  const [studyPeriodType, setStudyPeriodType] = useState<'day' | 'week' | 'month'>('day'); // 1일/7일/1달 단위
  const [studyDateOffset, setStudyDateOffset] = useState(0); // 날짜 오프셋 (0=오늘/이번주/이번달)
  const [_showMoreMenu, _setShowMoreMenu] = useState(false); // 더보기 메뉴 표시 여부 (미래 사용을 위해 보존)
  const [isSearchMode, setIsSearchMode] = useState(false); // 검색 모드 여부
  const [selectedPost, setSelectedPost] = useState<GroupNotice | null>(null); // 선택된 게시글
  const [showPostDetail, setShowPostDetail] = useState(false); // 게시글 상세 페이지

  // 가입 모달 관련 상태
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinTargetGroup, setJoinTargetGroup] = useState<Group | null>(null);
  const [joinPassword, setJoinPassword] = useState('');
  const [joinMessage, setJoinMessage] = useState('');

  // 스터디 룸 관련 상태
  const [showStudyRoom, setShowStudyRoom] = useState(false);
  const [studyRoomType, setStudyRoomType] = useState<StudyRoomType>(null);

  // 그룹 설정 페이지 관련 상태
  const [showSettingsPage, setShowSettingsPage] = useState(false);
  const settingsSlideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const settingsSwipeAnim = useRef(new Animated.Value(0)).current;

  // 그룹 알림 설정 상태
  const [notifyNewPost, setNotifyNewPost] = useState(true);
  const [notifyComment, setNotifyComment] = useState(true);
  const [notifyNotice, setNotifyNotice] = useState(true);
  const [notifyChat, setNotifyChat] = useState(true);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(25 * 60);
  const [isSessionRunning, setIsSessionRunning] = useState(true);
  const [isBreakTime, setIsBreakTime] = useState(false); // 휴식 시간 여부
  const FOCUS_TIME = 25 * 60; // 25분 집중
  const BREAK_TIME = 5 * 60; // 5분 휴식

  // 모임 생성 폼
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupCategory, setNewGroupCategory] = useState<GroupCategory>('exam');
  const [newGroupTags, setNewGroupTags] = useState('');
  const [newGroupMaxMembers, setNewGroupMaxMembers] = useState('20');
  const [newGroupMinStudyHours, setNewGroupMinStudyHours] = useState('10');
  const [newGroupRequireApproval, setNewGroupRequireApproval] = useState(true);
  const [newGroupIsPrivate, setNewGroupIsPrivate] = useState(false);
  const [newGroupImage, setNewGroupImage] = useState<string | null>(null);

  // 스와이프로 탭 전환
  const handleTabSwipe = useCallback((direction: 'left' | 'right') => {
    // 탭 순서 정의 (스와이프 네비게이션용)
    const detailTabOrder: Array<'info' | 'members' | 'study' | 'board' | 'chat'> = ['info', 'members', 'study', 'board', 'chat'];
    const currentIndex = detailTabOrder.indexOf(activeDetailTab);
    if (direction === 'left' && currentIndex < detailTabOrder.length - 1) {
      setActiveDetailTab(detailTabOrder[currentIndex + 1]);
    } else if (direction === 'right' && currentIndex > 0) {
      setActiveDetailTab(detailTabOrder[currentIndex - 1]);
    }
  }, [activeDetailTab]);

  // PanGestureHandler 이벤트
  const handleTabGestureEvent = useCallback((event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, velocityX } = event.nativeEvent;
      const swipeThreshold = 50;
      const velocityThreshold = 500;

      if (translationX < -swipeThreshold || velocityX < -velocityThreshold) {
        handleTabSwipe('left');
      } else if (translationX > swipeThreshold || velocityX > velocityThreshold) {
        handleTabSwipe('right');
      }
    }
  }, [handleTabSwipe]);

  // 샘플 이미지 목록 (실제 앱에서는 이미지 피커 사용)
  const SAMPLE_GROUP_IMAGES = [
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400',
    'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400',
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400',
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400',
    'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400',
  ];

  const {themeMode} = useThemeStore();

  const {
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    showRecruitingOnly,
    setShowRecruitingOnly,
    selectedGroup,
    selectGroup,
    myGroups,
    getFilteredGroups,
    createGroup,
    joinGroup,
    applyToGroup,
    leaveGroup,
  } = useGroupStore();

  const {setGroupDetailVisible} = useNavigationStore();

  useEffect(() => {
    setSystemColorScheme(safeGetColorScheme());
    const subscription = safeAddAppearanceListener((colorScheme) => {
      setSystemColorScheme(colorScheme);
    });
    return () => subscription?.remove();
  }, []);

  // 모임 상세 페이지가 열리면 탭바 숨기기
  useEffect(() => {
    setGroupDetailVisible(showDetailModal);
  }, [showDetailModal, setGroupDetailVisible]);

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

  const filteredGroups = getFilteredGroups();

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // 설정 페이지 열기
  const handleOpenSettings = () => {
    setShowMoreMenu(false);
    setShowSettingsPage(true);
    Animated.spring(settingsSlideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  };

  // 설정 페이지 닫기
  const handleCloseSettings = () => {
    Animated.timing(settingsSlideAnim, {
      toValue: SCREEN_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowSettingsPage(false);
      settingsSwipeAnim.setValue(0);
    });
  };

  // 설정 페이지 스와이프 핸들러
  const onSettingsSwipeGestureEvent = Animated.event(
    [{nativeEvent: {translationX: settingsSwipeAnim}}],
    {useNativeDriver: true}
  );

  const onSettingsSwipeStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const {translationX, velocityX} = event.nativeEvent;
      if (translationX > 100 || velocityX > 500) {
        Animated.timing(settingsSlideAnim, {
          toValue: SCREEN_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          setShowSettingsPage(false);
          settingsSwipeAnim.setValue(0);
          settingsSlideAnim.setValue(SCREEN_WIDTH);
        });
      } else {
        Animated.spring(settingsSwipeAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 10,
        }).start();
      }
    }
  };

  // 그룹 탈퇴 확인
  const handleLeaveGroup = () => {
    if (!selectedGroup) {return;}
    Alert.alert(
      '모임 탈퇴',
      `정말 '${selectedGroup.name}' 모임을 탈퇴하시겠습니까?\n탈퇴 후에는 다시 가입해야 합니다.`,
      [
        {text: '취소', style: 'cancel'},
        {
          text: '탈퇴',
          style: 'destructive',
          onPress: () => {
            leaveGroup(selectedGroup.id);
            handleCloseSettings();
            setShowDetailModal(false);
            selectGroup(null);
          },
        },
      ]
    );
  };

  // 스터디 룸 타이머
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showStudyRoom && isSessionRunning && sessionTimeLeft > 0) {
      interval = setInterval(() => {
        setSessionTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (showStudyRoom && isSessionRunning && sessionTimeLeft === 0) {
      // 타이머 종료 처리
      if (!isBreakTime) {
        // 집중 시간 끝 -> 휴식 시간 시작
        setIsBreakTime(true);
        setSessionTimeLeft(BREAK_TIME);
      } else {
        // 휴식 시간 끝 -> 자동 종료
        setShowStudyRoom(false);
        setStudyRoomType(null);
        setIsBreakTime(false);
        setShowDetailModal(true);
      }
    }
    return () => clearInterval(interval);
  }, [showStudyRoom, isSessionRunning, sessionTimeLeft, isBreakTime, BREAK_TIME]);

  // 스터디 룸 입장
  const enterStudyRoom = (type: StudyRoomType) => {
    setStudyRoomType(type);
    setShowDetailModal(false); // 디테일 모달 닫기
    setShowStudyRoom(true);
    setSessionTimeLeft(FOCUS_TIME);
    setIsSessionRunning(true);
    setIsBreakTime(false);
  };

  // 스터디 룸 나가기
  const exitStudyRoom = () => {
    if (studyRoomType === 'focus') {
      Alert.alert(
        '스터디 종료',
        '집중모드를 종료하면 집중 기록이 저장됩니다.\n정말 나가시겠어요?',
        [
          {text: '취소', style: 'cancel'},
          {
            text: '나가기',
            style: 'destructive',
            onPress: () => {
              setShowStudyRoom(false);
              setStudyRoomType(null);
              setIsBreakTime(false);
              setShowDetailModal(true); // 디테일 모달로 돌아가기
            },
          },
        ]
      );
    } else {
      Alert.alert(
        '스터디 종료',
        isBreakTime ? '휴식 시간입니다. 종료하시겠어요?' : '스터디를 종료하시겠어요?',
        [
          {text: '취소', style: 'cancel'},
          {
            text: '나가기',
            onPress: () => {
              setShowStudyRoom(false);
              setStudyRoomType(null);
              setIsBreakTime(false);
              setShowDetailModal(true); // 디테일 모달로 돌아가기
            },
          },
        ]
      );
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  void (isBreakTime ? BREAK_TIME : FOCUS_TIME); // totalSessionTime 계산용

  const handleCreateGroup = () => {
    if (!newGroupName.trim() || !newGroupDesc.trim()) {return;}

    createGroup({
      name: newGroupName.trim(),
      description: newGroupDesc.trim(),
      category: newGroupCategory,
      tags: newGroupTags.split(',').map((t) => t.trim()).filter((t) => t),
      status: 'recruiting',
      leaderId: 'currentUser',
      maxMembers: parseInt(newGroupMaxMembers, 10) || 20,
      rules: {
        minStudyMinutesPerWeek: (parseInt(newGroupMinStudyHours, 10) || 10) * 60,
      },
      isPrivate: newGroupIsPrivate,
      requireApproval: newGroupRequireApproval,
      coverImage: newGroupImage || undefined,
      posts: [],
    });

    // 초기화
    setNewGroupName('');
    setNewGroupDesc('');
    setNewGroupCategory('exam');
    setNewGroupTags('');
    setNewGroupMaxMembers('20');
    setNewGroupMinStudyHours('10');
    setNewGroupRequireApproval(true);
    setNewGroupIsPrivate(false);
    setNewGroupImage(null);
    setShowCreateModal(false);
  };

  // 가입 모달 열기
  const openJoinModal = (group: Group) => {
    setJoinTargetGroup(group);
    setJoinPassword('');
    setJoinMessage('');
    setShowJoinModal(true);
  };

  // 가입 처리
  const handleJoinGroup = (group: Group) => {
    if (group.requireApproval) {
      applyToGroup(group.id, joinMessage || '가입 신청합니다!');
    } else {
      joinGroup(group.id);
    }
    setShowJoinModal(false);
    setJoinTargetGroup(null);
  };

  const isMyGroup = (groupId: string) => {
    return myGroups.some((g) => g.id === groupId);
  };

  const getCategoryInfo = (category: GroupCategory) => {
    return GROUP_CATEGORIES.find((c) => c.id === category) || GROUP_CATEGORIES[6];
  };

  // 헤더
  const renderHeader = () => (
    <View style={[styles.header, {backgroundColor: cardBg, borderBottomColor: borderColor}]}>
      {isSearchMode ? (
        <>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setIsSearchMode(false);
              setSearchQuery('');
            }}>
            <Icon name="chevron-back" size={iconSize(24)} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, {color: textColor}]}>모임 찾기</Text>
        </>
      ) : (
        <Text style={[styles.headerTitle, {color: textColor}]}>내 모임</Text>
      )}
      <View style={styles.headerActions}>
        {!isSearchMode && (
          <TouchableOpacity
            style={[styles.headerIconButton, {backgroundColor: isDark ? '#2C2C2E' : '#F0F0F0'}]}
            onPress={() => setIsSearchMode(true)}>
            <Icon name="search" size={iconSize(18)} color={textColor} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.createButton, {backgroundColor: accentColor}]}
          onPress={() => setShowCreateModal(true)}>
          <Icon name="add" size={iconSize(20)} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // 검색 및 필터
  const renderSearchAndFilter = () => (
    <View style={styles.searchFilterSection}>
      {/* 검색바 */}
      <View style={[styles.searchBar, {backgroundColor: isDark ? '#2C2C2E' : '#F0F0F0'}]}>
        <Icon name="search" size={iconSize(18)} color={subtextColor} />
        <TextInput
          style={[styles.searchInput, {color: textColor}]}
          placeholder="모임 검색"
          placeholderTextColor={subtextColor}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close-circle" size={iconSize(18)} color={subtextColor} />
          </TouchableOpacity>
        )}
      </View>

      {/* 카테고리 필터 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryFilter}>
        <TouchableOpacity
          style={[
            styles.categoryChip,
            {borderColor: borderColor},
            selectedCategory === 'all' && {backgroundColor: accentColor, borderColor: accentColor},
          ]}
          onPress={() => setSelectedCategory('all')}>
          <Text
            style={[
              styles.categoryChipText,
              {color: subtextColor},
              selectedCategory === 'all' && {color: '#FFFFFF'},
            ]}>
            전체
          </Text>
        </TouchableOpacity>
        {GROUP_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryChip,
              {borderColor: borderColor},
              selectedCategory === cat.id && {backgroundColor: cat.color, borderColor: cat.color},
            ]}
            onPress={() => setSelectedCategory(cat.id)}>
            <Icon
              name={cat.icon as any}
              size={iconSize(14)}
              color={selectedCategory === cat.id ? '#FFFFFF' : cat.color}
            />
            <Text
              style={[
                styles.categoryChipText,
                {color: subtextColor},
                selectedCategory === cat.id && {color: '#FFFFFF'},
              ]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 모집중만 보기 */}
      <TouchableOpacity
        style={styles.recruitingFilter}
        onPress={() => setShowRecruitingOnly(!showRecruitingOnly)}>
        <Icon
          name={showRecruitingOnly ? 'checkbox' : 'square-outline'}
          size={iconSize(18)}
          color={showRecruitingOnly ? accentColor : subtextColor}
        />
        <Text style={[styles.recruitingFilterText, {color: subtextColor}]}>
          모집중만 보기
        </Text>
      </TouchableOpacity>
    </View>
  );

  // 모임 카드
  const renderGroupCard = ({item}: {item: Group}) => {
    const categoryInfo = getCategoryInfo(item.category);
    const isMember = isMyGroup(item.id);
    const isFull = item.members.length >= item.maxMembers;

    return (
      <TouchableOpacity
        style={[styles.groupCard, {backgroundColor: cardBg}]}
        onPress={() => {
          if (isMember) {
            selectGroup(item);
            setShowDetailModal(true);
          } else {
            openJoinModal(item);
          }
        }}>
        {/* 커버 이미지 */}
        {item.coverImage && (
          <Image
            source={{uri: item.coverImage}}
            style={styles.groupCardCoverImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.groupCardContent}>
          {/* 헤더 */}
          <View style={styles.groupCardHeader}>
            <View style={[styles.groupCategoryBadge, {backgroundColor: categoryInfo.color + '20'}]}>
              <Icon name={categoryInfo.icon as any} size={iconSize(14)} color={categoryInfo.color} />
              <Text style={[styles.groupCategoryText, {color: categoryInfo.color}]}>
                {categoryInfo.label}
              </Text>
            </View>
            {item.isPrivate && (
              <View style={[styles.privateBadge, {backgroundColor: isDark ? '#2C2C2E' : '#F0F0F0'}]}>
                <Icon name="lock-closed" size={iconSize(12)} color={subtextColor} />
              </View>
            )}
            <View
              style={[
                styles.statusBadge,
                {backgroundColor: item.status === 'recruiting' ? '#4CAF50' : '#FF9500'},
              ]}>
              <Text style={styles.statusText}>
                {item.status === 'recruiting' ? '모집중' : '활동중'}
              </Text>
            </View>
          </View>

          {/* 제목 */}
          <Text style={[styles.groupName, {color: textColor}]}>{item.name}</Text>
          <Text style={[styles.groupDesc, {color: subtextColor}]} numberOfLines={2}>
            {item.description}
          </Text>

          {/* 인원, 방 유형, 가입조건 - 1줄 간결하게 */}
          <View style={styles.tagList}>
            <View style={[styles.tagCompact, {backgroundColor: isDark ? '#2C2C2E' : '#F0F0F0'}]}>
              <Icon name="people-outline" size={iconSize(11)} color={subtextColor} />
              <Text style={[styles.tagTextCompact, {color: subtextColor}]}>
                {item.members.length}/{item.maxMembers}
              </Text>
            </View>
            <View style={[styles.tagCompact, {backgroundColor: item.isPrivate ? '#FF950015' : item.requireApproval ? '#007AFF15' : '#4CAF5015'}]}>
              <Icon
                name={item.isPrivate ? 'lock-closed' : item.requireApproval ? 'document-text-outline' : 'globe-outline'}
                size={iconSize(11)}
                color={item.isPrivate ? '#FF9500' : item.requireApproval ? '#007AFF' : '#4CAF50'}
              />
              <Text style={[styles.tagTextCompact, {color: item.isPrivate ? '#FF9500' : item.requireApproval ? '#007AFF' : '#4CAF50'}]}>
                {item.isPrivate ? '비밀' : item.requireApproval ? '신청' : '공개'}
              </Text>
            </View>
            {(item.rules.minStudyMinutesPerWeek || 0) > 0 && (
              <View style={[styles.tagCompact, {backgroundColor: isDark ? '#2C2C2E' : '#F0F0F0'}]}>
                <Icon name="time-outline" size={iconSize(11)} color={subtextColor} />
                <Text style={[styles.tagTextCompact, {color: subtextColor}]}>
                  {((item.rules.minStudyMinutesPerWeek || 0) / 60).toFixed(0)}h+
                </Text>
              </View>
            )}
          </View>

          {/* 가입 버튼 */}
          {!isMember && (
            <TouchableOpacity
              style={[
                styles.joinButton,
                {backgroundColor: isFull ? borderColor : accentColor},
              ]}
              disabled={isFull}
              onPress={(e) => {
                e.stopPropagation();
                handleJoinGroup(item);
              }}>
              <Text style={[styles.joinButtonText, {color: isFull ? subtextColor : '#FFFFFF'}]}>
                {isFull ? '정원 마감' : item.requireApproval ? '가입 신청' : '바로 가입'}
              </Text>
            </TouchableOpacity>
          )}
          {isMember && (
            <View style={[styles.memberBadge, {backgroundColor: accentColor + '20'}]}>
              <Icon name="checkmark-circle" size={iconSize(16)} color={accentColor} />
              <Text style={[styles.memberBadgeText, {color: accentColor}]}>가입됨</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // 모임 상세 모달
  const renderDetailModal = () => {
    if (!selectedGroup) {return null;}
    const categoryInfo = getCategoryInfo(selectedGroup.category);
    const isMember = isMyGroup(selectedGroup.id);

    return (
      <View style={[styles.detailScreenContainer, {backgroundColor: bgColor}]}>
        <SafeAreaView style={[styles.modalContainer, {backgroundColor: bgColor}]}>
          {/* 헤더 */}
          <View style={[styles.modalHeader, {backgroundColor: cardBg, borderBottomColor: borderColor}]}>
            <TouchableOpacity
              style={styles.modalHeaderBtn}
              onPress={() => {
                setShowDetailModal(false);
                selectGroup(null);
                setShowMoreMenu(false);
              }}>
              <Icon name="arrow-back" size={iconSize(24)} color={textColor} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, {color: textColor}]} numberOfLines={1}>{selectedGroup.name}</Text>
            <TouchableOpacity
              style={styles.modalHeaderBtn}
              onPress={handleOpenSettings}>
              <Icon name="ellipsis-vertical" size={iconSize(24)} color={textColor} />
            </TouchableOpacity>
          </View>

          {/* 탭 - Pill 스타일 */}
          <View style={[styles.detailTabsWrapper, {backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5'}]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.detailTabsContent}>
              {[
                {id: 'info' as const, label: '정보', icon: 'information-circle-outline'},
                {id: 'members' as const, label: '멤버', icon: 'people-outline'},
                {id: 'study' as const, label: '공부방', icon: 'videocam-outline'},
                {id: 'board' as const, label: '게시판', icon: 'document-text-outline'},
                {id: 'chat' as const, label: '채팅', icon: 'chatbubbles-outline'},
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.detailTab,
                    {
                      backgroundColor: activeDetailTab === tab.id
                        ? accentColor
                        : 'transparent',
                    },
                  ]}
                  onPress={() => setActiveDetailTab(tab.id)}>
                  <Icon
                    name={(activeDetailTab === tab.id ? tab.icon.replace('-outline', '') : tab.icon) as any}
                    size={iconSize(16)}
                    color={activeDetailTab === tab.id ? '#FFFFFF' : subtextColor}
                  />
                  <Text
                    style={[
                      styles.detailTabText,
                      {
                        color: activeDetailTab === tab.id ? '#FFFFFF' : subtextColor,
                        fontWeight: activeDetailTab === tab.id ? '700' : '500',
                      },
                    ]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* 컨텐츠 - 채팅 탭이 아닐 때만 ScrollView 표시 (스와이프로 탭 전환 가능) */}
          {activeDetailTab !== 'chat' && (
          <PanGestureHandler
            onHandlerStateChange={handleTabGestureEvent}
            activeOffsetX={[-20, 20]}
            failOffsetY={[-10, 10]}>
          <ScrollView style={styles.detailContent} contentContainerStyle={styles.detailContentContainer}>
            {activeDetailTab === 'info' && (
              <>
                {/* 기본 정보 */}
                <View style={[styles.infoCard, {backgroundColor: cardBg, borderColor: isDark ? '#2A2A2A' : '#E8E8E8'}]}>
                  <View style={styles.infoCardHeader}>
                    <View style={[styles.groupCategoryBadge, {backgroundColor: categoryInfo.color + '20'}]}>
                      <Icon name={categoryInfo.icon as any} size={iconSize(16)} color={categoryInfo.color} />
                      <Text style={[styles.groupCategoryText, {color: categoryInfo.color}]}>
                        {categoryInfo.label}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        {backgroundColor: selectedGroup.status === 'recruiting' ? '#4CAF50' : '#FF9500'},
                      ]}>
                      <Text style={styles.statusText}>
                        {selectedGroup.status === 'recruiting' ? '모집중' : '활동중'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.infoDesc, {color: textColor}]}>{selectedGroup.description}</Text>
                  <View style={styles.tagList}>
                    {selectedGroup.tags.map((tag, index) => (
                      <View key={index} style={[styles.tag, {backgroundColor: isDark ? '#2C2C2E' : '#F0F0F0'}]}>
                        <Text style={[styles.tagText, {color: subtextColor}]}>#{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* 규칙 */}
                <View style={[styles.rulesCard, {backgroundColor: cardBg, borderColor: isDark ? '#2A2A2A' : '#E8E8E8'}]}>
                  <Text style={[styles.rulesTitle, {color: textColor}]}>모임 규칙</Text>
                  <View style={styles.rulesList}>
                    {selectedGroup.rules.minStudyMinutesPerWeek && (
                      <View style={styles.ruleItem}>
                        <Icon name="checkmark-circle" size={iconSize(18)} color={accentColor} />
                        <Text style={[styles.ruleText, {color: textColor}]}>
                          주 {(selectedGroup.rules.minStudyMinutesPerWeek / 60).toFixed(0)}시간 이상 공부
                        </Text>
                      </View>
                    )}
                    {selectedGroup.rules.maxAbsenceDays && (
                      <View style={styles.ruleItem}>
                        <Icon name="checkmark-circle" size={iconSize(18)} color={accentColor} />
                        <Text style={[styles.ruleText, {color: textColor}]}>
                          {selectedGroup.rules.maxAbsenceDays}일 이상 미접속 시 자동 탈퇴
                        </Text>
                      </View>
                    )}
                    {selectedGroup.rules.requireDailyReport && (
                      <View style={styles.ruleItem}>
                        <Icon name="checkmark-circle" size={iconSize(18)} color={accentColor} />
                        <Text style={[styles.ruleText, {color: textColor}]}>일일 공부 인증 필수</Text>
                      </View>
                    )}
                    {selectedGroup.rules.customRules?.map((rule, index) => (
                      <View key={index} style={styles.ruleItem}>
                        <Icon name="checkmark-circle" size={iconSize(18)} color={accentColor} />
                        <Text style={[styles.ruleText, {color: textColor}]}>{rule}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* 가입 조건 */}
                <View style={[styles.conditionCard, {backgroundColor: cardBg, borderColor: isDark ? '#2A2A2A' : '#E8E8E8'}]}>
                  <Text style={[styles.conditionTitle, {color: textColor}]}>가입 조건</Text>
                  <View style={styles.conditionList}>
                    <View style={styles.conditionItem}>
                      <Icon
                        name={selectedGroup.requireApproval ? 'shield-checkmark' : 'enter'}
                        size={iconSize(18)}
                        color={subtextColor}
                      />
                      <Text style={[styles.conditionText, {color: subtextColor}]}>
                        {selectedGroup.requireApproval ? '승인 필요' : '바로 가입 가능'}
                      </Text>
                    </View>
                    {selectedGroup.minLevel && (
                      <View style={styles.conditionItem}>
                        <Icon name="star" size={iconSize(18)} color={subtextColor} />
                        <Text style={[styles.conditionText, {color: subtextColor}]}>
                          Lv.{selectedGroup.minLevel} 이상
                        </Text>
                      </View>
                    )}
                    <View style={styles.conditionItem}>
                      <Icon
                        name={selectedGroup.isPrivate ? 'lock-closed' : 'lock-open'}
                        size={iconSize(18)}
                        color={subtextColor}
                      />
                      <Text style={[styles.conditionText, {color: subtextColor}]}>
                        {selectedGroup.isPrivate ? '비공개 모임' : '공개 모임'}
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            )}

            {activeDetailTab === 'members' && (
              <View style={styles.membersList}>
                {/* 날짜 네비게이션 + 기간 선택기 */}
                {(() => {
                  const dateInfo = getDateRangeInfo(studyPeriodType, studyDateOffset);
                  const averageStudyTime = Math.round(
                    selectedGroup.members.reduce((sum, m) => {
                      if (studyPeriodType === 'day') {return sum + (m.todayStudyMinutes || 0);}
                      if (studyPeriodType === 'month') {return sum + (m.weeklyStudyMinutes * 4);}
                      return sum + m.weeklyStudyMinutes;
                    }, 0) / selectedGroup.members.length
                  );
                  const totalStudyTime = selectedGroup.members.reduce((sum, m) => {
                    if (studyPeriodType === 'day') {return sum + (m.todayStudyMinutes || 0);}
                    if (studyPeriodType === 'month') {return sum + (m.weeklyStudyMinutes * 4);}
                    return sum + m.weeklyStudyMinutes;
                  }, 0);

                  return (
                    <>
                      {/* 날짜 네비게이터 + 기간 선택 통합 UI */}
                      <View style={[styles.dateNavigatorContainer, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
                        {/* 날짜 네비게이션 (좌측) */}
                        <View style={styles.dateNavSection}>
                          <TouchableOpacity
                            style={[styles.dateNavArrow, {backgroundColor: isDark ? '#333333' : '#F5F5F5'}]}
                            onPress={() => setStudyDateOffset(prev => prev - 1)}>
                            <Icon name="chevron-back" size={iconSize(18)} color={isDark ? '#FFFFFF' : '#333333'} />
                          </TouchableOpacity>
                          <View style={styles.dateDisplayContainer}>
                            <Text style={[styles.dateDisplayText, {color: textColor}]}>
                              {dateInfo.displayText}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={[
                              styles.dateNavArrow,
                              {
                                backgroundColor: studyDateOffset >= 0
                                  ? isDark ? '#222222' : '#EEEEEE'
                                  : isDark ? '#333333' : '#F5F5F5',
                              },
                            ]}
                            onPress={() => setStudyDateOffset(prev => Math.min(prev + 1, 0))}
                            disabled={studyDateOffset >= 0}>
                            <Icon
                              name="chevron-forward"
                              size={iconSize(18)}
                              color={studyDateOffset >= 0 ? (isDark ? '#555555' : '#CCCCCC') : (isDark ? '#FFFFFF' : '#333333')}
                            />
                          </TouchableOpacity>
                        </View>

                        {/* 기간 단위 선택 (우측) */}
                        <View style={[styles.periodSelector, {backgroundColor: isDark ? '#2A2A2A' : '#F0F0F0'}]}>
                          {[
                            {id: 'day' as const, label: '1일'},
                            {id: 'week' as const, label: '7일'},
                            {id: 'month' as const, label: '1달'},
                          ].map((period) => (
                            <TouchableOpacity
                              key={period.id}
                              style={[
                                styles.periodOption,
                                {
                                  backgroundColor: studyPeriodType === period.id
                                    ? accentColor
                                    : 'transparent',
                                },
                              ]}
                              onPress={() => {
                                setStudyPeriodType(period.id);
                                setStudyDateOffset(0);
                              }}>
                              <Text
                                style={[
                                  styles.periodOptionText,
                                  {
                                    color: studyPeriodType === period.id
                                      ? '#FFFFFF'
                                      : isDark ? '#AAAAAA' : '#666666',
                                  },
                                ]}>
                                {period.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>

                      {/* 모임 공부 통계 카드 (개선된 디자인) */}
                      <View style={[styles.studyStatsCard, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
                        <View style={styles.studyStatsRow}>
                          {/* 총 공부시간 */}
                          <View style={styles.studyStatItem}>
                            <View style={[styles.studyStatIconCircle, {backgroundColor: accentColor + '20'}]}>
                              <Icon name="time-outline" size={iconSize(20)} color={accentColor} />
                            </View>
                            <Text style={[styles.studyStatValue, {color: textColor}]}>
                              {formatStudyTime(totalStudyTime)}
                            </Text>
                            <Text style={[styles.studyStatLabel, {color: subtextColor}]}>총 공부시간</Text>
                          </View>

                          {/* 구분선 */}
                          <View style={[styles.studyStatDivider, {backgroundColor: isDark ? '#333333' : '#EEEEEE'}]} />

                          {/* 평균 공부시간 */}
                          <View style={styles.studyStatItem}>
                            <View style={[styles.studyStatIconCircle, {backgroundColor: '#FF9500' + '20'}]}>
                              <Icon name="analytics-outline" size={iconSize(20)} color="#FF9500" />
                            </View>
                            <Text style={[styles.studyStatValue, {color: textColor}]}>
                              {formatStudyTime(averageStudyTime)}
                            </Text>
                            <Text style={[styles.studyStatLabel, {color: subtextColor}]}>인당 평균</Text>
                          </View>

                          {/* 구분선 */}
                          <View style={[styles.studyStatDivider, {backgroundColor: isDark ? '#333333' : '#EEEEEE'}]} />

                          {/* 참여 멤버 */}
                          <View style={styles.studyStatItem}>
                            <View style={[styles.studyStatIconCircle, {backgroundColor: '#5856D6' + '20'}]}>
                              <Icon name="people-outline" size={iconSize(20)} color="#5856D6" />
                            </View>
                            <Text style={[styles.studyStatValue, {color: textColor}]}>
                              {selectedGroup.members.filter(m => {
                                const time = studyPeriodType === 'day' ? (m.todayStudyMinutes || 0)
                                  : studyPeriodType === 'month' ? (m.weeklyStudyMinutes * 4)
                                  : m.weeklyStudyMinutes;
                                return time > 0;
                              }).length}명
                            </Text>
                            <Text style={[styles.studyStatLabel, {color: subtextColor}]}>참여 멤버</Text>
                          </View>
                        </View>
                      </View>
                    </>
                  );
                })()}

                <Text style={[styles.membersTitle, {color: textColor}]}>
                  멤버 ({selectedGroup.members.length}명)
                </Text>
                {selectedGroup.members.map((member) => {
                  const memberStudyTime = studyPeriodType === 'day'
                    ? (member.todayStudyMinutes || 0)
                    : studyPeriodType === 'month'
                    ? (member.weeklyStudyMinutes * 4)
                    : member.weeklyStudyMinutes;
                  const periodLabel = studyPeriodType === 'day' ? '오늘' : studyPeriodType === 'week' ? '이번 주' : '이번 달';
                  return (
                  <View key={member.id} style={styles.memberCardWrapper}>
                    <ProfileCard
                      isDark={isDark}
                      size="small"
                      user={{
                        nickname: member.nickname,
                        level: member.level || 1,
                        tier: member.tier,
                        profileImageUrl: member.profileImageUrl,
                        bio: `${periodLabel} ${formatStudyTime(memberStudyTime)}`,
                        cardFrame: 'default' as CardFrameType,
                      }}
                      onPress={() => {}}
                    />
                    {/* 역할 뱃지 (방장/매니저) */}
                    {member.role !== 'member' && (
                      <View
                        style={[
                          styles.memberRoleOverlay,
                          {backgroundColor: member.role === 'leader' ? '#FFD700' : '#4CAF50'},
                        ]}>
                        <Text style={styles.memberRoleText}>
                          {member.role === 'leader' ? '방장' : '매니저'}
                        </Text>
                      </View>
                    )}
                  </View>
                  );
                })}
              </View>
            )}

            {activeDetailTab === 'board' && (
              <View style={styles.boardContainer}>
                {selectedGroup.notices.length === 0 ? (
                  <View style={styles.emptyBoard}>
                    <Icon name="document-text-outline" size={iconSize(40)} color={subtextColor} />
                    <Text style={[styles.emptyBoardText, {color: subtextColor}]}>
                      아직 게시글이 없어요
                    </Text>
                  </View>
                ) : (
                  [...selectedGroup.notices]
                    .sort((a, b) => {
                      if (a.isPinned && !b.isPinned) {return -1;}
                      if (!a.isPinned && b.isPinned) {return 1;}
                      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                    })
                    .map((notice) => (
                    <TouchableOpacity
                      key={notice.id}
                      style={[
                        styles.boardPostItem,
                        {
                          backgroundColor: cardBg,
                          borderColor: isDark ? '#2C2C2E' : '#E5E5EA',
                        },
                      ]}
                      onPress={() => {
                        setSelectedPost(notice);
                        setShowPostDetail(true);
                      }}
                      activeOpacity={0.7}>
                      {/* 아바타 */}
                      <View style={styles.boardPostAvatar}>
                        <View style={[styles.boardPostAvatarInner, {backgroundColor: accentColor + '30'}]}>
                          <Icon name="person" size={iconSize(16)} color={accentColor} />
                        </View>
                      </View>
                      {/* 컨텐츠 */}
                      <View style={styles.boardPostContent}>
                        <View style={styles.boardPostTitleRow}>
                          {notice.isPinned && (
                            <View style={[styles.boardPinnedTextBadge, {backgroundColor: '#FF9500'}]}>
                              <Text style={styles.boardPinnedTextBadgeText}>고정</Text>
                            </View>
                          )}
                          <Text style={[styles.boardPostTitle, {color: textColor, flex: 1}]} numberOfLines={1}>
                            {notice.title}
                          </Text>
                        </View>
                        <View style={styles.boardPostMeta}>
                          <Text style={[styles.boardPostAuthor, {color: subtextColor}]}>
                            {notice.authorNickname}
                          </Text>
                          <Text style={[styles.boardPostDot, {color: subtextColor}]}>·</Text>
                          <Text style={[styles.boardPostTime, {color: subtextColor}]}>
                            {new Date(notice.createdAt).toLocaleDateString('ko-KR', {month: 'numeric', day: 'numeric'})}
                          </Text>
                        </View>
                      </View>
                      {/* 우측: 통계 + 화살표 */}
                      <View style={styles.boardPostRight}>
                        <View style={styles.boardPostStats}>
                          <Icon name="heart" size={iconSize(12)} color={notice.likes > 0 ? '#FF3B30' : subtextColor} />
                          <Text style={[styles.boardPostStatText, {color: subtextColor}]}>{notice.likes}</Text>
                          <Icon name="chatbubble" size={iconSize(12)} color={subtextColor} style={{marginLeft: sp(6)}} />
                          <Text style={[styles.boardPostStatText, {color: subtextColor}]}>{notice.commentCount}</Text>
                        </View>
                        <Icon name="chevron-forward" size={iconSize(16)} color={subtextColor} />
                      </View>
                    </TouchableOpacity>
                  ))
                )}

              </View>
            )}

            {activeDetailTab === 'study' && (
              <View style={[styles.studyCard, {backgroundColor: cardBg}]}>
                {!isMember ? (
                  <View style={styles.studyLocked}>
                    <Icon name="lock-closed" size={iconSize(48)} color={subtextColor} />
                    <Text style={[styles.studyLockedText, {color: subtextColor}]}>
                      모임에 가입하면 같이 스터디에 참여할 수 있어요
                    </Text>
                  </View>
                ) : (
                  <View style={styles.studyRoomEntry}>
                    {/* 스터디 룸 아이콘 */}
                    <View style={[styles.studyRoomIconContainer, {backgroundColor: '#4CAF50' + '20'}]}>
                      <Icon name="people" size={iconSize(48)} color="#4CAF50" />
                    </View>

                    {/* 현재 공부중인 멤버 수 */}
                    <View style={styles.studyingCountContainer}>
                      <View style={[styles.liveIndicator, {backgroundColor: '#4CAF50'}]} />
                      <Text style={[styles.studyingCountText, {color: textColor}]}>
                        현재 {selectedGroup.members.filter((m) => m.isStudying).length}명 공부중
                      </Text>
                    </View>

                    {/* 공부중인 멤버 아바타 */}
                    {selectedGroup.members.filter((m) => m.isStudying).length > 0 && (
                      <View style={styles.studyingAvatarsRow}>
                        {selectedGroup.members
                          .filter((m) => m.isStudying)
                          .slice(0, 5)
                          .map((member, index) => (
                            <View
                              key={member.id}
                              style={[
                                styles.studyingAvatarCircle,
                                {backgroundColor: accentColor + '30', marginLeft: index > 0 ? -sp(10) : 0},
                              ]}>
                              {member.profileImageUrl ? (
                                <Image source={{uri: member.profileImageUrl}} style={styles.studyingAvatarImage} />
                              ) : (
                                <Icon name="person" size={iconSize(16)} color="#9E9E9E" />
                              )}
                            </View>
                          ))}
                        {selectedGroup.members.filter((m) => m.isStudying).length > 5 && (
                          <View style={[styles.studyingAvatarMore, {backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA', marginLeft: -sp(10)}]}>
                            <Text style={[styles.studyingAvatarMoreText, {color: subtextColor}]}>
                              +{selectedGroup.members.filter((m) => m.isStudying).length - 5}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* 설명 */}
                    <Text style={[styles.studyRoomDesc, {color: subtextColor}]}>
                      모임 멤버들과 함께 공부해보세요!
                    </Text>

                    {/* 입장하기 버튼 */}
                    <TouchableOpacity
                      style={[styles.enterStudyButton, {backgroundColor: '#4CAF50'}]}
                      onPress={() => enterStudyRoom('free')}>
                      <Icon name="enter-outline" size={iconSize(20)} color="#FFFFFF" />
                      <Text style={styles.enterStudyButtonText}>입장하기</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* 채팅은 ScrollView 밖에서 처리 */}
          </ScrollView>
          </PanGestureHandler>
          )}

          {/* 채팅 탭 - ScrollView 밖에서 flex layout 사용 (스와이프로 탭 전환 가능) */}
          {activeDetailTab === 'chat' && (
            <PanGestureHandler
              onHandlerStateChange={handleTabGestureEvent}
              activeOffsetX={[-20, 20]}
              failOffsetY={[-10, 10]}>
            <View style={styles.chatContainer}>
              {!isMember ? (
                <View style={styles.chatLocked}>
                  <Icon name="lock-closed" size={iconSize(48)} color={subtextColor} />
                  <Text style={[styles.chatLockedText, {color: subtextColor}]}>
                    모임에 가입하면 채팅에 참여할 수 있어요
                  </Text>
                </View>
              ) : (
                <>
                  {/* 채팅 메시지 목록 - flex: 1로 남은 공간 차지 */}
                  <ScrollView
                    style={styles.chatMessagesScroll}
                    contentContainerStyle={styles.chatMessagesContent}>
                    {selectedGroup.messages.length === 0 ? (
                      <View style={styles.emptyChat}>
                        <Icon name="chatbubbles-outline" size={iconSize(48)} color={subtextColor} />
                        <Text style={[styles.emptyChatText, {color: subtextColor}]}>
                          아직 메시지가 없어요{'\n'}첫 메시지를 보내보세요!
                        </Text>
                      </View>
                    ) : (
                      selectedGroup.messages.map((msg) => (
                        <View key={msg.id} style={styles.chatMessage}>
                          <View style={[styles.chatAvatar, {backgroundColor: accentColor + '30'}]}>
                            <Icon name="person" size={iconSize(14)} color={accentColor} />
                          </View>
                          <View style={styles.chatBubble}>
                            <Text style={[styles.chatSender, {color: accentColor}]}>{msg.senderNickname}</Text>
                            <Text style={[styles.chatText, {color: textColor}]}>{msg.content}</Text>
                          </View>
                        </View>
                      ))
                    )}
                  </ScrollView>

                  {/* 채팅 입력란 - 하단에 고정 */}
                  <View style={[styles.chatInputFixed, {borderTopColor: borderColor, backgroundColor: cardBg}]}>
                    <TextInput
                      style={[styles.chatInputField, {color: textColor, backgroundColor: isDark ? '#2C2C2E' : '#F0F0F0'}]}
                      placeholder="메시지를 입력하세요..."
                      placeholderTextColor={subtextColor}
                    />
                    <TouchableOpacity style={[styles.chatSendBtn, {backgroundColor: accentColor}]}>
                      <Icon name="send" size={iconSize(18)} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
            </PanGestureHandler>
          )}

          {/* 하단 버튼 - 비회원일 때만 가입 버튼 표시 */}
          {!isMember && (
            <View style={[styles.detailFooter, {backgroundColor: cardBg, borderTopColor: borderColor}]}>
              <TouchableOpacity
                style={[styles.detailJoinButton, {backgroundColor: accentColor}]}
                onPress={() => handleJoinGroup(selectedGroup)}>
                <Text style={styles.detailJoinButtonText}>
                  {selectedGroup.requireApproval ? '가입 신청하기' : '바로 가입하기'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 게시판 글쓰기 플로팅 버튼 */}
          {isMember && activeDetailTab === 'board' && (
            <TouchableOpacity
              style={[styles.floatingWriteButton, {backgroundColor: accentColor}]}
              onPress={() => {/* TODO: 글쓰기 모달 */}}
              activeOpacity={0.8}>
              <Icon name="add" size={iconSize(28)} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </SafeAreaView>
      </View>
    );
  };

  // 스터디 룸 모달 렌더링 (MatchingScreen의 자유매칭 세션과 동일한 UI)
  const renderStudyRoomModal = () => {
    if (!selectedGroup || !showStudyRoom) {return null;}

    const studyingMembers = selectedGroup.members.filter(m => m.isStudying);
    const currentTotalTime = isBreakTime ? BREAK_TIME : FOCUS_TIME;
    const studyRoomTimerProgress = sessionTimeLeft / currentTotalTime;

    // 색상 설정: 집중 시간은 빨간색, 휴식 시간은 파란색
    const timerColor = isBreakTime ? '#007AFF' : '#FF3B30';
    // studyRoomTimerProgress는 나중에 타이머 UI에서 사용될 예정
    void studyRoomTimerProgress;

    return (
      <Modal
        visible={showStudyRoom}
        animationType="slide"
        onRequestClose={exitStudyRoom}>
        <View style={[styles.sessionContainer, {backgroundColor: isDark ? '#121212' : '#FAFAFA'}]}>
          <SafeAreaView style={styles.sessionContent}>
            {/* 헤더 */}
            <View style={styles.sessionHeader}>
              <View style={styles.sessionHeaderLeft}>
                <View style={[styles.sessionTypeBadge, {backgroundColor: timerColor}]}>
                  <Icon name={isBreakTime ? 'cafe' : 'chatbubbles'} size={iconSize(14)} color="#FFFFFF" />
                  <Text style={styles.sessionTypeBadgeText}>{isBreakTime ? '휴식 시간' : '같이 공부'}</Text>
                </View>
                <View style={styles.sessionPeopleCount}>
                  <Icon name="people" size={iconSize(14)} color={isDark ? '#888888' : '#666666'} />
                  <Text style={[styles.sessionPeopleText, {color: isDark ? '#888888' : '#666666'}]}>
                    {studyingMembers.length + 1}명
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.endSessionButton, {backgroundColor: '#FF5252'}]}
                onPress={exitStudyRoom}
              >
                <Icon name="exit" size={iconSize(18)} color="#FFFFFF" />
                <Text style={styles.endSessionText}>나가기</Text>
              </TouchableOpacity>
            </View>

            {/* 캠 목록 (가로 스크롤) */}
            <View style={styles.focusCamListSection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.focusCamListContent}
              >
                {/* 내 캠 */}
                <View style={styles.focusCamItem}>
                  <View style={[
                    styles.focusCamBox,
                    {
                      backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
                      borderWidth: 2,
                      borderColor: timerColor,
                    },
                  ]}>
                    <View style={[styles.focusCamPlaceholder, {backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5'}]}>
                      <Icon name="videocam" size={iconSize(24)} color={isDark ? '#666666' : '#999999'} />
                    </View>
                    {/* 캠 컨트롤 */}
                    <View style={styles.focusCamControls}>
                      <TouchableOpacity
                        style={[styles.focusCamControlBtn, {backgroundColor: timerColor}]}
                      >
                        <Icon name="videocam" size={iconSize(12)} color="#FFFFFF" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.focusCamControlBtn, {backgroundColor: timerColor}]}
                      >
                        <Icon name="mic" size={iconSize(12)} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <ProfileCard
                    user={{
                      nickname: '나',
                      level: 15,
                      cardFrame: 'gold' as CardFrameType,
                      badges: [
                        {id: 'study', icon: 'school', color: '#4CAF50'},
                        {id: 'streak', icon: 'flame', color: '#FF5722'},
                      ],
                    }}
                    size="cam"
                    isDark={isDark}
                  />
                </View>

                {/* 다른 참가자들 캠 */}
                {studyingMembers.map((member) => (
                  <View key={member.id} style={styles.focusCamItem}>
                    {/* 캠 박스 */}
                    <View style={[
                      styles.focusCamBox,
                      {
                        backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
                        borderWidth: 2,
                        borderColor: getTierColor(member.tier),
                      },
                    ]}>
                      <View style={[styles.focusCamPlaceholder, {backgroundColor: '#E0E0E020'}]}>
                        {member.profileImageUrl ? (
                          <Image source={{uri: member.profileImageUrl}} style={styles.focusCamImage} />
                        ) : (
                          <Icon name="person" size={iconSize(24)} color="#9E9E9E" />
                        )}
                      </View>
                      <View style={[styles.focusCamStatusDot, {backgroundColor: '#4CAF50'}]} />
                    </View>
                    {/* 프로필 카드 */}
                    <ProfileCard
                      user={{
                        nickname: member.nickname,
                        level: member.level || 10,
                        profileImageUrl: member.profileImageUrl,
                        cardFrame: (member.cardFrame as CardFrameType) || 'default',
                        badges: member.badges,
                      }}
                      size="cam"
                      isDark={isDark}
                    />
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* 타이머 및 채팅 */}
            <ScrollView
              style={{flex: 1}}
              contentContainerStyle={{paddingBottom: hp(20)}}
              showsVerticalScrollIndicator={false}
            >
              {/* 타이머 카드 */}
              <View style={styles.focusTimerSection}>
                <View style={[
                  styles.timerCard,
                  {
                    backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
                  },
                ]}>
                  <Text style={[styles.timerStatusLabel, {color: timerColor}]}>
                    {isBreakTime ? '휴식 시간' : '같이 공부'}
                  </Text>
                  <View style={styles.timerWrapper}>
                    <TimeTimer
                      size={sp(180)}
                      progress={timerProgress}
                      color={timerColor}
                      backgroundColor={isDark ? '#2A2A2A' : '#F5F5F5'}
                      timeText={formatTime(sessionTimeLeft)}
                      totalSeconds={currentTotalTime}
                      isRunning={isSessionRunning}
                      onPlayPause={() => setIsSessionRunning(!isSessionRunning)}
                      showButton={true}
                    />
                    <Text style={[styles.timerTimeText, {color: timerColor}]}>
                      {formatTime(sessionTimeLeft)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* 채팅 영역 */}
              <View style={{paddingHorizontal: sp(16)}}>
                <View style={[
                  styles.sessionChatSection,
                  {
                    backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
                    borderWidth: 1,
                    borderColor: isDark ? '#333333' : '#E8E8E8',
                  },
                ]}>
                  <View style={styles.sessionChatHeader}>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: sp(6)}}>
                      <Icon name="chatbubbles" size={iconSize(18)} color={timerColor} />
                      <Text style={[styles.sessionChatHeaderText, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>채팅</Text>
                    </View>
                  </View>
                  <View style={styles.sessionChatMessages}>
                    <Text style={[styles.sessionChatPlaceholder, {color: subtextColor}]}>
                      멤버들과 대화하며 공부해보세요!
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    );
  };

  // 가입 모달
  const renderJoinModal = () => {
    if (!joinTargetGroup) {return null;}
    const categoryInfo = getCategoryInfo(joinTargetGroup.category);
    const isFull = joinTargetGroup.members.length >= joinTargetGroup.maxMembers;

    return (
      <Modal
        visible={showJoinModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowJoinModal(false)}>
        <View style={styles.joinModalOverlay}>
          <TouchableOpacity
            style={styles.joinModalBackdrop}
            activeOpacity={1}
            onPress={() => setShowJoinModal(false)}
          />
          <View style={[styles.joinModalContent, {backgroundColor: cardBg}]}>
            {/* 헤더 */}
            <View style={styles.joinModalHeader}>
              <Text style={[styles.joinModalTitle, {color: textColor}]}>모임 가입</Text>
              <TouchableOpacity onPress={() => setShowJoinModal(false)}>
                <Icon name="close" size={iconSize(24)} color={subtextColor} />
              </TouchableOpacity>
            </View>

            {/* 스크롤 가능한 컨텐츠 */}
            <ScrollView
              style={styles.joinModalScrollContent}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {/* 모임 정보 */}
              <View style={[styles.joinModalGroupInfo, {backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5'}]}>
                <View style={[styles.joinModalGroupCategory, {backgroundColor: categoryInfo.color + '20'}]}>
                  <Icon name={categoryInfo.icon as any} size={iconSize(16)} color={categoryInfo.color} />
                </View>
                <View style={styles.joinModalGroupText}>
                  <Text style={[styles.joinModalGroupName, {color: textColor}]}>{joinTargetGroup.name}</Text>
                  <Text style={[styles.joinModalGroupMembers, {color: subtextColor}]}>
                    {joinTargetGroup.members.length}/{joinTargetGroup.maxMembers}명
                  </Text>
                </View>
              </View>

              {/* 모임 소개 */}
              {joinTargetGroup.description && (
                <View style={styles.joinModalDescSection}>
                  <Text style={[styles.joinModalSectionTitle, {color: textColor}]}>모임 소개</Text>
                  <View style={[styles.joinModalDescBox, {backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5'}]}>
                    <Text style={[styles.joinModalDescText, {color: subtextColor}]}>
                      {joinTargetGroup.description}
                    </Text>
                  </View>
                </View>
              )}

              {/* 가입 조건 */}
              <View style={styles.joinModalConditions}>
                <Text style={[styles.joinModalSectionTitle, {color: textColor}]}>가입 조건</Text>

                {/* 방 유형 */}
                <View style={styles.joinModalConditionItem}>
                  <Icon
                    name={joinTargetGroup.isPrivate ? 'lock-closed' : joinTargetGroup.requireApproval ? 'document-text' : 'globe'}
                    size={iconSize(18)}
                    color={joinTargetGroup.isPrivate ? '#FF9500' : joinTargetGroup.requireApproval ? '#007AFF' : '#4CAF50'}
                  />
                  <Text style={[styles.joinModalConditionText, {color: textColor}]}>
                    {joinTargetGroup.isPrivate ? '비밀방 (비밀번호 필요)' : joinTargetGroup.requireApproval ? '신청방 (관리자 승인 필요)' : '공개방 (바로 가입)'}
                  </Text>
                </View>

                {/* 주간 최소 공부시간 */}
                {(joinTargetGroup.rules.minStudyMinutesPerWeek || 0) > 0 && (
                  <View style={styles.joinModalConditionItem}>
                    <Icon name="time" size={iconSize(18)} color={subtextColor} />
                    <Text style={[styles.joinModalConditionText, {color: textColor}]}>
                      주 {((joinTargetGroup.rules.minStudyMinutesPerWeek || 0) / 60).toFixed(0)}시간 이상 공부
                    </Text>
                  </View>
                )}

                {/* 정원 */}
                <View style={styles.joinModalConditionItem}>
                  <Icon name="people" size={iconSize(18)} color={isFull ? '#FF3B30' : subtextColor} />
                  <Text style={[styles.joinModalConditionText, {color: isFull ? '#FF3B30' : textColor}]}>
                    {isFull ? '정원이 가득 찼습니다' : `현재 ${joinTargetGroup.members.length}명 / ${joinTargetGroup.maxMembers}명`}
                  </Text>
                </View>
              </View>

              {/* 비밀번호 입력 (비밀방인 경우) */}
              {joinTargetGroup.isPrivate && !isFull && (
                <View style={styles.joinModalInputSection}>
                  <Text style={[styles.joinModalInputLabel, {color: textColor}]}>비밀번호</Text>
                  <TextInput
                    style={[styles.joinModalInput, {backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5', color: textColor, borderColor}]}
                    placeholder="모임 비밀번호를 입력하세요"
                    placeholderTextColor={subtextColor}
                    value={joinPassword}
                    onChangeText={setJoinPassword}
                    secureTextEntry
                  />
                </View>
              )}

              {/* 가입 메시지 (신청방인 경우) */}
              {joinTargetGroup.requireApproval && !joinTargetGroup.isPrivate && !isFull && (
                <View style={styles.joinModalInputSection}>
                  <Text style={[styles.joinModalInputLabel, {color: textColor}]}>가입 메시지 (선택)</Text>
                  <TextInput
                    style={[styles.joinModalInput, styles.joinModalTextArea, {backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5', color: textColor, borderColor}]}
                    placeholder="관리자에게 전할 메시지를 입력하세요"
                    placeholderTextColor={subtextColor}
                    value={joinMessage}
                    onChangeText={setJoinMessage}
                    multiline
                    textAlignVertical="top"
                  />
                </View>
              )}
            </ScrollView>

            {/* 버튼 - ScrollView 밖에 고정 */}
            <View style={styles.joinModalButtons}>
              <TouchableOpacity
                style={[styles.joinModalCancelBtn, {borderColor}]}
                onPress={() => setShowJoinModal(false)}>
                <Text style={[styles.joinModalCancelText, {color: subtextColor}]}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.joinModalJoinBtn,
                  {backgroundColor: isFull ? subtextColor : accentColor},
                ]}
                onPress={() => !isFull && handleJoinGroup(joinTargetGroup)}
                disabled={isFull}>
                <Text style={styles.joinModalJoinText}>
                  {isFull ? '가입 불가' : joinTargetGroup.requireApproval ? '가입 신청' : '가입하기'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // 그룹 설정 페이지
  const renderSettingsPage = () => {
    if (!showSettingsPage || !selectedGroup) {return null;}

    return (
      <PanGestureHandler
        onGestureEvent={onSettingsSwipeGestureEvent}
        onHandlerStateChange={onSettingsSwipeStateChange}
        minDist={10}
      >
        <Animated.View
          style={[
            styles.settingsPageContainer,
            {
              backgroundColor: bgColor,
              transform: [
                {
                  translateX: Animated.add(settingsSlideAnim, settingsSwipeAnim.interpolate({
                    inputRange: [-100, 0, SCREEN_WIDTH],
                    outputRange: [0, 0, SCREEN_WIDTH],
                    extrapolate: 'clamp',
                  })),
                },
              ],
            },
          ]}
        >
          <SafeAreaView style={{flex: 1, backgroundColor: bgColor}}>
            {/* 스와이프 인디케이터 */}
            <Animated.View
              style={[
                styles.swipeIndicator,
                {
                  opacity: settingsSwipeAnim.interpolate({
                    inputRange: [0, 50, 100],
                    outputRange: [0.3, 0.6, 1],
                    extrapolate: 'clamp',
                  }),
                },
              ]}
            >
              <Icon name="chevron-back" size={iconSize(20)} color={subtextColor} />
            </Animated.View>

            {/* 헤더 */}
            <View style={[styles.settingsHeader, {backgroundColor: cardBg, borderBottomColor: borderColor}]}>
              <TouchableOpacity style={styles.settingsBackBtn} onPress={handleCloseSettings}>
                <Icon name="arrow-back" size={iconSize(24)} color={textColor} />
              </TouchableOpacity>
              <Text style={[styles.settingsTitle, {color: textColor}]}>모임 설정</Text>
              <View style={styles.settingsBackBtn} />
            </View>

            <ScrollView style={{flex: 1}} contentContainerStyle={styles.settingsContent}>
              {/* 모임 정보 섹션 */}
              <View style={[styles.settingsSection, {backgroundColor: cardBg}]}>
                <Text style={[styles.settingsSectionTitle, {color: subtextColor}]}>모임 정보</Text>

                <View style={[styles.settingsItem, {borderBottomColor: borderColor}]}>
                  <View style={styles.settingsItemLeft}>
                    <Icon name="people" size={iconSize(20)} color={accentColor} />
                    <Text style={[styles.settingsItemLabel, {color: textColor}]}>모임명</Text>
                  </View>
                  <Text style={[styles.settingsItemValue, {color: subtextColor}]}>{selectedGroup.name}</Text>
                </View>

                <View style={[styles.settingsItem, {borderBottomColor: borderColor}]}>
                  <View style={styles.settingsItemLeft}>
                    <Icon name="folder" size={iconSize(20)} color={accentColor} />
                    <Text style={[styles.settingsItemLabel, {color: textColor}]}>카테고리</Text>
                  </View>
                  <Text style={[styles.settingsItemValue, {color: subtextColor}]}>
                    {GROUP_CATEGORIES.find(c => c.id === selectedGroup.category)?.label || '기타'}
                  </Text>
                </View>

                <View style={[styles.settingsItem, {borderBottomWidth: 0}]}>
                  <View style={styles.settingsItemLeft}>
                    <Icon name="person" size={iconSize(20)} color={accentColor} />
                    <Text style={[styles.settingsItemLabel, {color: textColor}]}>모임장</Text>
                  </View>
                  <Text style={[styles.settingsItemValue, {color: subtextColor}]}>
                    {selectedGroup.members.find(m => m.role === 'leader')?.nickname || '알 수 없음'}
                  </Text>
                </View>
              </View>

              {/* 알림 설정 섹션 */}
              <View style={[styles.settingsSection, {backgroundColor: cardBg}]}>
                <Text style={[styles.settingsSectionTitle, {color: subtextColor}]}>알림 설정</Text>

                <View style={[styles.settingsItem, {borderBottomColor: borderColor}]}>
                  <View style={styles.settingsItemLeft}>
                    <Icon name="megaphone" size={iconSize(20)} color="#FF9500" />
                    <View>
                      <Text style={[styles.settingsItemLabel, {color: textColor}]}>공지사항</Text>
                      <Text style={[styles.settingsItemDesc, {color: subtextColor}]}>새 공지 알림 받기</Text>
                    </View>
                  </View>
                  <Switch
                    value={notifyNotice}
                    onValueChange={setNotifyNotice}
                    trackColor={{false: '#767577', true: accentColor + '60'}}
                    thumbColor={notifyNotice ? accentColor : '#f4f3f4'}
                  />
                </View>

                <View style={[styles.settingsItem, {borderBottomColor: borderColor}]}>
                  <View style={styles.settingsItemLeft}>
                    <Icon name="document-text" size={iconSize(20)} color="#34C759" />
                    <View>
                      <Text style={[styles.settingsItemLabel, {color: textColor}]}>새 게시글</Text>
                      <Text style={[styles.settingsItemDesc, {color: subtextColor}]}>게시판 새 글 알림</Text>
                    </View>
                  </View>
                  <Switch
                    value={notifyNewPost}
                    onValueChange={setNotifyNewPost}
                    trackColor={{false: '#767577', true: accentColor + '60'}}
                    thumbColor={notifyNewPost ? accentColor : '#f4f3f4'}
                  />
                </View>

                <View style={[styles.settingsItem, {borderBottomColor: borderColor}]}>
                  <View style={styles.settingsItemLeft}>
                    <Icon name="chatbubble" size={iconSize(20)} color="#5856D6" />
                    <View>
                      <Text style={[styles.settingsItemLabel, {color: textColor}]}>댓글</Text>
                      <Text style={[styles.settingsItemDesc, {color: subtextColor}]}>내 글에 댓글 알림</Text>
                    </View>
                  </View>
                  <Switch
                    value={notifyComment}
                    onValueChange={setNotifyComment}
                    trackColor={{false: '#767577', true: accentColor + '60'}}
                    thumbColor={notifyComment ? accentColor : '#f4f3f4'}
                  />
                </View>

                <View style={[styles.settingsItem, {borderBottomWidth: 0}]}>
                  <View style={styles.settingsItemLeft}>
                    <Icon name="chatbubbles" size={iconSize(20)} color="#007AFF" />
                    <View>
                      <Text style={[styles.settingsItemLabel, {color: textColor}]}>그룹 채팅</Text>
                      <Text style={[styles.settingsItemDesc, {color: subtextColor}]}>채팅 메시지 알림</Text>
                    </View>
                  </View>
                  <Switch
                    value={notifyChat}
                    onValueChange={setNotifyChat}
                    trackColor={{false: '#767577', true: accentColor + '60'}}
                    thumbColor={notifyChat ? accentColor : '#f4f3f4'}
                  />
                </View>
              </View>

              {/* 탈퇴 버튼 */}
              <TouchableOpacity
                style={[styles.leaveButton, {backgroundColor: isDark ? '#2C2C2E' : '#FFF'}]}
                onPress={handleLeaveGroup}
              >
                <Icon name="exit-outline" size={iconSize(20)} color="#FF3B30" />
                <Text style={styles.leaveButtonText}>모임 탈퇴</Text>
              </TouchableOpacity>

              <Text style={[styles.leaveWarning, {color: subtextColor}]}>
                모임 탈퇴 시 활동 기록이 삭제되며, 다시 가입해야 합니다.
              </Text>
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </PanGestureHandler>
    );
  };

  // 모임 생성 모달
  const renderCreateModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      onRequestClose={() => setShowCreateModal(false)}>
      <SafeAreaView style={[styles.modalContainer, {backgroundColor: bgColor}]}>
        <KeyboardAvoidingView
          style={{flex: 1}}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          {/* 헤더 */}
          <View style={[styles.modalHeader, {backgroundColor: cardBg, borderBottomColor: borderColor}]}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={[styles.cancelText, {color: subtextColor}]}>취소</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, {color: textColor}]}>모임 만들기</Text>
            <TouchableOpacity onPress={handleCreateGroup}>
              <Text style={[styles.submitText, {color: accentColor}]}>완료</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.createForm} contentContainerStyle={styles.createFormContent}>
            {/* 커버 이미지 */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, {color: textColor}]}>커버 이미지</Text>
              {newGroupImage ? (
                <View style={styles.selectedImageContainer}>
                  <Image
                    source={{uri: newGroupImage}}
                    style={styles.selectedImage}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={[styles.removeImageBtn, {backgroundColor: 'rgba(0,0,0,0.6)'}]}
                    onPress={() => setNewGroupImage(null)}>
                    <Icon name="close" size={iconSize(16)} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={[styles.imagePlaceholder, {backgroundColor: cardBg, borderColor}]}>
                  <Icon name="image-outline" size={iconSize(32)} color={subtextColor} />
                  <Text style={[styles.imagePlaceholderText, {color: subtextColor}]}>
                    아래에서 이미지를 선택하세요
                  </Text>
                </View>
              )}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.imagePickerScroll}
                contentContainerStyle={styles.imagePickerContent}>
                {SAMPLE_GROUP_IMAGES.map((img, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.imageOption,
                      {borderColor: newGroupImage === img ? accentColor : borderColor},
                      newGroupImage === img && {borderWidth: 2},
                    ]}
                    onPress={() => setNewGroupImage(img)}>
                    <Image source={{uri: img}} style={styles.imageOptionImg} resizeMode="cover" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* 모임 이름 */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, {color: textColor}]}>모임 이름 *</Text>
              <TextInput
                style={[styles.formInput, {color: textColor, backgroundColor: cardBg, borderColor}]}
                placeholder="예: 정보처리기사 합격반"
                placeholderTextColor={subtextColor}
                value={newGroupName}
                onChangeText={setNewGroupName}
                maxLength={30}
              />
            </View>

            {/* 카테고리 */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, {color: textColor}]}>카테고리 *</Text>
              <View style={styles.categoryOptions}>
                {GROUP_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryOption,
                      {borderColor: borderColor},
                      newGroupCategory === cat.id && {borderColor: cat.color, backgroundColor: cat.color + '10'},
                    ]}
                    onPress={() => setNewGroupCategory(cat.id)}>
                    <Icon
                      name={cat.icon as any}
                      size={iconSize(16)}
                      color={newGroupCategory === cat.id ? cat.color : subtextColor}
                    />
                    <Text
                      style={[
                        styles.categoryOptionText,
                        {color: newGroupCategory === cat.id ? cat.color : subtextColor},
                      ]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 설명 */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, {color: textColor}]}>모임 소개 *</Text>
              <TextInput
                style={[
                  styles.formInput,
                  styles.formTextArea,
                  {color: textColor, backgroundColor: cardBg, borderColor},
                ]}
                placeholder="모임의 목표와 활동 방식을 소개해주세요"
                placeholderTextColor={subtextColor}
                value={newGroupDesc}
                onChangeText={setNewGroupDesc}
                multiline
                textAlignVertical="top"
                maxLength={500}
              />
            </View>

            {/* 태그 */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, {color: textColor}]}>태그 (쉼표로 구분)</Text>
              <TextInput
                style={[styles.formInput, {color: textColor, backgroundColor: cardBg, borderColor}]}
                placeholder="예: 정보처리기사, IT자격증, 2024"
                placeholderTextColor={subtextColor}
                value={newGroupTags}
                onChangeText={setNewGroupTags}
              />
            </View>

            {/* 최대 인원 */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, {color: textColor}]}>최대 인원</Text>
              <TextInput
                style={[styles.formInput, {color: textColor, backgroundColor: cardBg, borderColor}]}
                placeholder="20"
                placeholderTextColor={subtextColor}
                value={newGroupMaxMembers}
                onChangeText={setNewGroupMaxMembers}
                keyboardType="number-pad"
              />
            </View>

            {/* 주당 최소 공부시간 */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, {color: textColor}]}>주당 최소 공부시간 (시간)</Text>
              <TextInput
                style={[styles.formInput, {color: textColor, backgroundColor: cardBg, borderColor}]}
                placeholder="10"
                placeholderTextColor={subtextColor}
                value={newGroupMinStudyHours}
                onChangeText={setNewGroupMinStudyHours}
                keyboardType="number-pad"
              />
            </View>

            {/* 옵션 */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, {color: textColor}]}>가입 설정</Text>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setNewGroupRequireApproval(!newGroupRequireApproval)}>
                <Icon
                  name={newGroupRequireApproval ? 'checkbox' : 'square-outline'}
                  size={iconSize(22)}
                  color={newGroupRequireApproval ? accentColor : subtextColor}
                />
                <Text style={[styles.checkboxText, {color: textColor}]}>가입 승인 필요</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setNewGroupIsPrivate(!newGroupIsPrivate)}>
                <Icon
                  name={newGroupIsPrivate ? 'checkbox' : 'square-outline'}
                  size={iconSize(22)}
                  color={newGroupIsPrivate ? accentColor : subtextColor}
                />
                <Text style={[styles.checkboxText, {color: textColor}]}>비공개 모임</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );

  // 게시글 상세 페이지
  const renderPostDetailPage = () => (
    <SafeAreaView style={[styles.modalContainer, {backgroundColor: bgColor}]}>
      {/* 헤더 */}
      <View style={[styles.modalHeader, {borderBottomColor: isDark ? '#2C2C2E' : '#E5E5EA'}]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            setShowPostDetail(false);
            setSelectedPost(null);
          }}>
          <Icon name="chevron-back" size={iconSize(24)} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.modalTitle, {color: textColor}]}>게시글</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.modalHeaderBtn}>
            <Icon name="ellipsis-horizontal" size={iconSize(22)} color={textColor} />
          </TouchableOpacity>
        </View>
      </View>

      {selectedPost && (
        <ScrollView style={styles.postDetailContent} showsVerticalScrollIndicator={false}>
          {/* 작성자 정보 */}
          <View style={styles.postDetailAuthor}>
            <View style={[styles.postDetailAvatar, {backgroundColor: accentColor + '30'}]}>
              <Icon name="person" size={iconSize(24)} color={accentColor} />
            </View>
            <View style={styles.postDetailAuthorInfo}>
              <View style={styles.postDetailAuthorRow}>
                <Text style={[styles.postDetailAuthorName, {color: textColor}]}>
                  {selectedPost.authorNickname}
                </Text>
                {selectedPost.authorTier && (
                  <View style={[styles.postDetailTierBadge, {backgroundColor: getTierColor(selectedPost.authorTier) + '20'}]}>
                    <Text style={[styles.postDetailTierText, {color: getTierColor(selectedPost.authorTier)}]}>
                      {selectedPost.authorTier}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.postDetailAuthorTime, {color: subtextColor}]}>
                {new Date(selectedPost.createdAt).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>

          {/* 고정 배지 */}
          {selectedPost.isPinned && (
            <View style={styles.postDetailPinnedBadge}>
              <Icon name="pin" size={iconSize(14)} color="#FF9500" />
              <Text style={styles.postDetailPinnedText}>고정된 게시글</Text>
            </View>
          )}

          {/* 제목 */}
          <Text style={[styles.postDetailTitle, {color: textColor}]}>
            {selectedPost.title}
          </Text>

          {/* 본문 */}
          <Text style={[styles.postDetailBody, {color: textColor}]}>
            {selectedPost.content}
          </Text>

          {/* 이미지 */}
          {selectedPost.image && (
            <Image
              source={{uri: selectedPost.image}}
              style={styles.postDetailImage}
              resizeMode="cover"
            />
          )}

          {/* 좋아요/댓글 통계 */}
          <View style={[styles.postDetailStats, {borderColor: isDark ? '#2C2C2E' : '#E5E5EA'}]}>
            <View style={styles.postDetailStatItem}>
              <Icon name="heart" size={iconSize(18)} color={selectedPost.likes > 0 ? '#FF3B30' : subtextColor} />
              <Text style={[styles.postDetailStatText, {color: subtextColor}]}>
                좋아요 {selectedPost.likes}
              </Text>
            </View>
            <View style={styles.postDetailStatItem}>
              <Icon name="chatbubble" size={iconSize(18)} color={subtextColor} />
              <Text style={[styles.postDetailStatText, {color: subtextColor}]}>
                댓글 {selectedPost.commentCount}
              </Text>
            </View>
          </View>

          {/* 액션 버튼 */}
          <View style={[styles.postDetailActions, {borderColor: isDark ? '#2C2C2E' : '#E5E5EA'}]}>
            <TouchableOpacity style={styles.postDetailActionButton}>
              <Icon name="heart-outline" size={iconSize(22)} color={subtextColor} />
              <Text style={[styles.postDetailActionText, {color: subtextColor}]}>좋아요</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.postDetailActionButton}>
              <Icon name="chatbubble-outline" size={iconSize(22)} color={subtextColor} />
              <Text style={[styles.postDetailActionText, {color: subtextColor}]}>댓글</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.postDetailActionButton}>
              <Icon name="share-outline" size={iconSize(22)} color={subtextColor} />
              <Text style={[styles.postDetailActionText, {color: subtextColor}]}>공유</Text>
            </TouchableOpacity>
          </View>

          {/* 댓글 영역 */}
          <View style={styles.postDetailComments}>
            <Text style={[styles.postDetailCommentsTitle, {color: textColor}]}>
              댓글 {selectedPost.commentCount}
            </Text>
            {selectedPost.commentCount === 0 ? (
              <View style={styles.postDetailEmptyComments}>
                <Icon name="chatbubble-ellipses-outline" size={iconSize(32)} color={subtextColor} />
                <Text style={[styles.postDetailEmptyCommentsText, {color: subtextColor}]}>
                  아직 댓글이 없어요
                </Text>
                <Text style={[styles.postDetailEmptyCommentsSubtext, {color: subtextColor}]}>
                  첫 번째 댓글을 남겨보세요!
                </Text>
              </View>
            ) : null}
          </View>

          {/* 하단 여백 */}
          <View style={{height: hp(100)}} />
        </ScrollView>
      )}

      {/* 댓글 입력창 */}
      <View style={[styles.postDetailInputContainer, {
        backgroundColor: bgColor,
        borderTopColor: isDark ? '#2C2C2E' : '#E5E5EA',
      }]}>
        <View style={[styles.postDetailInputWrapper, {backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7'}]}>
          <TextInput
            style={[styles.postDetailInput, {color: textColor}]}
            placeholder="댓글을 입력하세요..."
            placeholderTextColor={subtextColor}
          />
        </View>
        <TouchableOpacity style={[styles.postDetailSendButton, {backgroundColor: accentColor}]}>
          <Icon name="send" size={iconSize(18)} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  // 빈 상태
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="people-outline" size={iconSize(60)} color={subtextColor} />
      <Text style={[styles.emptyText, {color: subtextColor}]}>모임을 찾을 수 없어요</Text>
      <Text style={[styles.emptySubtext, {color: subtextColor}]}>
        새로운 모임을 만들어보세요!
      </Text>
    </View>
  );

  // 내 모임 카드 렌더링 (세로 목록용)
  const renderMyGroupCard = ({item}: {item: Group}) => {
    const categoryInfo = getCategoryInfo(item.category);

    return (
      <TouchableOpacity
        style={[styles.groupCard, {backgroundColor: cardBg}]}
        onPress={() => {
          selectGroup(item);
          setShowDetailModal(true);
        }}>
        <View style={styles.groupCardContent}>
          {/* 헤더 */}
          <View style={styles.groupCardHeader}>
            <View style={[styles.groupCategoryBadge, {backgroundColor: categoryInfo.color + '20'}]}>
              <Icon name={categoryInfo.icon as any} size={iconSize(14)} color={categoryInfo.color} />
              <Text style={[styles.groupCategoryText, {color: categoryInfo.color}]}>
                {categoryInfo.label}
              </Text>
            </View>
            {item.isPrivate && (
              <View style={[styles.privateBadge, {backgroundColor: isDark ? '#2C2C2E' : '#F0F0F0'}]}>
                <Icon name="lock-closed" size={iconSize(12)} color={subtextColor} />
              </View>
            )}
            <View
              style={[
                styles.statusBadge,
                {backgroundColor: item.status === 'recruiting' ? '#4CAF50' : '#FF9500'},
              ]}>
              <Text style={styles.statusText}>
                {item.status === 'recruiting' ? '모집중' : '활동중'}
              </Text>
            </View>
          </View>

          {/* 제목 */}
          <Text style={[styles.groupName, {color: textColor}]}>{item.name}</Text>
          <Text style={[styles.groupDesc, {color: subtextColor}]} numberOfLines={2}>
            {item.description}
          </Text>

          {/* 인원, 방 유형, 가입조건 - 1줄 간결하게 */}
          <View style={styles.tagList}>
            <View style={[styles.tagCompact, {backgroundColor: isDark ? '#2C2C2E' : '#F0F0F0'}]}>
              <Icon name="people-outline" size={iconSize(11)} color={subtextColor} />
              <Text style={[styles.tagTextCompact, {color: subtextColor}]}>
                {item.members.length}/{item.maxMembers}
              </Text>
            </View>
            <View style={[styles.tagCompact, {backgroundColor: item.isPrivate ? '#FF950015' : item.requireApproval ? '#007AFF15' : '#4CAF5015'}]}>
              <Icon
                name={item.isPrivate ? 'lock-closed' : item.requireApproval ? 'document-text-outline' : 'globe-outline'}
                size={iconSize(11)}
                color={item.isPrivate ? '#FF9500' : item.requireApproval ? '#007AFF' : '#4CAF50'}
              />
              <Text style={[styles.tagTextCompact, {color: item.isPrivate ? '#FF9500' : item.requireApproval ? '#007AFF' : '#4CAF50'}]}>
                {item.isPrivate ? '비밀' : item.requireApproval ? '신청' : '공개'}
              </Text>
            </View>
            {(item.rules.minStudyMinutesPerWeek || 0) > 0 && (
              <View style={[styles.tagCompact, {backgroundColor: isDark ? '#2C2C2E' : '#F0F0F0'}]}>
                <Icon name="time-outline" size={iconSize(11)} color={subtextColor} />
                <Text style={[styles.tagTextCompact, {color: subtextColor}]}>
                  {((item.rules.minStudyMinutesPerWeek || 0) / 60).toFixed(0)}h+
                </Text>
              </View>
            )}
          </View>

          {/* 가입됨 배지 */}
          <View style={[styles.memberBadge, {backgroundColor: accentColor + '20'}]}>
            <Icon name="checkmark-circle" size={iconSize(16)} color={accentColor} />
            <Text style={[styles.memberBadgeText, {color: accentColor}]}>가입됨</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // 내 모임이 없을 때 빈 상태
  const renderMyGroupsEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="people-outline" size={iconSize(60)} color={subtextColor} />
      <Text style={[styles.emptyText, {color: subtextColor}]}>아직 가입한 모임이 없어요</Text>
      <Text style={[styles.emptySubtext, {color: subtextColor}]}>
        검색 버튼을 눌러 모임을 찾아보세요!
      </Text>
    </View>
  );

  // 게시글 상세 페이지가 활성화되면 게시글 상세만 표시
  if (showPostDetail && selectedPost) {
    return renderPostDetailPage();
  }

  // 상세 화면이 활성화되면 상세 화면만 표시 (페이지 전환 효과)
  if (showDetailModal && selectedGroup) {
    return (
      <>
        {renderDetailModal()}
        {renderSettingsPage()}
        {renderStudyRoomModal()}
      </>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: bgColor}]}>
      {renderHeader()}

      {isSearchMode ? (
        // 검색 모드: 다른 사람들이 만든 모임 검색
        <FlatList
          data={filteredGroups}
          renderItem={renderGroupCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListHeaderComponent={renderSearchAndFilter()}
          ListEmptyComponent={renderEmptyState}
        />
      ) : (
        // 기본 모드: 내 모임만 표시
        <FlatList
          data={myGroups}
          renderItem={renderMyGroupCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={renderMyGroupsEmptyState}
        />
      )}

      {renderCreateModal()}
      {renderJoinModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  detailScreenContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  header: {
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
    gap: sp(8),
  },
  headerIconButton: {
    width: touchSize(36),
    height: touchSize(36),
    borderRadius: sp(18),
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    width: touchSize(36),
    height: touchSize(36),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: sp(-8),
  },
  createButton: {
    width: touchSize(36),
    height: touchSize(36),
    borderRadius: sp(18),
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingTop: hp(12),
    paddingBottom: hp(100),
  },
  // 내 모임 섹션
  myGroupsSection: {
    paddingVertical: hp(16),
  },
  sectionTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    paddingHorizontal: sp(16),
    marginBottom: hp(12),
  },
  myGroupsList: {
    paddingHorizontal: sp(16),
    gap: sp(12),
  },
  myGroupCard: {
    width: sp(120),
    padding: sp(14),
    borderRadius: sp(14),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  myGroupIcon: {
    width: sp(44),
    height: sp(44),
    borderRadius: sp(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(10),
  },
  myGroupName: {
    fontSize: fp(14),
    fontWeight: '600',
    marginBottom: hp(6),
  },
  myGroupStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(4),
  },
  myGroupStatText: {
    fontSize: fp(11),
  },
  unreadBadge: {
    position: 'absolute',
    top: sp(8),
    right: sp(8),
    backgroundColor: '#FF3B30',
    borderRadius: sp(10),
    minWidth: sp(20),
    height: sp(20),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: sp(6),
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: fp(11),
    fontWeight: '700',
  },
  // 검색 및 필터
  searchFilterSection: {
    paddingHorizontal: sp(16),
    paddingBottom: hp(12),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(12),
    paddingVertical: hp(10),
    borderRadius: sp(10),
    gap: sp(8),
    marginBottom: hp(12),
  },
  searchInput: {
    flex: 1,
    fontSize: fp(15),
    padding: 0,
  },
  categoryFilter: {
    gap: sp(8),
    marginBottom: hp(12),
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(12),
    paddingVertical: hp(8),
    borderRadius: sp(16),
    borderWidth: 1,
    gap: sp(6),
  },
  categoryChipText: {
    fontSize: fp(13),
    fontWeight: '500',
  },
  recruitingFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
  },
  recruitingFilterText: {
    fontSize: fp(13),
  },
  // 모임 카드
  groupCard: {
    marginHorizontal: sp(16),
    marginBottom: hp(12),
    borderRadius: sp(16),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  groupCardCoverImage: {
    width: '100%',
    height: hp(100),
  },
  groupCardContent: {
    padding: sp(14),
  },
  groupCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(6),
    marginBottom: hp(8),
  },
  groupCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(8),
    paddingVertical: hp(4),
    borderRadius: sp(8),
    gap: sp(4),
  },
  groupCategoryText: {
    fontSize: fp(11),
    fontWeight: '600',
  },
  privateBadge: {
    padding: sp(4),
    borderRadius: sp(6),
  },
  statusBadge: {
    paddingHorizontal: sp(8),
    paddingVertical: hp(4),
    borderRadius: sp(8),
    marginLeft: 'auto',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: fp(11),
    fontWeight: '600',
  },
  groupName: {
    fontSize: fp(16),
    fontWeight: '700',
    marginBottom: hp(4),
  },
  groupDesc: {
    fontSize: fp(13),
    lineHeight: fp(18),
    marginBottom: hp(8),
  },
  tagList: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(6),
    marginBottom: hp(10),
  },
  tag: {
    paddingHorizontal: sp(8),
    paddingVertical: hp(4),
    borderRadius: sp(6),
  },
  tagText: {
    fontSize: fp(11),
  },
  tagCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(6),
    paddingVertical: hp(3),
    borderRadius: sp(6),
    gap: sp(3),
  },
  tagTextCompact: {
    fontSize: fp(11),
    fontWeight: '500',
  },
  moreTag: {
    fontSize: fp(11),
    alignSelf: 'center',
  },
  groupInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: hp(10),
    borderTopWidth: 1,
    marginBottom: hp(10),
  },
  groupInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(6),
  },
  groupInfoText: {
    fontSize: fp(12),
    fontWeight: '500',
  },
  joinButton: {
    paddingVertical: hp(10),
    borderRadius: sp(10),
    alignItems: 'center',
  },
  joinButtonText: {
    fontSize: fp(13),
    fontWeight: '600',
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(10),
    borderRadius: sp(10),
    gap: sp(6),
  },
  memberBadgeText: {
    fontSize: fp(13),
    fontWeight: '600',
  },
  // 모달
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
    zIndex: 100,
  },
  modalHeaderBtn: {
    width: sp(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    flex: 1,
    fontSize: fp(16),
    fontWeight: '700',
    textAlign: 'center',
  },
  cancelText: {
    fontSize: fp(14),
  },
  submitText: {
    fontSize: fp(14),
    fontWeight: '600',
  },
  // 상세 탭 - Pill 스타일
  detailTabsWrapper: {
    paddingVertical: hp(10),
    paddingHorizontal: sp(8),
  },
  detailTabsContent: {
    flexDirection: 'row',
    gap: sp(8),
    paddingHorizontal: sp(4),
  },
  detailTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(8),
    paddingHorizontal: sp(14),
    gap: sp(6),
    borderRadius: sp(20),
  },
  detailTabText: {
    fontSize: fp(13),
  },
  detailContent: {
    flex: 1,
  },
  detailContentContainer: {
    padding: sp(16),
    gap: hp(16),
    paddingBottom: hp(100),
  },
  // 정보 카드
  infoCard: {
    padding: sp(16),
    borderRadius: sp(16),
    borderWidth: 0,
    marginBottom: hp(12),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
    marginBottom: hp(12),
  },
  infoDesc: {
    fontSize: fp(14),
    lineHeight: fp(22),
    marginBottom: hp(12),
  },
  // 통계 카드
  statsCard: {
    padding: sp(16),
    borderRadius: sp(16),
    borderWidth: 0,
    marginBottom: hp(12),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statsTitle: {
    fontSize: fp(16),
    fontWeight: '700',
    marginBottom: hp(14),
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sp(10),
    padding: sp(4),
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: hp(16),
    paddingHorizontal: sp(8),
    gap: hp(6),
    borderRadius: sp(12),
    borderWidth: 1,
  },
  statValue: {
    fontSize: fp(16),
    fontWeight: '700',
  },
  statLabel: {
    fontSize: fp(12),
  },
  // 규칙 카드
  rulesCard: {
    padding: sp(16),
    borderRadius: sp(14),
    borderWidth: 1,
    marginBottom: hp(12),
  },
  rulesTitle: {
    fontSize: fp(16),
    fontWeight: '700',
    marginBottom: hp(12),
  },
  rulesList: {
    gap: hp(10),
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(10),
  },
  ruleText: {
    fontSize: fp(14),
    flex: 1,
  },
  // 조건 카드
  conditionCard: {
    padding: sp(16),
    borderRadius: sp(14),
    borderWidth: 1,
    marginBottom: hp(12),
  },
  conditionTitle: {
    fontSize: fp(16),
    fontWeight: '700',
    marginBottom: hp(12),
  },
  conditionList: {
    gap: hp(10),
  },
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(10),
  },
  conditionText: {
    fontSize: fp(14),
  },
  // 모임 평균 공부시간 카드
  groupAverageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: sp(16),
    borderRadius: sp(12),
    marginBottom: hp(16),
  },
  groupAverageIcon: {
    width: sp(48),
    height: sp(48),
    borderRadius: sp(24),
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: sp(12),
  },
  groupAverageContent: {
    flex: 1,
  },
  groupAverageLabel: {
    fontSize: fp(12),
    fontWeight: '500',
    marginBottom: hp(4),
  },
  groupAverageTime: {
    fontSize: fp(22),
    fontWeight: '700',
    marginBottom: hp(2),
  },
  groupAverageSubtext: {
    fontSize: fp(11),
  },
  // 멤버 리스트 - ProfileCard 사용
  membersList: {
    gap: hp(12),
    paddingHorizontal: sp(16),
  },
  membersTitle: {
    fontSize: fp(16),
    fontWeight: '700',
    marginBottom: hp(12),
  },
  memberCardWrapper: {
    position: 'relative',
  },
  memberRoleOverlay: {
    position: 'absolute',
    top: sp(8),
    right: sp(8),
    paddingHorizontal: sp(8),
    paddingVertical: hp(3),
    borderRadius: sp(8),
  },
  memberRoleText: {
    color: '#FFFFFF',
    fontSize: fp(10),
    fontWeight: '700',
  },
  // 공지 카드
  noticeCard: {
    padding: sp(16),
    borderRadius: sp(14),
  },
  emptyNotice: {
    alignItems: 'center',
    paddingVertical: hp(40),
    gap: hp(12),
  },
  emptyNoticeText: {
    fontSize: fp(14),
  },
  noticeItem: {
    paddingVertical: hp(12),
    borderBottomWidth: 1,
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(4),
    marginBottom: hp(6),
  },
  pinnedText: {
    color: '#FF9500',
    fontSize: fp(11),
    fontWeight: '600',
  },
  noticeTitle: {
    fontSize: fp(15),
    fontWeight: '600',
    marginBottom: hp(6),
  },
  noticeContent: {
    fontSize: fp(13),
    lineHeight: fp(20),
    marginBottom: hp(8),
  },
  noticeDate: {
    fontSize: fp(11),
  },
  // 게시판 스타일 (PostListItem과 유사)
  boardContainer: {
    gap: hp(8),
  },
  boardWriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp(6),
    paddingVertical: hp(10),
    paddingHorizontal: sp(16),
    borderRadius: sp(8),
    alignSelf: 'flex-end',
    marginBottom: hp(8),
  },
  floatingWriteButton: {
    position: 'absolute',
    bottom: hp(100),
    right: sp(24),
    width: sp(56),
    height: sp(56),
    borderRadius: sp(28),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  boardWriteButtonText: {
    color: '#FFFFFF',
    fontSize: fp(13),
    fontWeight: '600',
  },
  emptyBoard: {
    alignItems: 'center',
    paddingVertical: hp(40),
    gap: hp(12),
  },
  emptyBoardText: {
    fontSize: fp(14),
  },
  boardPostItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: sp(14),
    paddingVertical: hp(14),
    borderRadius: sp(14),
    borderWidth: 1,
    marginBottom: hp(8),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  boardPinnedBadge: {
    position: 'absolute',
    top: hp(4),
    left: sp(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(2),
  },
  boardPinnedText: {
    color: '#FF9500',
    fontSize: fp(10),
    fontWeight: '600',
  },
  boardPinnedTextBadge: {
    paddingHorizontal: sp(6),
    paddingVertical: hp(2),
    borderRadius: sp(4),
    marginRight: sp(6),
  },
  boardPinnedTextBadgeText: {
    color: '#FFFFFF',
    fontSize: fp(10),
    fontWeight: '700',
  },
  // 날짜 네비게이터 컨테이너
  dateNavigatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sp(12),
    paddingVertical: hp(12),
    marginBottom: hp(12),
    borderRadius: sp(16),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  dateNavSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
  },
  dateNavArrow: {
    width: sp(36),
    height: sp(36),
    borderRadius: sp(18),
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateDisplayContainer: {
    minWidth: sp(80),
    alignItems: 'center',
  },
  dateDisplayText: {
    fontSize: fp(15),
    fontWeight: '700',
  },
  periodSelector: {
    flexDirection: 'row',
    borderRadius: sp(20),
    padding: sp(3),
  },
  periodOption: {
    paddingHorizontal: sp(12),
    paddingVertical: hp(6),
    borderRadius: sp(16),
  },
  periodOptionText: {
    fontSize: fp(12),
    fontWeight: '600',
  },
  // 공부 통계 카드
  studyStatsCard: {
    marginBottom: hp(16),
    borderRadius: sp(16),
    paddingVertical: hp(16),
    paddingHorizontal: sp(12),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  studyStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  studyStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  studyStatIconCircle: {
    width: sp(44),
    height: sp(44),
    borderRadius: sp(22),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(8),
  },
  studyStatValue: {
    fontSize: fp(16),
    fontWeight: '700',
    marginBottom: hp(2),
  },
  studyStatLabel: {
    fontSize: fp(11),
  },
  studyStatDivider: {
    width: 1,
    height: sp(50),
  },
  boardPostAvatar: {
    marginRight: sp(10),
    marginTop: hp(2),
  },
  boardPostAvatarInner: {
    width: sp(36),
    height: sp(36),
    borderRadius: sp(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  boardPostContent: {
    flex: 1,
    marginRight: sp(8),
  },
  boardPostTitle: {
    fontSize: fp(14),
    fontWeight: '600',
    marginBottom: hp(4),
  },
  boardPostMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  boardPostAuthor: {
    fontSize: fp(12),
  },
  boardPostDot: {
    fontSize: fp(12),
    marginHorizontal: sp(4),
  },
  boardPostTime: {
    fontSize: fp(11),
  },
  boardPostRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
  },
  boardPostStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  boardPostStatText: {
    fontSize: fp(11),
    marginLeft: sp(3),
  },
  boardPostTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(6),
  },
  boardPostItemPinned: {
    borderWidth: 1.5,
  },
  // 게시글 상세 모달 스타일
  postDetailContent: {
    flex: 1,
    padding: sp(16),
  },
  postDetailAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(16),
  },
  postDetailAvatar: {
    width: sp(48),
    height: sp(48),
    borderRadius: sp(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  postDetailAuthorInfo: {
    flex: 1,
    marginLeft: sp(12),
  },
  postDetailAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
  },
  postDetailAuthorName: {
    fontSize: fp(16),
    fontWeight: '600',
  },
  postDetailTierBadge: {
    paddingHorizontal: sp(8),
    paddingVertical: sp(2),
    borderRadius: sp(8),
  },
  postDetailTierText: {
    fontSize: fp(11),
    fontWeight: '600',
  },
  postDetailAuthorTime: {
    fontSize: fp(13),
    marginTop: hp(2),
  },
  postDetailPinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: sp(10),
    paddingVertical: sp(6),
    borderRadius: sp(8),
    alignSelf: 'flex-start',
    marginBottom: hp(12),
    gap: sp(6),
  },
  postDetailPinnedText: {
    fontSize: fp(13),
    fontWeight: '600',
    color: '#FF9500',
  },
  postDetailTitle: {
    fontSize: fp(20),
    fontWeight: '700',
    marginBottom: hp(16),
    lineHeight: fp(28),
  },
  postDetailBody: {
    fontSize: fp(16),
    lineHeight: fp(24),
    marginBottom: hp(20),
  },
  postDetailImage: {
    width: '100%',
    height: hp(200),
    borderRadius: sp(12),
    marginBottom: hp(20),
  },
  postDetailStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(12),
    borderTopWidth: 1,
    borderBottomWidth: 1,
    gap: sp(20),
  },
  postDetailStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(6),
  },
  postDetailStatText: {
    fontSize: fp(14),
  },
  postDetailActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: hp(12),
    borderBottomWidth: 1,
  },
  postDetailActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(6),
    paddingVertical: hp(8),
    paddingHorizontal: sp(16),
  },
  postDetailActionText: {
    fontSize: fp(14),
  },
  postDetailComments: {
    marginTop: hp(16),
  },
  postDetailCommentsTitle: {
    fontSize: fp(16),
    fontWeight: '600',
    marginBottom: hp(12),
  },
  postDetailEmptyComments: {
    alignItems: 'center',
    paddingVertical: hp(32),
    gap: hp(8),
  },
  postDetailEmptyCommentsText: {
    fontSize: fp(15),
    fontWeight: '500',
  },
  postDetailEmptyCommentsSubtext: {
    fontSize: fp(13),
  },
  postDetailInputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: sp(12),
    paddingBottom: hp(80), // 광고배너(50) + 여백(30)
    borderTopWidth: 1,
    gap: sp(10),
  },
  postDetailInputWrapper: {
    flex: 1,
    borderRadius: sp(20),
    paddingHorizontal: sp(16),
    paddingVertical: sp(10),
  },
  postDetailInput: {
    fontSize: fp(15),
  },
  postDetailSendButton: {
    width: sp(40),
    height: sp(40),
    borderRadius: sp(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 채팅 컨테이너 (flex layout)
  chatContainer: {
    flex: 1,
  },
  chatMessagesScroll: {
    flex: 1,
  },
  chatMessagesContent: {
    padding: sp(16),
    flexGrow: 1,
  },
  chatInputFixed: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(12),
    paddingTop: hp(10),
    paddingBottom: hp(80), // 광고배너(50) + 여백(30)
    borderTopWidth: 1,
    gap: sp(10),
  },
  chatLocked: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: hp(12),
  },
  chatLockedText: {
    fontSize: fp(14),
    textAlign: 'center',
  },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(40),
    gap: hp(12),
  },
  emptyChatText: {
    fontSize: fp(14),
    textAlign: 'center',
    lineHeight: fp(20),
  },
  chatMessage: {
    flexDirection: 'row',
    marginBottom: hp(12),
  },
  chatAvatar: {
    width: sp(28),
    height: sp(28),
    borderRadius: sp(14),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: sp(8),
  },
  chatBubble: {
    flex: 1,
  },
  chatSender: {
    fontSize: fp(12),
    fontWeight: '600',
    marginBottom: hp(2),
  },
  chatText: {
    fontSize: fp(14),
    lineHeight: fp(20),
  },
  // 하단 버튼
  detailFooter: {
    padding: sp(16),
    borderTopWidth: 1,
  },
  detailJoinButton: {
    paddingVertical: hp(14),
    borderRadius: sp(12),
    alignItems: 'center',
  },
  detailJoinButtonText: {
    color: '#FFFFFF',
    fontSize: fp(16),
    fontWeight: '600',
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp(8),
    paddingVertical: hp(16),
    borderRadius: sp(12),
    marginTop: hp(8),
  },
  leaveButtonText: {
    fontSize: fp(16),
    fontWeight: '600',
    color: '#FF3B30',
  },
  // 생성 폼
  createForm: {
    flex: 1,
  },
  createFormContent: {
    padding: sp(16),
    gap: hp(20),
  },
  formGroup: {
    gap: hp(8),
  },
  formLabel: {
    fontSize: fp(14),
    fontWeight: '600',
  },
  formInput: {
    paddingHorizontal: sp(14),
    paddingVertical: hp(12),
    borderRadius: sp(10),
    borderWidth: 1,
    fontSize: fp(15),
  },
  formTextArea: {
    height: hp(120),
    textAlignVertical: 'top',
  },
  categoryOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sp(8),
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(12),
    paddingVertical: hp(8),
    borderRadius: sp(10),
    borderWidth: 1,
    gap: sp(6),
  },
  categoryOptionText: {
    fontSize: fp(13),
    fontWeight: '500',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(10),
    paddingVertical: hp(6),
  },
  checkboxText: {
    fontSize: fp(14),
  },
  // 이미지 선택
  selectedImageContainer: {
    position: 'relative',
    borderRadius: sp(12),
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: hp(160),
    borderRadius: sp(12),
  },
  removeImageBtn: {
    position: 'absolute',
    top: sp(8),
    right: sp(8),
    width: sp(28),
    height: sp(28),
    borderRadius: sp(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholder: {
    height: hp(120),
    borderRadius: sp(12),
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hp(8),
  },
  imagePlaceholderText: {
    fontSize: fp(13),
  },
  imagePickerScroll: {
    marginTop: hp(12),
  },
  imagePickerContent: {
    gap: sp(10),
    paddingHorizontal: sp(2),
  },
  imageOption: {
    width: sp(80),
    height: sp(60),
    borderRadius: sp(8),
    overflow: 'hidden',
    borderWidth: 1,
  },
  imageOptionImg: {
    width: '100%',
    height: '100%',
  },
  // 빈 상태
  emptyState: {
    alignItems: 'center',
    paddingTop: hp(60),
    gap: hp(12),
  },
  emptyText: {
    fontSize: fp(16),
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: fp(14),
  },
  // 더보기 메뉴
  moreMenuContainer: {
    position: 'relative',
    zIndex: 100,
  },
  moreMenuDropdown: {
    position: 'absolute',
    top: sp(30),
    right: 0,
    minWidth: sp(140),
    borderRadius: sp(10),
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
  },
  moreMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(12),
    paddingHorizontal: sp(14),
    gap: sp(10),
  },
  moreMenuItemText: {
    fontSize: fp(14),
    fontWeight: '500',
  },
  // 같이 스터디 탭
  studyCard: {
    padding: sp(16),
    borderRadius: sp(14),
  },
  studyLocked: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(40),
    gap: hp(12),
  },
  studyLockedText: {
    fontSize: fp(14),
    textAlign: 'center',
  },
  studySection: {
    marginBottom: hp(20),
  },
  studySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
    marginBottom: hp(12),
  },
  liveIndicator: {
    width: sp(8),
    height: sp(8),
    borderRadius: sp(4),
  },
  studySectionTitle: {
    fontSize: fp(16),
    fontWeight: '700',
  },
  studyingMembers: {
    gap: hp(10),
  },
  noStudyingText: {
    fontSize: fp(14),
    textAlign: 'center',
    paddingVertical: hp(20),
  },
  studyingMemberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: sp(12),
    borderRadius: sp(12),
  },
  studyingMemberAvatar: {
    width: sp(40),
    height: sp(40),
    borderRadius: sp(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: sp(12),
  },
  studyingMemberInfo: {
    flex: 1,
  },
  studyingMemberName: {
    fontSize: fp(14),
    fontWeight: '600',
    marginBottom: hp(2),
  },
  studyingMemberTime: {
    fontSize: fp(12),
  },
  studyingBadge: {
    width: sp(24),
    height: sp(24),
    borderRadius: sp(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 스터디 룸 입장 UI
  studyRoomEntry: {
    alignItems: 'center',
    paddingVertical: hp(30),
  },
  studyRoomIconContainer: {
    width: sp(100),
    height: sp(100),
    borderRadius: sp(50),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(20),
  },
  studyingCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
    marginBottom: hp(16),
  },
  studyingCountText: {
    fontSize: fp(18),
    fontWeight: '700',
  },
  studyingAvatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(16),
  },
  studyingAvatarCircle: {
    width: sp(36),
    height: sp(36),
    borderRadius: sp(18),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  studyingAvatarImage: {
    width: '100%',
    height: '100%',
  },
  studyingAvatarMore: {
    width: sp(36),
    height: sp(36),
    borderRadius: sp(18),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  studyingAvatarMoreText: {
    fontSize: fp(11),
    fontWeight: '600',
  },
  studyRoomDesc: {
    fontSize: fp(14),
    textAlign: 'center',
    marginBottom: hp(24),
  },
  enterStudyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(14),
    paddingHorizontal: sp(32),
    borderRadius: sp(25),
    gap: sp(8),
  },
  enterStudyButtonText: {
    color: '#FFFFFF',
    fontSize: fp(16),
    fontWeight: '700',
  },
  // 채팅 입력란
  chatMessagesArea: {
    minHeight: hp(150),
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(10),
    paddingTop: hp(12),
    marginTop: hp(12),
    borderTopWidth: 1,
  },
  chatInputField: {
    flex: 1,
    paddingHorizontal: sp(14),
    paddingVertical: hp(10),
    borderRadius: sp(20),
    fontSize: fp(14),
  },
  chatSendBtn: {
    width: sp(40),
    height: sp(40),
    borderRadius: sp(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchingSection: {
    alignItems: 'center',
    paddingVertical: hp(24),
    paddingHorizontal: sp(16),
    marginBottom: hp(20),
  },
  matchingSectionTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    marginBottom: hp(8),
  },
  matchingDesc: {
    fontSize: fp(14),
    textAlign: 'center',
    lineHeight: fp(20),
    marginBottom: hp(20),
  },
  startStudyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(14),
    paddingHorizontal: sp(24),
    borderRadius: sp(12),
    gap: sp(8),
  },
  startStudyButtonText: {
    color: '#FFFFFF',
    fontSize: fp(16),
    fontWeight: '600',
  },
  rankingSection: {
    marginBottom: hp(16),
  },
  rankingSectionTitle: {
    fontSize: fp(16),
    fontWeight: '700',
    marginBottom: hp(12),
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(10),
    borderBottomWidth: 1,
  },
  rankingNumber: {
    width: sp(24),
    fontSize: fp(16),
    fontWeight: '700',
    textAlign: 'center',
  },
  rankingAvatar: {
    width: sp(32),
    height: sp(32),
    borderRadius: sp(16),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: sp(10),
  },
  rankingName: {
    flex: 1,
    fontSize: fp(14),
    fontWeight: '500',
  },
  rankingTime: {
    fontSize: fp(13),
  },
  // 스터디 모드 선택 UI
  studyingMembersHorizontal: {
    marginTop: hp(8),
  },
  studyingMemberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(10),
    paddingVertical: hp(6),
    borderRadius: sp(20),
    marginRight: sp(8),
  },
  studyingMemberAvatarSmall: {
    width: sp(24),
    height: sp(24),
    borderRadius: sp(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: sp(6),
  },
  studyingMemberNameSmall: {
    fontSize: fp(12),
    fontWeight: '500',
    marginRight: sp(6),
  },
  liveIndicatorSmall: {
    width: sp(6),
    height: sp(6),
    borderRadius: sp(3),
  },
  studyRoomSelection: {
    paddingVertical: hp(16),
    marginBottom: hp(20),
  },
  studyRoomTitle: {
    fontSize: fp(18),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: hp(4),
  },
  studyRoomSubtitle: {
    fontSize: fp(14),
    textAlign: 'center',
    marginBottom: hp(20),
  },
  studyModeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: sp(16),
    borderRadius: sp(16),
    marginBottom: hp(12),
  },
  studyModeIconBox: {
    width: sp(56),
    height: sp(56),
    justifyContent: 'center',
    alignItems: 'center',
  },
  studyModeInfo: {
    flex: 1,
    marginLeft: sp(12),
  },
  studyModeName: {
    fontSize: fp(16),
    fontWeight: '700',
    marginBottom: hp(4),
  },
  studyModeDesc: {
    fontSize: fp(13),
    lineHeight: fp(18),
  },
  studyModeArrow: {
    width: sp(36),
    height: sp(36),
    borderRadius: sp(18),
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 스터디 룸 모달 스타일
  studyRoomContainer: {
    flex: 1,
  },
  studyRoomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sp(16),
    paddingVertical: hp(12),
  },
  studyRoomHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(12),
  },
  studyRoomTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(10),
    paddingVertical: hp(6),
    borderRadius: sp(12),
    gap: sp(6),
  },
  studyRoomTypeText: {
    color: '#FFFFFF',
    fontSize: fp(13),
    fontWeight: '600',
  },
  studyRoomPeopleCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(4),
  },
  studyRoomPeopleText: {
    color: '#FFFFFF',
    fontSize: fp(13),
    fontWeight: '500',
  },
  studyRoomExitButton: {
    padding: sp(8),
  },
  studyRoomContent: {
    flex: 1,
  },
  studyRoomContentContainer: {
    padding: sp(16),
    paddingBottom: hp(40),
  },
  // 내 스터디 카드
  myStudyCard: {
    borderRadius: sp(16),
    padding: sp(20),
    marginBottom: hp(16),
  },
  myStudyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(20),
  },
  myStudyAvatar: {
    width: sp(56),
    height: sp(56),
    borderRadius: sp(28),
    justifyContent: 'center',
    alignItems: 'center',
  },
  myStudyInfo: {
    flex: 1,
    marginLeft: sp(14),
  },
  myStudyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
    marginBottom: hp(4),
  },
  myStudyName: {
    fontSize: fp(18),
    fontWeight: '700',
  },
  myStudyStatus: {
    fontSize: fp(14),
    fontWeight: '500',
  },
  tierBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(6),
    paddingVertical: hp(2),
    borderRadius: sp(6),
    gap: sp(3),
  },
  tierBadgeText: {
    fontSize: fp(10),
    fontWeight: '600',
  },
  focusBadge: {
    width: sp(36),
    height: sp(36),
    borderRadius: sp(18),
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 타이머
  timerSection: {
    alignItems: 'center',
    marginBottom: hp(20),
  },
  timerCircleContainer: {
    position: 'relative',
    width: sp(140),
    height: sp(140),
  },
  timerCircle: {
    width: sp(140),
    height: sp(140),
    borderRadius: sp(70),
    borderWidth: sp(4),
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontSize: fp(28),
    fontWeight: '700',
  },
  timerLabel: {
    fontSize: fp(12),
    marginTop: hp(4),
  },
  timerProgress: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: sp(140),
    borderRadius: sp(70),
    opacity: 0.2,
    transformOrigin: 'bottom',
  },
  // 컨트롤 버튼
  studyControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: sp(16),
  },
  controlButton: {
    width: sp(56),
    height: sp(56),
    borderRadius: sp(28),
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 공부중인 멤버 섹션
  studyMembersSection: {
    marginBottom: hp(16),
  },
  studyMembersSectionTitle: {
    fontSize: fp(16),
    fontWeight: '700',
    marginBottom: hp(12),
  },
  noMembersCard: {
    alignItems: 'center',
    paddingVertical: hp(30),
    borderRadius: sp(12),
  },
  noMembersText: {
    fontSize: fp(14),
    marginTop: hp(12),
  },
  studyMembersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sp(10),
  },
  // 새로운 멤버 프로필 카드 스타일
  memberProfileCard: {
    width: (SCREEN_WIDTH - sp(32) - sp(10)) / 2,
    padding: sp(14),
    borderRadius: sp(14),
    alignItems: 'center',
  },
  memberProfileTop: {
    alignItems: 'center',
    marginBottom: hp(10),
  },
  memberProfileAvatar: {
    width: sp(56),
    height: sp(56),
    borderRadius: sp(28),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(8),
  },
  memberProfileTime: {
    fontSize: fp(14),
    fontWeight: '700',
  },
  memberProfileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(6),
    marginBottom: hp(4),
  },
  memberProfileName: {
    fontSize: fp(15),
    fontWeight: '600',
    maxWidth: sp(80),
  },
  memberProfileStatus: {
    fontSize: fp(12),
  },
  studyMemberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: sp(12),
    borderRadius: sp(12),
  },
  studyMemberCardFocus: {
    flexDirection: 'column',
    padding: sp(10),
    width: (SCREEN_WIDTH - sp(32) - sp(10)) / 2,
  },
  memberCameraView: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: sp(10),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(10),
  },
  memberAvatarLarge: {
    width: sp(60),
    height: sp(60),
    borderRadius: sp(30),
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberCameraInfo: {
    alignItems: 'center',
  },
  memberCameraName: {
    fontSize: fp(14),
    fontWeight: '600',
    marginBottom: hp(2),
  },
  memberCameraTime: {
    fontSize: fp(12),
    fontWeight: '500',
  },
  memberAvatarSmall: {
    width: sp(40),
    height: sp(40),
    borderRadius: sp(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberListInfo: {
    flex: 1,
    marginLeft: sp(12),
  },
  memberListName: {
    fontSize: fp(14),
    fontWeight: '600',
    marginBottom: hp(2),
  },
  memberListTime: {
    fontSize: fp(12),
  },
  memberLiveIndicator: {
    width: sp(8),
    height: sp(8),
    borderRadius: sp(4),
  },
  // 채팅 섹션
  chatSection: {
    borderRadius: sp(14),
    padding: sp(16),
    marginBottom: hp(16),
  },
  chatSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
    marginBottom: hp(12),
  },
  chatSectionTitle: {
    fontSize: fp(16),
    fontWeight: '700',
  },
  chatMessagesContainer: {
    minHeight: hp(120),
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatPlaceholder: {
    fontSize: fp(14),
    textAlign: 'center',
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(10),
    paddingTop: hp(12),
    borderTopWidth: 1,
  },
  chatInput: {
    flex: 1,
    paddingHorizontal: sp(14),
    paddingVertical: hp(10),
    borderRadius: sp(20),
    fontSize: fp(14),
  },
  chatSendButton: {
    width: sp(40),
    height: sp(40),
    borderRadius: sp(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 집중 통계 카드
  focusStatsCard: {
    borderRadius: sp(14),
    padding: sp(16),
    marginBottom: hp(16),
  },
  focusStatsTitle: {
    fontSize: fp(16),
    fontWeight: '700',
    marginBottom: hp(16),
  },
  focusStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(16),
  },
  focusStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  focusStatValue: {
    fontSize: fp(24),
    fontWeight: '700',
    marginBottom: hp(4),
  },
  focusStatLabel: {
    fontSize: fp(12),
  },
  focusStatDivider: {
    width: 1,
    height: sp(40),
    marginHorizontal: sp(16),
  },
  encouragementBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(12),
    paddingHorizontal: sp(16),
    borderRadius: sp(12),
    gap: sp(8),
  },
  encouragementText: {
    fontSize: fp(14),
    fontWeight: '600',
  },
  // 세션 화면 스타일 (MatchingScreen과 동일)
  sessionContainer: {
    flex: 1,
  },
  sessionContent: {
    flex: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sp(16),
    paddingVertical: hp(12),
  },
  sessionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(12),
  },
  sessionTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(4),
    paddingHorizontal: sp(10),
    paddingVertical: hp(6),
    borderRadius: sp(8),
  },
  sessionTypeBadgeText: {
    color: '#FFFFFF',
    fontSize: fp(12),
    fontWeight: '600',
  },
  sessionPeopleCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(4),
  },
  sessionPeopleText: {
    fontSize: fp(13),
    fontWeight: '500',
  },
  endSessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(6),
    paddingHorizontal: sp(14),
    paddingVertical: hp(8),
    borderRadius: sp(8),
  },
  endSessionText: {
    color: '#FFFFFF',
    fontSize: fp(14),
    fontWeight: '600',
  },
  // 캠 리스트 스타일
  focusCamListSection: {
    paddingVertical: hp(12),
  },
  focusCamListContent: {
    paddingHorizontal: sp(16),
    gap: sp(12),
  },
  focusCamItem: {
    alignItems: 'center',
    width: sp(110),
  },
  focusCamBox: {
    width: sp(110),
    height: sp(120),
    borderRadius: sp(12),
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: sp(2)},
    shadowOpacity: 0.1,
    shadowRadius: sp(4),
    elevation: 3,
    marginBottom: sp(4),
  },
  focusCamPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  focusCamImage: {
    width: '100%',
    height: '100%',
  },
  focusCamControls: {
    position: 'absolute',
    bottom: sp(6),
    right: sp(6),
    flexDirection: 'row',
    gap: sp(4),
  },
  focusCamControlBtn: {
    width: sp(24),
    height: sp(24),
    borderRadius: sp(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusCamStatusDot: {
    position: 'absolute',
    top: sp(6),
    right: sp(6),
    width: sp(10),
    height: sp(10),
    borderRadius: sp(5),
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  // 타이머 스타일
  focusTimerSection: {
    paddingHorizontal: sp(16),
    marginBottom: hp(16),
  },
  timerCard: {
    borderRadius: sp(20),
    padding: sp(24),
    marginBottom: hp(16),
    alignItems: 'center',
  },
  timerWrapper: {
    alignItems: 'center',
  },
  timerTimeText: {
    fontSize: fp(32),
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    marginTop: hp(12),
  },
  timerStatusLabel: {
    fontSize: fp(16),
    fontWeight: '700',
    marginBottom: hp(12),
  },
  // 세션 채팅 스타일
  sessionChatSection: {
    borderRadius: sp(16),
    padding: sp(16),
    marginBottom: hp(16),
  },
  sessionChatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(12),
  },
  sessionChatHeaderText: {
    fontSize: fp(16),
    fontWeight: '700',
  },
  sessionChatMessages: {
    minHeight: hp(100),
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionChatPlaceholder: {
    fontSize: fp(14),
    textAlign: 'center',
  },
  // 가입 모달 스타일
  joinModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  joinModalContent: {
    width: '85%',
    maxWidth: sp(340),
    borderRadius: sp(20),
    padding: sp(20),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  joinModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(16),
  },
  joinModalTitle: {
    fontSize: fp(18),
    fontWeight: '700',
  },
  joinModalScrollContent: {
    maxHeight: hp(350),
  },
  joinModalDescSection: {
    marginBottom: hp(16),
  },
  joinModalDescBox: {
    padding: sp(12),
    borderRadius: sp(10),
    marginTop: hp(8),
  },
  joinModalDescText: {
    fontSize: fp(14),
    lineHeight: fp(20),
  },
  joinModalGroupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: sp(12),
    borderRadius: sp(12),
    marginBottom: hp(16),
    gap: sp(10),
  },
  joinModalGroupCategory: {
    width: sp(40),
    height: sp(40),
    borderRadius: sp(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinModalGroupText: {
    flex: 1,
  },
  joinModalGroupName: {
    fontSize: fp(15),
    fontWeight: '600',
    marginBottom: hp(2),
  },
  joinModalGroupMembers: {
    fontSize: fp(13),
  },
  joinModalConditions: {
    marginBottom: hp(16),
  },
  joinModalSectionTitle: {
    fontSize: fp(14),
    fontWeight: '600',
    marginBottom: hp(10),
  },
  joinModalConditionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
    marginBottom: hp(8),
  },
  joinModalConditionText: {
    fontSize: fp(14),
  },
  joinModalInputSection: {
    marginBottom: hp(12),
  },
  joinModalInputLabel: {
    fontSize: fp(14),
    fontWeight: '500',
    marginBottom: hp(6),
  },
  joinModalInput: {
    paddingHorizontal: sp(14),
    paddingVertical: hp(12),
    borderRadius: sp(10),
    borderWidth: 1,
    fontSize: fp(15),
  },
  joinModalTextArea: {
    height: hp(80),
    textAlignVertical: 'top',
  },
  joinModalButtons: {
    flexDirection: 'row',
    gap: sp(10),
    marginTop: hp(8),
  },
  joinModalCancelBtn: {
    flex: 1,
    paddingVertical: hp(14),
    borderRadius: sp(12),
    alignItems: 'center',
    borderWidth: 1,
  },
  joinModalCancelText: {
    fontSize: fp(15),
    fontWeight: '600',
  },
  joinModalJoinBtn: {
    flex: 1,
    paddingVertical: hp(14),
    borderRadius: sp(12),
    alignItems: 'center',
  },
  joinModalJoinText: {
    color: '#FFFFFF',
    fontSize: fp(15),
    fontWeight: '600',
  },
  // 설정 페이지 스타일
  settingsPageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 200,
  },
  swipeIndicator: {
    position: 'absolute',
    left: sp(8),
    top: '50%',
    zIndex: 10,
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sp(8),
    paddingVertical: hp(12),
    borderBottomWidth: 1,
  },
  settingsBackBtn: {
    width: sp(44),
    height: sp(44),
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsTitle: {
    fontSize: fp(17),
    fontWeight: '600',
  },
  settingsContent: {
    padding: sp(16),
    paddingBottom: hp(100),
  },
  settingsSection: {
    borderRadius: sp(12),
    marginBottom: hp(16),
    overflow: 'hidden',
  },
  settingsSectionTitle: {
    fontSize: fp(13),
    fontWeight: '500',
    paddingHorizontal: sp(16),
    paddingTop: sp(12),
    paddingBottom: sp(8),
    textTransform: 'uppercase',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sp(16),
    paddingVertical: hp(14),
    borderBottomWidth: 1,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(12),
    flex: 1,
  },
  settingsItemLabel: {
    fontSize: fp(16),
    fontWeight: '500',
  },
  settingsItemValue: {
    fontSize: fp(15),
  },
  settingsItemDesc: {
    fontSize: fp(12),
    marginTop: hp(2),
  },
  settingsLeaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp(8),
    paddingVertical: hp(16),
    borderRadius: sp(12),
    marginTop: hp(16),
  },
  settingsLeaveButtonText: {
    color: '#FF3B30',
    fontSize: fp(16),
    fontWeight: '600',
  },
  leaveWarning: {
    fontSize: fp(13),
    textAlign: 'center',
    marginTop: hp(12),
    lineHeight: fp(18),
  },
});

export default GroupContent;
