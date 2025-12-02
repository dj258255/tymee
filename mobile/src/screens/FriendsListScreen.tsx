import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  InteractionManager,
  TextInput,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import {useThemeStore} from '../store/themeStore';
import {safeGetColorScheme, safeAddAppearanceListener} from '../utils/appearance';

interface FriendsListScreenProps {
  onBack: () => void;
}

const FriendsListScreen: React.FC<FriendsListScreenProps> = ({onBack}) => {
  const [systemColorScheme, setSystemColorScheme] = useState<'light' | 'dark'>('light');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'friends' | 'requests'>('friends');

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

  // 임시 친구 데이터
  const friends = [
    {id: 1, name: '집중왕', level: 38, online: true, studying: true},
    {id: 2, name: '공부러버', level: 35, online: true, studying: false},
    {id: 3, name: '뽀모도로', level: 32, online: false, studying: false},
    {id: 4, name: '타임마스터', level: 29, online: true, studying: true},
    {id: 5, name: '스터디킹', level: 27, online: false, studying: false},
  ];

  // 임시 친구 요청 데이터
  const friendRequests = [
    {id: 1, name: '새로운친구1', level: 25},
    {id: 2, name: '새로운친구2', level: 22},
  ];

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView
      style={[
        styles.container,
        {backgroundColor: isDark ? '#121212' : '#FAFAFA'},
      ]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
            borderBottomColor: isDark ? '#2A2A2A' : '#E0E0E0',
          },
        ]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
          친구 목록
        </Text>
        <TouchableOpacity style={styles.addButton}>
          <Icon name="person-add-outline" size={24} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
              borderColor: isDark ? '#2A2A2A' : '#E0E0E0',
            },
          ]}>
          <Icon name="search" size={20} color={isDark ? '#666666' : '#AAAAAA'} />
          <TextInput
            style={[styles.searchInput, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}
            placeholder="친구 검색"
            placeholderTextColor={isDark ? '#666666' : '#AAAAAA'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close-circle" size={20} color={isDark ? '#666666' : '#AAAAAA'} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'friends' && styles.tabActive,
          ]}
          onPress={() => setSelectedTab('friends')}>
          <Text
            style={[
              styles.tabText,
              {color: isDark ? '#AAAAAA' : '#666666'},
              selectedTab === 'friends' && styles.tabTextActive,
              selectedTab === 'friends' && {color: isDark ? '#FFFFFF' : '#1A1A1A'},
            ]}>
            친구 ({friends.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'requests' && styles.tabActive,
          ]}
          onPress={() => setSelectedTab('requests')}>
          <Text
            style={[
              styles.tabText,
              {color: isDark ? '#AAAAAA' : '#666666'},
              selectedTab === 'requests' && styles.tabTextActive,
              selectedTab === 'requests' && {color: isDark ? '#FFFFFF' : '#1A1A1A'},
            ]}>
            요청 ({friendRequests.length})
          </Text>
          {friendRequests.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{friendRequests.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {selectedTab === 'friends' ? (
          // Friends List
          <View
            style={[
              styles.friendsList,
              {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'},
            ]}>
            {filteredFriends.map((friend, index) => (
              <React.Fragment key={friend.id}>
                <View style={styles.friendItem}>
                  <View style={styles.friendLeft}>
                    <View
                      style={[
                        styles.friendAvatar,
                        {backgroundColor: friend.online ? '#007AFF' : '#666666'},
                      ]}>
                      <Icon name="person" size={20} color="#FFFFFF" />
                      {friend.online && <View style={styles.onlineBadge} />}
                    </View>
                    <View style={styles.friendInfo}>
                      <View style={styles.friendNameRow}>
                        <Text style={[styles.friendName, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                          {friend.name}
                        </Text>
                        {friend.studying && (
                          <View style={styles.studyingBadge}>
                            <Icon name="book" size={10} color="#FFFFFF" />
                            <Text style={styles.studyingText}>공부중</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.friendLevel, {color: isDark ? '#AAAAAA' : '#666666'}]}>
                        Lv.{friend.level} • {friend.online ? '온라인' : '오프라인'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity>
                    <Icon name="ellipsis-horizontal" size={20} color={isDark ? '#666666' : '#AAAAAA'} />
                  </TouchableOpacity>
                </View>
                {index < filteredFriends.length - 1 && (
                  <View style={[styles.divider, {backgroundColor: isDark ? '#2A2A2A' : '#E0E0E0'}]} />
                )}
              </React.Fragment>
            ))}
          </View>
        ) : (
          // Friend Requests List
          <View
            style={[
              styles.friendsList,
              {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'},
            ]}>
            {friendRequests.map((request, index) => (
              <React.Fragment key={request.id}>
                <View style={styles.requestItem}>
                  <View style={styles.friendLeft}>
                    <View style={[styles.friendAvatar, {backgroundColor: '#666666'}]}>
                      <Icon name="person" size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.friendInfo}>
                      <Text style={[styles.friendName, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                        {request.name}
                      </Text>
                      <Text style={[styles.friendLevel, {color: isDark ? '#AAAAAA' : '#666666'}]}>
                        Lv.{request.level}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.requestButtons}>
                    <TouchableOpacity style={styles.acceptButton}>
                      <Icon name="checkmark" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.rejectButton}>
                      <Icon name="close" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
                {index < friendRequests.length - 1 && (
                  <View style={[styles.divider, {backgroundColor: isDark ? '#2A2A2A' : '#E0E0E0'}]} />
                )}
              </React.Fragment>
            ))}
          </View>
        )}
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  addButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    position: 'relative',
  },
  tabActive: {
    backgroundColor: '#007AFF20',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  tabTextActive: {
    fontWeight: '700',
  },
  badge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  friendsList: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  friendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  friendAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  friendInfo: {
    flex: 1,
    gap: 4,
  },
  friendNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  friendName: {
    fontSize: 15,
    fontWeight: '700',
  },
  studyingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FF5252',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  studyingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  friendLevel: {
    fontSize: 12,
  },
  divider: {
    height: 1,
    marginLeft: 72,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  requestButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FriendsListScreen;
