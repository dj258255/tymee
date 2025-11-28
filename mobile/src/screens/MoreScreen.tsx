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
import ProfileCard from '../components/ProfileCard';
import PencilIcon from '../components/PencilIcon';
import BallpenIcon from '../components/BallpenIcon';
import BuyBallpensScreen from './BuyBallpensScreen';
import PaymentHistoryScreen from './PaymentHistoryScreen';

const packageJson = require('../../package.json');

const MoreScreen: React.FC = () => {
  const {t} = useTranslation();
  const [systemColorScheme, setSystemColorScheme] = useState<'light' | 'dark'>('light');
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showBuyBallpensModal, setShowBuyBallpensModal] = useState(false);
  const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false);

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
          <ProfileCard
            isDark={isDark}
            size="small"
            onPress={() => setShowProfileModal(true)}
          />
        </View>

        {/* 결제 섹션 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: isDark ? '#FFFFFF' : '#000000'}]}>
            {t('settings.payment')}
          </Text>
          <View
            style={[
              styles.optionContainer,
              {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'},
            ]}>
            <View style={styles.paymentItem}>
              <View style={styles.optionLeft}>
                <PencilIcon size={24} />
                <Text
                  style={[
                    styles.optionLabel,
                    {color: isDark ? '#FFFFFF' : '#000000'},
                  ]}>
                  {t('payment.myPencils')}
                </Text>
              </View>
              <View style={styles.pencilAmountContainer}>
                <Text style={[styles.pencilAmount, {color: isDark ? '#FFD700' : '#F59E0B'}]}>
                  1,250
                </Text>
                <PencilIcon size={16} />
              </View>
            </View>
            <View
              style={[
                styles.divider,
                {backgroundColor: isDark ? '#2A2A2A' : '#E0E0E0'},
              ]}
            />
            <View style={styles.paymentItem}>
              <View style={styles.optionLeft}>
                <BallpenIcon size={24} />
                <Text
                  style={[
                    styles.optionLabel,
                    {color: isDark ? '#FFFFFF' : '#000000'},
                  ]}>
                  {t('payment.myBallpens')}
                </Text>
              </View>
              <View style={styles.pencilAmountContainer}>
                <Text style={[styles.pencilAmount, {color: isDark ? '#7EB6FF' : '#4A9AFF'}]}>
                  350
                </Text>
                <BallpenIcon size={16} />
              </View>
            </View>
            <View
              style={[
                styles.divider,
                {backgroundColor: isDark ? '#2A2A2A' : '#E0E0E0'},
              ]}
            />
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => setShowBuyBallpensModal(true)}>
              <View style={styles.optionLeft}>
                <Icon name="cart-outline" size={24} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
                <Text
                  style={[
                    styles.optionLabel,
                    {color: isDark ? '#FFFFFF' : '#000000'},
                  ]}>
                  {t('payment.buyBallpens')}
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
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => setShowPaymentHistoryModal(true)}>
              <View style={styles.optionLeft}>
                <Icon name="receipt-outline" size={24} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
                <Text
                  style={[
                    styles.optionLabel,
                    {color: isDark ? '#FFFFFF' : '#000000'},
                  ]}>
                  {t('payment.history')}
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

        {/* 설정 섹션 */}
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
                {packageJson.version}
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

      {/* Buy Ballpens Modal */}
      <Modal
        visible={showBuyBallpensModal}
        animationType="slide"
        onRequestClose={() => setShowBuyBallpensModal(false)}>
        <BuyBallpensScreen onBack={() => setShowBuyBallpensModal(false)} />
      </Modal>

      {/* Payment History Modal */}
      <Modal
        visible={showPaymentHistoryModal}
        animationType="slide"
        onRequestClose={() => setShowPaymentHistoryModal(false)}>
        <PaymentHistoryScreen onBack={() => setShowPaymentHistoryModal(false)} />
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
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  pencilAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pencilAmount: {
    fontSize: 16,
    fontWeight: '700',
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

export default MoreScreen;
