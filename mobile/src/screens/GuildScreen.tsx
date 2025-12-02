import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  InteractionManager,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import {useThemeStore} from '../store/themeStore';
import {safeGetColorScheme, safeAddAppearanceListener} from '../utils/appearance';

interface GuildScreenProps {
  onBack: () => void;
}

const GuildScreen: React.FC<GuildScreenProps> = ({onBack}) => {
  const [systemColorScheme, setSystemColorScheme] = useState<'light' | 'dark'>('light');

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

  // 임시 길드 멤버 데이터
  const guildMembers = [
    {id: 1, name: '타이미유저', level: 42, role: 'master', online: true},
    {id: 2, name: '집중왕', level: 38, role: 'admin', online: true},
    {id: 3, name: '공부러버', level: 35, role: 'member', online: false},
    {id: 4, name: '뽀모도로', level: 32, role: 'member', online: true},
    {id: 5, name: '타임마스터', level: 29, role: 'member', online: false},
  ];

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'master':
        return '길드장';
      case 'admin':
        return '부길드장';
      default:
        return '멤버';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'master':
        return '#FFD700';
      case 'admin':
        return '#C0C0C0';
      default:
        return isDark ? '#AAAAAA' : '#666666';
    }
  };

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
          길드
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Guild Info Card */}
        <View
          style={[
            styles.guildCard,
            {
              backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
              borderColor: isDark ? '#2A3A4A' : '#BBDEFB',
            },
          ]}>
          <View style={styles.guildHeader}>
            <View
              style={[
                styles.guildIcon,
                {backgroundColor: isDark ? '#1A2A3A' : '#E3F2FD'},
              ]}>
              <Icon name="people" size={32} color={isDark ? '#64B5F6' : '#1976D2'} />
            </View>
            <View style={styles.guildInfo}>
              <Text style={[styles.guildName, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                집중왕들
              </Text>
              <Text style={[styles.guildDescription, {color: isDark ? '#AAAAAA' : '#666666'}]}>
                함께 집중하고 성장하는 길드
              </Text>
            </View>
          </View>

          <View style={styles.guildStats}>
            <View style={styles.statItem}>
              <Icon name="people-outline" size={18} color={isDark ? '#AAAAAA' : '#666666'} />
              <Text style={[styles.statLabel, {color: isDark ? '#AAAAAA' : '#666666'}]}>
                멤버
              </Text>
              <Text style={[styles.statValue, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                {guildMembers.length}/50
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Icon name="trophy-outline" size={18} color={isDark ? '#AAAAAA' : '#666666'} />
              <Text style={[styles.statLabel, {color: isDark ? '#AAAAAA' : '#666666'}]}>
                랭킹
              </Text>
              <Text style={[styles.statValue, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                #42
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Icon name="star-outline" size={18} color={isDark ? '#AAAAAA' : '#666666'} />
              <Text style={[styles.statLabel, {color: isDark ? '#AAAAAA' : '#666666'}]}>
                경험치
              </Text>
              <Text style={[styles.statValue, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                15,280
              </Text>
            </View>
          </View>
        </View>

        {/* Guild Members */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
              멤버 목록
            </Text>
            <Text style={[styles.onlineCount, {color: isDark ? '#4CAF50' : '#2E7D32'}]}>
              {guildMembers.filter(m => m.online).length}명 접속중
            </Text>
          </View>

          <View
            style={[
              styles.memberList,
              {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'},
            ]}>
            {guildMembers.map((member, index) => (
              <React.Fragment key={member.id}>
                <View style={styles.memberItem}>
                  <View style={styles.memberLeft}>
                    <View
                      style={[
                        styles.memberAvatar,
                        {backgroundColor: member.online ? '#007AFF' : '#666666'},
                      ]}>
                      <Icon name="person" size={20} color="#FFFFFF" />
                      {member.online && <View style={styles.onlineBadge} />}
                    </View>
                    <View style={styles.memberInfo}>
                      <View style={styles.memberNameRow}>
                        <Text style={[styles.memberName, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                          {member.name}
                        </Text>
                        <View
                          style={[
                            styles.roleBadge,
                            {backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5'},
                          ]}>
                          <Text style={[styles.roleText, {color: getRoleColor(member.role)}]}>
                            {getRoleLabel(member.role)}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.memberLevel, {color: isDark ? '#AAAAAA' : '#666666'}]}>
                        Lv.{member.level}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity>
                    <Icon name="ellipsis-horizontal" size={20} color={isDark ? '#666666' : '#AAAAAA'} />
                  </TouchableOpacity>
                </View>
                {index < guildMembers.length - 1 && (
                  <View style={[styles.divider, {backgroundColor: isDark ? '#2A2A2A' : '#E0E0E0'}]} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Guild Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'},
            ]}>
            <Icon name="chatbubbles-outline" size={20} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
            <Text style={[styles.actionButtonText, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
              길드 채팅
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionButton,
              {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'},
            ]}>
            <Icon name="settings-outline" size={20} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
            <Text style={[styles.actionButtonText, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
              길드 설정
            </Text>
          </TouchableOpacity>
        </View>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  guildCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
    marginBottom: 24,
  },
  guildHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  guildIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guildInfo: {
    flex: 1,
  },
  guildName: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  guildDescription: {
    fontSize: 14,
  },
  guildStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E0E0E0',
  },
  statLabel: {
    fontSize: 12,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  onlineCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  memberList: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  memberAvatar: {
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
  memberInfo: {
    flex: 1,
    gap: 4,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '700',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
  },
  memberLevel: {
    fontSize: 12,
  },
  divider: {
    height: 1,
    marginLeft: 72,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});

export default GuildScreen;
