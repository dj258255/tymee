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
import {safeGetColorScheme, safeAddAppearanceListener} from '../utils/appearance';
import ProfileCard, {CARD_FRAMES, CardFrameType, defaultUser, AVATAR_FRAME_DATA} from '../components/ProfileCard';
import {sp, hp, fp, iconSize} from '../utils/responsive';

// 뱃지 데이터 (칭호 + 획득 뱃지 통합)
type BadgeCategory = 'basic' | 'special';

// 티어 데이터 (MatchingScreen과 동일)
const TIER_DATA = [
  {name: '명예박사', icon: 'school', color: '#FFD700', minRP: 50000, desc: '별이 되어 길을 밝히는 단계입니다'},
  {name: '박사', icon: 'school', color: '#9C27B0', minRP: 30000, desc: '지혜의 꽃이 활짝 피는 단계입니다'},
  {name: '석사 III', icon: 'library', color: '#00BCD4', minRP: 20000, desc: '넓은 바다를 헤엄치는 단계입니다'},
  {name: '석사 II', icon: 'library', color: '#00ACC1', minRP: 15000, desc: '더 넓은 세상을 꿈꾸는 단계입니다'},
  {name: '석사 I', icon: 'library', color: '#0097A7', minRP: 10000, desc: '새로운 문이 열리는 단계입니다'},
  {name: '학사 III', icon: 'book', color: '#4CAF50', minRP: 6000, desc: '정상이 눈앞에 보이는 단계입니다'},
  {name: '학사 II', icon: 'book', color: '#43A047', minRP: 4000, desc: '묵묵히 걸어가는 단계입니다'},
  {name: '학사 I', icon: 'book', color: '#388E3C', minRP: 2000, desc: '첫 발을 내딛는 단계입니다'},
  {name: '고등학생', icon: 'pencil', color: '#FF9800', minRP: 1000, desc: '작은 꿈이 자라나는 단계입니다'},
  {name: '중학생', icon: 'pencil', color: '#78909C', minRP: 300, desc: '세상이 궁금해지는 단계입니다'},
  {name: '초등학생', icon: 'pencil', color: '#A1887F', minRP: 0, desc: '여정이 시작되는 단계입니다'},
];

// 레벨 데이터 (10레벨마다 아바타 테두리 변경) - AVATAR_FRAME_DATA와 연동 (11개)
const LEVEL_EXP_DATA = [
  {expPerLevel: 100, totalExp: '0 ~ 1,000'},      // 1~10
  {expPerLevel: 150, totalExp: '1,000 ~ 2,500'},  // 11~20
  {expPerLevel: 200, totalExp: '2,500 ~ 4,500'},  // 21~30
  {expPerLevel: 250, totalExp: '4,500 ~ 7,000'},  // 31~40
  {expPerLevel: 300, totalExp: '7,000 ~ 10,000'}, // 41~50
  {expPerLevel: 350, totalExp: '10,000 ~ 13,500'}, // 51~60
  {expPerLevel: 400, totalExp: '13,500 ~ 17,500'}, // 61~70
  {expPerLevel: 450, totalExp: '17,500 ~ 22,000'}, // 71~80
  {expPerLevel: 500, totalExp: '22,000 ~ 27,000'}, // 81~90
  {expPerLevel: 550, totalExp: '27,000 ~ 32,500'}, // 91~95 (박사)
  {expPerLevel: 600, totalExp: '32,500 ~ 35,500'}, // 96~100 (명예박사)
];

const BADGES: {id: string; name: string; description: string; icon: string; color: string; category: BadgeCategory}[] = [
  // 기본 업적
  {id: 'beginner', name: '초보 학습자', description: '공부를 시작한 새내기', icon: 'leaf', color: '#4CAF50', category: 'basic'},
  {id: 'steady', name: '꾸준한 학습자', description: '매일 공부하는 습관의 달인', icon: 'fitness', color: '#2196F3', category: 'basic'},
  {id: 'focused', name: '집중의 달인', description: '깊은 몰입을 경험한 자', icon: 'eye', color: '#9C27B0', category: 'basic'},
  {id: 'earlybird', name: '아침형 인간', description: '새벽 공부의 선구자', icon: 'sunny', color: '#FF9800', category: 'basic'},
  {id: 'nightowl', name: '올빼미족', description: '밤을 밝히는 학습자', icon: 'moon', color: '#3F51B5', category: 'basic'},
  {id: 'level10', name: '레벨 10 달성', description: '레벨 10에 도달한 학습자', icon: 'star', color: '#FFD700', category: 'basic'},
  {id: 'streak7', name: '7일 연속 학습', description: '일주일 연속 학습 달성', icon: 'flame', color: '#FF5722', category: 'basic'},
  {id: 'hours100', name: '100시간 학습', description: '총 100시간 학습 달성', icon: 'time', color: '#00BCD4', category: 'basic'},
  {id: 'streak30', name: '30일 연속 학습', description: '한달 연속 학습 달성', icon: 'calendar', color: '#E91E63', category: 'basic'},
  {id: 'hours500', name: '500시간 학습', description: '총 500시간 학습 달성', icon: 'hourglass', color: '#9C27B0', category: 'basic'},
  // 특수 업적
  {id: 'master', name: '학습 마스터', description: '모든 목표를 달성한 자', icon: 'trophy', color: '#FFD700', category: 'special'},
  {id: 'perfectweek', name: '완벽한 일주일', description: '7일간 목표 100% 달성', icon: 'ribbon', color: '#FF4081', category: 'special'},
  {id: 'marathon', name: '마라톤 학습자', description: '하루 8시간 이상 학습', icon: 'medal', color: '#FF6D00', category: 'special'},
  {id: 'earlystart', name: '새벽의 시작', description: '새벽 5시에 학습 시작', icon: 'sunny', color: '#FFC107', category: 'special'},
  {id: 'nightmaster', name: '밤의 지배자', description: '자정까지 학습 완료', icon: 'moon', color: '#673AB7', category: 'special'},
  {id: 'sociallearner', name: '소셜 학습자', description: '그룹 스터디 10회 참여', icon: 'people', color: '#00BCD4', category: 'special'},
];

const ProfileScreen: React.FC<{onBack: () => void}> = ({onBack}) => {
  const {t} = useTranslation();
  const [systemColorScheme, setSystemColorScheme] = useState<'light' | 'dark'>('light');
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [showProfilePhotoModal, setShowProfilePhotoModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showBlockUsersModal, setShowBlockUsersModal] = useState(false);
  const [showFrameModal, setShowFrameModal] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [nickname, setNickname] = useState('타이미유저');
  const [statusMessage, setStatusMessage] = useState(t('settings.studying'));
  const [selectedFrame, setSelectedFrame] = useState<CardFrameType>('default');
  const [previewFrame, setPreviewFrame] = useState<CardFrameType | null>(null);
  const [selectedBadges, setSelectedBadges] = useState<string[]>(['steady']);
  const [previewBadge, setPreviewBadge] = useState<string | null>(null);
  const [badgeTab, setBadgeTab] = useState<BadgeCategory>('basic');
  const [ownedFrames, _setOwnedFrames] = useState<CardFrameType[]>(['default', 'gold', 'bronze', 'space']);
  const [ownedBadges, _setOwnedBadges] = useState<string[]>(['beginner', 'steady', 'focused', 'level10', 'streak7']);
  const [bio, setBio] = useState('매일 조금씩 성장하는 중입니다 🌱');
  const [showBioModal, setShowBioModal] = useState(false);
  const [tempBio, setTempBio] = useState(bio);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showTierModal, setShowTierModal] = useState(false);

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getCurrentBadge = () => {
    if (selectedBadges.length === 0) {return null;}
    const badge = BADGES.find(b => b.id === selectedBadges[0]);
    return badge || null;
  };

  const getSelectedBadgesList = () => {
    return selectedBadges.map(id => BADGES.find(b => b.id === id)).filter(Boolean);
  };

  const menuItems = [
    {
      id: 'nickname',
      title: t('profile.nickname'),
      icon: 'person-outline',
      value: nickname,
      onPress: () => setShowNicknameModal(true),
    },
    {
      id: 'bio',
      title: '자기소개',
      icon: 'chatbubble-outline',
      value: bio.length > 15 ? bio.substring(0, 15) + '...' : bio,
      onPress: () => {
        setTempBio(bio);
        setShowBioModal(true);
      },
    },
    {
      id: 'profilePhoto',
      title: t('profile.profilePhoto'),
      icon: 'camera-outline',
      value: '',
      onPress: () => setShowProfilePhotoModal(true),
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
          <Icon name="arrow-back" size={iconSize(24)} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>
        <View style={{width: sp(40)}} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Profile Section - Crazy Arcade Style */}
        <View style={styles.profileSection}>
          {/* Profile Card - 스토어에서 꾸미기 가능 */}
          <TouchableOpacity onPress={() => setShowFrameModal(true)} activeOpacity={0.8}>
            <ProfileCard
              isDark={isDark}
              size="small"
              user={{
                ...defaultUser,
                bio: bio,
                cardFrame: selectedFrame,
                badges: getSelectedBadgesList().map((b: any) => ({id: b.id, icon: b.icon, color: b.color})),
              }}
            />
          </TouchableOpacity>
          <Text style={styles.frameHint}>프로필 카드를 눌러 프레임 변경</Text>

          {/* Level & Experience Details */}
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>내 프로필</Text>

            {/* Badge Selection - 1st */}
            <TouchableOpacity
              style={styles.badgeSelectSection}
              onPress={() => setShowBadgeModal(true)}
              activeOpacity={0.7}>
              <View style={styles.badgeSelectHeader}>
                <View style={styles.badgeSelectInfo}>
                  <Icon name="medal" size={iconSize(20)} color="#FFD700" />
                  <Text style={styles.badgeSelectLabel}>대표 뱃지</Text>
                </View>
                <View style={styles.badgeSelectRight}>
                  <Text style={styles.badgeOwnedCount}>{ownedBadges.length}개 보유</Text>
                  <Icon name="chevron-forward" size={iconSize(18)} color={isDark ? '#666666' : '#AAAAAA'} />
                </View>
              </View>
              <View style={styles.badgeSelectList}>
                {[0, 1, 2].map((index) => {
                  const badge = getSelectedBadgesList()[index] as any;
                  if (badge) {
                    return (
                      <View key={badge.id} style={[styles.badgeSelectIcon, {backgroundColor: badge.color + '20'}]}>
                        <Icon name={badge.icon} size={iconSize(28)} color={badge.color} />
                      </View>
                    );
                  }
                  return (
                    <View key={`empty-${index}`} style={[styles.badgeSelectIcon, styles.badgeSelectIconEmpty]}>
                      <Icon name="add" size={iconSize(24)} color={isDark ? '#555555' : '#CCCCCC'} />
                    </View>
                  );
                })}
              </View>
            </TouchableOpacity>

            {/* 경계선 */}
            <View style={styles.sectionDivider} />

            {/* Level Section - 2nd */}
            <TouchableOpacity
              style={styles.levelSection}
              onPress={() => setShowLevelModal(true)}
              activeOpacity={0.7}>
              <View style={styles.levelHeader}>
                <View style={styles.levelInfo}>
                  <Icon name="star" size={iconSize(20)} color="#FFD700" />
                  <Text style={styles.levelNumber}>레벨 12</Text>
                </View>
                <View style={styles.levelRight}>
                  <Text style={styles.expText}>2,340 / 3,000 EXP</Text>
                  <Icon name="chevron-forward" size={iconSize(16)} color={isDark ? '#666666' : '#AAAAAA'} />
                </View>
              </View>

              {/* Experience Bar */}
              <View style={styles.expBarContainer}>
                <View style={[styles.expBarFill, {width: '78%'}]} />
              </View>
            </TouchableOpacity>

            {/* Competitive Rank Section - 3rd (매칭 화면 티어 시스템 적용) */}
            <TouchableOpacity
              style={styles.rankSection}
              onPress={() => setShowTierModal(true)}
              activeOpacity={0.7}>
              <View style={styles.rankHeader}>
                <View style={styles.rankInfo}>
                  <Icon name="book" size={iconSize(20)} color="#43A047" />
                  <Text style={[styles.rankTier, {color: '#43A047'}]}>학사 II</Text>
                </View>
                <View style={styles.rankRight}>
                  <Text style={styles.rankPoints}>4,250 / 6,000 RP</Text>
                  <Icon name="chevron-forward" size={iconSize(16)} color={isDark ? '#666666' : '#AAAAAA'} />
                </View>
              </View>

              {/* Rank Progress Bar */}
              <View style={styles.rankBarContainer}>
                <View style={[styles.rankBarFill, {width: '71%', backgroundColor: '#43A047'}]} />
              </View>
            </TouchableOpacity>

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
                    size={iconSize(24)}
                    color={isDark ? '#FFFFFF' : '#1A1A1A'}
                  />
                  <Text style={styles.menuTitle}>{item.title}</Text>
                </View>
                <View style={styles.menuRight}>
                  {item.value && <Text style={styles.menuValue}>{item.value}</Text>}
                  <Icon
                    name="chevron-forward"
                    size={iconSize(20)}
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
            <Icon name="log-out-outline" size={iconSize(24)} color="#FF5252" />
            <Text style={styles.dangerText}>{t('profile.logout')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dangerButton} onPress={handleDeleteAccount}>
            <Icon name="trash-outline" size={iconSize(24)} color="#FF5252" />
            <Text style={styles.dangerText}>{t('profile.deleteAccount')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Nickname Modal - 중앙 모달 */}
      <Modal
        visible={showNicknameModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNicknameModal(false)}>
        <View style={styles.centerModalOverlay}>
          <TouchableOpacity
            style={styles.centerModalBackdrop}
            activeOpacity={1}
            onPress={() => setShowNicknameModal(false)}
          />
          <View style={[styles.centerModalContent, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
            <View style={styles.centerModalHeader}>
              <Text style={[styles.centerModalTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                {t('profile.nickname')}
              </Text>
              <TouchableOpacity onPress={() => setShowNicknameModal(false)} style={styles.centerModalCloseBtn}>
                <Icon name="close" size={iconSize(22)} color={isDark ? '#AAAAAA' : '#666666'} />
              </TouchableOpacity>
            </View>
            <View style={{padding: sp(16)}}>
              <TextInput
                style={[
                  styles.centerModalInput,
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
                style={[styles.centerModalButton, {backgroundColor: '#007AFF', opacity: 0.5}]}
                disabled>
                <Text style={styles.centerModalButtonText}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bio Modal - 자기소개 수정 */}
      <Modal
        visible={showBioModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBioModal(false)}>
        <View style={styles.centerModalOverlay}>
          <TouchableOpacity
            style={styles.centerModalBackdrop}
            activeOpacity={1}
            onPress={() => setShowBioModal(false)}
          />
          <View style={[styles.centerModalContent, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
            <View style={styles.centerModalHeader}>
              <Text style={[styles.centerModalTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                자기소개
              </Text>
              <TouchableOpacity onPress={() => setShowBioModal(false)} style={styles.centerModalCloseBtn}>
                <Icon name="close" size={iconSize(22)} color={isDark ? '#AAAAAA' : '#666666'} />
              </TouchableOpacity>
            </View>
            <View style={{padding: sp(16)}}>
              <TextInput
                style={[
                  styles.centerModalInput,
                  styles.bioInput,
                  {
                    backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
                    color: isDark ? '#FFFFFF' : '#1A1A1A',
                  },
                ]}
                value={tempBio}
                onChangeText={setTempBio}
                placeholder="자기소개를 입력하세요"
                placeholderTextColor={isDark ? '#666666' : '#999999'}
                maxLength={100}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <Text style={[styles.bioCharCount, {color: isDark ? '#666666' : '#999999'}]}>
                {tempBio.length}/100
              </Text>
              <TouchableOpacity
                style={[styles.centerModalButton, {backgroundColor: '#007AFF'}]}
                onPress={() => {
                  setBio(tempBio);
                  setShowBioModal(false);
                }}>
                <Text style={styles.centerModalButtonText}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Profile Photo Modal - 중앙 모달 */}
      <Modal
        visible={showProfilePhotoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProfilePhotoModal(false)}>
        <View style={styles.centerModalOverlay}>
          <TouchableOpacity
            style={styles.centerModalBackdrop}
            activeOpacity={1}
            onPress={() => setShowProfilePhotoModal(false)}
          />
          <View style={[styles.centerModalContent, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
            <View style={styles.centerModalHeader}>
              <Text style={[styles.centerModalTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                {t('profile.profilePhoto')}
              </Text>
              <TouchableOpacity onPress={() => setShowProfilePhotoModal(false)} style={styles.centerModalCloseBtn}>
                <Icon name="close" size={iconSize(22)} color={isDark ? '#AAAAAA' : '#666666'} />
              </TouchableOpacity>
            </View>
            <View style={{padding: sp(16)}}>
              <TouchableOpacity
                style={[styles.centerModalOption, {backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5'}]}
                disabled>
                <Icon name="camera-outline" size={iconSize(22)} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
                <Text style={[styles.centerModalOptionText, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                  카메라로 촬영
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.centerModalOption, {backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5'}]}
                disabled>
                <Icon name="images-outline" size={iconSize(22)} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
                <Text style={[styles.centerModalOptionText, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                  갤러리에서 선택
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Status Message Modal - 중앙 모달 */}
      <Modal
        visible={showStatusModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStatusModal(false)}>
        <View style={styles.centerModalOverlay}>
          <TouchableOpacity
            style={styles.centerModalBackdrop}
            activeOpacity={1}
            onPress={() => setShowStatusModal(false)}
          />
          <View style={[styles.centerModalContent, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
            <View style={styles.centerModalHeader}>
              <Text style={[styles.centerModalTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                {t('profile.statusMessage')}
              </Text>
              <TouchableOpacity onPress={() => setShowStatusModal(false)} style={styles.centerModalCloseBtn}>
                <Icon name="close" size={iconSize(22)} color={isDark ? '#AAAAAA' : '#666666'} />
              </TouchableOpacity>
            </View>
            <View style={{padding: sp(16)}}>
              <TextInput
                style={[
                  styles.centerModalInput,
                  {
                    backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
                    color: isDark ? '#FFFFFF' : '#1A1A1A',
                    minHeight: hp(80),
                    textAlignVertical: 'top',
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
                style={[styles.centerModalButton, {backgroundColor: '#007AFF', opacity: 0.5}]}
                disabled>
                <Text style={styles.centerModalButtonText}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Block Users Modal - 중앙 모달 */}
      <Modal
        visible={showBlockUsersModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBlockUsersModal(false)}>
        <View style={styles.centerModalOverlay}>
          <TouchableOpacity
            style={styles.centerModalBackdrop}
            activeOpacity={1}
            onPress={() => setShowBlockUsersModal(false)}
          />
          <View style={[styles.centerModalContent, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
            <View style={styles.centerModalHeader}>
              <Text style={[styles.centerModalTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                {t('profile.blockUsers')}
              </Text>
              <TouchableOpacity onPress={() => setShowBlockUsersModal(false)} style={styles.centerModalCloseBtn}>
                <Icon name="close" size={iconSize(22)} color={isDark ? '#AAAAAA' : '#666666'} />
              </TouchableOpacity>
            </View>
            <View style={styles.blockEmptyContainer}>
              <Icon name="ban-outline" size={iconSize(48)} color={isDark ? '#666666' : '#AAAAAA'} />
              <Text style={[styles.blockEmptyText, {color: isDark ? '#888888' : '#666666'}]}>
                차단된 사용자가 없습니다.
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Frame Selection Modal - 4열 그리드 + 미리보기 */}
      <Modal
        visible={showFrameModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowFrameModal(false);
          setPreviewFrame(null);
        }}>
        <View style={styles.centerModalOverlay}>
          <TouchableOpacity
            style={styles.centerModalBackdrop}
            activeOpacity={1}
            onPress={() => {
              setShowFrameModal(false);
              setPreviewFrame(null);
            }}
          />
          <View style={[styles.themeGridModalContent, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
            <View style={styles.centerModalHeader}>
              <Text style={[styles.centerModalTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                프레임 선택
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowFrameModal(false);
                  setPreviewFrame(null);
                }}
                style={styles.centerModalCloseBtn}>
                <Icon name="close" size={iconSize(22)} color={isDark ? '#AAAAAA' : '#666666'} />
              </TouchableOpacity>
            </View>

            {/* 상단: 4열 그리드 프레임 목록 */}
            <ScrollView style={styles.themeGridScrollArea} showsVerticalScrollIndicator={false}>
              <View style={styles.themeGrid}>
                {/* 프레임 순서: 기본 -> 동색 -> 실버 -> 골드 -> 다이아 -> 네온 -> 우주 -> 불꽃 */}
                {(['default', 'bronze', 'silver', 'gold', 'diamond', 'neon', 'space', 'fire'] as CardFrameType[])
                  .sort((a, b) => {
                    const aOwned = ownedFrames.includes(a);
                    const bOwned = ownedFrames.includes(b);
                    if (aOwned && !bOwned) {return -1;}
                    if (!aOwned && bOwned) {return 1;}
                    return 0;
                  })
                  .map((frameKey) => {
                    const frame = CARD_FRAMES[frameKey];
                    const isOwned = ownedFrames.includes(frameKey);
                    const isSelected = selectedFrame === frameKey;
                    const isPreviewing = previewFrame === frameKey;

                    return (
                      <View
                        key={frameKey}
                        style={[
                          styles.frameGridItemWrapper,
                          {
                            // 선택/미리보기 시 바깥 테두리
                            borderColor: isPreviewing ? '#007AFF' : (isSelected ? '#4CAF50' : 'transparent'),
                            borderWidth: (isPreviewing || isSelected) ? 3 : 0,
                            borderRadius: sp(13),
                            padding: (isPreviewing || isSelected) ? 0 : 3,
                          },
                        ]}>
                        <TouchableOpacity
                          style={[
                            styles.frameGridItem,
                            {
                              // 카드 배경 - 우주 프레임만 어두운 배경
                              backgroundColor: frameKey === 'space' ? '#0D0D2B' : (isDark ? '#2A2A2A' : '#F5F5F5'),
                              // 카드 테두리 - 프레임별 스타일 적용
                              borderColor: frameKey === 'default' ? (isDark ? '#3A3A3A' : '#E0E0E0') : frame.borderColor,
                              borderWidth: frameKey === 'default' ? 1 : frame.borderWidth,
                              opacity: isOwned ? 1 : 0.5,
                            },
                          ]}
                          onPress={() => {
                            setPreviewFrame(frameKey);
                          }}>
                          <Text
                            style={[
                              styles.frameGridItemName,
                              {color: frameKey === 'space' ? '#B8B8FF' : (isDark ? '#FFFFFF' : '#1A1A1A')},
                            ]}
                            numberOfLines={1}>
                            {frame.name}
                          </Text>
                          {isSelected && isOwned && (
                            <View style={styles.frameGridSelectedBadge}>
                              <Icon name="checkmark" size={iconSize(10)} color="#FFFFFF" />
                            </View>
                          )}
                          {!isOwned && (
                            <View style={styles.frameGridLockBadge}>
                              <Icon name="lock-closed" size={iconSize(10)} color="#FFFFFF" />
                            </View>
                          )}
                        </TouchableOpacity>
                      </View>
                    );
                  })}
              </View>
            </ScrollView>

            {/* 하단: 미리보기 영역 - 실제 ProfileCard 사용 */}
            <View style={[styles.framePreviewSection, {borderTopColor: isDark ? '#333333' : '#E0E0E0'}]}>
              {(() => {
                const previewFrameKey = previewFrame || selectedFrame;
                const previewFrameData = CARD_FRAMES[previewFrameKey];

                return (
                  <>
                    <Text style={[styles.framePreviewTitle, {color: isDark ? '#AAAAAA' : '#666666'}]}>
                      미리보기: {previewFrameData.name}
                    </Text>
                    <View style={styles.framePreviewCardWrapper}>
                      <ProfileCard
                        isDark={isDark}
                        size="large"
                        user={{
                          ...defaultUser,
                          bio: bio,
                          cardFrame: previewFrameKey,
                          badges: selectedBadges.map(id => {
                            const badge = BADGES.find(b => b.id === id);
                            return badge ? {id: badge.id, icon: badge.icon, color: badge.color} : null;
                          }).filter(Boolean) as {id: string; icon: string; color: string}[],
                        }}
                      />
                    </View>
                  </>
                );
              })()}
            </View>

            {/* 적용 버튼 */}
            {(() => {
              const isPreviewOwned = previewFrame ? ownedFrames.includes(previewFrame) : true;
              const canApply = previewFrame && previewFrame !== selectedFrame && isPreviewOwned;
              const isNotOwned = previewFrame && !isPreviewOwned;

              return (
                <TouchableOpacity
                  style={[
                    styles.themeApplyButton,
                    {backgroundColor: canApply ? '#007AFF' : (isNotOwned ? '#FF9800' : (isDark ? '#333333' : '#E0E0E0'))},
                  ]}
                  disabled={!canApply && !isNotOwned}
                  onPress={() => {
                    if (canApply && previewFrame) {
                      setSelectedFrame(previewFrame);
                      setShowFrameModal(false);
                      setPreviewFrame(null);
                    } else if (isNotOwned) {
                      Alert.alert('미보유 프레임', '상점에서 구매 후 사용할 수 있어요!');
                    }
                  }}>
                  <Text style={[styles.themeApplyButtonText, {color: canApply || isNotOwned ? '#FFFFFF' : (isDark ? '#666666' : '#999999')}]}>
                    {isNotOwned ? '상점에서 구매하기' : '적용하기'}
                  </Text>
                </TouchableOpacity>
              );
            })()}
          </View>
        </View>
      </Modal>

      {/* Badge Selection Modal - 4열 그리드 + 미리보기 */}
      <Modal
        visible={showBadgeModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowBadgeModal(false);
          setPreviewBadge(null);
        }}>
        <View style={styles.centerModalOverlay}>
          <TouchableOpacity
            style={styles.centerModalBackdrop}
            activeOpacity={1}
            onPress={() => {
              setShowBadgeModal(false);
              setPreviewBadge(null);
            }}
          />
          <View style={[styles.themeGridModalContent, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
            <View style={styles.centerModalHeader}>
              <Text style={[styles.centerModalTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                뱃지 선택
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowBadgeModal(false);
                  setPreviewBadge(null);
                }}
                style={styles.centerModalCloseBtn}>
                <Icon name="close" size={iconSize(22)} color={isDark ? '#AAAAAA' : '#666666'} />
              </TouchableOpacity>
            </View>

            {/* 도움말 */}
            <View style={styles.badgeHelpContainer}>
              <Icon name="information-circle-outline" size={iconSize(14)} color={isDark ? '#888888' : '#999999'} />
              <Text style={[styles.badgeHelpText, {color: isDark ? '#888888' : '#999999'}]}>
                대표 뱃지는 최대 3개까지 선택 가능합니다
              </Text>
            </View>

            {/* 탭 버튼 */}
            <View style={styles.badgeTabContainer}>
              <TouchableOpacity
                style={[
                  styles.badgeTab,
                  badgeTab === 'basic' && styles.badgeTabActive,
                  badgeTab === 'basic' && {backgroundColor: isDark ? '#333333' : '#007AFF'},
                ]}
                onPress={() => setBadgeTab('basic')}>
                <Text style={[
                  styles.badgeTabText,
                  badgeTab === 'basic' && styles.badgeTabTextActive,
                ]}>
                  기본 업적
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.badgeTab,
                  badgeTab === 'special' && styles.badgeTabActive,
                  badgeTab === 'special' && {backgroundColor: isDark ? '#333333' : '#007AFF'},
                ]}
                onPress={() => setBadgeTab('special')}>
                <Text style={[
                  styles.badgeTabText,
                  badgeTab === 'special' && styles.badgeTabTextActive,
                ]}>
                  특수 업적
                </Text>
              </TouchableOpacity>
            </View>

            {/* 뱃지 그리드 */}
            <ScrollView style={styles.badgeGridScrollArea} showsVerticalScrollIndicator={false}>
              <View style={styles.badgeGrid}>
                {BADGES.filter(b => b.category === badgeTab)
                  .sort((a, b) => {
                    const aOwned = ownedBadges.includes(a.id);
                    const bOwned = ownedBadges.includes(b.id);
                    if (aOwned && !bOwned) {return -1;}
                    if (!aOwned && bOwned) {return 1;}
                    return 0;
                  })
                  .map((badge) => {
                    const isOwned = ownedBadges.includes(badge.id);
                    const isSelected = selectedBadges.includes(badge.id);
                    const isPreviewing = previewBadge === badge.id;

                    return (
                      <TouchableOpacity
                        key={badge.id}
                        style={[
                          styles.badgeGridItem,
                          {
                            borderColor: isPreviewing ? '#007AFF' : (isSelected ? '#4CAF50' : 'transparent'),
                            borderWidth: (isPreviewing || isSelected) ? 2 : 0,
                          },
                        ]}
                        onPress={() => {
                          setPreviewBadge(badge.id);
                          if (isOwned) {
                            if (isSelected) {
                              setSelectedBadges(prev => prev.filter(id => id !== badge.id));
                            } else if (selectedBadges.length < 3) {
                              setSelectedBadges(prev => [...prev, badge.id]);
                            } else {
                              Alert.alert('최대 3개', '뱃지는 최대 3개까지 선택할 수 있어요!');
                            }
                          }
                        }}>
                        <View style={[
                          styles.badgeIconContainer,
                          {
                            backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
                            opacity: isOwned ? 1 : 0.4,
                          },
                        ]}>
                          <Icon
                            name={badge.icon as any}
                            size={iconSize(32)}
                            color={isOwned ? badge.color : (isDark ? '#666666' : '#AAAAAA')}
                          />
                        </View>
                        {isSelected && isOwned && (
                          <View style={styles.badgeSelectedMark}>
                            <Icon name="checkmark-circle" size={iconSize(16)} color="#4CAF50" />
                          </View>
                        )}
                        {!isOwned && (
                          <View style={styles.badgeLockMark}>
                            <Icon name="lock-closed" size={iconSize(12)} color="#999999" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
              </View>
            </ScrollView>

            {/* 하단: 미리보기 영역 */}
            <View style={[styles.badgePreviewSection, {backgroundColor: isDark ? '#252525' : '#F8F8F8'}]}>
              {(() => {
                const previewBadgeId = previewBadge || (selectedBadges.length > 0 ? selectedBadges[0] : null);
                const previewBadgeData = previewBadgeId ? BADGES.find(b => b.id === previewBadgeId) : null;

                if (!previewBadgeData) {
                  return (
                    <Text style={{color: isDark ? '#888888' : '#666666', textAlign: 'center'}}>
                      뱃지를 탭하여 선택/해제하세요
                    </Text>
                  );
                }

                const isSelected = selectedBadges.includes(previewBadgeData.id);

                return (
                  <View style={styles.badgePreviewContent}>
                    <View style={[
                      styles.badgePreviewIcon,
                      {backgroundColor: previewBadgeData.color + '20'},
                    ]}>
                      <Icon
                        name={previewBadgeData.icon as any}
                        size={iconSize(40)}
                        color={previewBadgeData.color}
                      />
                    </View>
                    <View style={styles.badgePreviewInfo}>
                      <View style={{flexDirection: 'row', alignItems: 'center', gap: sp(8)}}>
                        <Text style={[styles.badgePreviewName, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                          {previewBadgeData.name}
                        </Text>
                        {isSelected && (
                          <Icon name="checkmark-circle" size={iconSize(18)} color="#4CAF50" />
                        )}
                      </View>
                      <Text style={[styles.badgePreviewDesc, {color: previewBadgeData.color}]}>
                        {previewBadgeData.description}
                      </Text>
                    </View>
                  </View>
                );
              })()}
            </View>

            {/* 닫기 버튼 */}
            <TouchableOpacity
              style={[styles.themeApplyButton, {backgroundColor: '#007AFF'}]}
              onPress={() => {
                setShowBadgeModal(false);
                setPreviewBadge(null);
              }}>
              <Text style={[styles.themeApplyButtonText, {color: '#FFFFFF'}]}>
                완료 ({selectedBadges.length}/3)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Level Info Modal */}
      <Modal
        visible={showLevelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLevelModal(false)}>
        <View style={styles.centerModalOverlay}>
          <TouchableOpacity
            style={styles.centerModalBackdrop}
            activeOpacity={1}
            onPress={() => setShowLevelModal(false)}
          />
          <View style={[styles.infoModalContent, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
            <View style={styles.centerModalHeader}>
              <Text style={[styles.centerModalTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                레벨 시스템
              </Text>
              <TouchableOpacity onPress={() => setShowLevelModal(false)} style={styles.centerModalCloseBtn}>
                <Icon name="close" size={iconSize(22)} color={isDark ? '#AAAAAA' : '#666666'} />
              </TouchableOpacity>
            </View>

            {/* 현재 레벨 표시 */}
            <View style={[styles.currentInfoSection, {backgroundColor: isDark ? '#252525' : '#F8F8F8'}]}>
              <View style={styles.currentInfoRow}>
                {/* 현재 레벨의 아바타 테두리 미리보기 */}
                <View style={[
                  styles.currentAvatarPreview,
                  {
                    borderColor: AVATAR_FRAME_DATA[1].borderColor,
                    borderWidth: AVATAR_FRAME_DATA[1].borderWidth,
                    shadowColor: AVATAR_FRAME_DATA[1].shadowColor,
                    shadowOpacity: AVATAR_FRAME_DATA[1].shadowOpacity,
                  },
                ]}>
                  <View style={[styles.currentAvatarInner, {backgroundColor: '#007AFF'}]}>
                    <Icon name="school" size={iconSize(20)} color="#FFFFFF" />
                  </View>
                </View>
                <View style={styles.currentLevelInfo}>
                  <Text style={[styles.currentInfoTitle, {color: isDark ? '#FFD700' : '#F59E0B'}]}>레벨 12</Text>
                  <Text style={[styles.currentInfoDesc, {color: isDark ? '#AAAAAA' : '#666666'}]}>
                    {AVATAR_FRAME_DATA[1].name} 테두리 사용 중
                  </Text>
                </View>
              </View>
            </View>

            <ScrollView style={styles.infoScrollArea} showsVerticalScrollIndicator={false}>
              <Text style={[styles.infoSectionTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                레벨별 아바타 테두리
              </Text>
              {AVATAR_FRAME_DATA.map((frameData, index) => {
                const isCurrent = index === 1; // 레벨 12 = 11~20 구간
                const expData = LEVEL_EXP_DATA[index];
                return (
                  <View
                    key={frameData.range}
                    style={[
                      styles.levelInfoItem,
                      {
                        backgroundColor: isCurrent
                          ? (isDark ? '#2A3A2A' : '#E8F5E9')
                          : (isDark ? '#252525' : '#F5F5F5'),
                        borderColor: isCurrent ? '#4CAF50' : 'transparent',
                        borderWidth: isCurrent ? 1 : 0,
                      },
                    ]}>
                    <View style={styles.levelInfoRow}>
                      {/* 아바타 테두리 미리보기 */}
                      <View style={[
                        styles.avatarPreview,
                        {
                          borderColor: frameData.borderColor,
                          borderWidth: frameData.borderWidth,
                          shadowColor: frameData.shadowColor,
                          shadowOpacity: frameData.shadowOpacity,
                        },
                      ]}>
                        <View style={[styles.avatarPreviewInner, {backgroundColor: '#007AFF'}]}>
                          <Icon name="school" size={iconSize(18)} color="#FFFFFF" />
                        </View>
                      </View>
                      {/* 레벨 정보 */}
                      <View style={styles.levelInfoText}>
                        <View style={styles.levelInfoHeader}>
                          <Text style={[styles.infoListTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                            레벨 {frameData.range}
                          </Text>
                          <Text style={[styles.avatarFrameName, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                            {frameData.name}
                          </Text>
                        </View>
                        <Text style={[styles.infoListSub, {color: isDark ? '#888888' : '#666666'}]}>
                          레벨당 {expData.expPerLevel} EXP
                        </Text>
                      </View>
                      {isCurrent && (
                        <View style={styles.currentBadge}>
                          <Icon name="checkmark-circle" size={iconSize(18)} color="#4CAF50" />
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={[styles.themeApplyButton, {backgroundColor: '#007AFF'}]}
              onPress={() => setShowLevelModal(false)}>
              <Text style={[styles.themeApplyButtonText, {color: '#FFFFFF'}]}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Tier Info Modal */}
      <Modal
        visible={showTierModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTierModal(false)}>
        <View style={styles.centerModalOverlay}>
          <TouchableOpacity
            style={styles.centerModalBackdrop}
            activeOpacity={1}
            onPress={() => setShowTierModal(false)}
          />
          <View style={[styles.infoModalContent, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
            <View style={styles.centerModalHeader}>
              <Text style={[styles.centerModalTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                티어 시스템
              </Text>
              <TouchableOpacity onPress={() => setShowTierModal(false)} style={styles.centerModalCloseBtn}>
                <Icon name="close" size={iconSize(22)} color={isDark ? '#AAAAAA' : '#666666'} />
              </TouchableOpacity>
            </View>

            {/* 현재 티어 표시 */}
            <View style={[styles.currentInfoSection, {backgroundColor: isDark ? '#252525' : '#F8F8F8'}]}>
              <View style={styles.currentInfoRow}>
                <Icon name="book" size={iconSize(24)} color="#43A047" />
                <Text style={[styles.currentInfoTitle, {color: '#43A047'}]}>학사 II</Text>
              </View>
              <Text style={[styles.currentInfoDesc, {color: isDark ? '#AAAAAA' : '#666666'}]}>
                묵묵히 걸어가는 단계입니다
              </Text>
            </View>

            <ScrollView style={styles.infoScrollArea} showsVerticalScrollIndicator={false}>
              <Text style={[styles.infoSectionTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                전체 티어 목록
              </Text>
              {TIER_DATA.slice().reverse().map((tier) => {
                const isCurrent = tier.name === '학사 II';
                return (
                  <View
                    key={tier.name}
                    style={[
                      styles.infoListItem,
                      {
                        backgroundColor: isCurrent
                          ? (isDark ? '#2A3A2A' : '#E8F5E9')
                          : (isDark ? '#252525' : '#F5F5F5'),
                        borderColor: isCurrent ? tier.color : 'transparent',
                        borderWidth: isCurrent ? 1 : 0,
                      },
                    ]}>
                    <View style={styles.infoListLeft}>
                      <View style={{flexDirection: 'row', alignItems: 'center', gap: sp(8)}}>
                        <Icon name={tier.icon as any} size={iconSize(20)} color={tier.color} />
                        <Text style={[styles.infoListTitle, {color: tier.color}]}>
                          {tier.name}
                        </Text>
                      </View>
                      <Text style={[styles.infoListSub, {color: isDark ? '#888888' : '#666666'}]}>
                        {tier.desc}
                      </Text>
                    </View>
                    <View style={styles.infoListRight}>
                      <Text style={[styles.tierRP, {color: isDark ? '#AAAAAA' : '#666666'}]}>
                        {tier.minRP.toLocaleString()} RP
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={[styles.themeApplyButton, {backgroundColor: '#007AFF'}]}
              onPress={() => setShowTierModal(false)}>
              <Text style={[styles.themeApplyButtonText, {color: '#FFFFFF'}]}>확인</Text>
            </TouchableOpacity>
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
      paddingHorizontal: sp(16),
      paddingVertical: hp(16),
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#2A2A2A' : '#E0E0E0',
    },
    backButton: {
      width: sp(40),
      height: sp(40),
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: fp(18),
      fontWeight: '700',
      color: isDark ? '#FFFFFF' : '#1A1A1A',
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: sp(24),
    },
    profileSection: {
      marginBottom: hp(32),
      gap: sp(12),
    },
    frameHint: {
      fontSize: fp(12),
      color: isDark ? '#888888' : '#999999',
      textAlign: 'center',
      marginTop: -sp(4),
    },
    profileCardOuter: {
      shadowColor: '#000',
      shadowOffset: {width: 0, height: sp(4)},
      shadowOpacity: 0.1,
      shadowRadius: sp(12),
      elevation: 4,
    },
    cardFrame: {
      borderRadius: sp(16),
      borderWidth: 3,
      padding: sp(3),
      backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
    },
    cardBackground: {
      backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
      borderRadius: sp(13),
      padding: sp(10),
    },
    profileCardContent: {
      flexDirection: 'row',
      gap: sp(10),
      alignItems: 'stretch',
    },
    centerContent: {
      flex: 1,
      justifyContent: 'space-between',
      gap: sp(6),
    },
    badgeTierRow: {
      flexDirection: 'row',
      gap: sp(6),
      justifyContent: 'center',
    },
    characterContainer: {
      position: 'relative',
    },
    characterAvatar: {
      width: sp(60),
      height: sp(60),
      borderRadius: sp(30),
      backgroundColor: '#007AFF',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: isDark ? '#2A2A2A' : '#F0F0F0',
    },
    editImageButton: {
      position: 'absolute',
      bottom: sp(-2),
      right: sp(-2),
      width: sp(20),
      height: sp(20),
      borderRadius: sp(10),
      backgroundColor: '#4CAF50',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: isDark ? '#1E1E1E' : '#FFFFFF',
    },
    badgeSlot: {
      alignItems: 'center',
      gap: sp(3),
    },
    badgeIconContainer: {
      width: sp(40),
      height: sp(40),
      borderRadius: sp(20),
      backgroundColor: isDark ? '#2A2A2A' : '#FFF9E6',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: isDark ? '#3A3A00' : '#FFE082',
    },
    badgeLabel: {
      fontSize: fp(9),
      fontWeight: '700',
      color: isDark ? '#FFD700' : '#F59E0B',
      textAlign: 'center',
    },
    tierSlot: {
      alignItems: 'center',
      gap: sp(3),
    },
    tierIconContainer: {
      width: sp(40),
      height: sp(40),
      borderRadius: sp(20),
      backgroundColor: isDark ? '#2A2A2A' : '#FCE4EC',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: isDark ? '#3A1A2A' : '#F8BBD0',
    },
    tierLabel: {
      fontSize: fp(9),
      fontWeight: '700',
      color: isDark ? '#F48FB1' : '#E91E63',
      textAlign: 'center',
    },
    titleSlot: {
      justifyContent: 'center',
      alignItems: 'center',
      width: sp(40),
      height: sp(40),
      borderRadius: sp(20),
      backgroundColor: isDark ? '#2A2A2A' : '#F3E5F5',
      borderWidth: 1,
      borderColor: isDark ? '#3A1A3A' : '#E1BEE7',
    },
    nicknameSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp(8),
      justifyContent: 'center',
    },
    nickname: {
      fontSize: fp(14),
      fontWeight: '800',
      color: isDark ? '#FFFFFF' : '#1A1A1A',
      letterSpacing: -0.3,
    },
    editNicknameButton: {
      padding: sp(4),
    },
    statusCard: {
      backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
      borderRadius: sp(8),
      padding: sp(12),
      shadowColor: '#000',
      shadowOffset: {width: 0, height: sp(1)},
      shadowOpacity: 0.03,
      shadowRadius: sp(4),
      elevation: 1,
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: sp(6),
    },
    statusText: {
      fontSize: fp(13),
      color: isDark ? '#AAAAAA' : '#666666',
      fontStyle: 'italic',
    },
    statsCard: {
      backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
      borderRadius: sp(12),
      padding: sp(20),
      shadowColor: '#000',
      shadowOffset: {width: 0, height: sp(2)},
      shadowOpacity: 0.05,
      shadowRadius: sp(8),
      elevation: 2,
      gap: sp(20),
    },
    statsTitle: {
      fontSize: fp(16),
      fontWeight: '700',
      color: isDark ? '#FFFFFF' : '#1A1A1A',
      marginBottom: hp(4),
    },
    levelSection: {
      gap: sp(10),
    },
    levelHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    levelInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp(8),
    },
    levelNumber: {
      fontSize: fp(18),
      fontWeight: '800',
      color: isDark ? '#FFD700' : '#F59E0B',
    },
    expText: {
      fontSize: fp(14),
      fontWeight: '600',
      color: isDark ? '#AAAAAA' : '#666666',
    },
    expBarContainer: {
      height: hp(12),
      backgroundColor: isDark ? '#2A2A2A' : '#E0E0E0',
      borderRadius: sp(6),
      overflow: 'hidden',
    },
    expBarFill: {
      height: '100%',
      backgroundColor: '#FFD700',
      borderRadius: sp(6),
    },
    expRemaining: {
      fontSize: fp(12),
      color: isDark ? '#999999' : '#888888',
      textAlign: 'center',
    },
    badgeSelectSection: {
      paddingTop: hp(16),
      paddingBottom: hp(4),
      borderTopWidth: 1,
      borderTopColor: isDark ? '#2A2A2A' : '#E0E0E0',
    },
    badgeSelectHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    badgeSelectInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp(8),
    },
    badgeSelectLabel: {
      fontSize: fp(14),
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#1A1A1A',
    },
    badgeSelectValueContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp(8),
    },
    badgeSelectBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp(6),
      paddingHorizontal: sp(10),
      paddingVertical: hp(4),
      borderRadius: sp(12),
    },
    badgeSelectList: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: hp(10),
      marginBottom: hp(-10),
      paddingHorizontal: sp(16),
    },
    badgeSelectIcon: {
      width: sp(56),
      height: sp(56),
      borderRadius: sp(14),
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.15)',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.25,
      shadowRadius: sp(4),
      elevation: 3,
    },
    badgeSelectIconEmpty: {
      backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
      borderStyle: 'dashed',
      borderColor: isDark ? '#444444' : '#DDDDDD',
      shadowOpacity: 0,
      elevation: 0,
    },
    badgeSelectValue: {
      fontSize: fp(13),
      fontWeight: '600',
    },
    badgeSelectCount: {
      fontSize: fp(12),
      color: isDark ? '#888888' : '#666666',
      marginTop: hp(6),
    },
    badgeSelectRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp(8),
    },
    badgeOwnedCount: {
      fontSize: fp(13),
      fontWeight: '600',
      color: isDark ? '#888888' : '#666666',
    },
    badgeHelpContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp(6),
      paddingHorizontal: sp(16),
      marginBottom: hp(12),
    },
    badgeHelpText: {
      fontSize: fp(12),
    },
    badgeTabContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: hp(16),
      marginBottom: hp(12),
      gap: sp(8),
    },
    badgeTab: {
      paddingVertical: hp(8),
      paddingHorizontal: sp(16),
      borderRadius: sp(20),
      backgroundColor: isDark ? '#2A2A2A' : '#F0F0F0',
      alignItems: 'center',
    },
    badgeTabActive: {
      backgroundColor: '#007AFF',
    },
    badgeTabText: {
      fontSize: fp(14),
      fontWeight: '600',
      color: isDark ? '#AAAAAA' : '#666666',
    },
    badgeTabTextActive: {
      color: '#FFFFFF',
    },
    badgeGridScrollArea: {
      maxHeight: hp(280),
    },
    badgeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: sp(12),
      paddingHorizontal: sp(16),
    },
    badgeGridItem: {
      width: sp(60),
      height: sp(60),
      borderRadius: sp(12),
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.12)',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
    badgeIconContainerLarge: {
      width: sp(56),
      height: sp(56),
      borderRadius: sp(10),
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeSelectedMark: {
      position: 'absolute',
      bottom: sp(-2),
      right: sp(-2),
    },
    badgeLockMark: {
      position: 'absolute',
      bottom: sp(2),
      right: sp(2),
      backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
      borderRadius: sp(10),
      padding: sp(2),
    },
    badgePreviewSection: {
      marginTop: hp(16),
      padding: sp(16),
      borderRadius: sp(12),
    },
    badgePreviewContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp(16),
    },
    badgePreviewIcon: {
      width: sp(64),
      height: sp(64),
      borderRadius: sp(16),
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.12)',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.2,
      shadowRadius: sp(4),
      elevation: 3,
    },
    badgePreviewInfo: {
      flex: 1,
      gap: sp(4),
    },
    badgePreviewName: {
      fontSize: fp(18),
      fontWeight: '700',
    },
    badgePreviewDesc: {
      fontSize: fp(14),
      fontWeight: '500',
    },
    rankSection: {
      gap: sp(10),
      paddingTop: hp(20),
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
      gap: sp(8),
    },
    rankTier: {
      fontSize: fp(18),
      fontWeight: '800',
      color: isDark ? '#F48FB1' : '#E91E63',
    },
    rankPoints: {
      fontSize: fp(14),
      fontWeight: '600',
      color: isDark ? '#AAAAAA' : '#666666',
    },
    rankBarContainer: {
      height: hp(12),
      backgroundColor: isDark ? '#2A2A2A' : '#E0E0E0',
      borderRadius: sp(6),
      overflow: 'hidden',
    },
    rankBarFill: {
      height: '100%',
      backgroundColor: '#E91E63',
      borderRadius: sp(6),
    },
    rankRemaining: {
      fontSize: fp(12),
      color: isDark ? '#999999' : '#888888',
      textAlign: 'center',
    },
    badgeSection: {
      gap: sp(8),
      paddingTop: hp(20),
      borderTopWidth: 1,
      borderTopColor: isDark ? '#2A2A2A' : '#E0E0E0',
    },
    badgeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp(8),
    },
    badgeTitle: {
      fontSize: fp(16),
      fontWeight: '700',
      color: isDark ? '#FFFFFF' : '#1A1A1A',
    },
    badgeDescription: {
      fontSize: fp(13),
      color: isDark ? '#AAAAAA' : '#666666',
      lineHeight: hp(18),
    },
    menuSection: {
      backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
      borderRadius: sp(12),
      overflow: 'hidden',
      marginBottom: hp(24),
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: hp(16),
      paddingHorizontal: sp(16),
    },
    menuLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: sp(12),
    },
    menuTitle: {
      fontSize: fp(16),
      fontWeight: '500',
      color: isDark ? '#FFFFFF' : '#1A1A1A',
    },
    menuRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp(8),
    },
    menuValue: {
      fontSize: fp(14),
      color: isDark ? '#AAAAAA' : '#666666',
    },
    divider: {
      height: 1,
      backgroundColor: isDark ? '#2A2A2A' : '#E0E0E0',
      marginLeft: sp(52),
    },
    dangerSection: {
      gap: sp(12),
    },
    dangerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp(12),
      paddingVertical: hp(16),
      paddingHorizontal: sp(16),
      backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
      borderRadius: sp(12),
      borderWidth: 1,
      borderColor: isDark ? '#3A1A1A' : '#FFE0E0',
    },
    dangerText: {
      fontSize: fp(16),
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
      borderTopLeftRadius: sp(20),
      borderTopRightRadius: sp(20),
      paddingBottom: hp(34),
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: sp(20),
      paddingVertical: hp(20),
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#2A2A2A' : '#E0E0E0',
    },
    modalTitle: {
      fontSize: fp(18),
      fontWeight: '700',
    },
    modalOption: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: sp(20),
      paddingVertical: hp(16),
    },
    modalOptionText: {
      fontSize: fp(16),
      fontWeight: '500',
    },
    input: {
      borderRadius: sp(12),
      padding: sp(16),
      fontSize: fp(16),
      marginBottom: hp(16),
      borderWidth: 1,
      borderColor: isDark ? '#3A3A3A' : '#E0E0E0',
    },
    confirmButton: {
      backgroundColor: '#007AFF',
      borderRadius: sp(12),
      padding: sp(16),
      alignItems: 'center',
    },
    confirmButtonText: {
      color: '#FFFFFF',
      fontSize: fp(16),
      fontWeight: '600',
    },
    photoOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: sp(16),
      borderRadius: sp(12),
      marginBottom: hp(12),
      gap: sp(12),
    },
    photoOptionText: {
      fontSize: fp(16),
      fontWeight: '500',
    },
    frameGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: sp(10),
      justifyContent: 'flex-start',
      paddingHorizontal: sp(16),
    },
    frameItem: {
      width: '30%',
      aspectRatio: 1,
      borderRadius: sp(12),
      borderWidth: 3,
      padding: sp(8),
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    frameItemSelected: {
      // borderWidth는 동일하게 유지하여 레이아웃 변동 방지
    },
    framePreview: {
      width: sp(48),
      height: sp(48),
      borderRadius: sp(24),
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: sp(6),
    },
    frameName: {
      fontSize: fp(11),
      fontWeight: '600',
      textAlign: 'center',
    },
    frameCheckmark: {
      position: 'absolute',
      top: sp(4),
      right: sp(4),
    },
    frameLock: {
      position: 'absolute',
      top: sp(4),
      right: sp(4),
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
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#2A2A2A' : '#E0E0E0',
    },
    centerModalTitle: {
      fontSize: fp(17),
      fontWeight: '600',
    },
    centerModalCloseBtn: {
      padding: sp(4),
    },
    centerModalInput: {
      borderWidth: 1,
      borderColor: isDark ? '#3A3A3A' : '#E0E0E0',
      borderRadius: sp(10),
      paddingHorizontal: sp(14),
      paddingVertical: hp(12),
      fontSize: fp(15),
      color: isDark ? '#FFFFFF' : '#1A1A1A',
      backgroundColor: isDark ? '#2A2A2A' : '#F8F8F8',
      marginBottom: hp(12),
    },
    bioInput: {
      height: hp(80),
      paddingTop: hp(12),
    },
    bioCharCount: {
      fontSize: fp(12),
      textAlign: 'right',
      marginBottom: hp(12),
      marginTop: hp(-8),
    },
    sectionDivider: {
      height: 1,
      backgroundColor: isDark ? '#333333' : '#E8E8E8',
      marginTop: hp(4),
      marginBottom: hp(10),
    },
    centerModalButton: {
      paddingVertical: hp(14),
      borderRadius: sp(10),
      alignItems: 'center',
    },
    centerModalButtonText: {
      fontSize: fp(16),
      fontWeight: '600',
      color: '#FFFFFF',
    },
    centerModalOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: hp(14),
      paddingHorizontal: sp(16),
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#2A2A2A' : '#E8E8E8',
    },
    centerModalOptionText: {
      fontSize: fp(15),
      marginLeft: sp(12),
      color: isDark ? '#FFFFFF' : '#1A1A1A',
    },
    centerModalEmptyText: {
      fontSize: fp(14),
      color: isDark ? '#888888' : '#666666',
      textAlign: 'center',
      paddingVertical: hp(40),
    },
    blockEmptyContainer: {
      paddingVertical: hp(32),
      paddingHorizontal: sp(24),
      alignItems: 'center',
      justifyContent: 'center',
      gap: hp(16),
    },
    blockEmptyText: {
      fontSize: fp(14),
      textAlign: 'center',
    },
    frameListContainer: {
      paddingVertical: hp(8),
    },
    frameListItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: sp(20),
      paddingVertical: hp(14),
      borderWidth: 2,
      marginHorizontal: sp(12),
      marginVertical: hp(4),
      borderRadius: sp(12),
    },
    frameListPreview: {
      width: sp(40),
      height: sp(40),
      borderRadius: sp(20),
      justifyContent: 'center',
      alignItems: 'center',
    },
    frameListName: {
      flex: 1,
      fontSize: fp(15),
      fontWeight: '500',
      marginLeft: sp(14),
    },
    frameListStatus: {
      width: sp(24),
      alignItems: 'center',
    },
    // 4열 그리드 모달 스타일
    themeGridModalContent: {
      width: '90%',
      maxWidth: sp(400),
      borderRadius: sp(16),
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: sp(4)},
      shadowOpacity: 0.25,
      shadowRadius: sp(16),
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
    frameGridItemWrapper: {
      // 바깥 테두리용 래퍼
    },
    frameGridItem: {
      width: sp(80),
      aspectRatio: 1.1,
      borderRadius: sp(10),
      paddingHorizontal: sp(4),
      paddingTop: sp(10),
      paddingBottom: sp(10),
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    frameGridPreview: {
      width: sp(32),
      height: sp(32),
      borderRadius: sp(16),
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: sp(4),
    },
    frameGridItemName: {
      fontSize: fp(10),
      fontWeight: '600',
      textAlign: 'center',
    },
    frameGridSelectedBadge: {
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
    frameGridLockBadge: {
      position: 'absolute',
      top: sp(4),
      right: sp(4),
      width: sp(16),
      height: sp(16),
      borderRadius: sp(8),
      backgroundColor: '#666666',
      justifyContent: 'center',
      alignItems: 'center',
    },
    framePreviewSection: {
      borderTopWidth: 1,
      paddingVertical: hp(16),
      paddingHorizontal: sp(12),
      alignItems: 'center',
    },
    framePreviewTitle: {
      fontSize: fp(14),
      fontWeight: '600',
      marginBottom: hp(12),
    },
    framePreviewCardWrapper: {
      width: '100%',
      paddingHorizontal: sp(4),
    },
    framePreviewCard: {
      alignItems: 'center',
    },
    framePreviewBox: {
      width: sp(100),
      height: sp(100),
      borderRadius: sp(16),
      justifyContent: 'center',
      alignItems: 'center',
      shadowOffset: {width: 0, height: sp(4)},
      shadowRadius: sp(8),
      elevation: 5,
    },
    framePreviewAvatar: {
      width: sp(56),
      height: sp(56),
      borderRadius: sp(28),
      justifyContent: 'center',
      alignItems: 'center',
    },
    // 칭호 그리드 스타일
    titleGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: sp(8),
    },
    titleGridItem: {
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
    titleGridItemName: {
      fontSize: fp(10),
      fontWeight: '600',
      textAlign: 'center',
      marginTop: sp(4),
    },
    titleGridSelectedBadge: {
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
    titleGridLockBadge: {
      position: 'absolute',
      top: sp(4),
      right: sp(4),
      width: sp(16),
      height: sp(16),
      borderRadius: sp(8),
      backgroundColor: '#666666',
      justifyContent: 'center',
      alignItems: 'center',
    },
    titlePreviewSection: {
      borderTopWidth: 1,
      paddingVertical: hp(12),
      paddingHorizontal: sp(16),
      alignItems: 'center',
    },
    titlePreviewLabel: {
      fontSize: fp(12),
      marginBottom: hp(8),
    },
    titlePreviewContent: {
      alignItems: 'center',
      gap: sp(8),
    },
    titlePreviewBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp(8),
      paddingHorizontal: sp(16),
      paddingVertical: sp(10),
      borderRadius: sp(20),
    },
    titlePreviewName: {
      fontSize: fp(16),
      fontWeight: '700',
    },
    titlePreviewDesc: {
      fontSize: fp(12),
    },
    // 적용 버튼 스타일
    themeApplyButton: {
      marginHorizontal: sp(16),
      marginTop: hp(8),
      marginBottom: hp(16),
      paddingVertical: hp(14),
      borderRadius: sp(12),
      alignItems: 'center',
    },
    themeApplyButtonText: {
      fontSize: fp(16),
      fontWeight: '600',
    },
    // 상태 메시지 편집 스타일
    statusEditContainer: {
      flex: 1,
    },
    statusInput: {
      fontSize: fp(13),
      textAlign: 'center',
      padding: 0,
    },
    // 칭호 섹션 스타일
    titleSection: {
      paddingTop: hp(20),
      borderTopWidth: 1,
      borderTopColor: isDark ? '#2A2A2A' : '#E0E0E0',
    },
    titleHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    titleInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp(8),
    },
    titleLabel: {
      fontSize: fp(16),
      fontWeight: '700',
      color: isDark ? '#FFFFFF' : '#1A1A1A',
    },
    titleValueContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp(4),
    },
    titleValue: {
      fontSize: fp(14),
      fontWeight: '500',
      color: isDark ? '#CE93D8' : '#7B1FA2',
    },
    // 레벨/티어 오른쪽 영역
    levelRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp(6),
    },
    rankRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp(6),
    },
    // Info Modal 스타일
    infoModalContent: {
      width: '90%',
      maxWidth: sp(400),
      maxHeight: '80%',
      borderRadius: sp(16),
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: sp(4)},
      shadowOpacity: 0.25,
      shadowRadius: sp(16),
      elevation: 10,
    },
    currentInfoSection: {
      marginHorizontal: sp(16),
      marginTop: hp(16),
      padding: sp(16),
      borderRadius: sp(12),
      alignItems: 'center',
    },
    currentInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp(10),
    },
    currentInfoTitle: {
      fontSize: fp(22),
      fontWeight: '800',
    },
    currentInfoDesc: {
      fontSize: fp(13),
      marginTop: hp(4),
    },
    infoScrollArea: {
      maxHeight: hp(350),
      paddingHorizontal: sp(16),
      marginTop: hp(16),
    },
    infoSectionTitle: {
      fontSize: fp(15),
      fontWeight: '700',
      marginBottom: hp(12),
    },
    infoListItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: sp(14),
      borderRadius: sp(10),
      marginBottom: hp(8),
    },
    infoListLeft: {
      flex: 1,
      gap: sp(4),
    },
    infoListTitle: {
      fontSize: fp(15),
      fontWeight: '600',
    },
    infoListSub: {
      fontSize: fp(12),
    },
    infoListRight: {
      alignItems: 'flex-end',
      gap: sp(4),
    },
    framePreviewMini: {
      width: sp(32),
      height: sp(32),
      borderRadius: sp(8),
      justifyContent: 'center',
      alignItems: 'center',
    },
    infoListFrame: {
      fontSize: fp(11),
      fontWeight: '500',
    },
    tierRP: {
      fontSize: fp(13),
      fontWeight: '600',
    },
    // 레벨 정보 아이템 스타일
    levelInfoItem: {
      padding: sp(14),
      borderRadius: sp(12),
      marginBottom: hp(8),
    },
    levelInfoTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: hp(10),
    },
    framePreviewContainer: {
      alignItems: 'center',
      paddingTop: hp(8),
      borderTopWidth: 1,
      borderTopColor: 'rgba(128, 128, 128, 0.2)',
    },
    // 아바타 테두리 미리보기 스타일
    currentAvatarPreview: {
      width: sp(52),
      height: sp(52),
      borderRadius: sp(26),
      justifyContent: 'center',
      alignItems: 'center',
      shadowOffset: {width: 0, height: sp(2)},
      shadowRadius: sp(4),
      elevation: 3,
      overflow: 'hidden',
    },
    currentAvatarInner: {
      width: '100%',
      height: '100%',
      borderRadius: sp(26),
      justifyContent: 'center',
      alignItems: 'center',
    },
    currentLevelInfo: {
      marginLeft: sp(14),
      flex: 1,
    },
    avatarPreview: {
      width: sp(48),
      height: sp(48),
      borderRadius: sp(24),
      justifyContent: 'center',
      alignItems: 'center',
      shadowOffset: {width: 0, height: sp(2)},
      shadowRadius: sp(4),
      elevation: 3,
      overflow: 'hidden',
    },
    avatarPreviewInner: {
      width: '100%',
      height: '100%',
      borderRadius: sp(24),
      justifyContent: 'center',
      alignItems: 'center',
    },
    levelInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    levelInfoText: {
      flex: 1,
      marginLeft: sp(14),
    },
    levelInfoHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp(8),
      marginBottom: sp(2),
    },
    avatarFrameName: {
      fontSize: fp(12),
      fontWeight: '700',
    },
    currentBadge: {
      marginLeft: sp(8),
    },
  });

export default ProfileScreen;
