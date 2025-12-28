import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  InteractionManager,
  Modal,
  SafeAreaView,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import {useTranslation} from 'react-i18next';
import {useThemeStore, ThemeMode} from '../store/themeStore';
import {safeGetColorScheme, safeAddAppearanceListener} from '../utils/appearance';
import ProfileScreen from './ProfileScreen';

const SettingsScreen: React.FC = () => {
  const {t} = useTranslation();
  const [systemColorScheme, setSystemColorScheme] = useState<'light' | 'dark'>('light');
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

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

  const {themeMode, setThemeMode} = useThemeStore();

  // 실제 적용되는 테마 결정
  const isDark =
    themeMode === 'system'
      ? systemColorScheme === 'dark'
      : themeMode === 'dark';

  const themeOptions: {mode: ThemeMode; label: string; icon: string}[] = [
    {mode: 'light', label: t('theme.light'), icon: 'sunny-outline'},
    {mode: 'dark', label: t('theme.dark'), icon: 'moon-outline'},
    {mode: 'system', label: t('theme.system'), icon: 'settings-outline'},
  ];

  const getThemeLabel = () => {
    const option = themeOptions.find(opt => opt.mode === themeMode);
    return option?.label || t('theme.system');
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        {backgroundColor: isDark ? '#121212' : '#FAFAFA'},
      ]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* 프로필 섹션 - Crazy Arcade Style */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.profileCardOuter}
            onPress={() => setShowProfileModal(true)}>
            {/* Card Frame */}
            <View style={[styles.cardFrame, {borderColor: isDark ? '#FFD700' : '#F59E0B'}]}>
              <View style={[styles.cardBackground, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
                <View style={styles.profileCardContent}>
                  {/* Left: Profile Avatar (전체 높이) */}
                  <View style={styles.characterAvatarSmall}>
                    <Icon name="rocket" size={24} color="#FFFFFF" />
                  </View>

                  {/* Center: Badge, Tier, Nickname */}
                  <View style={styles.centerContent}>
                    {/* Top Row: Badge, Tier */}
                    <View style={styles.badgeTierRow}>
                      {/* Badge */}
                      <View style={styles.badgeContainer}>
                        <View style={styles.badgeSlotSmall}>
                          <Icon name="medal" size={18} color="#FFD700" />
                        </View>
                        <Text style={[styles.levelText, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                          Lv.42
                        </Text>
                      </View>

                      {/* Tier */}
                      <View style={styles.tierContainer}>
                        <View style={styles.tierSlotSmall}>
                          <Icon name="trophy" size={18} color="#E91E63" />
                        </View>
                        <Text style={[styles.tierText, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                          학사 II
                        </Text>
                      </View>
                    </View>

                    {/* Bottom: Nickname */}
                    <Text style={[styles.profileName, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                      타이미유저
                    </Text>
                  </View>

                  {/* Right: Title (전체 높이) */}
                  <View style={styles.titleSlotSmall}>
                    <Icon name="ribbon" size={12} color="#9C27B0" />
                    <Text style={[styles.titleTextSmall, {color: isDark ? '#CE93D8' : '#9C27B0'}]}>
                      집중의 달인
                    </Text>
                  </View>

                  <Icon
                    name="chevron-forward"
                    size={18}
                    color={isDark ? '#666666' : '#AAAAAA'}
                  />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* 일반 섹션 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: isDark ? '#FFFFFF' : '#000000'}]}>
            {t('settings.general')}
          </Text>
          <View
            style={[
              styles.optionContainer,
              {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'},
            ]}>
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => setShowThemeModal(true)}>
              <View style={styles.optionLeft}>
                <Icon name="color-palette-outline" size={24} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
                <Text
                  style={[
                    styles.optionLabel,
                    {color: isDark ? '#FFFFFF' : '#000000'},
                  ]}>
                  {t('settings.theme')}
                </Text>
              </View>
              <View style={styles.optionRight}>
                <Text style={[styles.optionValue, {color: isDark ? '#AAAAAA' : '#666666'}]}>
                  {getThemeLabel()}
                </Text>
                <Icon
                  name="chevron-forward"
                  size={20}
                  color={isDark ? '#666666' : '#AAAAAA'}
                />
              </View>
            </TouchableOpacity>
            <View
              style={[
                styles.divider,
                {backgroundColor: isDark ? '#2A2A2A' : '#E0E0E0'},
              ]}
            />
            <TouchableOpacity style={styles.optionItem}>
              <View style={styles.optionLeft}>
                <Icon name="notifications-outline" size={24} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
                <Text
                  style={[
                    styles.optionLabel,
                    {color: isDark ? '#FFFFFF' : '#000000'},
                  ]}>
                  {t('settings.notifications')}
                </Text>
              </View>
              <Icon
                name="chevron-forward"
                size={20}
                color={isDark ? '#666666' : '#AAAAAA'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* 지원 섹션 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: isDark ? '#FFFFFF' : '#000000'}]}>
            {t('settings.support')}
          </Text>
          <View
            style={[
              styles.optionContainer,
              {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'},
            ]}>
            <TouchableOpacity style={styles.optionItem}>
              <View style={styles.optionLeft}>
                <Icon name="megaphone-outline" size={24} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
                <Text
                  style={[
                    styles.optionLabel,
                    {color: isDark ? '#FFFFFF' : '#000000'},
                  ]}>
                  {t('settings.announcements')}
                </Text>
              </View>
              <Icon
                name="chevron-forward"
                size={20}
                color={isDark ? '#666666' : '#AAAAAA'}
              />
            </TouchableOpacity>
            <View
              style={[
                styles.divider,
                {backgroundColor: isDark ? '#2A2A2A' : '#E0E0E0'},
              ]}
            />
            <TouchableOpacity style={styles.optionItem}>
              <View style={styles.optionLeft}>
                <Icon name="help-circle-outline" size={24} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
                <Text
                  style={[
                    styles.optionLabel,
                    {color: isDark ? '#FFFFFF' : '#000000'},
                  ]}>
                  {t('settings.help')}
                </Text>
              </View>
              <Icon
                name="chevron-forward"
                size={20}
                color={isDark ? '#666666' : '#AAAAAA'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* 앱 정보 섹션 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: isDark ? '#FFFFFF' : '#000000'}]}>
            {t('settings.appInfo')}
          </Text>
          <View
            style={[
              styles.optionContainer,
              {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'},
            ]}>
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, {color: isDark ? '#AAAAAA' : '#666666'}]}>
                {t('settings.version')}
              </Text>
              <Text style={[styles.infoValue, {color: isDark ? '#FFFFFF' : '#000000'}]}>
                1.0.0
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Theme Modal */}
      <Modal
        visible={showThemeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowThemeModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                테마 선택
              </Text>
              <TouchableOpacity onPress={() => setShowThemeModal(false)}>
                <Icon name="close" size={24} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
              </TouchableOpacity>
            </View>
            {themeOptions.map((option, index) => (
              <React.Fragment key={option.mode}>
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    setThemeMode(option.mode);
                    setShowThemeModal(false);
                  }}>
                  <View style={styles.modalOptionLeft}>
                    <Icon name={option.icon} size={24} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
                    <Text
                      style={[
                        styles.modalOptionLabel,
                        {color: isDark ? '#FFFFFF' : '#000000'},
                      ]}>
                      {option.label}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.radio,
                      {borderColor: isDark ? '#444444' : '#CCCCCC'},
                      themeMode === option.mode && styles.radioSelected,
                    ]}>
                    {themeMode === option.mode && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                </TouchableOpacity>
                {index < themeOptions.length - 1 && (
                  <View
                    style={[
                      styles.modalDivider,
                      {backgroundColor: isDark ? '#2A2A2A' : '#E0E0E0'},
                    ]}
                  />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>
      </Modal>

      {/* Profile Modal */}
      <Modal
        visible={showProfileModal}
        animationType="slide"
        onRequestClose={() => setShowProfileModal(false)}>
        <ProfileScreen onBack={() => setShowProfileModal(false)} />
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profileCardOuter: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardFrame: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 2,
  },
  cardBackground: {
    borderRadius: 10,
    padding: 10,
  },
  profileCardContent: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'stretch',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 8,
  },
  badgeTierRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  characterAvatarSmall: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tierContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeSlotSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF9E6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  tierSlotSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FCE4EC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F8BBD0',
  },
  levelText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  tierText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  titleSlotSmall: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#F3E5F5',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1BEE7',
    minWidth: 50,
  },
  titleTextSmall: {
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
  profileName: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  optionContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  optionValue: {
    fontSize: 14,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#007AFF',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  divider: {
    height: 1,
    marginLeft: 52,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  modalOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalOptionLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalDivider: {
    height: 1,
    marginLeft: 56,
  },
});

export default SettingsScreen;
