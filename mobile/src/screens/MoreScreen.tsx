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
import {useNavigation} from '@react-navigation/native';
import {useThemeStore, ThemeMode} from '../store/themeStore';
import {useStudyRecordStore} from '../store/studyRecordStore';
import {usePomodoroStore} from '../store/pomodoroStore';
import {StudyRecordThemeType, studyRecordThemes} from '../themes/studyRecordThemes';
import {PomodoroThemeType, timerColorPalette, getTimerColor} from '../themes/pomodoroThemes';
import {safeGetColorScheme, safeAddAppearanceListener} from '../utils/appearance';
import ProfileScreen from './ProfileScreen';
import ProfileCard from '../components/ProfileCard';
import PencilIcon from '../components/PencilIcon';
import BallpenIcon from '../components/BallpenIcon';
import BuyBallpensScreen from './BuyBallpensScreen';
import FriendsListScreen from './FriendsListScreen';
import {sp, hp, fp, iconSize} from '../utils/responsive';
import Svg, {Circle, Path} from 'react-native-svg';
import {useLanguageStore, Language} from '../store/languageStore';

const packageJson = require('../../package.json');

const MoreScreen: React.FC = () => {
  const {t} = useTranslation();
  const [systemColorScheme, setSystemColorScheme] = useState<'light' | 'dark'>('light');
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showBuyBallpensModal, setShowBuyBallpensModal] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const navigation = useNavigation<any>();
  const [showStudyRecordThemeModal, setShowStudyRecordThemeModal] = useState(false);
  const [showTimerThemeModal, setShowTimerThemeModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  // 미리보기용 state
  const [_previewTimerTheme, _setPreviewTimerTheme] = useState<PomodoroThemeType | null>(null);
  const [previewStudyTheme, setPreviewStudyTheme] = useState<StudyRecordThemeType | null>(null);

  // 개별 색상 선택용 state
  const [selectedColorType, setSelectedColorType] = useState<'focus' | 'break'>('focus');
  const [previewFocusColorId, setPreviewFocusColorId] = useState<string | null>(null);
  const [previewBreakColorId, setPreviewBreakColorId] = useState<string | null>(null);

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
  const {selectedTheme: studyRecordTheme, setTheme: setStudyRecordTheme} = useStudyRecordStore();
  const {settings: pomodoroSettings, updateSettings: updatePomodoroSettings} = usePomodoroStore();
  const {language, setLanguage} = useLanguageStore();

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

  const languageOptions: {lang: Language; label: string; flag: string}[] = [
    {lang: 'ko', label: '한국어', flag: '🇰🇷'},
    {lang: 'en', label: 'English', flag: '🇺🇸'},
    {lang: 'ja', label: '日本語', flag: '🇯🇵'},
  ];

  const getLanguageLabel = () => {
    const option = languageOptions.find(opt => opt.lang === language);
    return option?.label || '한국어';
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        {backgroundColor: isDark ? '#121212' : '#FAFAFA'},
      ]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, {paddingBottom: hp(100)}]}
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
                <PencilIcon size={iconSize(24)} />
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
                <PencilIcon size={iconSize(16)} />
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
                <BallpenIcon size={iconSize(24)} />
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
                <BallpenIcon size={iconSize(16)} />
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
                <Icon name="cart-outline" size={iconSize(24)} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
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
                size={iconSize(20)}
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
              onPress={() => navigation.navigate('PaymentHistory')}>
              <View style={styles.optionLeft}>
                <Icon name="receipt-outline" size={iconSize(24)} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
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
                size={iconSize(20)}
                color={isDark ? '#666666' : '#AAAAAA'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* 상점 섹션 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: isDark ? '#FFFFFF' : '#000000'}]}>
            상점
          </Text>
          <View
            style={[
              styles.optionContainer,
              {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'},
            ]}>
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => navigation.navigate('Store')}>
              <View style={styles.optionLeft}>
                <Icon name="storefront-outline" size={iconSize(24)} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
                <Text
                  style={[
                    styles.optionLabel,
                    {color: isDark ? '#FFFFFF' : '#000000'},
                  ]}>
                  아이템 상점
                </Text>
              </View>
              <Icon
                name="chevron-forward"
                size={iconSize(20)}
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
                <Icon name="color-palette-outline" size={iconSize(24)} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
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
                  size={iconSize(20)}
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
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => setShowTimerThemeModal(true)}>
              <View style={styles.optionLeft}>
                <Icon name="color-palette-outline" size={iconSize(24)} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
                <Text
                  style={[
                    styles.optionLabel,
                    {color: isDark ? '#FFFFFF' : '#000000'},
                  ]}>
                  타이머 색상
                </Text>
              </View>
              <View style={styles.optionRight}>
                <View style={styles.timerColorPreviewDots}>
                  <View style={[styles.timerColorDot, {backgroundColor: getTimerColor(pomodoroSettings.focusColorId || 'red').color}]} />
                  <View style={[styles.timerColorDot, {backgroundColor: getTimerColor(pomodoroSettings.breakColorId || 'blue').color}]} />
                </View>
                <Icon
                  name="chevron-forward"
                  size={iconSize(20)}
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
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => setShowStudyRecordThemeModal(true)}>
              <View style={styles.optionLeft}>
                <Icon name="book-outline" size={iconSize(24)} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
                <Text
                  style={[
                    styles.optionLabel,
                    {color: isDark ? '#FFFFFF' : '#000000'},
                  ]}>
                  공부 기록 테마
                </Text>
              </View>
              <View style={styles.optionRight}>
                <Text style={[styles.optionValue, {color: isDark ? '#AAAAAA' : '#666666'}]}>
                  {studyRecordThemes[studyRecordTheme]?.name || '공책'}
                </Text>
                <Icon
                  name="chevron-forward"
                  size={iconSize(20)}
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
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => setShowLanguageModal(true)}>
              <View style={styles.optionLeft}>
                <Icon name="language-outline" size={iconSize(24)} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
                <Text
                  style={[
                    styles.optionLabel,
                    {color: isDark ? '#FFFFFF' : '#000000'},
                  ]}>
                  {t('settings.language')}
                </Text>
              </View>
              <View style={styles.optionRight}>
                <Text style={[styles.optionValue, {color: isDark ? '#AAAAAA' : '#666666'}]}>
                  {getLanguageLabel()}
                </Text>
                <Icon
                  name="chevron-forward"
                  size={iconSize(20)}
                  color={isDark ? '#666666' : '#AAAAAA'}
                />
              </View>
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
                <Icon name="megaphone-outline" size={iconSize(24)} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
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
                size={iconSize(20)}
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
                <Icon name="help-circle-outline" size={iconSize(24)} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
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
                size={iconSize(20)}
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

      {/* Theme Modal - 중앙 모달 스타일 */}
      <Modal
        visible={showThemeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowThemeModal(false)}>
        <View style={styles.centerModalOverlay}>
          <TouchableOpacity
            style={styles.centerModalBackdrop}
            activeOpacity={1}
            onPress={() => setShowThemeModal(false)}
          />
          <View style={[styles.centerModalContent, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
            <View style={[styles.timerColorModalHeader, {borderBottomColor: isDark ? '#2A2A2A' : '#F0F0F0'}]}>
              <Text style={[styles.centerModalTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                테마 선택
              </Text>
              <TouchableOpacity onPress={() => setShowThemeModal(false)} style={styles.centerModalCloseBtn}>
                <Icon name="close" size={iconSize(22)} color={isDark ? '#AAAAAA' : '#666666'} />
              </TouchableOpacity>
            </View>
            <View style={styles.centerModalList}>
              {themeOptions.map((option) => {
                const isSelected = themeMode === option.mode;
                return (
                  <TouchableOpacity
                    key={option.mode}
                    style={[
                      styles.centerModalItem,
                      {
                        backgroundColor: isSelected
                          ? (isDark ? '#2A3A4A' : '#E8F4FF')
                          : (isDark ? '#2A2A2A' : '#F5F5F5'),
                        borderColor: isSelected ? '#007AFF' : 'transparent',
                      },
                    ]}
                    onPress={() => {
                      setThemeMode(option.mode);
                      setShowThemeModal(false);
                    }}>
                    <Icon name={option.icon} size={iconSize(22)} color={isSelected ? '#007AFF' : (isDark ? '#AAAAAA' : '#666666')} />
                    <Text
                      style={[
                        styles.centerModalItemText,
                        {color: isSelected ? '#007AFF' : (isDark ? '#FFFFFF' : '#1A1A1A')},
                      ]}>
                      {option.label}
                    </Text>
                    {isSelected && (
                      <Icon name="checkmark-circle" size={iconSize(20)} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
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

      {/* Friends List Modal */}
      <Modal
        visible={showFriendsModal}
        animationType="slide"
        onRequestClose={() => setShowFriendsModal(false)}>
        <FriendsListScreen onBack={() => setShowFriendsModal(false)} />
      </Modal>


      {/* Timer Color Modal - 집중/휴식 별도 색상 선택 */}
      <Modal
        visible={showTimerThemeModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowTimerThemeModal(false);
          setPreviewFocusColorId(null);
          setPreviewBreakColorId(null);
          setSelectedColorType('focus');
        }}>
        <View style={styles.centerModalOverlay}>
          <TouchableOpacity
            style={styles.centerModalBackdrop}
            activeOpacity={1}
            onPress={() => {
              setShowTimerThemeModal(false);
              setPreviewFocusColorId(null);
              setPreviewBreakColorId(null);
              setSelectedColorType('focus');
            }}
          />
          <View style={[styles.timerColorModalContent, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
            <View style={[styles.timerColorModalHeader, {borderBottomColor: isDark ? '#2A2A2A' : '#F0F0F0'}]}>
              <Text style={[styles.centerModalTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                타이머 색상
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowTimerThemeModal(false);
                  setPreviewFocusColorId(null);
                  setPreviewBreakColorId(null);
                  setSelectedColorType('focus');
                }}
                style={styles.centerModalCloseBtn}>
                <Icon name="close" size={iconSize(22)} color={isDark ? '#AAAAAA' : '#666666'} />
              </TouchableOpacity>
            </View>

            {/* 상단: 미리보기 + 집중/휴식 탭 */}
            <View style={styles.colorPreviewSection}>
              <View style={styles.colorPreviewTimers}>
                {/* 집중 타이머 미리보기 */}
                <TouchableOpacity
                  style={[
                    styles.colorPreviewTimerItem,
                    selectedColorType === 'focus' && styles.colorPreviewTimerItemSelected,
                    selectedColorType === 'focus' && {borderColor: '#007AFF'},
                  ]}
                  onPress={() => setSelectedColorType('focus')}>
                  <Svg width={sp(70)} height={sp(70)}>
                    <Circle cx={sp(35)} cy={sp(35)} r={sp(30)} fill={isDark ? '#333333' : '#F0F0F0'} />
                    <Path
                      d={`M ${sp(35)},${sp(35)} L ${sp(35)},${sp(5)} A ${sp(30)},${sp(30)} 0 1,1 ${sp(35) - sp(30) * Math.sin(Math.PI * 0.7)},${sp(35) + sp(30) * Math.cos(Math.PI * 0.7)} Z`}
                      fill={getTimerColor(previewFocusColorId || pomodoroSettings.focusColorId || 'red').color}
                    />
                    <Circle cx={sp(35)} cy={sp(35)} r={sp(18)} fill={isDark ? '#1E1E1E' : '#FFFFFF'} />
                  </Svg>
                  <Text style={[
                    styles.colorPreviewLabel,
                    {color: selectedColorType === 'focus' ? '#007AFF' : (isDark ? '#AAAAAA' : '#666666')},
                  ]}>
                    집중
                  </Text>
                  <Text style={[
                    styles.colorPreviewColorName,
                    {color: getTimerColor(previewFocusColorId || pomodoroSettings.focusColorId || 'red').color},
                  ]}>
                    {getTimerColor(previewFocusColorId || pomodoroSettings.focusColorId || 'red').name}
                  </Text>
                </TouchableOpacity>

                {/* 휴식 타이머 미리보기 */}
                <TouchableOpacity
                  style={[
                    styles.colorPreviewTimerItem,
                    selectedColorType === 'break' && styles.colorPreviewTimerItemSelected,
                    selectedColorType === 'break' && {borderColor: '#007AFF'},
                  ]}
                  onPress={() => setSelectedColorType('break')}>
                  <Svg width={sp(70)} height={sp(70)}>
                    <Circle cx={sp(35)} cy={sp(35)} r={sp(30)} fill={isDark ? '#333333' : '#F0F0F0'} />
                    <Path
                      d={`M ${sp(35)},${sp(35)} L ${sp(35)},${sp(5)} A ${sp(30)},${sp(30)} 0 1,1 ${sp(35) - sp(30) * Math.sin(Math.PI * 0.7)},${sp(35) + sp(30) * Math.cos(Math.PI * 0.7)} Z`}
                      fill={getTimerColor(previewBreakColorId || pomodoroSettings.breakColorId || 'blue').color}
                    />
                    <Circle cx={sp(35)} cy={sp(35)} r={sp(18)} fill={isDark ? '#1E1E1E' : '#FFFFFF'} />
                  </Svg>
                  <Text style={[
                    styles.colorPreviewLabel,
                    {color: selectedColorType === 'break' ? '#007AFF' : (isDark ? '#AAAAAA' : '#666666')},
                  ]}>
                    휴식
                  </Text>
                  <Text style={[
                    styles.colorPreviewColorName,
                    {color: getTimerColor(previewBreakColorId || pomodoroSettings.breakColorId || 'blue').color},
                  ]}>
                    {getTimerColor(previewBreakColorId || pomodoroSettings.breakColorId || 'blue').name}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.colorSelectHint, {color: isDark ? '#666666' : '#999999'}]}>
                {selectedColorType === 'focus' ? '집중' : '휴식'} 타이머 색상을 선택하세요
              </Text>
            </View>

            {/* 색상 팔레트 그리드 */}
            <ScrollView style={styles.colorPaletteScrollArea} showsVerticalScrollIndicator={false}>
              <View style={styles.colorPaletteGrid}>
                {timerColorPalette.map((colorOption) => {
                  const currentColorId = selectedColorType === 'focus'
                    ? (previewFocusColorId || pomodoroSettings.focusColorId || 'red')
                    : (previewBreakColorId || pomodoroSettings.breakColorId || 'blue');
                  const isSelected = currentColorId === colorOption.id;

                  return (
                    <TouchableOpacity
                      key={colorOption.id}
                      style={[
                        styles.colorPaletteItem,
                        {
                          backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
                          borderColor: isSelected ? '#007AFF' : 'transparent',
                        },
                      ]}
                      onPress={() => {
                        if (selectedColorType === 'focus') {
                          setPreviewFocusColorId(colorOption.id);
                        } else {
                          setPreviewBreakColorId(colorOption.id);
                        }
                      }}>
                      <View style={[styles.colorPaletteDot, {backgroundColor: colorOption.color}]}>
                        {isSelected && (
                          <Icon name="checkmark" size={iconSize(14)} color="#FFFFFF" />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.colorPaletteName,
                          {color: isSelected ? '#007AFF' : (isDark ? '#FFFFFF' : '#1A1A1A')},
                        ]}
                        numberOfLines={1}>
                        {colorOption.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* 적용 버튼 */}
            <TouchableOpacity
              style={[
                styles.themeApplyButton,
                {backgroundColor: (previewFocusColorId || previewBreakColorId) ? '#007AFF' : (isDark ? '#333333' : '#E0E0E0')},
              ]}
              disabled={!(previewFocusColorId || previewBreakColorId)}
              onPress={() => {
                const updates: any = {};
                if (previewFocusColorId) {
                  updates.focusColorId = previewFocusColorId;
                }
                if (previewBreakColorId) {
                  updates.breakColorId = previewBreakColorId;
                }
                if (Object.keys(updates).length > 0) {
                  updatePomodoroSettings(updates);
                }
                setShowTimerThemeModal(false);
                setPreviewFocusColorId(null);
                setPreviewBreakColorId(null);
                setSelectedColorType('focus');
              }}>
              <Text style={[
                styles.themeApplyButtonText,
                {color: (previewFocusColorId || previewBreakColorId) ? '#FFFFFF' : (isDark ? '#666666' : '#999999')},
              ]}>
                적용하기
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Study Record Theme Modal - 4열 그리드 + 미리보기 */}
      <Modal
        visible={showStudyRecordThemeModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowStudyRecordThemeModal(false);
          setPreviewStudyTheme(null);
        }}>
        <View style={styles.centerModalOverlay}>
          <TouchableOpacity
            style={styles.centerModalBackdrop}
            activeOpacity={1}
            onPress={() => {
              setShowStudyRecordThemeModal(false);
              setPreviewStudyTheme(null);
            }}
          />
          <View style={[styles.themeGridModalContent, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
            <View style={[styles.timerColorModalHeader, {borderBottomColor: isDark ? '#2A2A2A' : '#F0F0F0'}]}>
              <Text style={[styles.centerModalTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                공부 기록 테마
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowStudyRecordThemeModal(false);
                  setPreviewStudyTheme(null);
                }}
                style={styles.centerModalCloseBtn}>
                <Icon name="close" size={iconSize(22)} color={isDark ? '#AAAAAA' : '#666666'} />
              </TouchableOpacity>
            </View>

            {/* 상단: 4열 그리드 테마 목록 */}
            <ScrollView style={styles.themeGridScrollArea} showsVerticalScrollIndicator={false}>
              <View style={styles.themeGrid}>
                {Object.entries(studyRecordThemes).map(([key, themeOption]) => {
                  const isSelected = studyRecordTheme === key;
                  const isPreviewing = previewStudyTheme === key;
                  const previewBg = isDark ? themeOption.background.dark : themeOption.background.light;
                  const previewCardBg = isDark ? themeOption.card.dark : themeOption.card.light;

                  return (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.themeGridItem,
                        {
                          backgroundColor: isPreviewing
                            ? (isDark ? '#2A3A4A' : '#E8F4FF')
                            : (isDark ? '#2A2A2A' : '#F5F5F5'),
                          borderColor: isPreviewing ? '#007AFF' : (isSelected ? '#4CAF50' : 'transparent'),
                        },
                      ]}
                      onPress={() => setPreviewStudyTheme(key as StudyRecordThemeType)}>
                      {/* 테마 미니 미리보기 */}
                      <View style={[styles.studyThemeGridPreview, {backgroundColor: previewBg}]}>
                        <View style={[styles.studyThemeGridCard, {backgroundColor: previewCardBg}]}>
                          {themeOption.card.tapeDecoration && (
                            <View style={styles.studyThemeGridTape} />
                          )}
                        </View>
                      </View>
                      <Text
                        style={[
                          styles.themeGridItemName,
                          {color: isPreviewing ? '#007AFF' : (isDark ? '#FFFFFF' : '#1A1A1A')},
                        ]}
                        numberOfLines={1}>
                        {themeOption.name}
                      </Text>
                      {isSelected && (
                        <View style={styles.themeGridSelectedBadge}>
                          <Icon name="checkmark" size={iconSize(10)} color="#FFFFFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* 하단: 미리보기 영역 */}
            <View style={[styles.themePreviewSection, {borderTopColor: isDark ? '#333333' : '#E0E0E0'}]}>
              {(() => {
                const previewKey = previewStudyTheme || studyRecordTheme;
                const previewThemeData = studyRecordThemes[previewKey];

                if (!previewThemeData) {return null;}

                const previewBg = isDark ? previewThemeData.background.dark : previewThemeData.background.light;
                const previewCardBg = isDark ? previewThemeData.card.dark : previewThemeData.card.light;
                const textColor = isDark ? '#E0D5C8' : '#5C4A3D';

                return (
                  <>
                    <Text style={[styles.themePreviewTitle, {color: isDark ? '#AAAAAA' : '#666666'}]}>
                      미리보기: {previewThemeData.name}
                    </Text>
                    <View style={[styles.studyPreviewContainer, {backgroundColor: previewBg}]}>
                      {/* 배경 패턴 */}
                      {previewThemeData.background.pattern === 'grid' && (
                        <View style={styles.studyPreviewGridPattern}>
                          {[...Array(6)].map((_, i) => (
                            <View
                              key={`line-${i}`}
                              style={[
                                styles.studyPreviewGridLine,
                                {
                                  top: i * hp(20),
                                  backgroundColor: isDark
                                    ? previewThemeData.background.patternColor?.dark
                                    : previewThemeData.background.patternColor?.light,
                                },
                              ]}
                            />
                          ))}
                        </View>
                      )}
                      {/* 미리보기 카드 */}
                      <View
                        style={[
                          styles.studyPreviewCard,
                          {
                            backgroundColor: previewCardBg,
                            borderRadius: previewThemeData.card.borderRadius,
                            borderWidth: previewThemeData.card.borderWidth,
                            borderColor: isDark
                              ? previewThemeData.card.borderColor.dark
                              : previewThemeData.card.borderColor.light,
                          },
                        ]}>
                        {/* 마스킹 테이프 */}
                        {previewThemeData.card.tapeDecoration && (
                          <View style={styles.studyPreviewTapeContainer}>
                            <View style={[styles.studyPreviewTape, {transform: [{rotate: '-3deg'}]}]} />
                            <View style={[styles.studyPreviewTape, {right: sp(16), transform: [{rotate: '2deg'}]}]} />
                          </View>
                        )}
                        {/* 미리보기 컨텐츠 */}
                        <Text style={[styles.studyPreviewCardTitle, {color: textColor}]}>오늘의 학습</Text>
                        <View style={styles.studyPreviewStats}>
                          <View style={styles.studyPreviewStatItem}>
                            <Text style={[styles.studyPreviewStatValue, {color: textColor}]}>2h 30m</Text>
                            <Text style={[styles.studyPreviewStatLabel, {color: isDark ? '#8B7355' : '#A89078'}]}>총 학습</Text>
                          </View>
                          <View style={styles.studyPreviewStatItem}>
                            <Text style={[styles.studyPreviewStatValue, {color: textColor}]}>5</Text>
                            <Text style={[styles.studyPreviewStatLabel, {color: isDark ? '#8B7355' : '#A89078'}]}>세션</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </>
                );
              })()}
            </View>

            {/* 적용 버튼 */}
            <TouchableOpacity
              style={[
                styles.themeApplyButton,
                {backgroundColor: previewStudyTheme ? '#007AFF' : (isDark ? '#333333' : '#E0E0E0')},
              ]}
              disabled={!previewStudyTheme}
              onPress={() => {
                if (previewStudyTheme) {
                  setStudyRecordTheme(previewStudyTheme);
                  setShowStudyRecordThemeModal(false);
                  setPreviewStudyTheme(null);
                }
              }}>
              <Text style={[styles.themeApplyButtonText, {color: previewStudyTheme ? '#FFFFFF' : (isDark ? '#666666' : '#999999')}]}>
                적용하기
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Language Modal - 중앙 모달 스타일 */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}>
        <View style={styles.centerModalOverlay}>
          <TouchableOpacity
            style={styles.centerModalBackdrop}
            activeOpacity={1}
            onPress={() => setShowLanguageModal(false)}
          />
          <View style={[styles.centerModalContent, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
            <View style={[styles.timerColorModalHeader, {borderBottomColor: isDark ? '#2A2A2A' : '#F0F0F0'}]}>
              <Text style={[styles.centerModalTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                {t('settings.language')}
              </Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)} style={styles.centerModalCloseBtn}>
                <Icon name="close" size={iconSize(22)} color={isDark ? '#AAAAAA' : '#666666'} />
              </TouchableOpacity>
            </View>
            <View style={styles.centerModalList}>
              {languageOptions.map((option) => {
                const isSelected = language === option.lang;
                return (
                  <TouchableOpacity
                    key={option.lang}
                    style={[
                      styles.centerModalItem,
                      {
                        backgroundColor: isSelected
                          ? (isDark ? '#2A3A4A' : '#E8F4FF')
                          : (isDark ? '#2A2A2A' : '#F5F5F5'),
                        borderColor: isSelected ? '#007AFF' : 'transparent',
                      },
                    ]}
                    onPress={() => {
                      setLanguage(option.lang);
                      setShowLanguageModal(false);
                    }}>
                    <Text style={styles.languageFlag}>{option.flag}</Text>
                    <Text
                      style={[
                        styles.centerModalItemText,
                        {color: isSelected ? '#007AFF' : (isDark ? '#FFFFFF' : '#1A1A1A')},
                      ]}>
                      {option.label}
                    </Text>
                    {isSelected && (
                      <Icon name="checkmark-circle" size={iconSize(20)} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                );
              })}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: hp(20),
    paddingHorizontal: sp(16),
    paddingBottom: hp(40),
  },
  section: {
    marginBottom: hp(32),
  },
  sectionTitle: {
    fontSize: fp(14),
    fontWeight: '600',
    marginBottom: hp(12),
    marginLeft: sp(4),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionContainer: {
    borderRadius: sp(12),
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(16),
    paddingHorizontal: sp(16),
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: sp(12),
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
  },
  optionLabel: {
    fontSize: fp(16),
    fontWeight: '500',
  },
  optionValue: {
    fontSize: fp(14),
  },
  radio: {
    width: sp(24),
    height: sp(24),
    borderRadius: sp(12),
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#007AFF',
  },
  radioInner: {
    width: sp(12),
    height: sp(12),
    borderRadius: sp(6),
    backgroundColor: '#007AFF',
  },
  divider: {
    height: 1,
    marginLeft: sp(52),
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(16),
    paddingHorizontal: sp(16),
  },
  infoLabel: {
    fontSize: fp(16),
    fontWeight: '500',
  },
  infoValue: {
    fontSize: fp(16),
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(16),
    paddingHorizontal: sp(16),
  },
  pencilAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(6),
  },
  pencilAmount: {
    fontSize: fp(16),
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: sp(20),
    borderTopRightRadius: sp(20),
    paddingBottom: hp(40),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: sp(20),
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  modalTitle: {
    fontSize: fp(18),
    fontWeight: '700',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(16),
    paddingHorizontal: sp(20),
  },
  modalOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(12),
  },
  modalOptionLabel: {
    fontSize: fp(16),
    fontWeight: '500',
  },
  modalDivider: {
    height: 1,
    marginLeft: sp(56),
  },
  // Timer Theme Modal
  timerThemeModalContent: {
    borderTopLeftRadius: sp(24),
    borderTopRightRadius: sp(24),
    paddingHorizontal: sp(20),
    paddingTop: hp(20),
    paddingBottom: hp(40),
    maxHeight: '70%',
  },
  timerThemeSubtitle: {
    fontSize: fp(14),
    marginBottom: hp(16),
  },
  timerThemeList: {
    marginBottom: hp(12),
  },
  timerThemeOption: {
    flexDirection: 'row',
    padding: sp(12),
    borderRadius: sp(16),
    marginBottom: hp(12),
    alignItems: 'center',
  },
  timerThemePreview: {
    flexDirection: 'row',
    gap: sp(12),
  },
  timerRingContainer: {
    alignItems: 'center',
    gap: sp(4),
  },
  timerRingLabel: {
    fontSize: fp(10),
    fontWeight: '600',
  },
  timerThemeInfo: {
    flex: 1,
    marginLeft: sp(16),
    justifyContent: 'center',
  },
  timerThemeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
  },
  timerThemeName: {
    fontSize: fp(16),
    fontWeight: '700',
  },
  // Study Record Theme Modal
  studyThemeModalContent: {
    borderTopLeftRadius: sp(24),
    borderTopRightRadius: sp(24),
    paddingHorizontal: sp(20),
    paddingTop: hp(20),
    paddingBottom: hp(40),
    maxHeight: '70%',
  },
  studyThemeSubtitle: {
    fontSize: fp(14),
    marginBottom: hp(16),
  },
  studyThemeList: {
    marginBottom: hp(12),
  },
  studyThemeOption: {
    flexDirection: 'row',
    padding: sp(12),
    borderRadius: sp(16),
    marginBottom: hp(12),
  },
  studyThemePreview: {
    width: sp(60),
    height: hp(48),
    borderRadius: sp(8),
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  previewGridLine: {
    position: 'absolute',
  },
  previewCard: {
    width: sp(36),
    height: hp(24),
    position: 'relative',
  },
  previewTape: {
    position: 'absolute',
    top: hp(-4),
    left: sp(8),
    width: sp(20),
    height: hp(8),
    transform: [{rotate: '-5deg'}],
    opacity: 0.7,
  },
  studyThemeInfo: {
    flex: 1,
    marginLeft: sp(16),
    justifyContent: 'center',
  },
  studyThemeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
    marginBottom: hp(4),
  },
  studyThemeName: {
    fontSize: fp(16),
    fontWeight: '700',
  },
  selectedBadge: {
    width: sp(20),
    height: sp(20),
    borderRadius: sp(10),
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studyThemeDescription: {
    fontSize: fp(12),
  },
  studyThemeHint: {
    fontSize: fp(12),
    textAlign: 'center',
  },
  // Notification Modal
  notificationModalContent: {
    borderTopLeftRadius: sp(24),
    borderTopRightRadius: sp(24),
    paddingTop: hp(20),
    paddingBottom: hp(40),
    maxHeight: '80%',
  },
  notificationList: {
    paddingHorizontal: sp(20),
  },
  notificationSectionTitle: {
    fontSize: fp(12),
    fontWeight: '600',
    marginTop: hp(16),
    marginBottom: hp(8),
    marginLeft: sp(4),
    textTransform: 'uppercase',
  },
  notificationGroup: {
    borderRadius: sp(12),
    overflow: 'hidden',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(14),
    paddingHorizontal: sp(16),
  },
  notificationItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: sp(12),
  },
  notificationItemText: {
    flex: 1,
  },
  notificationItemTitle: {
    fontSize: fp(15),
    fontWeight: '600',
    marginBottom: hp(2),
  },
  notificationItemDesc: {
    fontSize: fp(12),
  },
  notificationDivider: {
    height: 1,
    marginLeft: sp(48),
  },
  // 중앙 모달 스타일
  centerModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  centerModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  centerModalContent: {
    width: '85%',
    maxWidth: sp(340),
    borderRadius: sp(20),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: sp(8)},
    shadowOpacity: 0.15,
    shadowRadius: sp(24),
    elevation: 10,
  },
  centerModalContentLarge: {
    width: '85%',
    maxWidth: sp(340),
    maxHeight: '70%',
    borderRadius: sp(16),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: sp(4)},
    shadowOpacity: 0.25,
    shadowRadius: sp(16),
    elevation: 10,
  },
  centerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: sp(20),
    paddingVertical: hp(16),
  },
  centerModalTitle: {
    fontSize: fp(17),
    fontWeight: '600',
  },
  centerModalCloseBtn: {
    padding: sp(4),
  },
  centerModalList: {
    paddingVertical: hp(8),
  },
  centerModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(20),
    paddingVertical: hp(14),
    borderWidth: 2,
    marginHorizontal: sp(12),
    marginVertical: hp(4),
    borderRadius: sp(12),
    gap: sp(12),
  },
  centerModalItemText: {
    flex: 1,
    fontSize: fp(15),
    fontWeight: '500',
  },
  // 알림 설정 중앙 모달
  centerNotificationList: {
    paddingHorizontal: sp(16),
    paddingBottom: hp(16),
  },
  centerNotificationSectionTitle: {
    fontSize: fp(11),
    fontWeight: '600',
    marginTop: hp(12),
    marginBottom: hp(6),
    marginLeft: sp(4),
    textTransform: 'uppercase',
  },
  centerNotificationGroup: {
    borderRadius: sp(10),
    overflow: 'hidden',
  },
  centerNotificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(12),
    paddingHorizontal: sp(12),
  },
  centerNotificationItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: sp(10),
  },
  centerNotificationItemTitle: {
    fontSize: fp(14),
    fontWeight: '500',
  },
  centerNotificationDivider: {
    height: 1,
    marginLeft: sp(40),
  },
  // 테마 선택 중앙 모달
  centerThemeList: {
    paddingHorizontal: sp(12),
    paddingVertical: hp(8),
  },
  centerThemeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(16),
    paddingVertical: hp(12),
    borderWidth: 2,
    marginVertical: hp(4),
    borderRadius: sp(12),
    gap: sp(12),
  },
  centerTimerPreview: {
    flexDirection: 'row',
    gap: sp(6),
  },
  centerTimerRing: {
    alignItems: 'center',
  },
  centerThemeName: {
    flex: 1,
    fontSize: fp(15),
    fontWeight: '600',
  },
  // 공부 기록 테마
  centerStudyPreview: {
    width: sp(44),
    height: sp(36),
    borderRadius: sp(6),
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerPreviewGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  centerPreviewGridLine: {
    position: 'absolute',
    width: '100%',
    height: 1,
  },
  centerPreviewCard: {
    width: sp(28),
    height: sp(20),
    position: 'relative',
  },
  centerPreviewTape: {
    position: 'absolute',
    top: hp(-3),
    left: sp(6),
    width: sp(16),
    height: hp(6),
    transform: [{rotate: '-5deg'}],
    opacity: 0.7,
  },
  centerStudyThemeInfo: {
    flex: 1,
  },
  centerStudyThemeDesc: {
    fontSize: fp(11),
    marginTop: hp(2),
  },
  // 테마 그리드 모달 스타일
  themeGridModalContent: {
    width: '92%',
    maxWidth: sp(400),
    maxHeight: '80%',
    borderRadius: sp(20),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: sp(8)},
    shadowOpacity: 0.15,
    shadowRadius: sp(24),
    elevation: 10,
  },
  themeGridScrollArea: {
    paddingHorizontal: sp(12),
    paddingTop: hp(12),
    paddingBottom: hp(4),
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: sp(8),
  },
  themeGridItem: {
    width: (sp(380) - sp(24) - sp(24)) / 4,
    aspectRatio: 0.9,
    borderRadius: sp(10),
    borderWidth: 2,
    paddingHorizontal: sp(4),
    paddingTop: sp(6),
    paddingBottom: sp(4),
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
  },
  themeGridColorPreview: {
    flexDirection: 'row',
    gap: sp(4),
    marginBottom: hp(2),
  },
  themeGridColorDot: {
    width: sp(16),
    height: sp(16),
    borderRadius: sp(8),
  },
  themeGridItemName: {
    fontSize: fp(10),
    fontWeight: '600',
    textAlign: 'center',
  },
  themeGridSelectedBadge: {
    position: 'absolute',
    top: sp(4),
    right: sp(4),
    width: sp(16),
    height: sp(16),
    borderRadius: sp(8),
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  themePreviewSection: {
    borderTopWidth: 1,
    paddingHorizontal: sp(16),
    paddingVertical: hp(12),
  },
  themePreviewTitle: {
    fontSize: fp(12),
    fontWeight: '600',
    marginBottom: hp(8),
  },
  timerPreviewContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: sp(32),
  },
  timerPreviewItem: {
    alignItems: 'center',
    gap: hp(4),
  },
  timerPreviewLabel: {
    fontSize: fp(11),
    fontWeight: '500',
    marginTop: hp(4),
  },
  timerPreviewTime: {
    fontSize: fp(16),
    fontWeight: '700',
  },
  themeApplyButton: {
    marginHorizontal: sp(16),
    marginTop: hp(8),
    marginBottom: hp(16),
    paddingVertical: hp(12),
    borderRadius: sp(12),
    alignItems: 'center',
  },
  themeApplyButtonText: {
    fontSize: fp(15),
    fontWeight: '600',
  },
  // 타이머 색상 선택 모달 스타일
  timerColorModalContent: {
    width: '92%',
    maxWidth: sp(400),
    height: '65%',
    borderRadius: sp(20),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: sp(8)},
    shadowOpacity: 0.15,
    shadowRadius: sp(24),
    elevation: 10,
  },
  timerColorModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: sp(20),
    paddingVertical: hp(16),
    borderBottomWidth: 1,
  },
  colorPreviewSection: {
    paddingVertical: hp(16),
    paddingHorizontal: sp(16),
  },
  colorPreviewTimers: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: sp(24),
  },
  colorPreviewTimerItem: {
    alignItems: 'center',
    paddingHorizontal: sp(14),
    paddingVertical: hp(10),
    borderRadius: sp(12),
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorPreviewTimerItemSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  colorPreviewLabel: {
    fontSize: fp(13),
    fontWeight: '600',
    marginTop: hp(8),
  },
  colorPreviewColorName: {
    fontSize: fp(11),
    fontWeight: '500',
    marginTop: hp(2),
  },
  colorSelectHint: {
    fontSize: fp(12),
    textAlign: 'center',
    marginTop: hp(8),
  },
  colorPaletteScrollArea: {
    flex: 1,
    paddingHorizontal: sp(12),
    paddingTop: hp(8),
    paddingBottom: hp(8),
  },
  colorPaletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: sp(8),
  },
  colorPaletteItem: {
    width: (sp(380) - sp(24) - sp(32)) / 5,
    aspectRatio: 0.9,
    borderRadius: sp(10),
    borderWidth: 2,
    paddingVertical: sp(6),
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorPaletteDot: {
    width: sp(24),
    height: sp(24),
    borderRadius: sp(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorPaletteName: {
    fontSize: fp(9),
    fontWeight: '600',
    textAlign: 'center',
    marginTop: hp(3),
  },
  // 타이머 색상 미리보기 (설정 메뉴)
  timerColorPreviewDots: {
    flexDirection: 'row',
    gap: sp(4),
    marginRight: sp(8),
  },
  timerColorDot: {
    width: sp(16),
    height: sp(16),
    borderRadius: sp(8),
  },
  // 공부 기록 테마 그리드 미리보기
  studyThemeGridPreview: {
    width: sp(32),
    height: sp(24),
    borderRadius: sp(4),
    marginBottom: hp(4),
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  studyThemeGridCard: {
    width: sp(20),
    height: sp(14),
    borderRadius: sp(2),
    position: 'relative',
  },
  studyThemeGridTape: {
    position: 'absolute',
    top: hp(-2),
    left: sp(4),
    width: sp(12),
    height: hp(4),
    backgroundColor: '#FFE4B5',
    transform: [{rotate: '-5deg'}],
    opacity: 0.8,
  },
  // 공부 기록 테마 미리보기 섹션
  studyPreviewContainer: {
    borderRadius: sp(12),
    padding: sp(12),
    overflow: 'hidden',
    position: 'relative',
  },
  studyPreviewGridPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  studyPreviewGridLine: {
    position: 'absolute',
    width: '100%',
    height: 1,
  },
  studyPreviewCard: {
    padding: sp(12),
    position: 'relative',
  },
  studyPreviewTapeContainer: {
    position: 'absolute',
    top: hp(-6),
    left: 0,
    right: 0,
    height: hp(16),
    zIndex: 10,
  },
  studyPreviewTape: {
    position: 'absolute',
    left: sp(16),
    width: sp(40),
    height: hp(12),
    backgroundColor: '#FFE4B5',
    opacity: 0.7,
  },
  studyPreviewCardTitle: {
    fontSize: fp(14),
    fontWeight: '700',
    marginBottom: hp(8),
    marginTop: hp(4),
  },
  studyPreviewStats: {
    flexDirection: 'row',
    gap: sp(24),
  },
  studyPreviewStatItem: {
    alignItems: 'center',
  },
  studyPreviewStatValue: {
    fontSize: fp(16),
    fontWeight: '700',
  },
  studyPreviewStatLabel: {
    fontSize: fp(10),
    marginTop: hp(2),
  },
  languageFlag: {
    fontSize: fp(22),
  },
});

export default MoreScreen;
