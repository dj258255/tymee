import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  InteractionManager,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useThemeStore} from '../store/themeStore';
import {safeGetColorScheme, safeAddAppearanceListener} from '../utils/appearance';
import Icon from '@react-native-vector-icons/ionicons';
import PencilIcon from '../components/PencilIcon';
import BallpenIcon from '../components/BallpenIcon';

interface StoreItem {
  id: string;
  name: string;
  description: string;
  pencilPrice?: number;
  ballpenPrice?: number;
  category: 'theme' | 'icon' | 'sound' | 'feature' | 'profile';
  icon: string;
  color: string;
  owned?: boolean;
  subcategory?: 'frame' | 'background' | 'badge';
}

const StoreScreen: React.FC = () => {
  const {t} = useTranslation();
  const [systemColorScheme, setSystemColorScheme] = useState<'light' | 'dark'>('light');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [pencils, setPencils] = useState(1250); // 사용자 연필
  const [ballpens, setBallpens] = useState(350); // 사용자 볼펜

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
    {
      id: '1',
      name: '다크 네온 테마',
      description: '사이버펑크 스타일의 네온 테마',
      pencilPrice: 3000,
      category: 'theme',
      icon: 'color-palette',
      color: '#FF00FF',
    },
    {
      id: '2',
      name: '파스텔 테마',
      description: '부드럽고 편안한 파스텔 컬러',
      pencilPrice: 2500,
      category: 'theme',
      icon: 'color-palette',
      color: '#FFB6C1',
    },
    {
      id: '3',
      name: '고양이 타이머',
      description: '귀여운 고양이 모양 타이머',
      ballpenPrice: 40,
      category: 'icon',
      icon: 'paw',
      color: '#FF6B6B',
    },
    {
      id: '4',
      name: '레트로 타이머',
      description: '빈티지 아날로그 시계 스타일',
      pencilPrice: 3500,
      category: 'icon',
      icon: 'time',
      color: '#4ECDC4',
    },
    {
      id: '5',
      name: '자연 사운드팩',
      description: '빗소리, 파도소리, 새소리',
      pencilPrice: 2000,
      category: 'sound',
      icon: 'musical-notes',
      color: '#95E1D3',
    },
    {
      id: '6',
      name: '로파이 비트팩',
      description: '집중력 향상 로파이 음악',
      ballpenPrice: 25,
      category: 'sound',
      icon: 'headset',
      color: '#AA96DA',
    },
    {
      id: '7',
      name: '그룹 스터디',
      description: '친구들과 함께 공부하기',
      ballpenPrice: 50,
      category: 'feature',
      icon: 'people',
      color: '#FCBAD3',
      owned: true,
    },
    {
      id: '8',
      name: '통계 프로',
      description: '상세한 학습 분석 및 리포트',
      pencilPrice: 6000,
      ballpenPrice: 60,
      category: 'feature',
      icon: 'stats-chart',
      color: '#A8D8EA',
    },
    // 프로필 카드 꾸미기 아이템들
    {
      id: '9',
      name: '골드 프레임',
      description: '화려한 황금색 카드 테두리',
      pencilPrice: 3000,
      category: 'profile',
      subcategory: 'frame',
      icon: 'square-outline',
      color: '#FFD700',
      owned: true,
    },
    {
      id: '10',
      name: '다이아 프레임',
      description: '반짝이는 다이아몬드 테두리',
      ballpenPrice: 50,
      category: 'profile',
      subcategory: 'frame',
      icon: 'diamond-outline',
      color: '#B9F2FF',
    },
    {
      id: '11',
      name: '레인보우 프레임',
      description: '무지개 빛깔의 화려한 테두리',
      pencilPrice: 4500,
      category: 'profile',
      subcategory: 'frame',
      icon: 'prism-outline',
      color: '#FF6B9D',
    },
    {
      id: '12',
      name: '플래티넘 프레임',
      description: '고급스러운 플래티넘 테두리',
      ballpenPrice: 40,
      category: 'profile',
      subcategory: 'frame',
      icon: 'star-outline',
      color: '#E5E4E2',
    },
    {
      id: '13',
      name: '그라데이션 배경',
      description: '아름다운 그라데이션 카드 배경',
      pencilPrice: 3500,
      category: 'profile',
      subcategory: 'background',
      icon: 'color-fill',
      color: '#A8E6CF',
    },
    {
      id: '14',
      name: '별빛 배경',
      description: '반짝이는 별들이 가득한 배경',
      pencilPrice: 4000,
      category: 'profile',
      subcategory: 'background',
      icon: 'sparkles',
      color: '#FFD93D',
    },
    {
      id: '15',
      name: '네온 배경',
      description: '사이버펑크 네온 느낌의 배경',
      ballpenPrice: 45,
      category: 'profile',
      subcategory: 'background',
      icon: 'flash',
      color: '#FF6BCB',
    },
    {
      id: '16',
      name: '플래티넘 뱃지',
      description: '고급스러운 플래티넘 뱃지 스킨',
      pencilPrice: 2500,
      category: 'profile',
      subcategory: 'badge',
      icon: 'medal',
      color: '#E5E4E2',
    },
    {
      id: '17',
      name: '다이아 뱃지',
      description: '최고급 다이아몬드 뱃지',
      ballpenPrice: 35,
      category: 'profile',
      subcategory: 'badge',
      icon: 'diamond',
      color: '#B9F2FF',
    },
    {
      id: '18',
      name: '크리스탈 뱃지',
      description: '투명하게 빛나는 크리스탈 뱃지',
      pencilPrice: 3000,
      ballpenPrice: 30,
      category: 'profile',
      subcategory: 'badge',
      icon: 'prism',
      color: '#C3B1E1',
    },
  ];

  const categories = [
    {id: 'all', name: '전체', icon: 'grid'},
    {id: 'profile', name: '프로필', icon: 'person-circle'},
    {id: 'theme', name: '테마', icon: 'color-palette'},
    {id: 'icon', name: '아이콘', icon: 'shapes'},
    {id: 'sound', name: '사운드', icon: 'musical-notes'},
    {id: 'feature', name: '기능', icon: 'sparkles'},
  ];

  const filteredItems = selectedCategory === 'all'
    ? storeItems
    : storeItems.filter(item => item.category === selectedCategory);

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: isDark ? '#121212' : '#FAFAFA'}]}>
      {/* 헤더 */}
      <View style={[styles.header, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
        <View>
          <Text style={[styles.title, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
            {t('store.title')}
          </Text>
          <Text style={[styles.subtitle, {color: isDark ? '#999999' : '#666666'}]}>
            나만의 학습 환경 꾸미기
          </Text>
        </View>
        <View style={styles.currencyContainer}>
          <View style={[styles.coinContainer, {backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5'}]}>
            <PencilIcon size={20} />
            <Text style={[styles.coinText, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
              {pencils.toLocaleString()}
            </Text>
          </View>
          <View style={[styles.coinContainer, {backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5'}]}>
            <BallpenIcon size={20} />
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
                size={20}
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
        contentContainerStyle={[styles.itemsContainer, {paddingBottom: 100}]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {filteredItems.map(item => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.itemCard,
                {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'},
              ]}>
              {/* 아이템 아이콘 */}
              <View style={[styles.itemIconContainer, {backgroundColor: item.color + '20'}]}>
                <Icon name={item.icon} size={32} color={item.color} />
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
                  <Icon name="checkmark" size={14} color="#FFFFFF" />
                  <Text style={styles.ownedText}>보유중</Text>
                </View>
              ) : (
                <View style={styles.pricesWrapper}>
                  {item.pencilPrice && (
                    <View style={[styles.priceContainer, {backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5'}]}>
                      <PencilIcon size={14} />
                      <Text style={[styles.priceText, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                        {item.pencilPrice.toLocaleString()}
                      </Text>
                    </View>
                  )}
                  {item.ballpenPrice && (
                    <View style={[styles.priceContainer, {backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5'}]}>
                      <BallpenIcon size={14} />
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  currencyContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  coinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  coinText: {
    fontSize: 14,
    fontWeight: '700',
  },
  categoryScrollWrapper: {
    height: 76,
    marginBottom: 8,
  },
  categoryScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  categoryContainer: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 8,
    alignItems: 'center',
    height: 76,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 22,
    gap: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    height: 44,
  },
  categoryTabActive: {
    borderColor: 'transparent',
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemsScroll: {
    flex: 1,
  },
  itemsContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  itemCard: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  itemIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemInfo: {
    marginBottom: 12,
    minHeight: 60,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  itemDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  pricesWrapper: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
  },
  ownedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  ownedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default StoreScreen;
