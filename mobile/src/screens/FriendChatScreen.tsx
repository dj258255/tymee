import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Modal,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useThemeStore} from '../store/themeStore';
import {useFriendStore, Friend, ChatMessage} from '../store/friendStore';
import {safeGetColorScheme, safeAddAppearanceListener} from '../utils/appearance';
import {sp, hp, fp, iconSize} from '../utils/responsive';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

// 스팀 스타일 색상
const STEAM_COLORS = {
  online: '#57cbde',
  inGame: '#90ba3c',
  offline: '#898989',
  away: '#e5c963',
  darkBg: '#1b2838',
  darkCard: '#2a475e',
  lightBg: '#c7d5e0',
  accent: '#66c0f4',
};

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

const formatMessageTime = (date: Date) => {
  return date.toLocaleTimeString('ko-KR', {hour: '2-digit', minute: '2-digit'});
};

const FriendChatScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {friendId} = route.params as {friendId: string};

  const [systemColorScheme, setSystemColorScheme] = useState<'light' | 'dark'>('light');
  const {themeMode} = useThemeStore();
  const [messageInput, setMessageInput] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const {friends, chatRooms, sendMessage, removeFriend} = useFriendStore();

  const friend = friends.find(f => f.id === friendId);
  const chatRoom = chatRooms.find(c => c.friendId === friendId);
  const messages = chatRoom?.messages || [];

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

  const bgColor = isDark ? '#171a21' : '#e5e5e5';
  const cardBg = isDark ? '#1b2838' : '#ffffff';
  const textColor = isDark ? '#c7d5e0' : '#1b2838';
  const subtextColor = isDark ? '#8f98a0' : '#626262';
  const dividerColor = isDark ? '#2a475e' : '#d2d2d2';
  const inputBg = isDark ? '#32404f' : '#f5f5f5';

  const handleSendMessage = () => {
    if (messageInput.trim() && friend) {
      sendMessage(friend.id, messageInput.trim());
      setMessageInput('');
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({animated: true});
      }, 100);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleViewProfile = () => {
    setShowProfileModal(true);
  };

  const handleRemoveFriend = () => {
    Alert.alert(
      '친구 삭제',
      `${friend?.nickname}님을 친구에서 삭제하시겠습니까?`,
      [
        {text: '취소', style: 'cancel'},
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            if (friend) {
              removeFriend(friend.id);
              setShowProfileModal(false);
              navigation.goBack();
            }
          },
        },
      ]
    );
  };

  const renderMessage = ({item}: {item: ChatMessage}) => {
    const isMe = item.senderId === 'me';
    return (
      <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
        {!isMe && (
          <View style={[styles.messageAvatar, {backgroundColor: '#4a6785'}]}>
            <Icon name="person" size={iconSize(14)} color="#c7d5e0" />
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isMe
              ? {backgroundColor: STEAM_COLORS.accent}
              : {backgroundColor: isDark ? '#32404f' : '#e8e8e8'},
          ]}>
          <Text
            style={[
              styles.messageText,
              {color: isMe ? '#ffffff' : textColor},
            ]}>
            {item.content}
          </Text>
          <Text
            style={[
              styles.messageTime,
              {color: isMe ? 'rgba(255,255,255,0.7)' : subtextColor},
            ]}>
            {item.createdAt ? formatMessageTime(new Date(item.createdAt)) : ''}
          </Text>
        </View>
      </View>
    );
  };

  if (!friend) {
    return (
      <SafeAreaView style={[styles.container, {backgroundColor: bgColor}]}>
        <Text style={{color: textColor}}>친구를 찾을 수 없습니다</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF'}]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* 헤더 */}
      <View style={[styles.header, {backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderBottomColor: dividerColor}]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-back" size={iconSize(24)} color={textColor} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerCenter} onPress={handleViewProfile}>
          <View style={styles.headerAvatarContainer}>
            <View style={[
              styles.headerAvatar,
              {backgroundColor: '#4a6785'},
              friend.tier && {borderWidth: 2, borderColor: getTierColor(friend.tier)}
            ]}>
              <Icon name="person" size={iconSize(20)} color="#c7d5e0" />
            </View>
            {friend.level && (
              <View style={[styles.headerLevelBadge, {backgroundColor: getTierColor(friend.tier)}]}>
                <Text style={styles.headerLevelText}>{friend.level}</Text>
              </View>
            )}
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.headerName, {color: textColor}]}>
              {friend.nickname}
            </Text>
            <View style={styles.headerStatus}>
              <View style={[styles.statusDot, {backgroundColor: getStatusColor(friend.status)}]} />
              <Text style={[styles.headerStatusText, {color: getStatusColor(friend.status)}]}>
                {getStatusText(friend.status, friend.statusMessage)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton}>
          <Icon name="ellipsis-vertical" size={iconSize(20)} color={subtextColor} />
        </TouchableOpacity>
      </View>

      {/* 메시지 리스트 */}
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Icon name="chatbubbles-outline" size={iconSize(48)} color={subtextColor} />
              <Text style={[styles.emptyChatText, {color: subtextColor}]}>
                {friend.nickname}님과의 대화를 시작하세요
              </Text>
            </View>
          }
        />

        {/* 입력창 */}
        <View style={[styles.inputContainer, {backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderTopColor: dividerColor}]}>
          <TouchableOpacity style={styles.inputButton}>
            <Icon name="add-circle-outline" size={iconSize(26)} color={subtextColor} />
          </TouchableOpacity>
          <View style={[styles.inputWrapper, {backgroundColor: inputBg}]}>
            <TextInput
              style={[styles.input, {color: textColor}]}
              placeholder="메시지를 입력하세요..."
              placeholderTextColor={subtextColor}
              value={messageInput}
              onChangeText={setMessageInput}
              multiline
              maxLength={500}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.sendButton,
              {backgroundColor: messageInput.trim() ? STEAM_COLORS.accent : 'transparent'},
            ]}
            onPress={handleSendMessage}
            disabled={!messageInput.trim()}>
            <Icon
              name={messageInput.trim() ? 'send' : 'mic-outline'}
              size={iconSize(22)}
              color={messageInput.trim() ? '#FFFFFF' : subtextColor}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* 프로필 모달 */}
      <Modal
        visible={showProfileModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProfileModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.profileModal, {backgroundColor: cardBg}]}>
            <View style={[styles.profileHeader, {backgroundColor: isDark ? '#2a475e' : '#f0f0f0'}]}>
              <View style={[styles.profileAvatar, {backgroundColor: '#4a6785'}]}>
                <Icon name="person" size={iconSize(40)} color="#c7d5e0" />
              </View>
              <View style={[styles.profileStatusBadge, {backgroundColor: getStatusColor(friend.status)}]} />
            </View>

            <View style={styles.profileContent}>
              <Text style={[styles.profileName, {color: textColor}]}>{friend.nickname}</Text>
              <Text style={[styles.profileStatus, {color: getStatusColor(friend.status)}]}>
                {getStatusText(friend.status, friend.statusMessage)}
              </Text>

              <View style={[styles.profileStats, {borderColor: dividerColor}]}>
                <View style={styles.profileStatItem}>
                  <Text style={[styles.profileStatValue, {color: textColor}]}>Lv.{friend.level || 0}</Text>
                  <Text style={[styles.profileStatLabel, {color: subtextColor}]}>레벨</Text>
                </View>
                <View style={[styles.profileStatDivider, {backgroundColor: dividerColor}]} />
                <View style={styles.profileStatItem}>
                  <Text style={[styles.profileStatValue, {color: textColor}]}>{friend.tier || '-'}</Text>
                  <Text style={[styles.profileStatLabel, {color: subtextColor}]}>티어</Text>
                </View>
                <View style={[styles.profileStatDivider, {backgroundColor: dividerColor}]} />
                <View style={styles.profileStatItem}>
                  <Text style={[styles.profileStatValue, {color: textColor}]}>
                    {friend.todayStudyTime ? formatTime(friend.todayStudyTime) : '0분'}
                  </Text>
                  <Text style={[styles.profileStatLabel, {color: subtextColor}]}>오늘 공부</Text>
                </View>
              </View>

              <View style={styles.profileActions}>
                <TouchableOpacity
                  style={[styles.profileActionButton, {backgroundColor: '#c43b3b'}]}
                  onPress={handleRemoveFriend}>
                  <Icon name="person-remove" size={iconSize(18)} color="#ffffff" />
                  <Text style={styles.profileActionText}>친구 삭제</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.profileFooter}>
              <TouchableOpacity
                style={styles.profileCloseButton}
                onPress={() => setShowProfileModal(false)}>
                <Icon name="close" size={iconSize(24)} color={subtextColor} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(8),
    paddingVertical: sp(12),
    borderBottomWidth: 1,
  },
  backButton: {
    padding: sp(8),
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: sp(4),
  },
  headerAvatarContainer: {
    position: 'relative',
  },
  headerAvatar: {
    width: sp(40),
    height: sp(40),
    borderRadius: sp(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLevelBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    paddingHorizontal: sp(4),
    paddingVertical: sp(1),
    borderRadius: sp(6),
    minWidth: sp(18),
    alignItems: 'center',
  },
  headerLevelText: {
    fontSize: fp(9),
    fontWeight: '700',
    color: '#ffffff',
  },
  headerInfo: {
    marginLeft: sp(12),
    flex: 1,
  },
  headerName: {
    fontSize: fp(16),
    fontWeight: '600',
  },
  headerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: sp(2),
  },
  statusDot: {
    width: sp(8),
    height: sp(8),
    borderRadius: sp(4),
    marginRight: sp(6),
  },
  headerStatusText: {
    fontSize: fp(12),
  },
  headerButton: {
    padding: sp(8),
  },
  keyboardView: {
    flex: 1,
  },
  messageList: {
    padding: sp(16),
    flexGrow: 1,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: sp(12),
    alignItems: 'flex-end',
  },
  messageRowMe: {
    flexDirection: 'row-reverse',
  },
  messageAvatar: {
    width: sp(28),
    height: sp(28),
    borderRadius: sp(14),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: sp(8),
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: sp(14),
    paddingVertical: sp(10),
    borderRadius: sp(18),
  },
  messageText: {
    fontSize: fp(15),
    lineHeight: fp(20),
  },
  messageTime: {
    fontSize: fp(10),
    marginTop: sp(4),
    alignSelf: 'flex-end',
  },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(100),
  },
  emptyChatText: {
    marginTop: sp(12),
    fontSize: fp(14),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: sp(8),
    paddingVertical: sp(6),
    borderTopWidth: 1,
  },
  inputButton: {
    padding: sp(4),
    marginBottom: sp(2),
  },
  inputWrapper: {
    flex: 1,
    marginHorizontal: sp(6),
    borderRadius: sp(18),
    paddingHorizontal: sp(12),
    paddingVertical: sp(6),
    maxHeight: hp(100),
  },
  input: {
    fontSize: fp(15),
    maxHeight: hp(80),
  },
  sendButton: {
    width: sp(40),
    height: sp(40),
    borderRadius: sp(20),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sp(2),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileModal: {
    width: SCREEN_WIDTH - sp(60),
    borderRadius: sp(16),
    overflow: 'hidden',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: sp(24),
  },
  profileAvatar: {
    width: sp(80),
    height: sp(80),
    borderRadius: sp(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileStatusBadge: {
    position: 'absolute',
    bottom: sp(20),
    right: SCREEN_WIDTH / 2 - sp(30) - sp(30),
    width: sp(20),
    height: sp(20),
    borderRadius: sp(10),
    borderWidth: 3,
    borderColor: '#2a475e',
  },
  profileContent: {
    padding: sp(20),
    alignItems: 'center',
  },
  profileName: {
    fontSize: fp(20),
    fontWeight: '700',
  },
  profileStatus: {
    fontSize: fp(14),
    marginTop: sp(4),
  },
  profileStats: {
    flexDirection: 'row',
    marginTop: sp(20),
    paddingTop: sp(16),
    borderTopWidth: 1,
    width: '100%',
  },
  profileStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  profileStatValue: {
    fontSize: fp(16),
    fontWeight: '600',
  },
  profileStatLabel: {
    fontSize: fp(12),
    marginTop: sp(4),
  },
  profileStatDivider: {
    width: 1,
    height: sp(30),
  },
  profileActions: {
    marginTop: sp(20),
    width: '100%',
  },
  profileActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: sp(12),
    borderRadius: sp(10),
    gap: sp(8),
  },
  profileActionText: {
    color: '#ffffff',
    fontSize: fp(14),
    fontWeight: '600',
  },
  profileFooter: {
    position: 'absolute',
    top: sp(12),
    right: sp(12),
  },
  profileCloseButton: {
    padding: sp(4),
  },
});

export default FriendChatScreen;
