import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  InteractionManager,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  Animated,
  Easing,
  Dimensions,
  Alert,
  TextInput,
} from 'react-native';
import {useThemeStore} from '../store/themeStore';
import {safeGetColorScheme, safeAddAppearanceListener} from '../utils/appearance';
import Icon from '@react-native-vector-icons/ionicons';
import {sp, hp, fp, iconSize} from '../utils/responsive';
import TimeTimer from '../components/TimeTimer';
import ProfileCard, {CARD_FRAMES, CardFrameType} from '../components/ProfileCard';
import {useCurrencyStore} from '../store/currencyStore';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

type MatchingType = 'free' | 'focus' | null;
type ScreenState = 'main' | 'matching' | 'session';

// 티어 데이터
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

const MatchingScreen: React.FC = () => {
  const [systemColorScheme, setSystemColorScheme] = useState<'light' | 'dark'>('light');
  const [screenState, setScreenState] = useState<ScreenState>('main');
  const [matchingType, setMatchingType] = useState<MatchingType>(null);
  const [matchingProgress, setMatchingProgress] = useState(0);
  const [matchFound, setMatchFound] = useState(false);
  const [showTierModal, setShowTierModal] = useState(false);

  // 애니메이션
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

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

  // 매칭 시작
  const startMatching = (type: MatchingType) => {
    setMatchingType(type);
    setScreenState('matching');
    setMatchingProgress(0);
    setMatchFound(false);

    // 펄스 애니메이션
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // 회전 애니메이션
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    // 진행률 시뮬레이션
    const progressInterval = setInterval(() => {
      setMatchingProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 500);

    // 3초 후 매칭 완료
    setTimeout(() => {
      clearInterval(progressInterval);
      setMatchingProgress(100);
      setMatchFound(true);

      // 페이드 인
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      // 1.5초 후 세션 화면으로 이동
      setTimeout(() => {
        setScreenState('session');
      }, 1500);
    }, 3000);
  };

  // 매칭 취소
  const cancelMatching = () => {
    pulseAnim.stopAnimation();
    rotateAnim.stopAnimation();
    pulseAnim.setValue(1);
    rotateAnim.setValue(0);
    fadeAnim.setValue(0);
    setScreenState('main');
    setMatchingType(null);
    setMatchingProgress(0);
    setMatchFound(false);
  };

  // 세션 종료 (패널티 경고 포함)
  const endSession = () => {
    // 집중매칭인 경우 패널티 경고
    if (matchingType === 'focus') {
      Alert.alert(
        '매칭 종료',
        '집중매칭을 중도 종료하면 패널티가 적용됩니다.\n\n• RP -50 포인트\n• 10분 내 재매칭 불가\n\n정말 나가시겠어요?',
        [
          {
            text: '취소',
            style: 'cancel',
          },
          {
            text: '나가기',
            style: 'destructive',
            onPress: () => {
              setScreenState('main');
              setMatchingType(null);
              // TODO: 실제 패널티 적용 로직
            },
          },
        ],
      );
    } else {
      // 자유매칭은 경고 없이 종료
      Alert.alert(
        '매칭 종료',
        '매칭을 종료하시겠어요?',
        [
          {
            text: '취소',
            style: 'cancel',
          },
          {
            text: '나가기',
            onPress: () => {
              setScreenState('main');
              setMatchingType(null);
            },
          },
        ],
      );
    }
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const primaryColor = matchingType === 'free' ? '#2196F3' : '#FF9800';

  // 메인 화면 렌더링
  const renderMainScreen = () => (
    <SafeAreaView style={[styles.container, {backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF'}]}>
      {/* 콘텐츠 */}
      <ScrollView
        style={styles.tabContent}
        contentContainerStyle={{paddingBottom: 120, flexGrow: 1}}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* 자유매칭 - 그룹 */}
        <View style={[styles.matchSection, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
          <View style={styles.matchHeader}>
            <View style={[styles.matchIconBg, {backgroundColor: '#E3F2FD'}]}>
              <Icon name="chatbubbles" size={iconSize(28)} color="#2196F3" />
            </View>
            <View style={styles.matchTitleSection}>
              <View style={styles.matchTitleRow}>
                <Text style={[styles.matchTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                  자유매칭
                </Text>
                <View style={[styles.matchTypeBadge, {backgroundColor: '#E3F2FD'}]}>
                  <Icon name="people" size={iconSize(12)} color="#2196F3" />
                  <Text style={[styles.matchTypeBadgeText, {color: '#2196F3'}]}>2~5명</Text>
                </View>
              </View>
              <Text style={[styles.matchSubtitle, {color: isDark ? '#999999' : '#666666'}]}>
                대화하며 편하게 공부
              </Text>
            </View>
          </View>
          <View style={styles.matchFeatures}>
            <View style={styles.featureItem}>
              <Icon name="videocam" size={iconSize(16)} color={isDark ? '#64B5F6' : '#2196F3'} />
              <Text style={[styles.featureText, {color: isDark ? '#AAAAAA' : '#666666'}]}>캠 ON/OFF 자유</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="mic" size={iconSize(16)} color={isDark ? '#64B5F6' : '#2196F3'} />
              <Text style={[styles.featureText, {color: isDark ? '#AAAAAA' : '#666666'}]}>마이크 ON/OFF 자유</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="chatbubble-ellipses" size={iconSize(16)} color={isDark ? '#64B5F6' : '#2196F3'} />
              <Text style={[styles.featureText, {color: isDark ? '#AAAAAA' : '#666666'}]}>채팅 ON/OFF 자유</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.matchButton, {backgroundColor: '#2196F3'}]}
            onPress={() => startMatching('free')}
          >
            <Icon name="people" size={iconSize(20)} color="#FFFFFF" />
            <Text style={styles.matchButtonText}>그룹 매칭 시작</Text>
            <View style={styles.matchButtonRewardSection}>
              <View style={styles.matchButtonRpBadge}>
                <Icon name="pencil" size={iconSize(12)} color="#FFE082" />
                <Text style={styles.matchButtonRpText}>+50</Text>
              </View>
              <View style={styles.matchButtonRpBadge}>
                <Icon name="star" size={iconSize(12)} color="#FFD700" />
                <Text style={styles.matchButtonRpText}>+100 RP</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* 집중매칭 - 그룹 */}
        <View style={[styles.matchSection, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
          <View style={styles.matchHeader}>
            <View style={[styles.matchIconBg, {backgroundColor: '#FFF3E0'}]}>
              <Icon name="flame" size={iconSize(28)} color="#FF9800" />
            </View>
            <View style={styles.matchTitleSection}>
              <View style={styles.matchTitleRow}>
                <Text style={[styles.matchTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                  집중매칭
                </Text>
                <View style={[styles.matchTypeBadge, {backgroundColor: '#FFF3E0'}]}>
                  <Icon name="people" size={iconSize(12)} color="#FF9800" />
                  <Text style={[styles.matchTypeBadgeText, {color: '#FF9800'}]}>2~5명</Text>
                </View>
              </View>
              <Text style={[styles.matchSubtitle, {color: isDark ? '#999999' : '#666666'}]}>
                조용히 집중해서 공부
              </Text>
            </View>
          </View>
          <View style={styles.matchFeatures}>
            <View style={styles.featureItem}>
              <Icon name="videocam" size={iconSize(16)} color={isDark ? '#FFB74D' : '#FF9800'} />
              <Text style={[styles.featureText, {color: isDark ? '#AAAAAA' : '#666666'}]}>캠 필수 ON</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="mic-off" size={iconSize(16)} color={isDark ? '#FFB74D' : '#FF9800'} />
              <Text style={[styles.featureText, {color: isDark ? '#AAAAAA' : '#666666'}]}>마이크 OFF</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="chatbubble-outline" size={iconSize(16)} color={isDark ? '#FFB74D' : '#FF9800'} />
              <Text style={[styles.featureText, {color: isDark ? '#AAAAAA' : '#666666'}]}>채팅 OFF</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.matchButton, {backgroundColor: '#FF9800'}]}
            onPress={() => startMatching('focus')}
          >
            <Icon name="flash" size={iconSize(20)} color="#FFFFFF" />
            <Text style={styles.matchButtonText}>그룹 매칭 시작</Text>
            <View style={styles.matchButtonRewardSection}>
              <View style={styles.matchButtonRpBadge}>
                <Icon name="pencil" size={iconSize(12)} color="#FFE082" />
                <Text style={styles.matchButtonRpText}>+75</Text>
              </View>
              <View style={styles.matchButtonRpBadge}>
                <Icon name="star" size={iconSize(12)} color="#FFD700" />
                <Text style={styles.matchButtonRpText}>+200 RP</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* 티어 정보 카드 */}
        <TouchableOpacity
          style={[styles.tierInfoCard, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}
          activeOpacity={0.8}
          onPress={() => setShowTierModal(true)}
        >
          <View style={styles.tierInfoHeader}>
            <View style={styles.tierInfoLeft}>
              <View style={[styles.tierIconBg, {backgroundColor: '#43A04720'}]}>
                <Icon name="book" size={iconSize(24)} color="#43A047" />
              </View>
              <View>
                <Text style={[styles.tierLabel, {color: isDark ? '#888888' : '#666666'}]}>현재 티어</Text>
                <Text style={[styles.tierName, {color: '#43A047'}]}>학사 II</Text>
              </View>
            </View>
            <View style={styles.tierInfoRight}>
              <Text style={[styles.rpLabel, {color: isDark ? '#888888' : '#666666'}]}>티어 포인트</Text>
              <Text style={[styles.rpAmount, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                1,250 <Text style={styles.rpMax}>/ 2,000 RP</Text>
              </Text>
            </View>
          </View>

          {/* RP 프로그레스 바 */}
          <View style={styles.tierProgressSection}>
            <View style={[styles.tierProgressBg, {backgroundColor: isDark ? '#2A2A2A' : '#E8E8E8'}]}>
              <View style={[styles.tierProgressFill, {width: '62.5%', backgroundColor: '#43A047'}]} />
            </View>
            <View style={styles.tierProgressLabels}>
              <Text style={[styles.tierProgressText, {color: isDark ? '#666666' : '#999999'}]}>학사 II</Text>
              <Text style={[styles.tierProgressText, {color: isDark ? '#666666' : '#999999'}]}>학사 III</Text>
            </View>
          </View>

          {/* 티어 정보 보기 + 시즌 정보 */}
          <View style={styles.tierFooter}>
            <View style={styles.seasonInfo}>
              <Icon name="calendar" size={iconSize(14)} color={isDark ? '#666666' : '#999999'} />
              <Text style={[styles.seasonText, {color: isDark ? '#666666' : '#999999'}]}>
                시즌 3 · 23일 남음
              </Text>
            </View>
            <View style={styles.tierInfoButton}>
              <Text style={[styles.tierInfoButtonText, {color: isDark ? '#888888' : '#666666'}]}>
                티어 정보
              </Text>
              <Icon name="chevron-forward" size={iconSize(14)} color={isDark ? '#888888' : '#666666'} />
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );

  // 매칭 중 화면 렌더링
  const renderMatchingScreen = () => (
    <View style={[styles.matchingContainer, {backgroundColor: isDark ? '#121212' : '#FAFAFA'}]}>
      <SafeAreaView style={styles.matchingContent}>
        {/* 헤더 */}
        <View style={styles.matchingHeader}>
          <TouchableOpacity onPress={cancelMatching} style={styles.cancelButton}>
            <Icon name="close" size={iconSize(28)} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
          </TouchableOpacity>
        </View>

        {/* 중앙 콘텐츠 */}
        <View style={styles.matchingCenter}>
          {!matchFound ? (
            <>
              {/* 매칭 중 애니메이션 */}
              <View style={styles.matchingAnimationContainer}>
                <Animated.View
                  style={[
                    styles.pulseCircle,
                    {
                      backgroundColor: primaryColor + '20',
                      transform: [{scale: pulseAnim}],
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.pulseCircle2,
                    {
                      backgroundColor: primaryColor + '10',
                      transform: [{scale: pulseAnim}],
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.spinnerContainer,
                    {transform: [{rotate: spin}]},
                  ]}
                >
                  <View style={[styles.spinnerDot, {backgroundColor: primaryColor}]} />
                  <View style={[styles.spinnerDot2, {backgroundColor: primaryColor + '60'}]} />
                </Animated.View>
                <View style={[styles.matchingIconContainer, {backgroundColor: primaryColor}]}>
                  <Icon
                    name={matchingType === 'free' ? 'chatbubbles' : 'flame'}
                    size={iconSize(40)}
                    color="#FFFFFF"
                  />
                </View>
              </View>

              <Text style={[styles.matchingTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                {matchingType === 'free' ? '자유매칭' : '집중매칭'} 중...
              </Text>
              <Text style={[styles.matchingSubtitle, {color: isDark ? '#888888' : '#666666'}]}>
                함께 공부할 파트너를 찾고 있어요
              </Text>

              {/* 진행률 */}
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, {backgroundColor: isDark ? '#333333' : '#E0E0E0'}]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: primaryColor,
                        width: `${Math.min(matchingProgress, 100)}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.progressText, {color: isDark ? '#888888' : '#666666'}]}>
                  {Math.round(Math.min(matchingProgress, 100))}%
                </Text>
              </View>

            </>
          ) : (
            <>
              {/* 매칭 완료 */}
              <Animated.View style={[styles.matchFoundContainer, {opacity: fadeAnim}]}>
                <View style={[styles.matchFoundIcon, {backgroundColor: '#4CAF50'}]}>
                  <Icon name="checkmark" size={iconSize(50)} color="#FFFFFF" />
                </View>
                <Text style={[styles.matchFoundTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                  매칭 완료!
                </Text>
                <Text style={[styles.matchFoundSubtitle, {color: isDark ? '#888888' : '#666666'}]}>
                  잠시 후 세션이 시작됩니다
                </Text>
              </Animated.View>
            </>
          )}
        </View>

        {/* 취소 버튼 */}
        {!matchFound && (
          <View style={styles.matchingFooter}>
            <TouchableOpacity
              style={[styles.cancelMatchButton, {borderColor: isDark ? '#444444' : '#DDDDDD'}]}
              onPress={cancelMatching}
            >
              <Text style={[styles.cancelMatchText, {color: isDark ? '#AAAAAA' : '#666666'}]}>
                매칭 취소
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </View>
  );

  // 더미 매칭된 유저 데이터 (2~5명) - ProfileCard 형식에 맞춤
  const matchedUsers = [
    {
      id: 1,
      nickname: '김공부',
      level: 23,
      tier: '학사 I',
      title: '수학 마스터',
      cardFrame: 'default' as CardFrameType,
      badges: [
        {id: 'math', icon: 'calculator', color: '#2196F3'},
        {id: 'streak', icon: 'flame', color: '#FF5722'},
      ],
      isCamOn: true, // 자유매칭용 캠 상태
    },
    {
      id: 2,
      nickname: '이열정',
      level: 31,
      tier: '학사 III',
      title: '영어 달인',
      cardFrame: 'silver' as CardFrameType,
      badges: [
        {id: 'english', icon: 'language', color: '#4CAF50'},
        {id: 'streak', icon: 'flame', color: '#FF5722'},
        {id: 'early', icon: 'sunny', color: '#FFC107'},
      ],
      isCamOn: false, // 캠 OFF 예시
    },
    {
      id: 3,
      nickname: '박집중',
      level: 45,
      tier: '석사 II',
      title: '코딩 천재',
      cardFrame: 'gold' as CardFrameType,
      badges: [
        {id: 'code', icon: 'code-slash', color: '#9C27B0'},
        {id: 'trophy', icon: 'trophy', color: '#FFD700'},
        {id: 'star', icon: 'star', color: '#FF9800'},
      ],
      isCamOn: true,
    },
    {
      id: 4,
      nickname: '최노력',
      level: 18,
      tier: '고등학생',
      title: '물리학도',
      cardFrame: 'bronze' as CardFrameType,
      badges: [
        {id: 'science', icon: 'flask', color: '#FF9800'},
      ],
      isCamOn: false, // 캠 OFF 예시
    },
  ];

  // 내 캠/마이크 ON/OFF 상태 (자유매칭용)
  const [isMyCamOn, setIsMyCamOn] = useState(true);
  const [isMyMicOn, setIsMyMicOn] = useState(true);
  const myCardFrame: CardFrameType = 'default'; // 내 카드 프레임 (실제로는 유저 설정에서 가져옴)

  // 상대방 화면 숨기기/음소거 상태 (userId로 관리)
  const [hiddenUsers, setHiddenUsers] = useState<Set<number>>(new Set());
  const [mutedUsers, setMutedUsers] = useState<Set<number>>(new Set());

  // 내 프로필 모달 표시 여부
  const [showMyProfileModal, setShowMyProfileModal] = useState(false);

  // 채팅 전체화면 모달 상태
  const [showChatFullScreen, setShowChatFullScreen] = useState(false);
  const [chatInput, setChatInput] = useState('');

  // 채팅 메시지 더미 데이터
  const [chatMessages] = useState([
    {id: 1, sender: '김공부', color: '#2196F3', message: '안녕하세요! 같이 화이팅해요', time: '14:30'},
    {id: 2, sender: '이열정', color: '#4CAF50', message: '오늘 목표 달성하자!', time: '14:31'},
    {id: 3, sender: '박노력', color: '#FF9800', message: '다들 집중 잘 되시나요?', time: '14:32'},
    {id: 4, sender: '최성실', color: '#9C27B0', message: '저는 수학 공부 중이에요', time: '14:33'},
    {id: 5, sender: '김공부', color: '#2196F3', message: '화이팅! 다들 힘내세요~', time: '14:35'},
  ]);

  // 상대방 화면 숨기기 토글
  const toggleHideUser = (userId: number) => {
    setHiddenUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  // 상대방 음소거 토글
  const toggleMuteUser = (userId: number) => {
    setMutedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  // 세션 타이머
  const FOCUS_TIME = 25 * 60; // 25분 집중
  const BREAK_TIME = 5 * 60; // 5분 휴식
  const [sessionTimeLeft, setSessionTimeLeft] = useState(FOCUS_TIME);
  const [isSessionRunning, setIsSessionRunning] = useState(true);
  const [isBreakTime, setIsBreakTime] = useState(false); // 휴식 시간 여부

  // 보상 지급 함수
  const grantMatchingReward = useCurrencyStore(state => state.grantFocusReward);

  // 타이머 카운트다운
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (screenState === 'session' && isSessionRunning && sessionTimeLeft > 0) {
      interval = setInterval(() => {
        setSessionTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (screenState === 'session' && sessionTimeLeft === 0) {
      // 시간이 다 됐을 때
      if (!isBreakTime && matchingType === 'free') {
        // 집중 시간 끝 → 보상 지급 후 휴식 시간으로 전환 (자유매칭)
        grantMatchingReward('free_matching', 25); // 25분 집중 완료 보상
        setIsBreakTime(true);
        setSessionTimeLeft(BREAK_TIME);
      } else if (!isBreakTime && matchingType === 'focus') {
        // 집중매칭 집중 시간 끝 → 보상 지급 후 휴식 시간으로 전환
        grantMatchingReward('focus_matching', 25); // 25분 집중 완료 보상
        setIsBreakTime(true);
        setSessionTimeLeft(BREAK_TIME);
      } else if (isBreakTime) {
        // 휴식 시간 끝 → 자동 종료
        setScreenState('main');
        setMatchingType(null);
        setIsBreakTime(false);
      }
    }
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenState, isSessionRunning, sessionTimeLeft, isBreakTime, matchingType, grantMatchingReward]);

  // 세션 시작 시 타이머 리셋
  useEffect(() => {
    if (screenState === 'session') {
      setSessionTimeLeft(FOCUS_TIME);
      setIsSessionRunning(true);
      setIsBreakTime(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenState]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalTime = isBreakTime ? BREAK_TIME : FOCUS_TIME;
  const timerProgress = sessionTimeLeft / totalTime;

  // 타이머 색상: 집중=빨강, 휴식=파랑
  const timerColor = isBreakTime ? '#2196F3' : '#FF5252';

  // 매칭 중 일시정지 시도 핸들러
  const handlePauseAttempt = () => {
    Alert.alert(
      '일시정지 불가',
      '매칭 중에는 타이머를 일시정지할 수 없어요.\n\n나가기를 눌러 매칭을 종료해주세요.',
      [{text: '확인', style: 'default'}]
    );
  };


  // 캠 박스 프레임 스타일 가져오기 헬퍼
  const getCamFrameStyle = (frameType: CardFrameType) => {
    const frame = CARD_FRAMES[frameType] || CARD_FRAMES.default;
    const borderColor = frameType === 'default'
      ? (isDark ? '#3A3A3A' : '#E0E0E0')
      : frame.borderColor;
    return {
      borderWidth: frame.borderWidth,
      borderColor,
      shadowColor: frame.shadowColor,
      shadowOpacity: frame.shadowOpacity,
    };
  };

  // 세션 화면 렌더링 (자유매칭) - 집중매칭과 동일한 UI
  const renderFreeSessionScreen = () => {
    const myFrameStyle = getCamFrameStyle(myCardFrame);

    return (
    <View style={[styles.sessionContainer, {backgroundColor: isDark ? '#121212' : '#FAFAFA'}]}>
      <SafeAreaView style={styles.sessionContent}>
        {/* 헤더 */}
        <View style={styles.sessionHeader}>
          <View style={styles.sessionHeaderLeft}>
            <View style={[styles.sessionTypeBadge, {backgroundColor: timerColor}]}>
              <Icon name={isBreakTime ? 'cafe' : 'chatbubbles'} size={iconSize(14)} color="#FFFFFF" />
              <Text style={styles.sessionTypeBadgeText}>{isBreakTime ? '휴식 시간' : '자유 공부'}</Text>
            </View>
            <View style={styles.sessionPeopleCount}>
              <Icon name="people" size={iconSize(14)} color={isDark ? '#888888' : '#666666'} />
              <Text style={[styles.sessionPeopleText, {color: isDark ? '#888888' : '#666666'}]}>
                {matchedUsers.length + 1}명
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.endSessionButton, {backgroundColor: '#FF5252'}]}
            onPress={endSession}
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
            <TouchableOpacity
              style={styles.focusCamItem}
              onPress={() => setShowMyProfileModal(true)}
              activeOpacity={0.8}
            >
              {isMyCamOn ? (
                <View style={[
                  styles.focusCamBox,
                  {
                    backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
                    borderWidth: myFrameStyle.borderWidth,
                    borderColor: myFrameStyle.borderColor,
                  },
                ]}>
                  <View style={[styles.focusCamPlaceholder, {backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5'}]}>
                    <Icon name="videocam" size={iconSize(24)} color={isDark ? '#666666' : '#999999'} />
                  </View>
                  {/* 캠 컨트롤 */}
                  <View style={styles.focusCamControls}>
                    <TouchableOpacity
                      style={[styles.focusCamControlBtn, {backgroundColor: isMyCamOn ? timerColor : '#666666'}]}
                      onPress={() => setIsMyCamOn(!isMyCamOn)}
                    >
                      <Icon name={isMyCamOn ? 'videocam' : 'videocam-off'} size={iconSize(12)} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.focusCamControlBtn, {backgroundColor: isMyMicOn ? timerColor : '#666666'}]}
                      onPress={() => setIsMyMicOn(!isMyMicOn)}
                    >
                      <Icon name={isMyMicOn ? 'mic' : 'mic-off'} size={iconSize(12)} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                // 캠 OFF시 프로필카드(cam 사이즈)만 표시 + 캠 ON 버튼
                <View style={styles.camOffContainer}>
                  <ProfileCard
                    user={{
                      nickname: '열공러',
                      level: 15,
                      cardFrame: myCardFrame,
                      badges: [
                        {id: 'study', icon: 'school', color: '#4CAF50'},
                        {id: 'streak', icon: 'flame', color: '#FF5722'},
                        {id: 'focus', icon: 'eye', color: '#2196F3'},
                      ],
                    }}
                    size="cam"
                    isDark={isDark}
                  />
                  {/* 캠 ON 버튼 */}
                  <TouchableOpacity
                    style={[styles.camOnButton, {backgroundColor: timerColor}]}
                    onPress={() => setIsMyCamOn(true)}
                  >
                    <Icon name="videocam" size={iconSize(14)} color="#FFFFFF" />
                    <Text style={styles.camOnButtonText}>캠 켜기</Text>
                  </TouchableOpacity>
                </View>
              )}
              {isMyCamOn && (
                <ProfileCard
                  user={{
                    nickname: '열공러',
                    level: 15,
                    cardFrame: myCardFrame,
                    badges: [
                      {id: 'study', icon: 'school', color: '#4CAF50'},
                      {id: 'streak', icon: 'flame', color: '#FF5722'},
                      {id: 'focus', icon: 'eye', color: '#2196F3'},
                    ],
                  }}
                  size="cam"
                  isDark={isDark}
                />
              )}
            </TouchableOpacity>

            {/* 다른 참가자들 캠 */}
            {matchedUsers.map((user) => {
              const userFrameStyle = getCamFrameStyle(user.cardFrame);
              const isHidden = hiddenUsers.has(user.id);
              const isMuted = mutedUsers.has(user.id);
              return (
              <TouchableOpacity
                key={user.id}
                style={styles.focusCamItem}
                onPress={() => handleCamPress(user)}
                activeOpacity={0.8}
              >
                {/* 캠 박스 */}
                <View style={[
                  styles.focusCamBox,
                  {
                    backgroundColor: (isHidden || !user.isCamOn)
                      ? (isDark ? '#2A2A2A' : '#F0F0F0')
                      : (isDark ? '#1E1E1E' : '#FFFFFF'),
                    borderWidth: (isHidden || !user.isCamOn) ? 2 : userFrameStyle.borderWidth,
                    borderColor: (isHidden || !user.isCamOn)
                      ? (isDark ? '#3A3A3A' : '#E0E0E0')
                      : userFrameStyle.borderColor,
                  },
                ]}>
                  {isHidden ? (
                    // 내가 화면을 숨긴 경우
                    <View style={styles.hiddenCamPlaceholder}>
                      <Icon name="eye-off" size={iconSize(28)} color={isDark ? '#666666' : '#999999'} />
                      <Text style={[styles.hiddenCamText, {color: isDark ? '#888888' : '#666666'}]}>
                        화면 차단중
                      </Text>
                    </View>
                  ) : user.isCamOn ? (
                    // 캠 ON
                    <>
                      <View style={[styles.focusCamPlaceholder, {backgroundColor: '#E0E0E0'}]}>
                        <Icon name="person" size={iconSize(24)} color="#9E9E9E" />
                      </View>
                      <View style={[styles.focusCamStatusDot, {backgroundColor: '#4CAF50'}]} />
                    </>
                  ) : (
                    // 상대방이 캠 OFF한 경우
                    <View style={styles.hiddenCamPlaceholder}>
                      <Icon name="videocam-off" size={iconSize(24)} color={isDark ? '#666666' : '#999999'} />
                      <Text style={[styles.hiddenCamText, {color: isDark ? '#888888' : '#666666'}]}>
                        화면 끔
                      </Text>
                    </View>
                  )}
                  {/* 음소거 상태 표시 */}
                  {isMuted && (
                    <View style={styles.camMutedBadge}>
                      <Icon name="volume-mute" size={iconSize(10)} color="#FFFFFF" />
                    </View>
                  )}
                </View>
                {/* 프로필 카드는 항상 표시 */}
                <ProfileCard
                  user={{
                    nickname: user.nickname,
                    level: user.level || 10,
                    cardFrame: user.cardFrame,
                    badges: user.badges,
                  }}
                  size="cam"
                  isDark={isDark}
                />
              </TouchableOpacity>
              );
            })}
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
                // 테두리 제거로 더 깔끔한 UI
              },
            ]}>
              <Text style={[styles.timerStatusLabel, {color: timerColor}]}>
                {isBreakTime ? '휴식 시간' : '자유 공부'}
              </Text>
              <View style={styles.timerWrapper}>
                <TimeTimer
                  size={sp(180)}
                  progress={timerProgress}
                  color={timerColor}
                  backgroundColor={isDark ? '#2A2A2A' : '#F5F5F5'}
                  timeText={formatTime(sessionTimeLeft)}
                  totalSeconds={totalTime}
                  isRunning={isSessionRunning}
                  onPlayPause={handlePauseAttempt}
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
              styles.chatSection,
              {
                backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
                borderWidth: 1,
                borderColor: isDark ? '#333333' : '#E8E8E8',
              },
            ]}>
              <View style={styles.chatHeader}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: sp(6)}}>
                  <Icon name="chatbubbles" size={iconSize(18)} color={timerColor} />
                  <Text style={[styles.chatHeaderText, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>채팅</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowChatFullScreen(true)}
                  style={styles.chatExpandBtn}
                >
                  <Icon name="expand" size={iconSize(18)} color={isDark ? '#888888' : '#666666'} />
                </TouchableOpacity>
              </View>
              <View style={styles.chatMessages}>
                {chatMessages.slice(-3).map((msg) => (
                  <View key={msg.id} style={styles.chatBubble}>
                    <Text style={[styles.chatSender, {color: msg.color}]}>{msg.sender}</Text>
                    <Text style={[styles.chatMessage, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                      {msg.message}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* 프로필 모달 */}
      {renderProfileModal()}
      {/* 내 프로필 모달 */}
      {renderMyProfileModal()}
      {/* 채팅 전체화면 모달 */}
      {renderChatFullScreenModal()}
    </View>
  );
  };

  // 캠 옵션 모달 상태
  const [showCamOptions, setShowCamOptions] = useState(false);
  const [selectedCamUser, setSelectedCamUser] = useState<typeof matchedUsers[0] | null>(null);


  // 캠 클릭 핸들러
  const handleCamPress = (user: typeof matchedUsers[0]) => {
    setSelectedCamUser(user);
    setShowCamOptions(true);
  };

  // 프로필 모달 렌더링 함수
  const renderProfileModal = () => (
    <Modal
      visible={showCamOptions}
      transparent
      animationType="fade"
      onRequestClose={() => setShowCamOptions(false)}
    >
      <View style={styles.profileModalOverlay}>
        <TouchableOpacity
          style={styles.profileModalBackdrop}
          activeOpacity={1}
          onPress={() => setShowCamOptions(false)}
        />
        <View style={[styles.profileModalContent, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
          {selectedCamUser && (
            <>
              {/* 프로필 카드 섹션 */}
              <View style={styles.profileModalCardSection}>
                <View style={{width: '100%'}}>
                  <ProfileCard
                    user={{
                      nickname: selectedCamUser.nickname,
                      level: selectedCamUser.level || 10,
                      tier: selectedCamUser.tier,
                      cardFrame: selectedCamUser.cardFrame,
                      badges: selectedCamUser.badges,
                      title: selectedCamUser.title,
                      bio: '함께 공부해요!',
                    }}
                    size="large"
                    isDark={isDark}
                  />
                </View>
              </View>

              {/* 옵션 버튼들 */}
              <View style={styles.profileModalButtons}>
                {/* 자유매칭에서만 음소거 옵션 표시 */}
                {matchingType === 'free' && (
                  <TouchableOpacity
                    style={[styles.profileModalBtn, {
                      backgroundColor: mutedUsers.has(selectedCamUser.id)
                        ? '#FF980020'
                        : (isDark ? '#2A2A2A' : '#F5F5F5'),
                    }]}
                    onPress={() => {
                      toggleMuteUser(selectedCamUser.id);
                      setShowCamOptions(false);
                    }}
                  >
                    <Icon
                      name={mutedUsers.has(selectedCamUser.id) ? 'volume-high' : 'volume-mute'}
                      size={iconSize(18)}
                      color={mutedUsers.has(selectedCamUser.id) ? '#FF9800' : (isDark ? '#FFFFFF' : '#1A1A1A')}
                    />
                    <Text style={[styles.profileModalBtnText, {
                      color: mutedUsers.has(selectedCamUser.id) ? '#FF9800' : (isDark ? '#FFFFFF' : '#1A1A1A'),
                    }]}>
                      {mutedUsers.has(selectedCamUser.id) ? '음소거 해제' : '음소거'}
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.profileModalBtn, {
                    backgroundColor: hiddenUsers.has(selectedCamUser.id)
                      ? '#2196F320'
                      : (isDark ? '#2A2A2A' : '#F5F5F5'),
                  }]}
                  onPress={() => {
                    toggleHideUser(selectedCamUser.id);
                    setShowCamOptions(false);
                  }}
                >
                  <Icon
                    name={hiddenUsers.has(selectedCamUser.id) ? 'eye' : 'eye-off'}
                    size={iconSize(18)}
                    color={hiddenUsers.has(selectedCamUser.id) ? '#2196F3' : (isDark ? '#FFFFFF' : '#1A1A1A')}
                  />
                  <Text style={[styles.profileModalBtnText, {
                    color: hiddenUsers.has(selectedCamUser.id) ? '#2196F3' : (isDark ? '#FFFFFF' : '#1A1A1A'),
                  }]}>
                    {hiddenUsers.has(selectedCamUser.id) ? '화면 보기' : '화면 숨기기'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.profileModalBtn, {backgroundColor: '#FF525220'}]}
                  onPress={() => {
                    setShowCamOptions(false);
                    // TODO: 신고하기
                  }}
                >
                  <Icon name="flag" size={iconSize(18)} color="#FF5252" />
                  <Text style={[styles.profileModalBtnText, {color: '#FF5252'}]}>신고하기</Text>
                </TouchableOpacity>
              </View>

              {/* 닫기 버튼 */}
              <TouchableOpacity
                style={[styles.profileModalCloseBtn, {backgroundColor: isDark ? '#333333' : '#E0E0E0'}]}
                onPress={() => setShowCamOptions(false)}
              >
                <Text style={[styles.profileModalCloseBtnText, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>닫기</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  // 내 프로필 모달 렌더링 함수
  const renderMyProfileModal = () => (
    <Modal
      visible={showMyProfileModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowMyProfileModal(false)}
    >
      <View style={styles.profileModalOverlay}>
        <TouchableOpacity
          style={styles.profileModalBackdrop}
          activeOpacity={1}
          onPress={() => setShowMyProfileModal(false)}
        />
        <View style={[styles.profileModalContent, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
          {/* 내 프로필 카드 섹션 */}
          <View style={styles.profileModalCardSection}>
            <View style={{width: '100%'}}>
              <ProfileCard
                user={{
                  nickname: '열공러',
                  level: 15,
                  cardFrame: myCardFrame,
                  badges: [
                    {id: 'study', icon: 'school', color: '#4CAF50'},
                    {id: 'streak', icon: 'flame', color: '#FF5722'},
                    {id: 'focus', icon: 'eye', color: '#2196F3'},
                  ],
                  bio: '열심히 공부 중!',
                }}
                size="large"
                isDark={isDark}
              />
            </View>
          </View>

          {/* 닫기 버튼 */}
          <TouchableOpacity
            style={[styles.profileModalCloseBtn, {backgroundColor: isDark ? '#333333' : '#E0E0E0'}]}
            onPress={() => setShowMyProfileModal(false)}
          >
            <Text style={[styles.profileModalCloseBtnText, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>닫기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // 채팅 전체화면 모달
  const renderChatFullScreenModal = () => (
    <Modal
      visible={showChatFullScreen}
      animationType="slide"
      statusBarTranslucent
      presentationStyle="pageSheet"
      onRequestClose={() => setShowChatFullScreen(false)}
    >
      <View style={[styles.chatFullScreenContainer, {backgroundColor: isDark ? '#121212' : '#FAFAFA'}]}>
        <SafeAreaView style={{flex: 1}}>
          {/* 헤더 */}
          <View style={styles.chatFullScreenHeader}>
            <Text style={[styles.chatFullScreenTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
              채팅
            </Text>
            <TouchableOpacity onPress={() => setShowChatFullScreen(false)} style={styles.chatFullScreenClose}>
              <Icon name="close" size={iconSize(24)} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
            </TouchableOpacity>
          </View>

          {/* 메시지 목록 */}
          <ScrollView
            style={styles.chatFullScreenMessages}
            contentContainerStyle={{paddingHorizontal: sp(16), paddingBottom: hp(16)}}
            showsVerticalScrollIndicator={false}
          >
            {chatMessages.map((msg) => (
              <View key={msg.id} style={[
                styles.chatFullScreenBubble,
                {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'},
              ]}>
                <View style={styles.chatFullScreenBubbleHeader}>
                  <Text style={[styles.chatFullScreenSender, {color: msg.color}]}>{msg.sender}</Text>
                  <Text style={[styles.chatFullScreenTime, {color: isDark ? '#666666' : '#999999'}]}>{msg.time}</Text>
                </View>
                <Text style={[styles.chatFullScreenMessage, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                  {msg.message}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* 입력창 */}
          <View style={[
            styles.chatFullScreenInputContainer,
            {
              backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
              borderTopColor: isDark ? '#333333' : '#E8E8E8',
            },
          ]}>
            <View style={[
              styles.chatFullScreenInput,
              {backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5'},
            ]}>
              <TextInput
                style={[styles.chatFullScreenTextInput, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}
                placeholder="메시지를 입력하세요..."
                placeholderTextColor={isDark ? '#666666' : '#999999'}
                value={chatInput}
                onChangeText={setChatInput}
                multiline
              />
            </View>
            <TouchableOpacity
              style={[styles.chatFullScreenSendBtn, {backgroundColor: timerColor}]}
              onPress={() => {
                if (chatInput.trim()) {
                  setChatInput('');
                }
              }}
            >
              <Icon name="send" size={iconSize(20)} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );

  // 세션 화면 렌더링 (집중매칭) - 캠 화면 그리드
  const renderFocusSessionScreen = () => {
    const myFrameStyle = getCamFrameStyle(myCardFrame);

    return (
    <View style={[styles.sessionContainer, {backgroundColor: isDark ? '#121212' : '#FAFAFA'}]}>
      <SafeAreaView style={styles.sessionContent}>
        {/* 헤더 */}
        <View style={styles.sessionHeader}>
          <View style={styles.sessionHeaderLeft}>
            <View style={[styles.sessionTypeBadge, {backgroundColor: timerColor}]}>
              <Icon name={isBreakTime ? 'cafe' : 'flame'} size={iconSize(14)} color="#FFFFFF" />
              <Text style={styles.sessionTypeBadgeText}>{isBreakTime ? '휴식 시간' : '집중 시간'}</Text>
            </View>
            <View style={styles.sessionPeopleCount}>
              <Icon name="people" size={iconSize(14)} color={isDark ? '#888888' : '#666666'} />
              <Text style={[styles.sessionPeopleText, {color: isDark ? '#888888' : '#666666'}]}>
                {matchedUsers.length + 1}명
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.endSessionButton, {backgroundColor: '#FF5252'}]}
            onPress={endSession}
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
            <TouchableOpacity
              style={styles.focusCamItem}
              onPress={() => setShowMyProfileModal(true)}
              activeOpacity={0.8}
            >
              <View style={[
                styles.focusCamBox,
                {
                  backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
                  borderWidth: myFrameStyle.borderWidth,
                  borderColor: myFrameStyle.borderColor,
                },
              ]}>
                <View style={[styles.focusCamPlaceholder, {backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5'}]}>
                  <Icon name="videocam" size={iconSize(24)} color={isDark ? '#666666' : '#999999'} />
                </View>
              </View>
              <ProfileCard
                user={{
                  nickname: '열공러',
                  level: 15,
                  cardFrame: myCardFrame,
                  badges: [
                    {id: 'study', icon: 'school', color: '#4CAF50'},
                    {id: 'streak', icon: 'flame', color: '#FF5722'},
                    {id: 'focus', icon: 'eye', color: '#2196F3'},
                  ],
                }}
                size="cam"
                isDark={isDark}
              />
            </TouchableOpacity>

            {/* 다른 참가자들 캠 */}
            {matchedUsers.map((user) => {
              const userFrameStyle = getCamFrameStyle(user.cardFrame);
              const isHidden = hiddenUsers.has(user.id);
              const isMuted = mutedUsers.has(user.id);
              return (
              <TouchableOpacity
                key={user.id}
                style={styles.focusCamItem}
                onPress={() => handleCamPress(user)}
                activeOpacity={0.8}
              >
                {/* 캠 박스 */}
                <View style={[
                  styles.focusCamBox,
                  {
                    backgroundColor: (isHidden || !user.isCamOn)
                      ? (isDark ? '#2A2A2A' : '#F0F0F0')
                      : (isDark ? '#1E1E1E' : '#FFFFFF'),
                    borderWidth: (isHidden || !user.isCamOn) ? 2 : userFrameStyle.borderWidth,
                    borderColor: (isHidden || !user.isCamOn)
                      ? (isDark ? '#3A3A3A' : '#E0E0E0')
                      : userFrameStyle.borderColor,
                  },
                ]}>
                  {isHidden ? (
                    <View style={styles.hiddenCamPlaceholder}>
                      <Icon name="eye-off" size={iconSize(28)} color={isDark ? '#666666' : '#999999'} />
                      <Text style={[styles.hiddenCamText, {color: isDark ? '#888888' : '#666666'}]}>
                        화면 차단중
                      </Text>
                    </View>
                  ) : user.isCamOn ? (
                    <>
                      <View style={[styles.focusCamPlaceholder, {backgroundColor: '#E0E0E0'}]}>
                        <Icon name="person" size={iconSize(24)} color="#9E9E9E" />
                      </View>
                      <View style={[styles.focusCamStatusDot, {backgroundColor: '#4CAF50'}]} />
                      {/* 집중도 바 */}
                      <View style={styles.focusCamProgressBar}>
                        <View style={[styles.focusCamProgressFill, {width: `${85 + Math.random() * 15}%`, backgroundColor: timerColor}]} />
                      </View>
                    </>
                  ) : (
                    <View style={styles.hiddenCamPlaceholder}>
                      <Icon name="videocam-off" size={iconSize(24)} color={isDark ? '#666666' : '#999999'} />
                      <Text style={[styles.hiddenCamText, {color: isDark ? '#888888' : '#666666'}]}>
                        화면 끔
                      </Text>
                    </View>
                  )}
                  {isMuted && (
                    <View style={styles.camMutedBadge}>
                      <Icon name="volume-mute" size={iconSize(10)} color="#FFFFFF" />
                    </View>
                  )}
                </View>
                {/* 프로필 카드는 항상 표시 */}
                <ProfileCard
                  user={{
                    nickname: user.nickname,
                    level: user.level || 10,
                    cardFrame: user.cardFrame,
                    badges: user.badges,
                  }}
                  size="cam"
                  isDark={isDark}
                />
              </TouchableOpacity>
            );
            })}
          </ScrollView>
        </View>

        {/* 타이머 및 컨텐츠 */}
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
                // 테두리 제거로 더 깔끔한 UI
              },
            ]}>
              <Text style={[styles.timerStatusLabel, {color: timerColor}]}>
                {isBreakTime ? '휴식 시간' : '집중 시간'}
              </Text>
              <View style={styles.timerWrapper}>
                <TimeTimer
                  size={sp(180)}
                  progress={timerProgress}
                  color={timerColor}
                  backgroundColor={isDark ? '#2A2A2A' : '#F5F5F5'}
                  timeText={formatTime(sessionTimeLeft)}
                  totalSeconds={totalTime}
                  isRunning={isSessionRunning}
                  onPlayPause={handlePauseAttempt}
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
              styles.chatSection,
              {
                backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
                borderWidth: 1,
                borderColor: isDark ? '#333333' : '#E8E8E8',
              },
            ]}>
              <View style={styles.chatHeader}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: sp(6)}}>
                  <Icon name="chatbubbles" size={iconSize(18)} color={timerColor} />
                  <Text style={[styles.chatHeaderText, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>채팅</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowChatFullScreen(true)}
                  style={styles.chatExpandBtn}
                >
                  <Icon name="expand" size={iconSize(18)} color={isDark ? '#888888' : '#666666'} />
                </TouchableOpacity>
              </View>
              <View style={styles.chatMessages}>
                {chatMessages.slice(-3).map((msg) => (
                  <View key={msg.id} style={styles.chatBubble}>
                    <Text style={[styles.chatSender, {color: msg.color}]}>{msg.sender}</Text>
                    <Text style={[styles.chatMessage, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                      {msg.message}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>

      {/* 프로필 모달 */}
      {renderProfileModal()}
      {/* 내 프로필 모달 */}
      {renderMyProfileModal()}
      {/* 채팅 전체화면 모달 */}
      {renderChatFullScreenModal()}
    </View>
  );
  };

  // 티어 모달 컨텐츠
  const renderTierModal = () => (
    <View style={[styles.tierModalContainer, {backgroundColor: isDark ? '#121212' : '#FAFAFA'}]}>
      <SafeAreaView style={{flex: 1}}>
        {/* 헤더 */}
        <View style={styles.tierModalHeader}>
          <Text style={[styles.tierModalTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
            티어 시스템
          </Text>
          <TouchableOpacity onPress={() => setShowTierModal(false)} style={styles.tierModalClose}>
            <Icon name="close" size={iconSize(24)} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
          </TouchableOpacity>
        </View>

        {/* 현재 티어 */}
        <View style={[styles.currentTierCard, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
          <View style={[styles.currentTierIconBg, {backgroundColor: '#43A04720'}]}>
            <Icon name="book" size={iconSize(32)} color="#43A047" />
          </View>
          <View style={styles.currentTierInfo}>
            <Text style={[styles.currentTierLabel, {color: isDark ? '#888888' : '#666666'}]}>
              현재 티어
            </Text>
            <Text style={[styles.currentTierName, {color: '#43A047'}]}>학사 II</Text>
            <Text style={[styles.currentTierRP, {color: isDark ? '#AAAAAA' : '#666666'}]}>
              1,250 / 2,000 RP
            </Text>
          </View>
          <View style={styles.currentTierProgress}>
            <Text style={[styles.nextTierText, {color: isDark ? '#888888' : '#666666'}]}>
              다음: 학사 III
            </Text>
            <View style={[styles.currentTierBar, {backgroundColor: isDark ? '#2A2A2A' : '#E8E8E8'}]}>
              <View style={[styles.currentTierBarFill, {width: '62.5%', backgroundColor: '#43A047'}]} />
            </View>
          </View>
        </View>

        {/* 티어 목록 */}
        <ScrollView style={styles.tierList} showsVerticalScrollIndicator={false}>
          <Text style={[styles.tierListTitle, {color: isDark ? '#888888' : '#666666'}]}>
            전체 티어
          </Text>
          {TIER_DATA.map((tier) => {
            const isCurrentTier = tier.name === '학사 II';
            return (
              <View
                key={tier.name}
                style={[
                  styles.tierItem,
                  {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'},
                  isCurrentTier && styles.tierItemCurrent,
                  isCurrentTier && {borderColor: tier.color},
                ]}
              >
                <View style={[styles.tierItemIcon, {backgroundColor: tier.color + '20'}]}>
                  <Icon name={tier.icon as any} size={iconSize(20)} color={tier.color} />
                </View>
                <View style={styles.tierItemInfo}>
                  <View style={styles.tierItemNameRow}>
                    <Text style={[styles.tierItemName, {color: tier.color}]}>{tier.name}</Text>
                    {isCurrentTier && (
                      <View style={[styles.currentBadge, {backgroundColor: tier.color}]}>
                        <Text style={styles.currentBadgeText}>현재</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.tierItemDesc, {color: isDark ? '#888888' : '#666666'}]}>
                    {tier.desc}
                  </Text>
                </View>
                <Text style={[styles.tierItemRP, {color: isDark ? '#666666' : '#999999'}]}>
                  {tier.minRP.toLocaleString()} RP
                </Text>
              </View>
            );
          })}

          {/* RP 획득 방법 */}
          <View style={[styles.rpGuideCard, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
            <Text style={[styles.rpGuideTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
              RP 획득 방법
            </Text>
            <View style={styles.rpGuideItem}>
              <Icon name="flash" size={iconSize(18)} color="#FF9800" />
              <Text style={[styles.rpGuideText, {color: isDark ? '#AAAAAA' : '#666666'}]}>
                집중매칭 1분당 +1 RP
              </Text>
            </View>
            <View style={styles.rpGuideItem}>
              <Icon name="trophy" size={iconSize(18)} color="#4CAF50" />
              <Text style={[styles.rpGuideText, {color: isDark ? '#AAAAAA' : '#666666'}]}>
                집중도 90% 이상 보너스 +50%
              </Text>
            </View>
            <View style={styles.rpGuideItem}>
              <Icon name="flame" size={iconSize(18)} color="#FF5722" />
              <Text style={[styles.rpGuideText, {color: isDark ? '#AAAAAA' : '#666666'}]}>
                연속 7일 집중매칭 +100 RP
              </Text>
            </View>
          </View>

          <View style={{height: hp(40)}} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );

  // 화면 상태에 따른 렌더링
  // 매칭 중이면 매칭 화면 표시
  if (screenState === 'matching') {
    return (
      <>
        {renderMatchingScreen()}
        {/* 티어 정보 모달 */}
        <Modal
          visible={showTierModal}
          animationType="slide"
          statusBarTranslucent
          presentationStyle="pageSheet"
        >
          {renderTierModal()}
        </Modal>
      </>
    );
  }

  // 세션 중이면 세션 화면 표시
  if (screenState === 'session') {
    return (
      <>
        {matchingType === 'free' ? renderFreeSessionScreen() : renderFocusSessionScreen()}
        {/* 티어 정보 모달 */}
        <Modal
          visible={showTierModal}
          animationType="slide"
          statusBarTranslucent
          presentationStyle="pageSheet"
        >
          {renderTierModal()}
        </Modal>
      </>
    );
  }

  // 메인 화면
  return (
    <>
      {renderMainScreen()}

      {/* 티어 정보 모달 */}
      <Modal
        visible={showTierModal}
        animationType="slide"
        statusBarTranslucent
        presentationStyle="pageSheet"
      >
        {renderTierModal()}
      </Modal>

    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: sp(20),
    paddingTop: hp(16),
    paddingBottom: hp(16),
  },
  title: {
    fontSize: fp(28),
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tabContent: {
    flex: 1,
  },
  // 매칭 섹션
  matchSection: {
    margin: sp(16),
    marginBottom: sp(8),
    padding: sp(20),
    borderRadius: sp(16),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: sp(4)},
    shadowOpacity: 0.12,
    shadowRadius: sp(12),
    elevation: 4,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(14),
    marginBottom: hp(16),
  },
  matchIconBg: {
    width: sp(56),
    height: sp(56),
    borderRadius: sp(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchTitleSection: {
    flex: 1,
  },
  matchTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
    marginBottom: hp(2),
  },
  matchTitle: {
    fontSize: fp(20),
    fontWeight: '800',
  },
  matchTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(8),
    paddingVertical: hp(3),
    borderRadius: sp(10),
    gap: sp(4),
  },
  matchTypeBadgeText: {
    fontSize: fp(11),
    fontWeight: '700',
  },
  matchSubtitle: {
    fontSize: fp(14),
  },
  matchFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sp(12),
    marginBottom: hp(20),
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(6),
  },
  featureText: {
    fontSize: fp(13),
  },
  matchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(14),
    borderRadius: sp(14),
    gap: sp(8),
  },
  matchButtonText: {
    color: '#FFFFFF',
    fontSize: fp(16),
    fontWeight: '700',
  },

  // 매칭 중 화면
  matchingContainer: {
    flex: 1,
  },
  matchingContent: {
    flex: 1,
  },
  matchingHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: sp(20),
    paddingTop: hp(10),
  },
  cancelButton: {
    padding: sp(8),
  },
  matchingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: sp(40),
  },
  matchingAnimationContainer: {
    width: sp(200),
    height: sp(200),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(40),
  },
  pulseCircle: {
    position: 'absolute',
    width: sp(180),
    height: sp(180),
    borderRadius: sp(90),
  },
  pulseCircle2: {
    position: 'absolute',
    width: sp(200),
    height: sp(200),
    borderRadius: sp(100),
  },
  spinnerContainer: {
    position: 'absolute',
    width: sp(140),
    height: sp(140),
  },
  spinnerDot: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -sp(6),
    width: sp(12),
    height: sp(12),
    borderRadius: sp(6),
  },
  spinnerDot2: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    marginLeft: -sp(6),
    width: sp(12),
    height: sp(12),
    borderRadius: sp(6),
  },
  matchingIconContainer: {
    width: sp(100),
    height: sp(100),
    borderRadius: sp(50),
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchingTitle: {
    fontSize: fp(24),
    fontWeight: '800',
    marginBottom: hp(8),
  },
  matchingSubtitle: {
    fontSize: fp(16),
    marginBottom: hp(30),
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: hp(30),
  },
  progressBar: {
    width: '100%',
    height: sp(8),
    borderRadius: sp(4),
    overflow: 'hidden',
    marginBottom: hp(8),
  },
  progressFill: {
    height: '100%',
    borderRadius: sp(4),
  },
  progressText: {
    fontSize: fp(14),
  },
  waitingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
    paddingHorizontal: sp(20),
    paddingVertical: hp(12),
    borderRadius: sp(12),
  },
  waitingText: {
    fontSize: fp(14),
  },
  matchingFooter: {
    paddingHorizontal: sp(40),
    paddingBottom: hp(40),
  },
  cancelMatchButton: {
    paddingVertical: hp(14),
    borderRadius: sp(12),
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelMatchText: {
    fontSize: fp(16),
    fontWeight: '600',
  },

  // 매칭 완료
  matchFoundContainer: {
    alignItems: 'center',
  },
  matchFoundIcon: {
    width: sp(100),
    height: sp(100),
    borderRadius: sp(50),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(24),
  },
  matchFoundTitle: {
    fontSize: fp(28),
    fontWeight: '800',
    marginBottom: hp(8),
  },
  matchFoundSubtitle: {
    fontSize: fp(16),
    marginBottom: hp(30),
  },
  partnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: sp(16),
    borderRadius: sp(16),
    gap: sp(14),
    width: '100%',
  },
  partnerAvatar: {
    width: sp(56),
    height: sp(56),
    borderRadius: sp(28),
    justifyContent: 'center',
    alignItems: 'center',
  },
  partnerAvatarText: {
    fontSize: fp(22),
    fontWeight: '700',
  },
  partnerInfo: {
    flex: 1,
  },
  partnerName: {
    fontSize: fp(18),
    fontWeight: '700',
    marginBottom: hp(4),
  },
  partnerStudy: {
    fontSize: fp(14),
  },

  // 세션 화면
  sessionContainer: {
    flex: 1,
  },
  sessionContent: {
    flex: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  sessionTimer: {
    fontSize: fp(20),
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
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

  // 비디오 영역
  videoContainer: {
    flex: 1,
    margin: sp(16),
    borderRadius: sp(20),
    overflow: 'hidden',
  },
  partnerVideo: {
    flex: 1,
    borderRadius: sp(20),
    overflow: 'hidden',
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  partnerVideoInfo: {
    position: 'absolute',
    bottom: sp(16),
    left: sp(16),
  },
  partnerVideoName: {
    fontSize: fp(18),
    fontWeight: '700',
    marginBottom: hp(4),
  },
  partnerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(6),
  },
  statusDot: {
    width: sp(8),
    height: sp(8),
    borderRadius: sp(4),
    backgroundColor: '#4CAF50',
  },
  statusText: {
    color: '#4CAF50',
    fontSize: fp(13),
    fontWeight: '500',
  },
  myVideo: {
    position: 'absolute',
    bottom: sp(16),
    right: sp(16),
    width: sp(100),
    height: sp(140),
    borderRadius: sp(12),
    overflow: 'hidden',
  },
  myVideoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  myVideoControls: {
    position: 'absolute',
    bottom: sp(8),
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: sp(8),
  },
  videoControlBtn: {
    width: sp(28),
    height: sp(28),
    borderRadius: sp(14),
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 컨트롤 영역
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: hp(16),
    marginHorizontal: sp(16),
    borderRadius: sp(16),
    marginBottom: hp(12),
  },
  controlButton: {
    alignItems: 'center',
    paddingVertical: hp(12),
    paddingHorizontal: sp(20),
    borderRadius: sp(12),
  },
  controlLabel: {
    fontSize: fp(12),
    marginTop: hp(4),
  },

  // 채팅 미리보기
  chatPreview: {
    marginHorizontal: sp(16),
    marginBottom: hp(16),
    padding: sp(16),
    borderRadius: sp(16),
  },
  chatBubble: {
    marginBottom: hp(12),
  },
  chatSender: {
    fontSize: fp(13),
    fontWeight: '600',
    marginBottom: hp(4),
  },
  chatMessage: {
    fontSize: fp(15),
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(10),
  },
  chatInput: {
    flex: 1,
    height: sp(44),
    borderRadius: sp(22),
    paddingHorizontal: sp(16),
    justifyContent: 'center',
  },
  chatInputPlaceholder: {
    fontSize: fp(14),
  },
  sendButton: {
    width: sp(44),
    height: sp(44),
    borderRadius: sp(22),
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 집중매칭 세션
  focusVideoContainer: {
    flex: 1,
    padding: sp(16),
  },
  focusVideoRow: {
    flex: 1,
    flexDirection: 'row',
    gap: sp(12),
  },
  focusVideoCard: {
    flex: 1,
    borderRadius: sp(16),
    overflow: 'hidden',
  },
  focusVideoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusVideoOverlay: {
    position: 'absolute',
    bottom: sp(12),
    left: sp(12),
  },
  focusVideoName: {
    color: '#FFFFFF',
    fontSize: fp(16),
    fontWeight: '700',
    marginBottom: hp(4),
  },
  focusStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(4),
  },
  focusStatusText: {
    color: '#FFFFFF',
    fontSize: fp(12),
  },
  focusMeter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: sp(4),
    backgroundColor: '#333333',
  },
  focusMeterFill: {
    height: '100%',
  },

  // 집중 통계
  focusStats: {
    flexDirection: 'row',
    marginHorizontal: sp(16),
    marginBottom: hp(16),
    padding: sp(16),
    borderRadius: sp(16),
  },
  focusStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  focusStatValue: {
    color: '#FFFFFF',
    fontSize: fp(20),
    fontWeight: '800',
    marginTop: hp(8),
    marginBottom: hp(2),
  },
  focusStatLabel: {
    color: '#888888',
    fontSize: fp(12),
  },
  focusStatDivider: {
    width: 1,
    backgroundColor: '#333333',
    marginVertical: hp(8),
  },

  // 집중 컨트롤
  focusControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: sp(20),
    marginBottom: hp(16),
  },
  focusControlBtn: {
    width: sp(56),
    height: sp(56),
    borderRadius: sp(28),
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 격려 메시지
  encourageMessage: {
    alignItems: 'center',
    paddingBottom: hp(20),
  },

  // 새로운 세션 화면 스타일
  sessionPeopleCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(4),
  },
  sessionPeopleText: {
    fontSize: fp(13),
    fontWeight: '500',
  },

  // 프로필 카드 그리드
  profileCardsContainer: {
    flex: 1,
  },
  profileCardsContent: {
    padding: sp(16),
    paddingBottom: sp(20),
  },
  profileCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sp(12),
    marginBottom: hp(16),
  },

  // 프로필 카드
  profileCard: {
    width: (SCREEN_WIDTH - sp(16) * 2 - sp(12)) / 2,
    padding: sp(16),
    borderRadius: sp(16),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: sp(2)},
    shadowOpacity: 0.08,
    shadowRadius: sp(8),
    elevation: 3,
  },
  profileAvatar: {
    width: sp(56),
    height: sp(56),
    borderRadius: sp(28),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(10),
  },
  profileAvatarText: {
    fontSize: fp(24),
    fontWeight: '700',
  },
  profileName: {
    fontSize: fp(16),
    fontWeight: '700',
    marginBottom: hp(2),
    textAlign: 'center',
  },
  profileSubject: {
    fontSize: fp(13),
    marginBottom: hp(8),
  },
  profileStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(4),
  },
  profileStreakText: {
    color: '#FF9800',
    fontSize: fp(12),
    fontWeight: '600',
  },
  onlineDot: {
    position: 'absolute',
    top: sp(12),
    right: sp(12),
    width: sp(10),
    height: sp(10),
    borderRadius: sp(5),
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  // 채팅 섹션
  chatSection: {
    borderRadius: sp(16),
    padding: sp(16),
    marginBottom: hp(16),
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(12),
  },
  chatHeaderText: {
    fontSize: fp(16),
    fontWeight: '700',
  },
  chatExpandBtn: {
    padding: sp(4),
  },
  chatMessages: {
    marginBottom: hp(12),
  },

  // 내 프로필 섹션
  myProfileSection: {
    marginBottom: hp(16),
  },

  // 매칭된 유저 섹션
  matchedUsersSection: {
    marginBottom: hp(16),
  },
  sectionLabel: {
    fontSize: fp(14),
    fontWeight: '600',
    marginBottom: hp(12),
  },

  // 매칭된 유저 카드
  matchedUserCard: {
    width: (SCREEN_WIDTH - sp(16) * 2 - sp(12)) / 2,
    padding: sp(14),
    borderRadius: sp(16),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: sp(2)},
    shadowOpacity: 0.08,
    shadowRadius: sp(8),
    elevation: 3,
  },
  matchedUserAvatar: {
    width: sp(48),
    height: sp(48),
    borderRadius: sp(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(8),
  },
  matchedUserAvatarText: {
    fontSize: fp(20),
    fontWeight: '700',
  },
  matchedUserName: {
    fontSize: fp(14),
    fontWeight: '700',
    marginBottom: hp(2),
    textAlign: 'center',
  },
  matchedUserSubject: {
    fontSize: fp(12),
    marginBottom: hp(6),
  },
  matchedUserStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(4),
  },
  matchedUserStreakText: {
    color: '#FF9800',
    fontSize: fp(11),
    fontWeight: '600',
  },

  // 타이머 카드
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

  // 타이머 섹션 (하단 고정 - 더이상 사용 안함)
  timerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(20),
    paddingBottom: hp(30),
    borderTopLeftRadius: sp(24),
    borderTopRightRadius: sp(24),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -sp(4)},
    shadowOpacity: 0.1,
    shadowRadius: sp(12),
    elevation: 10,
  },
  timerContent: {
    flex: 1,
  },
  timerLabel: {
    fontSize: fp(13),
    marginBottom: hp(2),
  },
  timerText: {
    fontSize: fp(36),
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  timerControls: {
    flexDirection: 'row',
    gap: sp(12),
  },
  timerControlBtn: {
    width: sp(56),
    height: sp(56),
    borderRadius: sp(28),
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 집중 모드 프로필 카드
  focusProfileCard: {
    width: (SCREEN_WIDTH - sp(16) * 2 - sp(12)) / 2,
    padding: sp(14),
    borderRadius: sp(16),
    alignItems: 'center',
  },
  focusProfileAvatar: {
    width: sp(48),
    height: sp(48),
    borderRadius: sp(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(8),
  },
  focusProfileAvatarText: {
    fontSize: fp(20),
    fontWeight: '700',
  },
  focusProfileName: {
    color: '#FFFFFF',
    fontSize: fp(14),
    fontWeight: '700',
    marginBottom: hp(4),
    textAlign: 'center',
  },
  focusProfileStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(4),
    marginBottom: hp(8),
  },
  focusStatusIndicator: {
    width: sp(6),
    height: sp(6),
    borderRadius: sp(3),
  },
  focusStatusTextSmall: {
    color: '#888888',
    fontSize: fp(11),
  },
  focusBar: {
    width: '100%',
    height: sp(4),
    backgroundColor: '#333333',
    borderRadius: sp(2),
    overflow: 'hidden',
  },
  focusBarFill: {
    height: '100%',
    borderRadius: sp(2),
  },

  // 집중 통계 카드
  focusStatsCard: {
    borderRadius: sp(16),
    padding: sp(16),
    marginBottom: hp(16),
  },
  focusStatRow: {
    flexDirection: 'row',
  },

  // 격려 카드
  encourageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp(8),
    paddingVertical: hp(12),
  },
  encourageEmoji: {
    fontSize: fp(20),
  },
  encourageText: {
    color: '#FF9800',
    fontSize: fp(14),
    fontWeight: '600',
  },

  // 매칭된 유저 아이템 (ProfileCard용)
  matchedUserItem: {
    marginBottom: hp(12),
    position: 'relative',
  },
  onlineIndicator: {
    position: 'absolute',
    top: sp(8),
    right: sp(8),
    zIndex: 10,
  },
  onlineDotSmall: {
    width: sp(10),
    height: sp(10),
    borderRadius: sp(5),
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  // 집중매칭 캠 화면 스타일
  focusHeaderTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(6),
    backgroundColor: '#1A1A1A',
    paddingHorizontal: sp(12),
    paddingVertical: hp(6),
    borderRadius: sp(8),
  },
  focusHeaderTimerText: {
    color: '#FF9800',
    fontSize: fp(16),
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  camGridContainer: {
    flex: 1,
    padding: sp(12),
  },
  myCamContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: sp(16),
    overflow: 'hidden',
    marginBottom: hp(12),
    position: 'relative',
  },
  camPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222222',
  },
  camPlaceholderText: {
    color: '#666666',
    fontSize: fp(14),
    marginTop: hp(8),
  },
  camOverlay: {
    position: 'absolute',
    bottom: sp(12),
    left: sp(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
  },
  camNameBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: sp(10),
    paddingVertical: hp(4),
    borderRadius: sp(6),
  },
  camNameText: {
    color: '#FFFFFF',
    fontSize: fp(14),
    fontWeight: '600',
  },
  camStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(4),
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: sp(8),
    paddingVertical: hp(4),
    borderRadius: sp(6),
  },
  camStatusDot: {
    width: sp(8),
    height: sp(8),
    borderRadius: sp(4),
  },
  camStatusText: {
    color: '#FFFFFF',
    fontSize: fp(12),
  },
  camControlsRow: {
    position: 'absolute',
    bottom: sp(12),
    right: sp(12),
    flexDirection: 'row',
    gap: sp(8),
  },
  camControlBtn: {
    width: sp(40),
    height: sp(40),
    borderRadius: sp(20),
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otherCamsContent: {
    paddingRight: sp(12),
    gap: sp(10),
  },
  otherCamContainer: {
    width: sp(120),
    height: sp(160),
    backgroundColor: '#1A1A1A',
    borderRadius: sp(12),
    overflow: 'hidden',
    position: 'relative',
  },
  otherCamPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222222',
  },
  otherCamOverlay: {
    position: 'absolute',
    bottom: sp(24),
    left: sp(8),
    right: sp(8),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  otherCamName: {
    color: '#FFFFFF',
    fontSize: fp(12),
    fontWeight: '600',
    flex: 1,
  },
  otherCamStatus: {
    marginLeft: sp(4),
  },
  camStatusDotSmall: {
    width: sp(6),
    height: sp(6),
    borderRadius: sp(3),
  },
  focusProgressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: sp(4),
    backgroundColor: '#333333',
  },
  focusProgressFill: {
    height: '100%',
  },
  focusBottomSection: {
    paddingHorizontal: sp(12),
    paddingBottom: hp(12),
  },
  focusMyCamSection: {
    paddingHorizontal: sp(16),
    marginBottom: hp(16),
  },
  focusMyCam: {
    height: hp(200),
    backgroundColor: '#1A1A1A',
    borderRadius: sp(16),
    overflow: 'hidden',
    position: 'relative',
  },
  focusOtherCamsSection: {
    marginBottom: hp(16),
  },
  focusTimerSection: {
    paddingHorizontal: sp(16),
  },
  focusStatsSection: {
    paddingHorizontal: sp(16),
  },

  // 집중매칭 가로 캠 목록 스타일
  focusCamListSection: {
    paddingVertical: hp(12),
    // 테두리 제거 - 타이머 카드와 겹쳐 보이는 문제 해결
  },
  focusCamListContent: {
    paddingHorizontal: sp(16),
    gap: sp(12),
  },
  focusCamItem: {
    alignItems: 'center',
    width: sp(110), // camCard와 동일한 너비
  },
  focusCamBox: {
    width: sp(110), // camCard와 동일한 너비
    height: sp(120),
    borderRadius: sp(12),
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: sp(2)},
    shadowOpacity: 0.1,
    shadowRadius: sp(4),
    elevation: 3,
    marginBottom: sp(4), // 캠과 카드 사이 간격
  },
  focusCamPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusCamBadge: {
    position: 'absolute',
    top: sp(6),
    left: sp(6),
    backgroundColor: '#4CAF50',
    paddingHorizontal: sp(6),
    paddingVertical: sp(2),
    borderRadius: sp(4),
  },
  focusCamBadgeText: {
    color: '#FFFFFF',
    fontSize: fp(10),
    fontWeight: '700',
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
  focusCamProgressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: sp(4),
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  focusCamProgressFill: {
    height: '100%',
  },
  focusCamName: {
    fontSize: fp(12),
    fontWeight: '600',
    marginTop: hp(6),
    textAlign: 'center',
  },

  // 캠 옵션 모달
  camOptionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: sp(20),
  },
  camOptionsModal: {
    width: '100%',
    maxWidth: sp(320),
    borderRadius: sp(16),
    overflow: 'hidden',
  },
  camOptionsTitle: {
    fontSize: fp(16),
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: hp(16),
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  camOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(12),
    paddingHorizontal: sp(20),
    paddingVertical: hp(14),
    borderBottomWidth: 1,
  },
  camOptionText: {
    fontSize: fp(15),
    fontWeight: '500',
  },
  camOptionCancel: {
    paddingVertical: hp(14),
    alignItems: 'center',
  },
  camOptionCancelText: {
    fontSize: fp(15),
    fontWeight: '600',
  },

  // 티어 정보 카드
  tierInfoCard: {
    margin: sp(16),
    marginTop: sp(8),
    padding: sp(16),
    borderRadius: sp(16),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: sp(2)},
    shadowOpacity: 0.08,
    shadowRadius: sp(8),
    elevation: 3,
  },
  tierInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(16),
  },
  tierInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(12),
  },
  tierIconBg: {
    width: sp(48),
    height: sp(48),
    borderRadius: sp(14),
    justifyContent: 'center',
    alignItems: 'center',
  },
  tierLabel: {
    fontSize: fp(11),
    fontWeight: '500',
    marginBottom: hp(2),
  },
  tierName: {
    fontSize: fp(18),
    fontWeight: '800',
  },
  tierInfoRight: {
    alignItems: 'flex-end',
  },
  rpLabel: {
    fontSize: fp(11),
    fontWeight: '500',
    marginBottom: hp(2),
  },
  rpAmount: {
    fontSize: fp(16),
    fontWeight: '800',
  },
  rpMax: {
    fontSize: fp(12),
    fontWeight: '600',
    color: '#888888',
  },
  tierProgressSection: {
    marginBottom: hp(14),
  },
  tierProgressBg: {
    height: sp(10),
    borderRadius: sp(5),
    overflow: 'hidden',
    marginBottom: hp(6),
  },
  tierProgressFill: {
    height: '100%',
    borderRadius: sp(5),
  },
  tierProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tierProgressText: {
    fontSize: fp(11),
    fontWeight: '500',
  },
  rpNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
    paddingHorizontal: sp(12),
    paddingVertical: hp(10),
    borderRadius: sp(10),
    marginBottom: hp(12),
  },
  rpNoticeText: {
    fontSize: fp(12),
    fontWeight: '600',
    flex: 1,
  },
  seasonInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(6),
  },
  seasonText: {
    fontSize: fp(12),
    fontWeight: '500',
  },
  tierFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierInfoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(4),
  },
  tierInfoButtonText: {
    fontSize: fp(13),
    fontWeight: '600',
  },

  // 티어 모달
  tierModalContainer: {
    flex: 1,
  },
  tierModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: sp(20),
    paddingVertical: hp(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tierModalTitle: {
    fontSize: fp(20),
    fontWeight: '800',
  },
  tierModalClose: {
    padding: sp(4),
  },
  currentTierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: sp(16),
    padding: sp(16),
    borderRadius: sp(16),
    gap: sp(14),
  },
  currentTierIconBg: {
    width: sp(64),
    height: sp(64),
    borderRadius: sp(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentTierInfo: {
    flex: 1,
  },
  currentTierLabel: {
    fontSize: fp(11),
    fontWeight: '500',
    marginBottom: hp(2),
  },
  currentTierName: {
    fontSize: fp(20),
    fontWeight: '800',
    marginBottom: hp(2),
  },
  currentTierRP: {
    fontSize: fp(13),
    fontWeight: '600',
  },
  currentTierProgress: {
    alignItems: 'flex-end',
  },
  nextTierText: {
    fontSize: fp(11),
    fontWeight: '500',
    marginBottom: hp(6),
  },
  currentTierBar: {
    width: sp(80),
    height: sp(8),
    borderRadius: sp(4),
    overflow: 'hidden',
  },
  currentTierBarFill: {
    height: '100%',
    borderRadius: sp(4),
  },
  tierList: {
    flex: 1,
    paddingHorizontal: sp(16),
  },
  tierListTitle: {
    fontSize: fp(13),
    fontWeight: '600',
    marginBottom: hp(12),
    marginTop: hp(8),
  },
  tierItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: sp(14),
    borderRadius: sp(12),
    marginBottom: hp(8),
    gap: sp(12),
  },
  tierItemCurrent: {
    borderWidth: 2,
  },
  tierItemIcon: {
    width: sp(44),
    height: sp(44),
    borderRadius: sp(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  tierItemInfo: {
    flex: 1,
  },
  tierItemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
  },
  tierItemName: {
    fontSize: fp(15),
    fontWeight: '700',
  },
  currentBadge: {
    paddingHorizontal: sp(6),
    paddingVertical: sp(2),
    borderRadius: sp(6),
  },
  currentBadgeText: {
    color: '#FFFFFF',
    fontSize: fp(10),
    fontWeight: '700',
  },
  tierItemDesc: {
    fontSize: fp(12),
    marginTop: hp(2),
  },
  tierItemRP: {
    fontSize: fp(12),
    fontWeight: '600',
  },
  rpGuideCard: {
    padding: sp(16),
    borderRadius: sp(16),
    marginTop: hp(16),
  },
  rpGuideTitle: {
    fontSize: fp(16),
    fontWeight: '700',
    marginBottom: hp(14),
  },
  rpGuideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(10),
    marginBottom: hp(12),
  },
  rpGuideText: {
    fontSize: fp(14),
    fontWeight: '500',
  },
  rpGuideNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp(8),
    padding: sp(12),
    borderRadius: sp(10),
    marginTop: hp(8),
  },
  rpGuideNoticeText: {
    fontSize: fp(13),
    fontWeight: '600',
    flex: 1,
  },

  // 캠 OFF 관련 스타일
  camOffContainer: {
    alignItems: 'center',
  },
  camOnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sp(10),
    paddingVertical: sp(6),
    borderRadius: sp(8),
    marginTop: sp(6),
    gap: sp(4),
  },
  camOnButtonText: {
    color: '#FFFFFF',
    fontSize: fp(11),
    fontWeight: '600',
  },

  // RP 배지 스타일
  matchButtonRewardSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: sp(8),
    gap: sp(6),
  },
  matchButtonRpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: sp(8),
    paddingVertical: sp(3),
    borderRadius: sp(10),
    gap: sp(4),
  },
  matchButtonRpText: {
    color: '#FFFFFF',
    fontSize: fp(11),
    fontWeight: '700',
  },

  // 프로필 및 옵션 통합 모달 스타일
  profileOptionsOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  profileOptionsBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  profileOptionsModal: {
    borderTopLeftRadius: sp(24),
    borderTopRightRadius: sp(24),
    paddingHorizontal: sp(20),
    paddingTop: sp(20),
    paddingBottom: hp(40),
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  profileOptionsCardSection: {
    alignItems: 'center',
    marginBottom: hp(20),
  },
  profileOptionsButtons: {
    flexDirection: 'row',
    gap: sp(10),
    marginBottom: hp(16),
  },
  profileOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(12),
    borderRadius: sp(12),
    gap: sp(6),
  },
  profileOptionBtnText: {
    fontSize: fp(13),
    fontWeight: '600',
  },
  profileOptionsCloseBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(14),
    borderRadius: sp(12),
  },
  profileOptionsCloseBtnText: {
    fontSize: fp(15),
    fontWeight: '600',
  },

  // 프로필 모달 (중앙 배치)
  profileModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: sp(20),
  },
  profileModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  profileModalContent: {
    width: '100%',
    maxWidth: sp(340),
    borderRadius: sp(20),
    padding: sp(20),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: sp(4)},
    shadowOpacity: 0.2,
    shadowRadius: sp(12),
    elevation: 8,
  },
  profileModalCardSection: {
    alignItems: 'center',
    marginBottom: hp(20),
    width: '100%',
  },
  profileModalButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sp(10),
    marginBottom: hp(16),
  },
  profileModalBtn: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(12),
    borderRadius: sp(12),
    gap: sp(6),
  },
  profileModalBtnText: {
    fontSize: fp(13),
    fontWeight: '600',
  },
  profileModalCloseBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(14),
    borderRadius: sp(12),
  },
  profileModalCloseBtnText: {
    fontSize: fp(15),
    fontWeight: '600',
  },

  // 화면 숨기기/음소거 관련 스타일
  hiddenCamContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  hiddenCamPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiddenCamText: {
    fontSize: fp(9),
    fontWeight: '600',
    marginTop: hp(4),
    textAlign: 'center',
  },
  hiddenStatusText: {
    fontSize: fp(10),
    fontWeight: '600',
    marginTop: hp(4),
    textAlign: 'center',
  },
  mutedBadge: {
    position: 'absolute',
    top: sp(4),
    right: sp(4),
    backgroundColor: '#FF980020',
    borderRadius: sp(8),
    padding: sp(4),
  },
  camMutedBadge: {
    position: 'absolute',
    bottom: sp(6),
    left: sp(6),
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: sp(8),
    padding: sp(4),
  },

  // 채팅 전체화면 모달 스타일
  chatFullScreenContainer: {
    flex: 1,
  },
  chatFullScreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sp(16),
    paddingVertical: hp(12),
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  chatFullScreenTitle: {
    fontSize: fp(18),
    fontWeight: '700',
  },
  chatFullScreenClose: {
    padding: sp(4),
  },
  chatFullScreenMessages: {
    flex: 1,
    paddingTop: hp(12),
  },
  chatFullScreenBubble: {
    padding: sp(12),
    borderRadius: sp(12),
    marginBottom: hp(10),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: sp(1)},
    shadowOpacity: 0.05,
    shadowRadius: sp(4),
    elevation: 2,
  },
  chatFullScreenBubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(4),
  },
  chatFullScreenSender: {
    fontSize: fp(13),
    fontWeight: '600',
  },
  chatFullScreenTime: {
    fontSize: fp(11),
  },
  chatFullScreenMessage: {
    fontSize: fp(14),
    lineHeight: fp(20),
  },
  chatFullScreenInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: sp(16),
    paddingVertical: hp(12),
    borderTopWidth: 1,
    gap: sp(10),
  },
  chatFullScreenInput: {
    flex: 1,
    borderRadius: sp(20),
    paddingHorizontal: sp(16),
    paddingVertical: hp(10),
    maxHeight: hp(100),
  },
  chatFullScreenTextInput: {
    fontSize: fp(14),
    padding: 0,
    margin: 0,
  },
  chatFullScreenSendBtn: {
    width: sp(44),
    height: sp(44),
    borderRadius: sp(22),
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MatchingScreen;
