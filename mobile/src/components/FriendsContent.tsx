import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import {useNavigation} from '@react-navigation/native';
import {useThemeStore} from '../store/themeStore';
import {
  useFriendStore,
  Friend,
  FriendRequest,
  ChatMessage,
} from '../store/friendStore';
import {safeGetColorScheme, safeAddAppearanceListener} from '../utils/appearance';
import {sp, hp, fp, iconSize} from '../utils/responsive';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

// 스팀 스타일 색상
const STEAM_COLORS = {
  online: '#57cbde',      // 스팀 온라인 블루
  inGame: '#90ba3c',      // 스팀 게임중 그린 (공부중)
  offline: '#898989',     // 스팀 오프라인 그레이
  away: '#e5c963',        // 스팀 자리비움
  darkBg: '#1b2838',      // 스팀 다크 배경
  darkCard: '#2a475e',    // 스팀 다크 카드
  lightBg: '#c7d5e0',     // 스팀 라이트 배경
  accent: '#66c0f4',      // 스팀 악센트
};

// 상태별 색상
const getStatusColor = (status: Friend['status']) => {
  switch (status) {
    case 'online':
      return STEAM_COLORS.online;
    case 'studying':
      return STEAM_COLORS.inGame;
    case 'offline':
    default:
      return STEAM_COLORS.offline;
  }
};

// 상태별 텍스트
const getStatusText = (status: Friend['status'], statusMessage?: string) => {
  switch (status) {
    case 'online':
      return '온라인';
    case 'studying':
      return statusMessage || '공부 중';
    case 'offline':
    default:
      return '오프라인';
  }
};

// 시간 포맷팅
const formatTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) {
    return `${hours}시간 ${mins}분`;
  } else if (hours > 0) {
    return `${hours}시간`;
  }
  return `${mins}분`;
};

// 티어에 따른 테두리 색상 (매칭 화면과 동일)
const getTierColor = (tier?: string) => {
  switch (tier) {
    case '명예박사':
      return '#FFD700';
    case '박사':
      return '#9C27B0';
    case '석사 III':
      return '#00BCD4';
    case '석사 II':
      return '#00ACC1';
    case '석사 I':
      return '#0097A7';
    case '학사 III':
      return '#4CAF50';
    case '학사 II':
      return '#43A047';
    case '학사 I':
      return '#388E3C';
    case '고등학생':
      return '#FF9800';
    case '중학생':
      return '#78909C';
    case '초등학생':
      return '#A1887F';
    default:
      return '#4a6785';
  }
};

// 마지막 활동 시간 포맷팅
const formatLastActive = (date?: Date) => {
  if (!date) return '';
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  return `${days}일 전`;
};

// 메시지 시간 포맷팅
const formatMessageTime = (date: Date) => {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString('ko-KR', {hour: '2-digit', minute: '2-digit'});
  }
  return date.toLocaleDateString('ko-KR', {month: 'short', day: 'numeric'});
};

type FriendsTab = 'all' | 'online' | 'requests';

// 내 프로필 데이터 (실제로는 userStore에서 가져와야 함)
const MY_PROFILE = {
  id: 'me',
  nickname: '공부하는 개발자',
  status: 'studying' as const,
  statusMessage: '리액트 네이티브 공부 중',
  level: 15,
  tier: '학사 II',
  bio: '매일 조금씩 성장하는 중입니다',
  todayStudyTime: 127, // 2시간 7분
  totalStudyTime: 15840, // 264시간
  friendCode: 'TYMEE#1234',
  badges: [
    {id: '1', icon: 'flame', color: '#FF6B6B', name: '연속 7일'},
    {id: '2', icon: 'trophy', color: '#FFD700', name: '1000시간'},
    {id: '3', icon: 'star', color: '#4CAF50', name: '인기 스터디어'},
  ],
};

const FriendsContent: React.FC = () => {
  const navigation = useNavigation<any>();
  const [systemColorScheme, setSystemColorScheme] = useState<'light' | 'dark'>('light');
  const {themeMode} = useThemeStore();
  const [activeTab, setActiveTab] = useState<FriendsTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [addFriendCode, setAddFriendCode] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileFriend, setProfileFriend] = useState<Friend | null>(null);
  const [showMyProfileModal, setShowMyProfileModal] = useState(false);
  const [myStatusMessage, setMyStatusMessage] = useState(MY_PROFILE.statusMessage);
  const [myStatus, setMyStatus] = useState<'online' | 'studying' | 'offline'>(MY_PROFILE.status);

  const {
    friends,
    friendRequests,
    searchResults,
    chatRooms,
    searchUsers,
    clearSearchResults,
    acceptFriendRequest,
    rejectFriendRequest,
    sendFriendRequest,
    openChat,
    removeFriend,
    markAsRead,
  } = useFriendStore();

  useEffect(() => {
    const initialScheme = safeGetColorScheme();
    setSystemColorScheme(initialScheme);

    const subscription = safeAddAppearanceListener((scheme) => {
      setSystemColorScheme(scheme);
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  const isDark =
    themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');

  // 스팀 스타일 색상
  const bgColor = isDark ? '#171a21' : '#e5e5e5';
  const cardBg = isDark ? '#1b2838' : '#ffffff';
  const headerBg = isDark ? '#171a21' : '#ffffff';
  const textColor = isDark ? '#c7d5e0' : '#1b2838';
  const subtextColor = isDark ? '#8f98a0' : '#626262';
  const dividerColor = isDark ? '#2a475e' : '#d2d2d2';
  const inputBg = isDark ? '#32404f' : '#f5f5f5';

  // 친구 필터링
  const filteredFriends = friends.filter(friend => {
    const matchesSearch = friend.nickname.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'online') {
      return matchesSearch && (friend.status === 'online' || friend.status === 'studying');
    }
    return matchesSearch;
  });

  // 온라인/오프라인 정렬
  const sortedFriends = [...filteredFriends].sort((a, b) => {
    const statusOrder = {studying: 0, online: 1, offline: 2};
    return statusOrder[a.status] - statusOrder[b.status];
  });

  // 온라인 친구 수
  const onlineCount = friends.filter(f => f.status === 'online' || f.status === 'studying').length;

  // 채팅 열기 (페이지 이동)
  const handleOpenChat = (friend: Friend) => {
    openChat(friend.id);
    markAsRead(friend.id);
    navigation.navigate('FriendChat', {friendId: friend.id});
  };

  // 프로필 보기
  const handleViewProfile = (friend: Friend) => {
    setProfileFriend(friend);
    setShowProfileModal(true);
  };

  // 친구 추가
  const handleAddFriend = () => {
    if (addFriendCode.trim()) {
      sendFriendRequest(addFriendCode.trim());
      Alert.alert('친구 요청 전송', `${addFriendCode}님에게 친구 요청을 보냈습니다.`);
      setAddFriendCode('');
      setShowAddFriendModal(false);
    }
  };

  // 친구 아이템 렌더링
  const renderFriendItem = ({item}: {item: Friend}) => {
    const statusColor = getStatusColor(item.status);
    const chatRoom = chatRooms.find(r => r.friendId === item.id);
    const hasUnread = chatRoom && chatRoom.unreadCount > 0;
    const lastMessage = chatRoom?.messages[chatRoom.messages.length - 1];

    return (
      <TouchableOpacity
        style={[styles.friendItem, {backgroundColor: cardBg}]}
        onPress={() => handleOpenChat(item)}
        onLongPress={() => handleViewProfile(item)}
        activeOpacity={0.7}
      >
        {/* 아바타 */}
        <View style={styles.avatarContainer}>
          <View style={[
            styles.avatar,
            {backgroundColor: item.profileImage ? 'transparent' : '#4a6785'},
            item.tier && {borderWidth: 2, borderColor: getTierColor(item.tier)}
          ]}>
            <Icon name="person" size={iconSize(24)} color="#c7d5e0" />
          </View>
          {/* 레벨 배지 */}
          {item.level && (
            <View style={[styles.levelBadgeSmall, {backgroundColor: getTierColor(item.tier)}]}>
              <Text style={styles.levelBadgeSmallText}>{item.level}</Text>
            </View>
          )}
          {/* 온라인 상태 표시 */}
          <View style={[styles.statusDot, {backgroundColor: statusColor}]} />
        </View>

        {/* 정보 */}
        <View style={styles.friendInfo}>
          <View style={styles.friendNameRow}>
            {/* 뱃지들 (닉네임 왼쪽) */}
            {item.badges && item.badges.length > 0 && (
              <View style={styles.friendBadgesRow}>
                {item.badges.slice(0, 2).map((badge) => (
                  <View
                    key={badge.id}
                    style={[styles.friendBadgeIcon, {backgroundColor: badge.color + '20'}]}>
                    <Icon
                      name={(badge.icon as any) || 'star'}
                      size={iconSize(10)}
                      color={badge.color}
                    />
                  </View>
                ))}
              </View>
            )}
            <Text style={[styles.friendName, {color: textColor}]} numberOfLines={1}>
              {item.nickname}
            </Text>
            {/* 티어 뱃지 (꾸며진 스타일) */}
            {item.tier && (
              <View style={[
                styles.tierBadgeStyled,
                {
                  backgroundColor: getTierColor(item.tier) + '20',
                  borderColor: getTierColor(item.tier),
                }
              ]}>
                <Text style={[styles.tierTextStyled, {color: getTierColor(item.tier)}]}>
                  {item.tier}
                </Text>
              </View>
            )}
          </View>

          {/* 2줄: 자기소개 (있을 때만) */}
          {item.statusMessage && (
            <Text
              style={[styles.bioText, {color: subtextColor}]}
              numberOfLines={1}
            >
              {item.statusMessage}
            </Text>
          )}

          {/* 3줄: 마지막 메시지 + 안읽음 배지 + 시간 (있을 때만) */}
          {lastMessage && (
            <View style={styles.messageRowWithTime}>
              <View style={styles.messageLeft}>
                <Text
                  style={[
                    styles.lastMessagePreview,
                    {color: hasUnread ? textColor : subtextColor},
                    hasUnread && styles.lastMessageUnread,
                  ]}
                  numberOfLines={1}
                >
                  {lastMessage.senderId === 'me' ? '나: ' : ''}{lastMessage.content}
                </Text>
                {hasUnread && (
                  <View style={styles.unreadBadgeSmall}>
                    <Text style={styles.unreadTextSmall}>{chatRoom!.unreadCount}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.lastMessageTime, {color: subtextColor}]}>
                {formatMessageTime(lastMessage.createdAt)}
              </Text>
            </View>
          )}

          {/* 4줄: 온라인 상태 */}
          <View style={styles.statusRow}>
            <View style={[styles.statusDotSmall, {backgroundColor: statusColor}]} />
            <Text style={[styles.statusTextSmall, {color: subtextColor}]}>
              {item.status === 'studying' ? '공부 중' : item.status === 'online' ? '온라인' : '오프라인'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // 친구 요청 아이템
  const renderRequestItem = ({item}: {item: FriendRequest}) => (
    <View style={[styles.requestItem, {backgroundColor: cardBg}]}>
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, {backgroundColor: '#4a6785'}]}>
          <Icon name="person" size={iconSize(24)} color="#c7d5e0" />
        </View>
      </View>
      <View style={styles.requestInfo}>
        <Text style={[styles.friendName, {color: textColor}]}>{item.from.nickname}</Text>
        <Text style={[styles.requestMessage, {color: subtextColor}]} numberOfLines={1}>
          {item.message || '친구 요청을 보냈습니다'}
        </Text>
        <Text style={[styles.requestTime, {color: subtextColor}]}>
          {formatLastActive(item.createdAt)}
        </Text>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={[styles.acceptButton, {backgroundColor: STEAM_COLORS.inGame}]}
          onPress={() => acceptFriendRequest(item.id)}
        >
          <Icon name="checkmark" size={iconSize(18)} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.rejectButton, {backgroundColor: '#c43b3b'}]}
          onPress={() => rejectFriendRequest(item.id)}
        >
          <Icon name="close" size={iconSize(18)} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // 메시지 아이템
  const renderMessageItem = ({item}: {item: ChatMessage}) => {
    const isMe = item.senderId === 'me';
    return (
      <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
        {!isMe && (
          <View style={[styles.messageAvatar, {backgroundColor: '#4a6785'}]}>
            <Icon name="person" size={iconSize(14)} color="#c7d5e0" />
          </View>
        )}
        <View style={[
          styles.messageBubble,
          isMe ? styles.messageBubbleMe : styles.messageBubbleOther,
          {backgroundColor: isMe ? STEAM_COLORS.accent : (isDark ? '#32404f' : '#f0f0f0')}
        ]}>
          <Text style={[styles.messageText, {color: isMe ? '#FFFFFF' : textColor}]}>
            {item.content}
          </Text>
          <Text style={[styles.messageTime, {color: isMe ? 'rgba(255,255,255,0.7)' : subtextColor}]}>
            {formatMessageTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, {backgroundColor: bgColor}]}>
      {/* 내 프로필 카드 (Steam 스타일) */}
      <TouchableOpacity
        style={[styles.myProfileCard, {backgroundColor: cardBg, borderBottomColor: dividerColor}]}
        onPress={() => setShowMyProfileModal(true)}
        activeOpacity={0.7}
      >
        <View style={styles.myProfileLeft}>
          <View style={styles.avatarContainer}>
            <View style={[
              styles.myAvatar,
              {backgroundColor: '#E0E0E0'},
              {borderWidth: 2, borderColor: getTierColor(MY_PROFILE.tier)}
            ]}>
              <Icon name="person" size={iconSize(28)} color="#9E9E9E" />
            </View>
            {/* 레벨 배지 */}
            <View style={[styles.myLevelBadge, {backgroundColor: getTierColor(MY_PROFILE.tier)}]}>
              <Text style={styles.myLevelBadgeText}>{MY_PROFILE.level}</Text>
            </View>
            <View style={[styles.statusDot, {backgroundColor: getStatusColor(myStatus), borderColor: cardBg}]} />
          </View>
          <View style={styles.myProfileInfo}>
            <View style={styles.myProfileNameRow}>
              {/* 뱃지 (닉네임 왼쪽) */}
              {MY_PROFILE.badges && MY_PROFILE.badges.length > 0 && (
                <View style={styles.myProfileBadgesRow}>
                  {MY_PROFILE.badges.slice(0, 3).map((badge) => (
                    <View
                      key={badge.id}
                      style={[styles.myProfileBadgeIcon, {backgroundColor: badge.color + '20'}]}>
                      <Icon
                        name={(badge.icon as any) || 'star'}
                        size={iconSize(10)}
                        color={badge.color}
                      />
                    </View>
                  ))}
                </View>
              )}
              <Text style={[styles.myProfileName, {color: textColor}]}>{MY_PROFILE.nickname}</Text>
              {/* 티어 뱃지 (꾸며진 스타일) */}
              <View style={[
                styles.tierBadgeStyled,
                {
                  backgroundColor: getTierColor(MY_PROFILE.tier) + '20',
                  borderColor: getTierColor(MY_PROFILE.tier),
                }
              ]}>
                <Text style={[styles.tierTextStyled, {color: getTierColor(MY_PROFILE.tier)}]}>
                  {MY_PROFILE.tier}
                </Text>
              </View>
            </View>
            <Text style={[styles.myStatusText, {color: getStatusColor(myStatus)}]}>
              {myStatus === 'studying' ? myStatusMessage : getStatusText(myStatus)}
            </Text>
            <Text style={[styles.myStudyTime, {color: subtextColor}]}>
              오늘 {formatTime(MY_PROFILE.todayStudyTime)}
            </Text>
          </View>
        </View>
        <View style={styles.myProfileRight}>
          <Icon name="chevron-forward" size={iconSize(20)} color={subtextColor} />
        </View>
      </TouchableOpacity>

      {/* 검색바 */}
      <View style={[styles.searchContainer, {backgroundColor: headerBg}]}>
        <View style={[styles.searchBar, {backgroundColor: inputBg}]}>
          <Icon name="search" size={iconSize(18)} color={subtextColor} />
          <TextInput
            style={[styles.searchInput, {color: textColor}]}
            placeholder="친구 검색..."
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
      </View>

      {/* 탭 */}
      <View style={[styles.tabContainer, {backgroundColor: headerBg, borderBottomColor: dividerColor}]}>
        <View style={styles.tabsLeft}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'all' && styles.tabActive]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[
              styles.tabText,
              {color: activeTab === 'all' ? STEAM_COLORS.accent : subtextColor}
            ]}>
              전체 ({friends.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'online' && styles.tabActive]}
            onPress={() => setActiveTab('online')}
          >
            <Text style={[
              styles.tabText,
              {color: activeTab === 'online' ? STEAM_COLORS.accent : subtextColor}
            ]}>
              온라인 ({onlineCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'requests' && styles.tabActive]}
            onPress={() => setActiveTab('requests')}
          >
            <Text style={[
              styles.tabText,
              {color: activeTab === 'requests' ? STEAM_COLORS.accent : subtextColor}
            ]}>
              요청 ({friendRequests.length})
            </Text>
            {friendRequests.length > 0 && (
              <View style={styles.requestBadge}>
                <Text style={styles.requestBadgeText}>{friendRequests.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.addButton, {backgroundColor: STEAM_COLORS.accent}]}
          onPress={() => setShowAddFriendModal(true)}
        >
          <Icon name="person-add" size={iconSize(18)} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* 친구 목록 */}
      {activeTab !== 'requests' ? (
        <FlatList
          data={sortedFriends}
          keyExtractor={(item) => item.id}
          renderItem={renderFriendItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="people-outline" size={iconSize(48)} color={subtextColor} />
              <Text style={[styles.emptyText, {color: subtextColor}]}>
                {searchQuery ? '검색 결과가 없습니다' : '친구가 없습니다'}
              </Text>
              <TouchableOpacity
                style={[styles.addFriendButton, {backgroundColor: STEAM_COLORS.accent}]}
                onPress={() => setShowAddFriendModal(true)}
              >
                <Icon name="person-add" size={iconSize(16)} color="#FFFFFF" />
                <Text style={styles.addFriendButtonText}>친구 추가</Text>
              </TouchableOpacity>
            </View>
          }
        />
      ) : (
        <FlatList
          data={friendRequests}
          keyExtractor={(item) => item.id}
          renderItem={renderRequestItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="mail-outline" size={iconSize(48)} color={subtextColor} />
              <Text style={[styles.emptyText, {color: subtextColor}]}>
                친구 요청이 없습니다
              </Text>
            </View>
          }
        />
      )}

      {/* 친구 추가 모달 */}
      <Modal
        visible={showAddFriendModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddFriendModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.addFriendModal, {backgroundColor: cardBg}]}>
            <View style={styles.addFriendHeader}>
              <Text style={[styles.addFriendTitle, {color: textColor}]}>친구 추가</Text>
              <TouchableOpacity onPress={() => setShowAddFriendModal(false)}>
                <Icon name="close" size={iconSize(24)} color={subtextColor} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.addFriendDesc, {color: subtextColor}]}>
              친구의 닉네임이나 코드를 입력하세요
            </Text>

            <View style={[styles.addFriendInputContainer, {backgroundColor: inputBg}]}>
              <Icon name="person-add-outline" size={iconSize(20)} color={subtextColor} />
              <TextInput
                style={[styles.addFriendInput, {color: textColor}]}
                placeholder="닉네임 또는 친구 코드"
                placeholderTextColor={subtextColor}
                value={addFriendCode}
                onChangeText={setAddFriendCode}
                autoFocus
              />
            </View>

            <View style={styles.addFriendButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, {backgroundColor: isDark ? '#32404f' : '#e0e0e0'}]}
                onPress={() => setShowAddFriendModal(false)}
              >
                <Text style={[styles.cancelButtonText, {color: textColor}]}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, {backgroundColor: STEAM_COLORS.accent}]}
                onPress={handleAddFriend}
              >
                <Text style={styles.confirmButtonText}>요청 보내기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 프로필 모달 */}
      <Modal
        visible={showProfileModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.profileModal, {backgroundColor: cardBg}]}>
            {/* 프로필 헤더 */}
            <View style={[styles.profileHeader, {backgroundColor: isDark ? '#2a475e' : '#f0f0f0'}]}>
              <View style={[styles.profileAvatar, {backgroundColor: '#4a6785'}]}>
                <Icon name="person" size={iconSize(40)} color="#c7d5e0" />
              </View>
              <View style={[styles.profileStatusBadge, {backgroundColor: getStatusColor(profileFriend?.status || 'offline')}]} />
            </View>

            {/* 프로필 정보 */}
            <View style={styles.profileContent}>
              <Text style={[styles.profileName, {color: textColor}]}>{profileFriend?.nickname}</Text>
              <Text style={[styles.profileStatus, {color: getStatusColor(profileFriend?.status || 'offline')}]}>
                {getStatusText(profileFriend?.status || 'offline', profileFriend?.statusMessage)}
              </Text>

              {/* 통계 */}
              <View style={[styles.profileStats, {borderColor: dividerColor}]}>
                <View style={styles.profileStatItem}>
                  <Text style={[styles.profileStatValue, {color: textColor}]}>Lv.{profileFriend?.level || 0}</Text>
                  <Text style={[styles.profileStatLabel, {color: subtextColor}]}>레벨</Text>
                </View>
                <View style={[styles.profileStatDivider, {backgroundColor: dividerColor}]} />
                <View style={styles.profileStatItem}>
                  <Text style={[styles.profileStatValue, {color: textColor}]}>{profileFriend?.tier || '-'}</Text>
                  <Text style={[styles.profileStatLabel, {color: subtextColor}]}>티어</Text>
                </View>
                <View style={[styles.profileStatDivider, {backgroundColor: dividerColor}]} />
                <View style={styles.profileStatItem}>
                  <Text style={[styles.profileStatValue, {color: textColor}]}>
                    {profileFriend?.todayStudyTime ? formatTime(profileFriend.todayStudyTime) : '0분'}
                  </Text>
                  <Text style={[styles.profileStatLabel, {color: subtextColor}]}>오늘 공부</Text>
                </View>
              </View>

              {/* 액션 버튼 */}
              <View style={styles.profileActions}>
                <TouchableOpacity
                  style={[styles.profileActionButton, {backgroundColor: STEAM_COLORS.accent}]}
                  onPress={() => {
                    setShowProfileModal(false);
                    if (profileFriend) handleOpenChat(profileFriend);
                  }}
                >
                  <Icon name="chatbubble" size={iconSize(18)} color="#FFFFFF" />
                  <Text style={styles.profileActionText}>메시지</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.profileActionButton, {backgroundColor: '#c43b3b'}]}
                  onPress={() => {
                    Alert.alert(
                      '친구 삭제',
                      `${profileFriend?.nickname}님을 친구에서 삭제하시겠습니까?`,
                      [
                        {text: '취소', style: 'cancel'},
                        {
                          text: '삭제',
                          style: 'destructive',
                          onPress: () => {
                            if (profileFriend) {
                              removeFriend(profileFriend.id);
                              setShowProfileModal(false);
                            }
                          },
                        },
                      ]
                    );
                  }}
                >
                  <Icon name="person-remove" size={iconSize(18)} color="#FFFFFF" />
                  <Text style={styles.profileActionText}>삭제</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 닫기 버튼 */}
            <TouchableOpacity
              style={styles.profileCloseButton}
              onPress={() => setShowProfileModal(false)}
            >
              <Icon name="close" size={iconSize(24)} color={subtextColor} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 내 프로필 모달 */}
      <Modal
        visible={showMyProfileModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMyProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.myProfileModalContainer, {backgroundColor: cardBg}]}>
            {/* 배너 헤더 */}
            <View style={[styles.myProfileBanner, {backgroundColor: isDark ? '#2a475e' : '#f0f0f0'}]}>
              <View style={[styles.myProfileAvatarLarge, {backgroundColor: '#4a6785'}]}>
                <Icon name="person" size={iconSize(50)} color="#c7d5e0" />
              </View>
              <View style={[styles.myProfileStatusBadgeLarge, {backgroundColor: getStatusColor(myStatus)}]} />
            </View>

            {/* 프로필 정보 */}
            <View style={styles.myProfileContent}>
              <View style={styles.myProfileHeader}>
                <Text style={[styles.myProfileModalName, {color: textColor}]}>{MY_PROFILE.nickname}</Text>
                <View style={[styles.levelBadge, {backgroundColor: STEAM_COLORS.accent}]}>
                  <Text style={styles.levelBadgeText}>Lv.{MY_PROFILE.level}</Text>
                </View>
              </View>

              {/* 친구 코드 */}
              <View style={[styles.friendCodeContainer, {backgroundColor: inputBg}]}>
                <Text style={[styles.friendCodeLabel, {color: subtextColor}]}>내 친구 코드</Text>
                <View style={styles.friendCodeRow}>
                  <Text style={[styles.friendCode, {color: textColor}]}>{MY_PROFILE.friendCode}</Text>
                  <TouchableOpacity
                    style={[styles.copyButton, {backgroundColor: STEAM_COLORS.accent}]}
                    onPress={() => Alert.alert('복사됨', '친구 코드가 클립보드에 복사되었습니다.')}
                  >
                    <Icon name="copy-outline" size={iconSize(16)} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* 상태 설정 */}
              <View style={styles.statusSelectContainer}>
                <Text style={[styles.statusSelectLabel, {color: subtextColor}]}>상태 설정</Text>
                <View style={styles.statusSelectRow}>
                  <TouchableOpacity
                    style={[
                      styles.statusSelectButton,
                      {backgroundColor: myStatus === 'online' ? STEAM_COLORS.online + '20' : inputBg},
                      myStatus === 'online' && {borderColor: STEAM_COLORS.online, borderWidth: 2},
                    ]}
                    onPress={() => setMyStatus('online')}
                  >
                    <View style={[styles.statusSelectDot, {backgroundColor: STEAM_COLORS.online}]} />
                    <Text style={[styles.statusSelectText, {color: myStatus === 'online' ? STEAM_COLORS.online : textColor}]}>
                      온라인
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.statusSelectButton,
                      {backgroundColor: myStatus === 'studying' ? STEAM_COLORS.inGame + '20' : inputBg},
                      myStatus === 'studying' && {borderColor: STEAM_COLORS.inGame, borderWidth: 2},
                    ]}
                    onPress={() => setMyStatus('studying')}
                  >
                    <View style={[styles.statusSelectDot, {backgroundColor: STEAM_COLORS.inGame}]} />
                    <Text style={[styles.statusSelectText, {color: myStatus === 'studying' ? STEAM_COLORS.inGame : textColor}]}>
                      공부 중
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.statusSelectButton,
                      {backgroundColor: myStatus === 'offline' ? STEAM_COLORS.offline + '20' : inputBg},
                      myStatus === 'offline' && {borderColor: STEAM_COLORS.offline, borderWidth: 2},
                    ]}
                    onPress={() => setMyStatus('offline')}
                  >
                    <View style={[styles.statusSelectDot, {backgroundColor: STEAM_COLORS.offline}]} />
                    <Text style={[styles.statusSelectText, {color: myStatus === 'offline' ? STEAM_COLORS.offline : textColor}]}>
                      오프라인
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 상태 메시지 편집 */}
              <View style={styles.statusEditContainer}>
                <Text style={[styles.statusEditLabel, {color: subtextColor}]}>상태 메시지</Text>
                <View style={[styles.statusEditInputContainer, {backgroundColor: inputBg}]}>
                  <TextInput
                    style={[styles.statusEditInput, {color: textColor}]}
                    value={myStatusMessage}
                    onChangeText={setMyStatusMessage}
                    placeholder="상태 메시지를 입력하세요"
                    placeholderTextColor={subtextColor}
                    maxLength={50}
                  />
                  <Icon name="pencil" size={iconSize(16)} color={subtextColor} />
                </View>
              </View>
            </View>

            {/* 닫기 버튼 */}
            <TouchableOpacity
              style={styles.profileCloseButton}
              onPress={() => setShowMyProfileModal(false)}
            >
              <Icon name="close" size={iconSize(24)} color={subtextColor} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // 채팅 페이지 애니메이션 스타일
  chatPageContainer: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  swipeIndicator: {
    position: 'absolute',
    left: sp(8),
    top: '50%',
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sp(16),
    paddingVertical: sp(12),
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: fp(20),
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
  },
  addButton: {
    width: sp(36),
    height: sp(36),
    borderRadius: sp(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: sp(16),
    paddingVertical: sp(8),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(12),
    paddingVertical: sp(8),
    borderRadius: sp(8),
    gap: sp(8),
  },
  searchInput: {
    flex: 1,
    fontSize: fp(14),
    padding: 0,
  },
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sp(16),
    borderBottomWidth: 1,
  },
  tabsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tab: {
    paddingVertical: sp(12),
    paddingHorizontal: sp(16),
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(4),
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: STEAM_COLORS.accent,
  },
  tabText: {
    fontSize: fp(14),
    fontWeight: '500',
  },
  requestBadge: {
    backgroundColor: '#c43b3b',
    borderRadius: sp(10),
    minWidth: sp(18),
    height: sp(18),
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: sp(4),
  },
  requestBadgeText: {
    color: '#FFFFFF',
    fontSize: fp(11),
    fontWeight: '600',
  },
  listContent: {
    padding: sp(12),
    gap: sp(8),
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: sp(12),
    paddingVertical: sp(10),
    borderRadius: sp(8),
    gap: sp(12),
  },
  avatarContainer: {
    position: 'relative',
    paddingTop: sp(4),
    paddingRight: sp(4),
  },
  avatar: {
    width: sp(48),
    height: sp(48),
    borderRadius: sp(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: sp(14),
    height: sp(14),
    borderRadius: sp(7),
    borderWidth: 2,
    borderColor: '#1b2838',
  },
  friendInfo: {
    flex: 1,
    gap: sp(1),
    paddingTop: sp(4),
  },
  friendNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
  },
  friendName: {
    fontSize: fp(15),
    fontWeight: '600',
  },
  tierBadge: {
    paddingHorizontal: sp(6),
    paddingVertical: sp(2),
    borderRadius: sp(4),
  },
  tierText: {
    fontSize: fp(11),
    fontWeight: '500',
  },
  // 꾸며진 티어 뱃지 스타일
  tierBadgeStyled: {
    paddingHorizontal: sp(6),
    paddingVertical: sp(2),
    borderRadius: sp(6),
    borderWidth: 1,
  },
  tierTextStyled: {
    fontSize: fp(10),
    fontWeight: '700',
  },
  // 친구 뱃지 스타일
  friendBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(2),
    marginRight: sp(4),
  },
  friendBadgeIcon: {
    width: sp(16),
    height: sp(16),
    borderRadius: sp(4),
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: fp(13),
  },
  lastActiveText: {
    fontSize: fp(12),
    marginTop: sp(2),
  },
  // 마지막 메시지 관련
  lastMessageTime: {
    fontSize: fp(11),
    flexShrink: 0,
  },
  lastMessagePreview: {
    fontSize: fp(13),
    flex: 1,
  },
  lastMessageUnread: {
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(4),
  },
  statusTextSmall: {
    fontSize: fp(11),
    flex: 1,
  },
  bioText: {
    fontSize: fp(12),
  },
  messageRowWithTime: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: sp(8),
  },
  messageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: sp(6),
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(6),
  },
  unreadBadgeSmall: {
    backgroundColor: '#c43b3b',
    borderRadius: sp(6),
    minWidth: sp(14),
    height: sp(14),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sp(3),
  },
  unreadTextSmall: {
    color: '#FFFFFF',
    fontSize: fp(9),
    fontWeight: '600',
  },
  messageDot: {
    fontSize: fp(11),
    marginHorizontal: sp(4),
  },
  friendActions: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    alignSelf: 'flex-start',
    gap: sp(6),
    minWidth: sp(50),
  },
  unreadBadge: {
    backgroundColor: '#c43b3b',
    borderRadius: sp(10),
    minWidth: sp(20),
    height: sp(20),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sp(6),
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: fp(11),
    fontWeight: '600',
  },
  chatButton: {
    width: sp(36),
    height: sp(36),
    borderRadius: sp(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: sp(12),
    borderRadius: sp(8),
    gap: sp(12),
  },
  requestInfo: {
    flex: 1,
    gap: sp(2),
  },
  requestMessage: {
    fontSize: fp(13),
  },
  requestTime: {
    fontSize: fp(12),
  },
  requestActions: {
    flexDirection: 'row',
    gap: sp(8),
  },
  acceptButton: {
    width: sp(36),
    height: sp(36),
    borderRadius: sp(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButton: {
    width: sp(36),
    height: sp(36),
    borderRadius: sp(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(60),
    gap: sp(12),
  },
  emptyText: {
    fontSize: fp(15),
  },
  addFriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(16),
    paddingVertical: sp(10),
    borderRadius: sp(8),
    gap: sp(8),
    marginTop: sp(8),
  },
  addFriendButtonText: {
    color: '#FFFFFF',
    fontSize: fp(14),
    fontWeight: '600',
  },
  // 전체화면 채팅 모달
  chatFullScreen: {
    flex: 1,
  },
  chatFullHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(8),
    paddingVertical: sp(10),
    borderBottomWidth: 1,
  },
  chatBackButton: {
    padding: sp(8),
  },
  chatFullHeaderCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(10),
    paddingHorizontal: sp(4),
  },
  chatFullHeaderAvatar: {
    width: sp(36),
    height: sp(36),
    borderRadius: sp(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatFullHeaderInfo: {
    flex: 1,
    gap: sp(1),
  },
  chatFullHeaderName: {
    fontSize: fp(16),
    fontWeight: '600',
  },
  chatFullHeaderStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(4),
  },
  statusDotTiny: {
    width: sp(6),
    height: sp(6),
    borderRadius: sp(3),
  },
  chatFullHeaderStatusText: {
    fontSize: fp(12),
    fontWeight: '500',
  },
  statusDotSmall: {
    width: sp(8),
    height: sp(8),
    borderRadius: sp(4),
  },
  chatHeaderButton: {
    padding: sp(8),
  },
  messageListFull: {
    padding: sp(16),
    paddingBottom: sp(8),
    flexGrow: 1,
  },
  chatEmptyContainerFull: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(100),
    gap: sp(12),
  },
  chatEmptyAvatar: {
    width: sp(80),
    height: sp(80),
    borderRadius: sp(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatEmptyName: {
    fontSize: fp(18),
    fontWeight: '600',
  },
  chatEmptyHint: {
    fontSize: fp(14),
  },
  chatInputContainerFull: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: sp(8),
    paddingVertical: sp(8),
    gap: sp(8),
    borderTopWidth: 1,
  },
  attachButton: {
    padding: sp(6),
  },
  chatInputWrapper: {
    flex: 1,
    borderRadius: sp(20),
    paddingHorizontal: sp(14),
    paddingVertical: sp(8),
    maxHeight: hp(100),
  },
  chatInputFull: {
    fontSize: fp(15),
    padding: 0,
    minHeight: sp(24),
    maxHeight: hp(80),
  },
  sendButtonFull: {
    width: sp(38),
    height: sp(38),
    borderRadius: sp(19),
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: sp(8),
    marginBottom: sp(8),
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageAvatar: {
    width: sp(28),
    height: sp(28),
    borderRadius: sp(6),
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: sp(12),
    paddingVertical: sp(8),
    borderRadius: sp(12),
  },
  messageBubbleMe: {
    borderBottomRightRadius: sp(4),
  },
  messageBubbleOther: {
    borderBottomLeftRadius: sp(4),
  },
  messageText: {
    fontSize: fp(14),
    lineHeight: fp(20),
  },
  messageTime: {
    fontSize: fp(10),
    marginTop: sp(4),
    alignSelf: 'flex-end',
  },
  chatEmptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(60),
    gap: sp(8),
  },
  chatEmptyText: {
    fontSize: fp(14),
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: sp(12),
    gap: sp(8),
    borderTopWidth: 1,
  },
  chatInput: {
    flex: 1,
    maxHeight: hp(100),
    paddingHorizontal: sp(14),
    paddingVertical: sp(10),
    borderRadius: sp(20),
    fontSize: fp(14),
  },
  sendButton: {
    width: sp(40),
    height: sp(40),
    borderRadius: sp(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 친구 추가 모달
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addFriendModal: {
    width: SCREEN_WIDTH - sp(48),
    borderRadius: sp(12),
    padding: sp(20),
  },
  addFriendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: sp(12),
  },
  addFriendTitle: {
    fontSize: fp(18),
    fontWeight: '700',
  },
  addFriendDesc: {
    fontSize: fp(14),
    marginBottom: sp(16),
  },
  addFriendInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(12),
    paddingVertical: sp(10),
    borderRadius: sp(8),
    gap: sp(10),
    marginBottom: sp(20),
  },
  addFriendInput: {
    flex: 1,
    fontSize: fp(15),
    padding: 0,
  },
  addFriendButtons: {
    flexDirection: 'row',
    gap: sp(12),
  },
  cancelButton: {
    flex: 1,
    paddingVertical: sp(12),
    borderRadius: sp(8),
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: fp(15),
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: sp(12),
    borderRadius: sp(8),
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: fp(15),
    fontWeight: '600',
  },
  // 프로필 모달
  profileModal: {
    width: SCREEN_WIDTH - sp(48),
    borderRadius: sp(12),
    overflow: 'hidden',
  },
  profileHeader: {
    height: hp(100),
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  profileAvatar: {
    width: sp(80),
    height: sp(80),
    borderRadius: sp(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileStatusBadge: {
    position: 'absolute',
    bottom: sp(10),
    right: SCREEN_WIDTH / 2 - sp(24) - sp(60),
    width: sp(20),
    height: sp(20),
    borderRadius: sp(10),
    borderWidth: 3,
    borderColor: '#1b2838',
  },
  profileContent: {
    padding: sp(20),
    alignItems: 'center',
  },
  profileName: {
    fontSize: fp(20),
    fontWeight: '700',
    marginBottom: sp(4),
  },
  profileStatus: {
    fontSize: fp(14),
    fontWeight: '500',
    marginBottom: sp(20),
  },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: sp(16),
    borderTopWidth: 1,
    borderBottomWidth: 1,
    width: '100%',
    marginBottom: sp(20),
  },
  profileStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  profileStatValue: {
    fontSize: fp(16),
    fontWeight: '700',
    marginBottom: sp(4),
  },
  profileStatLabel: {
    fontSize: fp(12),
  },
  profileStatDivider: {
    width: 1,
    height: sp(30),
  },
  profileActions: {
    flexDirection: 'row',
    gap: sp(12),
    width: '100%',
  },
  profileActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: sp(12),
    borderRadius: sp(8),
    gap: sp(8),
  },
  profileActionText: {
    color: '#FFFFFF',
    fontSize: fp(14),
    fontWeight: '600',
  },
  profileCloseButton: {
    position: 'absolute',
    top: sp(12),
    right: sp(12),
    padding: sp(4),
  },
  // 내 프로필 카드 스타일
  myProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sp(16),
    paddingVertical: sp(14),
    borderBottomWidth: 1,
  },
  myProfileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(12),
    flex: 1,
  },
  myAvatar: {
    width: sp(56),
    height: sp(56),
    borderRadius: sp(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  myProfileInfo: {
    flex: 1,
    gap: sp(2),
  },
  myProfileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(6),
    flexWrap: 'wrap',
  },
  myProfileName: {
    fontSize: fp(15),
    fontWeight: '700',
  },
  // 내 프로필 뱃지 스타일
  myProfileBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(2),
    marginRight: sp(2),
  },
  myProfileBadgeIcon: {
    width: sp(18),
    height: sp(18),
    borderRadius: sp(4),
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 내 레벨 배지
  myLevelBadge: {
    position: 'absolute',
    top: -sp(4),
    right: -sp(4),
    minWidth: sp(20),
    height: sp(20),
    borderRadius: sp(10),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sp(4),
    borderWidth: 2,
    borderColor: '#1b2838',
  },
  myLevelBadgeText: {
    color: '#FFFFFF',
    fontSize: fp(10),
    fontWeight: '700',
  },
  myStatusText: {
    fontSize: fp(13),
    fontWeight: '500',
  },
  myStudyTime: {
    fontSize: fp(12),
    marginTop: sp(2),
  },
  myProfileRight: {
    paddingLeft: sp(8),
  },
  // 내 프로필 모달 스타일
  myProfileModalContainer: {
    width: SCREEN_WIDTH - sp(40),
    borderRadius: sp(12),
    overflow: 'hidden',
  },
  myProfileBanner: {
    height: hp(120),
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  myProfileAvatarLarge: {
    width: sp(90),
    height: sp(90),
    borderRadius: sp(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  myProfileStatusBadgeLarge: {
    position: 'absolute',
    bottom: sp(12),
    right: SCREEN_WIDTH / 2 - sp(20) - sp(55),
    width: sp(24),
    height: sp(24),
    borderRadius: sp(12),
    borderWidth: 3,
    borderColor: '#1b2838',
  },
  myProfileContent: {
    padding: sp(20),
  },
  myProfileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp(10),
    marginBottom: sp(16),
  },
  myProfileModalName: {
    fontSize: fp(22),
    fontWeight: '700',
  },
  levelBadge: {
    paddingHorizontal: sp(8),
    paddingVertical: sp(4),
    borderRadius: sp(6),
  },
  levelBadgeText: {
    color: '#FFFFFF',
    fontSize: fp(12),
    fontWeight: '600',
  },
  friendCodeContainer: {
    padding: sp(12),
    borderRadius: sp(8),
    marginBottom: sp(16),
  },
  friendCodeLabel: {
    fontSize: fp(12),
    marginBottom: sp(6),
  },
  friendCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  friendCode: {
    fontSize: fp(18),
    fontWeight: '700',
    letterSpacing: 1,
  },
  copyButton: {
    width: sp(32),
    height: sp(32),
    borderRadius: sp(6),
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusEditContainer: {
    marginBottom: sp(16),
  },
  statusEditLabel: {
    fontSize: fp(12),
    marginBottom: sp(6),
  },
  statusEditInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(12),
    paddingVertical: sp(10),
    borderRadius: sp(8),
    gap: sp(8),
  },
  statusEditInput: {
    flex: 1,
    fontSize: fp(14),
    padding: 0,
  },
  myProfileStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: sp(16),
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: sp(16),
  },
  myProfileStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: sp(4),
  },
  myProfileStatValue: {
    fontSize: fp(15),
    fontWeight: '700',
  },
  myProfileStatLabel: {
    fontSize: fp(11),
  },
  myProfileStatDivider: {
    width: 1,
    height: sp(40),
  },
  totalStudyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: sp(12),
    borderRadius: sp(8),
    gap: sp(12),
  },
  totalStudyInfo: {
    flex: 1,
  },
  totalStudyLabel: {
    fontSize: fp(12),
    marginBottom: sp(2),
  },
  totalStudyValue: {
    fontSize: fp(16),
    fontWeight: '700',
  },
  // 상태 선택 스타일
  statusSelectContainer: {
    marginBottom: sp(16),
  },
  statusSelectLabel: {
    fontSize: fp(12),
    marginBottom: sp(8),
  },
  statusSelectRow: {
    flexDirection: 'row',
    gap: sp(8),
  },
  statusSelectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: sp(10),
    paddingHorizontal: sp(8),
    borderRadius: sp(8),
    gap: sp(6),
  },
  statusSelectDot: {
    width: sp(10),
    height: sp(10),
    borderRadius: sp(5),
  },
  statusSelectText: {
    fontSize: fp(13),
    fontWeight: '600',
  },
  // 레벨 배지 스타일 (친구 목록)
  levelBadgeSmall: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: sp(18),
    height: sp(18),
    borderRadius: sp(9),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sp(4),
    borderWidth: 1.5,
    borderColor: '#1b2838',
  },
  levelBadgeSmallText: {
    color: '#FFFFFF',
    fontSize: fp(9),
    fontWeight: '700',
  },
  // 채팅 헤더 아바타 컨테이너
  chatHeaderAvatarContainer: {
    position: 'relative',
  },
  chatHeaderLevelBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: sp(16),
    height: sp(16),
    borderRadius: sp(8),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sp(3),
    borderWidth: 1.5,
    borderColor: '#1C1C1E',
  },
  chatHeaderLevelText: {
    color: '#FFFFFF',
    fontSize: fp(8),
    fontWeight: '700',
  },
});

export default FriendsContent;
