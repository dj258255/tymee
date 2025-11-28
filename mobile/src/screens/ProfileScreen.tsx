import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  InteractionManager,
  SafeAreaView,
  Modal,
  TextInput,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import {useTranslation} from 'react-i18next';
import {useThemeStore} from '../store/themeStore';
import {useLanguageStore} from '../store/languageStore';
import {safeGetColorScheme, safeAddAppearanceListener} from '../utils/appearance';
import ProfileCard from '../components/ProfileCard';

const ProfileScreen: React.FC<{onBack: () => void}> = ({onBack}) => {
  const {t, i18n} = useTranslation();
  const [systemColorScheme, setSystemColorScheme] = useState<'light' | 'dark'>('light');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [showProfilePhotoModal, setShowProfilePhotoModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showBlockUsersModal, setShowBlockUsersModal] = useState(false);
  const [nickname, setNickname] = useState('타이미유저');
  const [statusMessage, setStatusMessage] = useState(t('settings.studying'));
  const {language, setLanguage} = useLanguageStore();

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

  const handleLogout = () => {
    Alert.alert(t('profile.logout'), t('profile.logoutConfirm'), [
      {text: t('common.cancel'), style: 'cancel'},
      {text: t('profile.logout'), style: 'destructive', onPress: () => console.log('로그아웃')},
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('profile.deleteAccount'),
      t('profile.deleteConfirm'),
      [
        {text: t('common.cancel'), style: 'cancel'},
        {text: t('profile.deleteAccount'), style: 'destructive', onPress: () => console.log('탈퇴')},
      ]
    );
  };

  const styles = getStyles(isDark);

  const getLanguageLabel = () => {
    switch (i18n.language) {
      case 'ko':
        return t('language.korean');
      case 'en':
        return t('language.english');
      case 'ja':
        return t('language.japanese');
      default:
        return t('language.korean');
    }
  };

  const languageOptions = [
    {code: 'ko', label: t('language.korean')},
    {code: 'en', label: t('language.english')},
    {code: 'ja', label: t('language.japanese')},
  ];

  const menuItems = [
    {
      id: 'nickname',
      title: t('profile.nickname'),
      icon: 'person-outline',
      value: t('profile.user'),
      onPress: () => setShowNicknameModal(true),
    },
    {
      id: 'profilePhoto',
      title: t('profile.profilePhoto'),
      icon: 'camera-outline',
      value: '',
      onPress: () => setShowProfilePhotoModal(true),
    },
    {
      id: 'status',
      title: t('profile.statusMessage'),
      icon: 'chatbubble-outline',
      value: t('settings.studying'),
      onPress: () => setShowStatusModal(true),
    },
    {
      id: 'language',
      title: t('profile.language'),
      icon: 'globe-outline',
      value: getLanguageLabel(),
      onPress: () => setShowLanguageModal(true),
    },
    {
      id: 'block',
      title: t('profile.blockUsers'),
      icon: 'ban-outline',
      onPress: () => setShowBlockUsersModal(true),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>
        <View style={{width: 40}} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Profile Section - Crazy Arcade Style */}
        <View style={styles.profileSection}>
          {/* Profile Card - 스토어에서 꾸미기 가능 */}
          <ProfileCard isDark={isDark} size="large" />

          {/* Status Message (별도 카드) */}
          <View style={styles.statusCard}>
            <View style={styles.statusContainer}>
              <Icon name="chatbubble-ellipses-outline" size={12} color={isDark ? '#AAAAAA' : '#666666'} />
              <Text style={styles.statusText}>{t('settings.studying')}</Text>
            </View>
          </View>

          {/* Level & Experience Details */}
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>레벨 & 경험치</Text>

            {/* Level Section */}
            <View style={styles.levelSection}>
              <View style={styles.levelHeader}>
                <View style={styles.levelInfo}>
                  <Icon name="star" size={20} color="#FFD700" />
                  <Text style={styles.levelNumber}>레벨 12</Text>
                </View>
                <Text style={styles.expText}>2,340 / 3,000 EXP</Text>
              </View>

              {/* Experience Bar */}
              <View style={styles.expBarContainer}>
                <View style={[styles.expBarFill, {width: '78%'}]} />
              </View>
              <Text style={styles.expRemaining}>다음 레벨까지 660 EXP 남음</Text>
            </View>

            {/* Competitive Rank Section */}
            <View style={styles.rankSection}>
              <View style={styles.rankHeader}>
                <View style={styles.rankInfo}>
                  <Icon name="trophy" size={20} color="#E91E63" />
                  <Text style={styles.rankTier}>플래티넘 III</Text>
                </View>
                <Text style={styles.rankPoints}>1,847 RP</Text>
              </View>

              {/* Rank Progress Bar */}
              <View style={styles.rankBarContainer}>
                <View style={[styles.rankBarFill, {width: '62%'}]} />
              </View>
              <Text style={styles.rankRemaining}>플래티넘 II까지 153 RP 남음</Text>
            </View>

            {/* Badge Section */}
            <View style={styles.badgeSection}>
              <View style={styles.badgeHeader}>
                <Icon name="medal" size={20} color="#FFD700" />
                <Text style={styles.badgeTitle}>획득 뱃지</Text>
              </View>
              <Text style={styles.badgeDescription}>레벨 10 달성 시 획득한 골드 뱃지</Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <React.Fragment key={item.id}>
              <TouchableOpacity style={styles.menuItem} onPress={item.onPress}>
                <View style={styles.menuLeft}>
                  <Icon
                    name={item.icon}
                    size={24}
                    color={isDark ? '#FFFFFF' : '#1A1A1A'}
                  />
                  <Text style={styles.menuTitle}>{item.title}</Text>
                </View>
                <View style={styles.menuRight}>
                  {item.value && <Text style={styles.menuValue}>{item.value}</Text>}
                  <Icon
                    name="chevron-forward"
                    size={20}
                    color={isDark ? '#666666' : '#AAAAAA'}
                  />
                </View>
              </TouchableOpacity>
              {index < menuItems.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerSection}>
          <TouchableOpacity style={styles.dangerButton} onPress={handleLogout}>
            <Icon name="log-out-outline" size={24} color="#FF5252" />
            <Text style={styles.dangerText}>{t('profile.logout')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dangerButton} onPress={handleDeleteAccount}>
            <Icon name="trash-outline" size={24} color="#FF5252" />
            <Text style={styles.dangerText}>{t('profile.deleteAccount')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Nickname Modal */}
      <Modal
        visible={showNicknameModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNicknameModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowNicknameModal(false)}
          />
          <View style={[styles.modalContent, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                {t('profile.nickname')}
              </Text>
              <TouchableOpacity onPress={() => setShowNicknameModal(false)}>
                <Icon name="close" size={24} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
              </TouchableOpacity>
            </View>
            <View style={{padding: 20}}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
                    color: isDark ? '#FFFFFF' : '#1A1A1A',
                  },
                ]}
                value={nickname}
                onChangeText={setNickname}
                placeholder="닉네임을 입력하세요"
                placeholderTextColor={isDark ? '#666666' : '#999999'}
                maxLength={20}
              />
              <TouchableOpacity
                style={[styles.confirmButton, {opacity: 0.5}]}
                disabled>
                <Text style={styles.confirmButtonText}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Profile Photo Modal */}
      <Modal
        visible={showProfilePhotoModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProfilePhotoModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowProfilePhotoModal(false)}
          />
          <View style={[styles.modalContent, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                {t('profile.profilePhoto')}
              </Text>
              <TouchableOpacity onPress={() => setShowProfilePhotoModal(false)}>
                <Icon name="close" size={24} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
              </TouchableOpacity>
            </View>
            <View style={{padding: 20}}>
              <TouchableOpacity
                style={[styles.photoOption, {backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5'}]}
                disabled>
                <Icon name="camera-outline" size={24} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
                <Text style={[styles.photoOptionText, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                  카메라로 촬영
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.photoOption, {backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5'}]}
                disabled>
                <Icon name="images-outline" size={24} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
                <Text style={[styles.photoOptionText, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                  갤러리에서 선택
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Status Message Modal */}
      <Modal
        visible={showStatusModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStatusModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowStatusModal(false)}
          />
          <View style={[styles.modalContent, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                {t('profile.statusMessage')}
              </Text>
              <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                <Icon name="close" size={24} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
              </TouchableOpacity>
            </View>
            <View style={{padding: 20}}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
                    color: isDark ? '#FFFFFF' : '#1A1A1A',
                  },
                ]}
                value={statusMessage}
                onChangeText={setStatusMessage}
                placeholder="상태 메시지를 입력하세요"
                placeholderTextColor={isDark ? '#666666' : '#999999'}
                maxLength={50}
                multiline
              />
              <TouchableOpacity
                style={[styles.confirmButton, {opacity: 0.5}]}
                disabled>
                <Text style={styles.confirmButtonText}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Block Users Modal */}
      <Modal
        visible={showBlockUsersModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBlockUsersModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowBlockUsersModal(false)}
          />
          <View style={[styles.modalContent, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                {t('profile.blockUsers')}
              </Text>
              <TouchableOpacity onPress={() => setShowBlockUsersModal(false)}>
                <Icon name="close" size={24} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
              </TouchableOpacity>
            </View>
            <View style={{padding: 20}}>
              <Text style={[styles.modalOptionText, {color: isDark ? '#FFFFFF' : '#1A1A1A', marginBottom: 20}]}>
                차단된 사용자가 없습니다.
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Language Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowLanguageModal(false)}
          />
          <View style={[styles.modalContent, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                {t('profile.language')}
              </Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Icon name="close" size={24} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
              </TouchableOpacity>
            </View>
            {languageOptions.map((option, index) => (
              <React.Fragment key={option.code}>
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    setLanguage(option.code as 'ko' | 'en' | 'ja');
                    setShowLanguageModal(false);
                  }}>
                  <Text style={[styles.modalOptionText, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                    {option.label}
                  </Text>
                  {i18n.language === option.code && (
                    <Icon name="checkmark" size={24} color="#007AFF" />
                  )}
                </TouchableOpacity>
                {index < languageOptions.length - 1 && (
                  <View style={[styles.divider, {backgroundColor: isDark ? '#2A2A2A' : '#E0E0E0'}]} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#121212' : '#FAFAFA',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#2A2A2A' : '#E0E0E0',
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: isDark ? '#FFFFFF' : '#1A1A1A',
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: 24,
    },
    profileSection: {
      marginBottom: 32,
      gap: 12,
    },
    profileCardOuter: {
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
    },
    cardFrame: {
      borderRadius: 16,
      borderWidth: 3,
      padding: 3,
      backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
    },
    cardBackground: {
      backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
      borderRadius: 13,
      padding: 10,
    },
    profileCardContent: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'stretch',
    },
    centerContent: {
      flex: 1,
      justifyContent: 'space-between',
      gap: 6,
    },
    badgeTierRow: {
      flexDirection: 'row',
      gap: 6,
      justifyContent: 'center',
    },
    characterContainer: {
      position: 'relative',
    },
    characterAvatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#007AFF',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: isDark ? '#2A2A2A' : '#F0F0F0',
    },
    editImageButton: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: '#4CAF50',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: isDark ? '#1E1E1E' : '#FFFFFF',
    },
    badgeSlot: {
      alignItems: 'center',
      gap: 3,
    },
    badgeIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? '#2A2A2A' : '#FFF9E6',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: isDark ? '#3A3A00' : '#FFE082',
    },
    badgeLabel: {
      fontSize: 9,
      fontWeight: '700',
      color: isDark ? '#FFD700' : '#F59E0B',
      textAlign: 'center',
    },
    tierSlot: {
      alignItems: 'center',
      gap: 3,
    },
    tierIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? '#2A2A2A' : '#FCE4EC',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: isDark ? '#3A1A2A' : '#F8BBD0',
    },
    tierLabel: {
      fontSize: 9,
      fontWeight: '700',
      color: isDark ? '#F48FB1' : '#E91E63',
      textAlign: 'center',
    },
    titleSlot: {
      justifyContent: 'center',
      alignItems: 'center',
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? '#2A2A2A' : '#F3E5F5',
      borderWidth: 1,
      borderColor: isDark ? '#3A1A3A' : '#E1BEE7',
    },
    nicknameSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      justifyContent: 'center',
    },
    nickname: {
      fontSize: 14,
      fontWeight: '800',
      color: isDark ? '#FFFFFF' : '#1A1A1A',
      letterSpacing: -0.3,
    },
    editNicknameButton: {
      padding: 4,
    },
    statusCard: {
      backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
      borderRadius: 8,
      padding: 12,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.03,
      shadowRadius: 4,
      elevation: 1,
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    statusText: {
      fontSize: 13,
      color: isDark ? '#AAAAAA' : '#666666',
      fontStyle: 'italic',
    },
    statsCard: {
      backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
      borderRadius: 12,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
      gap: 20,
    },
    statsTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: isDark ? '#FFFFFF' : '#1A1A1A',
      marginBottom: 4,
    },
    levelSection: {
      gap: 10,
    },
    levelHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    levelInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    levelNumber: {
      fontSize: 18,
      fontWeight: '800',
      color: isDark ? '#FFD700' : '#F59E0B',
    },
    expText: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#AAAAAA' : '#666666',
    },
    expBarContainer: {
      height: 12,
      backgroundColor: isDark ? '#2A2A2A' : '#E0E0E0',
      borderRadius: 6,
      overflow: 'hidden',
    },
    expBarFill: {
      height: '100%',
      backgroundColor: '#FFD700',
      borderRadius: 6,
    },
    expRemaining: {
      fontSize: 12,
      color: isDark ? '#999999' : '#888888',
      textAlign: 'center',
    },
    rankSection: {
      gap: 10,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#2A2A2A' : '#E0E0E0',
    },
    rankHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    rankInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    rankTier: {
      fontSize: 18,
      fontWeight: '800',
      color: isDark ? '#F48FB1' : '#E91E63',
    },
    rankPoints: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#AAAAAA' : '#666666',
    },
    rankBarContainer: {
      height: 12,
      backgroundColor: isDark ? '#2A2A2A' : '#E0E0E0',
      borderRadius: 6,
      overflow: 'hidden',
    },
    rankBarFill: {
      height: '100%',
      backgroundColor: '#E91E63',
      borderRadius: 6,
    },
    rankRemaining: {
      fontSize: 12,
      color: isDark ? '#999999' : '#888888',
      textAlign: 'center',
    },
    badgeSection: {
      gap: 8,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#2A2A2A' : '#E0E0E0',
    },
    badgeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    badgeTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: isDark ? '#FFFFFF' : '#1A1A1A',
    },
    badgeDescription: {
      fontSize: 13,
      color: isDark ? '#AAAAAA' : '#666666',
      lineHeight: 18,
    },
    menuSection: {
      backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 24,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      paddingHorizontal: 16,
    },
    menuLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 12,
    },
    menuTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: isDark ? '#FFFFFF' : '#1A1A1A',
    },
    menuRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    menuValue: {
      fontSize: 14,
      color: isDark ? '#AAAAAA' : '#666666',
    },
    divider: {
      height: 1,
      backgroundColor: isDark ? '#2A2A2A' : '#E0E0E0',
      marginLeft: 52,
    },
    dangerSection: {
      gap: 12,
    },
    dangerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 16,
      paddingHorizontal: 16,
      backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? '#3A1A1A' : '#FFE0E0',
    },
    dangerText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FF5252',
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalBackdrop: {
      flex: 1,
    },
    modalContent: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 34,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#2A2A2A' : '#E0E0E0',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
    },
    modalOption: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    modalOptionText: {
      fontSize: 16,
      fontWeight: '500',
    },
    input: {
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isDark ? '#3A3A3A' : '#E0E0E0',
    },
    confirmButton: {
      backgroundColor: '#007AFF',
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
    },
    confirmButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    photoOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      gap: 12,
    },
    photoOptionText: {
      fontSize: 16,
      fontWeight: '500',
    },
  });

export default ProfileScreen;
