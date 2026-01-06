import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  InteractionManager,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useNavigation} from '@react-navigation/native';
import {useThemeStore} from '../store/themeStore';
import {safeGetColorScheme, safeAddAppearanceListener} from '../utils/appearance';
import Icon from '@react-native-vector-icons/ionicons';
import PencilIcon from '../components/PencilIcon';
import BallpenIcon from '../components/BallpenIcon';
import {sp, hp, fp, iconSize} from '../utils/responsive';
import ProfileCard from '../components/ProfileCard';
import Svg, {Circle, Path} from 'react-native-svg';


interface StoreItem {
  id: string;
  name: string;
  description: string;
  pencilPrice?: number;
  ballpenPrice?: number;
  category: 'frame' | 'timer' | 'studyRecord';
  icon: string;
  color: string;
  owned?: boolean;
  previewType?: 'timer' | 'frame' | 'studyRecord';
}

const StoreScreen: React.FC = () => {
  const {t: _t} = useTranslation();
  const navigation = useNavigation();
  const [systemColorScheme, setSystemColorScheme] = useState<'light' | 'dark'>('light');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [pencils, setPencils] = useState(1250);
  const [ballpens, setBallpens] = useState(350);
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

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

  // 상점 아이템들
  const storeItems: StoreItem[] = [
    // 타이머 테마
    {
      id: '1',
      name: '오션 테마',
      description: '시원한 바다 컬러 타이머',
      pencilPrice: 2000,
      category: 'timer',
      icon: 'water-outline',
      color: '#4FC3F7',
      previewType: 'timer',
    },
    {
      id: '2',
      name: '포레스트 테마',
      description: '자연의 숲 느낌 타이머',
      pencilPrice: 2000,
      category: 'timer',
      icon: 'leaf-outline',
      color: '#2E7D32',
      previewType: 'timer',
    },
    {
      id: '3',
      name: '선셋 테마',
      description: '따뜻한 노을빛 타이머',
      pencilPrice: 2500,
      category: 'timer',
      icon: 'sunny-outline',
      color: '#FF9800',
      previewType: 'timer',
    },
    {
      id: '4',
      name: '라벤더 테마',
      description: '은은한 보라빛 타이머',
      ballpenPrice: 30,
      category: 'timer',
      icon: 'flower-outline',
      color: '#9575CD',
      previewType: 'timer',
    },
    {
      id: '5',
      name: '민트 테마',
      description: '청량한 민트 컬러 타이머',
      ballpenPrice: 25,
      category: 'timer',
      icon: 'sparkles-outline',
      color: '#26A69A',
      previewType: 'timer',
    },
    // 공부기록 테마
    {
      id: '10',
      name: '공책 테마',
      description: '실제 공책 느낌의 공부기록',
      pencilPrice: 3000,
      category: 'studyRecord',
      icon: 'book-outline',
      color: '#8D6E63',
      previewType: 'studyRecord',
    },
    // 프레임 테마
    {
      id: '20',
      name: '동색 프레임',
      description: '따뜻한 브론즈 컬러 테두리',
      pencilPrice: 1500,
      category: 'frame',
      icon: 'shield-outline',
      color: '#CD7F32',
      previewType: 'frame',
    },
    {
      id: '21',
      name: '골드 프레임',
      description: '화려한 황금색 카드 테두리',
      pencilPrice: 3000,
      category: 'frame',
      icon: 'star-outline',
      color: '#FFD700',
      previewType: 'frame',
    },
    {
      id: '22',
      name: '우주 프레임',
      description: '신비로운 은하수 스타일 테두리',
      ballpenPrice: 50,
      category: 'frame',
      icon: 'planet-outline',
      color: '#6B5BFF',
      previewType: 'frame',
    },
    {
      id: '23',
      name: '실버 프레임',
      description: '세련된 은색 테두리',
      pencilPrice: 2000,
      category: 'frame',
      icon: 'ellipse-outline',
      color: '#B0BEC5',
      previewType: 'frame',
    },
    {
      id: '24',
      name: '다이아몬드 프레임',
      description: '반짝이는 다이아몬드 테두리',
      ballpenPrice: 60,
      category: 'frame',
      icon: 'diamond-outline',
      color: '#B9F2FF',
      previewType: 'frame',
    },
    {
      id: '25',
      name: '네온 프레임',
      description: '빛나는 네온 스타일 테두리',
      ballpenPrice: 40,
      category: 'frame',
      icon: 'flash-outline',
      color: '#00FF88',
      previewType: 'frame',
    },
    {
      id: '26',
      name: '불꽃 프레임',
      description: '열정적인 불꽃 테두리',
      ballpenPrice: 45,
      category: 'frame',
      icon: 'flame-outline',
      color: '#FF5722',
      previewType: 'frame',
    },
  ];

  const categories = [
    {id: 'all', name: '전체', icon: 'grid'},
    {id: 'frame', name: '프레임', icon: 'square-outline'},
    {id: 'timer', name: '타이머', icon: 'timer-outline'},
    {id: 'studyRecord', name: '공부기록', icon: 'book-outline'},
  ];

  const filteredItems = selectedCategory === 'all'
    ? storeItems
    : storeItems.filter(item => item.category === selectedCategory);

  const handleItemPress = (item: StoreItem) => {
    setSelectedItem(item);
    setShowPurchaseModal(true);
  };

  const handlePurchase = () => {
    if (!selectedItem) {return;}

    const price = selectedItem.pencilPrice || selectedItem.ballpenPrice || 0;
    const isPencil = !!selectedItem.pencilPrice;
    const currentBalance = isPencil ? pencils : ballpens;

    if (currentBalance < price) {
      Alert.alert(
        '잔액 부족',
        isPencil ? '연필이 부족합니다.' : '볼펜이 부족합니다.',
        [{text: '확인'}]
      );
      return;
    }

    Alert.alert(
      '구매 확인',
      `${selectedItem.name}을(를) 구매하시겠습니까?`,
      [
        {text: '취소', style: 'cancel'},
        {
          text: '구매',
          onPress: () => {
            if (isPencil) {
              setPencils(prev => prev - price);
            } else {
              setBallpens(prev => prev - price);
            }
            Alert.alert('구매 완료', `${selectedItem.name}을(를) 구매했습니다!`);
            setShowPurchaseModal(false);
          },
        },
      ]
    );
  };

  // 미리보기 렌더링
  const renderPreview = () => {
    if (!selectedItem) {return null;}

    const cardBg = isDark ? '#1E1E1E' : '#FFFFFF';

    switch (selectedItem.previewType) {
      case 'timer':
        return (
          <View style={[styles.previewContainer, {backgroundColor: cardBg}]}>
            <Text style={[styles.previewTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
              타이머 색상 미리보기
            </Text>
            <View style={styles.timerPreviewSingle}>
              <Svg width={sp(100)} height={sp(100)}>
                <Circle cx={sp(50)} cy={sp(50)} r={sp(42)} fill={isDark ? '#333333' : '#F0F0F0'} />
                <Path
                  d={`M ${sp(50)},${sp(50)} L ${sp(50)},${sp(8)} A ${sp(42)},${sp(42)} 0 1,1 ${sp(50) - sp(42) * Math.sin(Math.PI * 0.7)},${sp(50) + sp(42) * Math.cos(Math.PI * 0.7)} Z`}
                  fill={selectedItem.color}
                />
                <Circle cx={sp(50)} cy={sp(50)} r={sp(26)} fill={isDark ? '#1E1E1E' : '#FFFFFF'} />
              </Svg>
            </View>
            <Text style={[styles.previewDesc, {color: isDark ? '#999999' : '#666666'}]}>
              {selectedItem.description}
            </Text>
          </View>
        );

      case 'frame':
        // 프레임 ID 매핑 (상점 아이템 id -> CardFrameType)
        const frameIdMap: Record<string, string> = {
          '20': 'bronze',
          '21': 'gold',
          '22': 'space',
          '23': 'silver',
          '24': 'diamond',
          '25': 'neon',
          '26': 'fire',
        };
        const frameType = frameIdMap[selectedItem.id] || 'default';

        return (
          <View style={[styles.previewContainer, {backgroundColor: cardBg}]}>
            <Text style={[styles.previewTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
              프레임 미리보기
            </Text>
            <View style={styles.framePreviewWrapper}>
              <ProfileCard
                user={{
                  nickname: '열공러',
                  level: 25,
                  tier: '학사 II',
                  cardFrame: frameType as any,
                  badges: [
                    {id: 'study', icon: 'school', color: '#4CAF50'},
                    {id: 'streak', icon: 'flame', color: '#FF5722'},
                  ],
                }}
                size="tiny"
                isDark={isDark}
              />
            </View>
            <Text style={[styles.previewDesc, {color: isDark ? '#999999' : '#666666'}]}>
              {selectedItem.description}
            </Text>
          </View>
        );

      case 'studyRecord':
        return (
          <View style={[styles.previewContainer, {backgroundColor: cardBg}]}>
            <Text style={[styles.previewTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
              공부기록 미리보기
            </Text>
            <View style={[styles.studyRecordPreview, {backgroundColor: '#FFF8E1'}]}>
              {/* 공책 라인 */}
              {[...Array(6)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.notebookLine,
                    {top: hp(20) + i * hp(18)},
                  ]}
                />
              ))}
              <View style={styles.notebookMargin} />
              <View style={styles.studyRecordContent}>
                <Text style={styles.studyRecordDate}>2024년 12월 24일</Text>
                <Text style={styles.studyRecordTime}>오늘 공부: 3시간 25분</Text>
              </View>
            </View>
            <Text style={[styles.previewDesc, {color: isDark ? '#999999' : '#666666'}]}>
              {selectedItem.description}
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  // 구매 모달
  const renderPurchaseModal = () => (
    <Modal
      visible={showPurchaseModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowPurchaseModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.purchaseModal, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
          {/* 모달 헤더 */}
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
              {selectedItem?.name}
            </Text>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowPurchaseModal(false)}>
              <Icon name="close" size={iconSize(24)} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
            </TouchableOpacity>
          </View>

          {/* 미리보기 */}
          {renderPreview()}

          {/* 가격 및 구매 버튼 */}
          <View style={styles.purchaseSection}>
            {selectedItem?.owned ? (
              <View style={[styles.ownedBadgeLarge, {backgroundColor: '#4CAF50'}]}>
                <Icon name="checkmark-circle" size={iconSize(20)} color="#FFFFFF" />
                <Text style={styles.ownedTextLarge}>이미 보유중</Text>
              </View>
            ) : (
              <>
                {/* 가격 표시 */}
                <View style={styles.priceSection}>
                  {selectedItem?.pencilPrice && (
                    <View style={[styles.priceLarge, {backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5'}]}>
                      <PencilIcon size={iconSize(20)} />
                      <Text style={[styles.priceTextLarge, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                        {selectedItem.pencilPrice.toLocaleString()}
                      </Text>
                    </View>
                  )}
                  {selectedItem?.ballpenPrice && (
                    <View style={[styles.priceLarge, {backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5'}]}>
                      <BallpenIcon size={iconSize(20)} />
                      <Text style={[styles.priceTextLarge, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                        {selectedItem.ballpenPrice.toLocaleString()}
                      </Text>
                    </View>
                  )}
                </View>

                {/* 구매 버튼 */}
                <TouchableOpacity
                  style={[styles.purchaseButton, {backgroundColor: '#007AFF'}]}
                  onPress={handlePurchase}>
                  <Icon name="cart" size={iconSize(20)} color="#FFFFFF" />
                  <Text style={styles.purchaseButtonText}>구매하기</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: isDark ? '#121212' : '#FAFAFA'}]}>
      {/* 헤더 */}
      <View style={[styles.header, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={iconSize(24)} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
          아이템 상점
        </Text>
        <View style={{flex: 1}} />
        <View style={styles.currencyContainer}>
          <View style={[styles.coinContainer, {backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5'}]}>
            <PencilIcon size={iconSize(18)} />
            <Text style={[styles.coinText, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
              {pencils.toLocaleString()}
            </Text>
          </View>
          <View style={[styles.coinContainer, {backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5'}]}>
            <BallpenIcon size={iconSize(18)} />
            <Text style={[styles.coinText, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
              {ballpens.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* 카테고리 탭 */}
      <View style={styles.categoryScrollWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContainer}
          nestedScrollEnabled={true}>
          {categories.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryTab,
                {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'},
                selectedCategory === category.id && styles.categoryTabActive,
                selectedCategory === category.id && {backgroundColor: '#007AFF'},
              ]}
              onPress={() => setSelectedCategory(category.id)}>
              <Icon
                name={category.icon}
                size={iconSize(18)}
                color={selectedCategory === category.id ? '#FFFFFF' : (isDark ? '#999999' : '#666666')}
              />
              <Text style={[
                styles.categoryTabText,
                {color: isDark ? '#999999' : '#666666'},
                selectedCategory === category.id && {color: '#FFFFFF'},
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 상품 그리드 */}
      <ScrollView
        style={styles.itemsScroll}
        contentContainerStyle={[styles.itemsContainer, {paddingBottom: hp(100)}]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {filteredItems.map(item => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.itemCard,
                {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'},
              ]}
              onPress={() => handleItemPress(item)}
              activeOpacity={0.7}>
              {/* 아이템 아이콘 */}
              <View style={[styles.itemIconContainer, {backgroundColor: item.color + '20'}]}>
                <Icon name={item.icon} size={iconSize(32)} color={item.color} />
              </View>

              {/* 아이템 정보 */}
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.itemDescription, {color: isDark ? '#999999' : '#666666'}]} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>

              {/* 가격 또는 소유 표시 */}
              {item.owned ? (
                <View style={[styles.ownedBadge, {backgroundColor: '#4CAF50'}]}>
                  <Icon name="checkmark" size={iconSize(14)} color="#FFFFFF" />
                  <Text style={styles.ownedText}>보유중</Text>
                </View>
              ) : (
                <View style={styles.pricesWrapper}>
                  {item.pencilPrice && (
                    <View style={[styles.priceContainer, {backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5'}]}>
                      <PencilIcon size={iconSize(14)} />
                      <Text style={[styles.priceText, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                        {item.pencilPrice.toLocaleString()}
                      </Text>
                    </View>
                  )}
                  {item.ballpenPrice && (
                    <View style={[styles.priceContainer, {backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5'}]}>
                      <BallpenIcon size={iconSize(14)} />
                      <Text style={[styles.priceText, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                        {item.ballpenPrice.toLocaleString()}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* 구매 모달 */}
      {renderPurchaseModal()}
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
    paddingHorizontal: sp(16),
    paddingTop: hp(12),
    paddingBottom: hp(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    padding: sp(8),
    marginRight: sp(8),
  },
  headerTitle: {
    fontSize: fp(18),
    fontWeight: '700',
  },
  currencyContainer: {
    flexDirection: 'row',
    gap: sp(8),
  },
  coinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(10),
    paddingVertical: hp(6),
    borderRadius: sp(16),
    gap: sp(4),
  },
  coinText: {
    fontSize: fp(13),
    fontWeight: '700',
  },
  categoryScrollWrapper: {
    flexShrink: 0,
  },
  categoryScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  categoryContainer: {
    paddingHorizontal: sp(16),
    paddingVertical: sp(12),
    gap: sp(8),
    alignItems: 'center',
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sp(14),
    paddingVertical: sp(10),
    borderRadius: sp(20),
    gap: sp(6),
    marginRight: sp(8),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  categoryTabActive: {
    borderColor: 'transparent',
  },
  categoryTabText: {
    fontSize: fp(14),
    fontWeight: '600',
  },
  itemsScroll: {
    flex: 1,
  },
  itemsContainer: {
    paddingHorizontal: sp(16),
    paddingTop: hp(8),
    paddingBottom: hp(100),
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  itemCard: {
    width: '48%',
    borderRadius: sp(16),
    padding: sp(14),
    marginBottom: sp(12),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: sp(2)},
    shadowOpacity: 0.08,
    shadowRadius: sp(8),
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  itemIconContainer: {
    width: sp(50),
    height: sp(50),
    borderRadius: sp(25),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(10),
  },
  itemInfo: {
    marginBottom: hp(12),
    minHeight: hp(55),
  },
  itemName: {
    fontSize: fp(15),
    fontWeight: '700',
    marginBottom: hp(4),
    letterSpacing: -0.3,
  },
  itemDescription: {
    fontSize: fp(12),
    lineHeight: hp(16),
  },
  pricesWrapper: {
    flexDirection: 'row',
    gap: sp(6),
    flexWrap: 'wrap',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: sp(10),
    paddingVertical: hp(5),
    borderRadius: sp(10),
    gap: sp(4),
  },
  priceText: {
    fontSize: fp(13),
    fontWeight: '700',
  },
  ownedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: sp(10),
    paddingVertical: hp(5),
    borderRadius: sp(10),
    gap: sp(4),
  },
  ownedText: {
    fontSize: fp(12),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // 구매 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: sp(20),
  },
  purchaseModal: {
    width: '100%',
    maxWidth: sp(360),
    borderRadius: sp(20),
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sp(20),
    paddingVertical: hp(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  modalTitle: {
    fontSize: fp(18),
    fontWeight: '700',
  },
  modalCloseBtn: {
    padding: sp(4),
  },
  previewContainer: {
    padding: sp(20),
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: fp(14),
    fontWeight: '600',
    marginBottom: hp(16),
  },
  previewDesc: {
    fontSize: fp(13),
    textAlign: 'center',
    marginTop: hp(16),
  },
  timerPreviewSingle: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: hp(8),
  },
  framePreviewWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(8),
  },
  studyRecordPreview: {
    width: sp(200),
    height: hp(140),
    borderRadius: sp(8),
    position: 'relative',
    overflow: 'hidden',
  },
  notebookLine: {
    position: 'absolute',
    left: sp(30),
    right: sp(10),
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  notebookMargin: {
    position: 'absolute',
    left: sp(25),
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#FFCDD2',
  },
  studyRecordContent: {
    paddingLeft: sp(35),
    paddingTop: hp(25),
  },
  studyRecordDate: {
    fontSize: fp(12),
    color: '#5D4037',
    fontWeight: '600',
  },
  studyRecordTime: {
    fontSize: fp(14),
    color: '#3E2723',
    fontWeight: '700',
    marginTop: hp(8),
  },
  purchaseSection: {
    padding: sp(20),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    gap: hp(16),
  },
  priceSection: {
    flexDirection: 'row',
    gap: sp(12),
  },
  priceLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(16),
    paddingVertical: hp(10),
    borderRadius: sp(12),
    gap: sp(8),
  },
  priceTextLarge: {
    fontSize: fp(18),
    fontWeight: '700',
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: hp(14),
    borderRadius: sp(12),
    gap: sp(8),
  },
  purchaseButtonText: {
    fontSize: fp(16),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ownedBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(20),
    paddingVertical: hp(12),
    borderRadius: sp(12),
    gap: sp(8),
  },
  ownedTextLarge: {
    fontSize: fp(16),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default StoreScreen;
