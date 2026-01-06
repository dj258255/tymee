import React, {useState, useEffect, useMemo} from 'react';
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
import {useTranslation} from 'react-i18next';
import {useThemeStore} from '../store/themeStore';
import {safeGetColorScheme, safeAddAppearanceListener} from '../utils/appearance';
import PencilIcon from '../components/PencilIcon';
import BallpenIcon from '../components/BallpenIcon';
import {sp, hp, fp, iconSize} from '../utils/responsive';

interface PaymentHistoryScreenProps {
  onBack?: () => void;
  navigation?: any;
}

type CurrencyType = 'pencil' | 'ballpen';
type TransactionType = 'purchase' | 'spend' | 'earn';

interface PaymentHistory {
  id: string;
  type: TransactionType;
  currency: CurrencyType;
  amount: number;
  title: string;
  description: string;
  source?: string; // 어디서 얻었는지/어디에 썼는지
  date: string;
  status: 'completed' | 'pending' | 'cancelled';
}

type FilterType = 'all' | 'pencil' | 'ballpen';
type TransactionFilter = 'all' | 'earn' | 'spend' | 'purchase';

// 샘플 데이터 - 실제로는 store나 API에서 가져올 것
const HISTORY_DATA: PaymentHistory[] = [
  {
    id: '1',
    type: 'purchase',
    currency: 'ballpen',
    amount: 100,
    title: '볼펜 100개 구매',
    description: '인앱 결제',
    source: 'App Store',
    date: '2025-01-15 14:30',
    status: 'completed',
  },
  {
    id: '2',
    type: 'spend',
    currency: 'ballpen',
    amount: -30,
    title: '라벤더 타이머 테마',
    description: '아이템 상점에서 구매',
    source: '아이템 상점',
    date: '2025-01-15 12:20',
    status: 'completed',
  },
  {
    id: '3',
    type: 'earn',
    currency: 'pencil',
    amount: 50,
    title: '일일 출석 보상',
    description: '7일 연속 출석 보너스',
    source: '출석 체크',
    date: '2025-01-15 09:00',
    status: 'completed',
  },
  {
    id: '4',
    type: 'earn',
    currency: 'pencil',
    amount: 200,
    title: '뽀모도로 완료 보상',
    description: '오늘 8개 뽀모도로 완료',
    source: '뽀모도로 타이머',
    date: '2025-01-14 22:00',
    status: 'completed',
  },
  {
    id: '5',
    type: 'spend',
    currency: 'pencil',
    amount: -2000,
    title: '오션 타이머 테마',
    description: '아이템 상점에서 구매',
    source: '아이템 상점',
    date: '2025-01-14 18:45',
    status: 'completed',
  },
  {
    id: '6',
    type: 'spend',
    currency: 'pencil',
    amount: -3000,
    title: '골드 프레임',
    description: '프로필 카드 테두리',
    source: '아이템 상점',
    date: '2025-01-14 15:30',
    status: 'completed',
  },
  {
    id: '7',
    type: 'earn',
    currency: 'pencil',
    amount: 100,
    title: '레벨업 보상',
    description: '레벨 15 달성!',
    source: '레벨업',
    date: '2025-01-14 12:00',
    status: 'completed',
  },
  {
    id: '8',
    type: 'purchase',
    currency: 'pencil',
    amount: 1000,
    title: '연필 1,000개 구매',
    description: '인앱 결제',
    source: 'App Store',
    date: '2025-01-13 16:20',
    status: 'completed',
  },
  {
    id: '9',
    type: 'earn',
    currency: 'pencil',
    amount: 30,
    title: '친구 초대 보상',
    description: '친구 1명 초대 완료',
    source: '친구 초대',
    date: '2025-01-13 10:15',
    status: 'completed',
  },
  {
    id: '10',
    type: 'spend',
    currency: 'ballpen',
    amount: -50,
    title: '우주 프레임',
    description: '프로필 카드 테두리',
    source: '아이템 상점',
    date: '2025-01-12 20:30',
    status: 'completed',
  },
  {
    id: '11',
    type: 'earn',
    currency: 'pencil',
    amount: 500,
    title: '주간 미션 완료',
    description: '이번 주 공부 목표 달성',
    source: '주간 미션',
    date: '2025-01-12 23:59',
    status: 'completed',
  },
  {
    id: '12',
    type: 'earn',
    currency: 'ballpen',
    amount: 10,
    title: '첫 구매 보너스',
    description: '첫 인앱 결제 감사 선물',
    source: '이벤트',
    date: '2025-01-12 14:00',
    status: 'completed',
  },
];

const PaymentHistoryScreen: React.FC<PaymentHistoryScreenProps> = ({onBack, navigation}) => {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation) {
      navigation.goBack();
    }
  };
  const {t} = useTranslation();
  const [systemColorScheme, setSystemColorScheme] = useState<'light' | 'dark'>('light');
  const [currencyFilter, setCurrencyFilter] = useState<FilterType>('all');
  const [transactionFilter, setTransactionFilter] = useState<TransactionFilter>('all');

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

  // 필터링된 내역
  const filteredHistory = useMemo(() => {
    return HISTORY_DATA.filter(item => {
      // 화폐 필터
      if (currencyFilter !== 'all' && item.currency !== currencyFilter) {
        return false;
      }
      // 거래 유형 필터
      if (transactionFilter !== 'all' && item.type !== transactionFilter) {
        return false;
      }
      return true;
    });
  }, [currencyFilter, transactionFilter]);

  // 요약 계산
  const summary = useMemo(() => {
    const now = new Date();
    const thisMonth = HISTORY_DATA.filter(item => {
      const itemDate = new Date(item.date.replace(' ', 'T'));
      return itemDate.getMonth() === now.getMonth() &&
             itemDate.getFullYear() === now.getFullYear();
    });

    return {
      pencil: {
        earned: thisMonth.filter(i => i.currency === 'pencil' && i.type === 'earn')
          .reduce((sum, i) => sum + i.amount, 0),
        spent: thisMonth.filter(i => i.currency === 'pencil' && i.type === 'spend')
          .reduce((sum, i) => sum + Math.abs(i.amount), 0),
        purchased: thisMonth.filter(i => i.currency === 'pencil' && i.type === 'purchase')
          .reduce((sum, i) => sum + i.amount, 0),
      },
      ballpen: {
        earned: thisMonth.filter(i => i.currency === 'ballpen' && i.type === 'earn')
          .reduce((sum, i) => sum + i.amount, 0),
        spent: thisMonth.filter(i => i.currency === 'ballpen' && i.type === 'spend')
          .reduce((sum, i) => sum + Math.abs(i.amount), 0),
        purchased: thisMonth.filter(i => i.currency === 'ballpen' && i.type === 'purchase')
          .reduce((sum, i) => sum + i.amount, 0),
      },
    };
  }, []);

  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case 'purchase':
        return 'cart';
      case 'spend':
        return 'arrow-up';
      case 'earn':
        return 'arrow-down';
      default:
        return 'help';
    }
  };

  const getTypeColor = (type: TransactionType) => {
    switch (type) {
      case 'purchase':
        return '#007AFF';
      case 'spend':
        return '#FF6B6B';
      case 'earn':
        return '#4CAF50';
      default:
        return '#999999';
    }
  };

  const getTypeLabel = (type: TransactionType) => {
    switch (type) {
      case 'purchase':
        return '구매';
      case 'spend':
        return '사용';
      case 'earn':
        return '획득';
      default:
        return '';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr.replace(' ', 'T'));
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `오늘 ${dateStr.split(' ')[1]}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `어제 ${dateStr.split(' ')[1]}`;
    }
    return dateStr;
  };

  const currencyFilters: {id: FilterType; label: string}[] = [
    {id: 'all', label: '전체'},
    {id: 'pencil', label: '연필'},
    {id: 'ballpen', label: '볼펜'},
  ];

  const transactionFilters: {id: TransactionFilter; label: string; color: string}[] = [
    {id: 'all', label: '전체', color: '#666666'},
    {id: 'earn', label: '획득', color: '#4CAF50'},
    {id: 'spend', label: '사용', color: '#FF6B6B'},
    {id: 'purchase', label: '충전', color: '#007AFF'},
  ];

  const styles = getStyles(isDark);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-back" size={iconSize(24)} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('payment.history')}</Text>
        <View style={{width: sp(40)}} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>

        {/* 화폐 필터 */}
        <View style={styles.filterSection}>
          <View style={styles.filterRow}>
            {currencyFilters.map(filter => (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.filterChip,
                  currencyFilter === filter.id && styles.filterChipActive,
                ]}
                onPress={() => setCurrencyFilter(filter.id)}>
                {filter.id === 'pencil' && <PencilIcon size={iconSize(14)} />}
                {filter.id === 'ballpen' && <BallpenIcon size={iconSize(14)} />}
                {filter.id === 'all' && <Icon name="apps" size={iconSize(14)} color={currencyFilter === filter.id ? '#FFFFFF' : (isDark ? '#AAAAAA' : '#666666')} />}
                <Text style={[
                  styles.filterChipText,
                  currencyFilter === filter.id && styles.filterChipTextActive,
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 요약 카드 */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>이번 달 요약</Text>

          {/* 연필 요약 */}
          {(currencyFilter === 'all' || currencyFilter === 'pencil') && (
            <View style={styles.currencySummary}>
              <View style={styles.currencyHeader}>
                <PencilIcon size={iconSize(18)} />
                <Text style={styles.currencyLabel}>연필</Text>
              </View>
              <View style={styles.summaryStats}>
                <View style={styles.summaryStatItem}>
                  <Text style={[styles.summaryStatValue, {color: '#4CAF50'}]}>
                    +{summary.pencil.earned.toLocaleString()}
                  </Text>
                  <Text style={styles.summaryStatLabel}>획득</Text>
                </View>
                <View style={styles.summaryStatDivider} />
                <View style={styles.summaryStatItem}>
                  <Text style={[styles.summaryStatValue, {color: '#FF6B6B'}]}>
                    -{summary.pencil.spent.toLocaleString()}
                  </Text>
                  <Text style={styles.summaryStatLabel}>사용</Text>
                </View>
                <View style={styles.summaryStatDivider} />
                <View style={styles.summaryStatItem}>
                  <Text style={[styles.summaryStatValue, {color: '#007AFF'}]}>
                    +{summary.pencil.purchased.toLocaleString()}
                  </Text>
                  <Text style={styles.summaryStatLabel}>충전</Text>
                </View>
              </View>
            </View>
          )}

          {/* 볼펜 요약 */}
          {(currencyFilter === 'all' || currencyFilter === 'ballpen') && (
            <View style={[styles.currencySummary, currencyFilter === 'all' && styles.currencySummaryBorder]}>
              <View style={styles.currencyHeader}>
                <BallpenIcon size={iconSize(18)} />
                <Text style={styles.currencyLabel}>볼펜</Text>
              </View>
              <View style={styles.summaryStats}>
                <View style={styles.summaryStatItem}>
                  <Text style={[styles.summaryStatValue, {color: '#4CAF50'}]}>
                    +{summary.ballpen.earned.toLocaleString()}
                  </Text>
                  <Text style={styles.summaryStatLabel}>획득</Text>
                </View>
                <View style={styles.summaryStatDivider} />
                <View style={styles.summaryStatItem}>
                  <Text style={[styles.summaryStatValue, {color: '#FF6B6B'}]}>
                    -{summary.ballpen.spent.toLocaleString()}
                  </Text>
                  <Text style={styles.summaryStatLabel}>사용</Text>
                </View>
                <View style={styles.summaryStatDivider} />
                <View style={styles.summaryStatItem}>
                  <Text style={[styles.summaryStatValue, {color: '#007AFF'}]}>
                    +{summary.ballpen.purchased.toLocaleString()}
                  </Text>
                  <Text style={styles.summaryStatLabel}>충전</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* 거래 유형 필터 */}
        <View style={styles.transactionFilterSection}>
          <Text style={styles.sectionTitle}>상세 내역</Text>
          <View style={styles.transactionFilterRow}>
            {transactionFilters.map(filter => (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.transactionFilterChip,
                  transactionFilter === filter.id && {
                    backgroundColor: filter.color + '20',
                    borderColor: filter.color,
                  },
                ]}
                onPress={() => setTransactionFilter(filter.id)}>
                <Text style={[
                  styles.transactionFilterText,
                  transactionFilter === filter.id && {color: filter.color},
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* History List */}
        <View style={styles.historySection}>
          {filteredHistory.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="receipt-outline" size={iconSize(48)} color={isDark ? '#444444' : '#CCCCCC'} />
              <Text style={styles.emptyText}>해당 조건의 내역이 없습니다</Text>
            </View>
          ) : (
            filteredHistory.map((item) => (
              <View key={item.id} style={styles.historyCard}>
                {/* 화폐 아이콘 + 타입 표시 */}
                <View style={styles.historyIconWrapper}>
                  <View
                    style={[
                      styles.typeIcon,
                      {backgroundColor: getTypeColor(item.type) + '20'},
                    ]}>
                    <Icon
                      name={getTypeIcon(item.type)}
                      size={iconSize(18)}
                      color={getTypeColor(item.type)}
                    />
                  </View>
                  <View style={styles.currencyBadge}>
                    {item.currency === 'pencil' ? (
                      <PencilIcon size={iconSize(12)} />
                    ) : (
                      <BallpenIcon size={iconSize(12)} />
                    )}
                  </View>
                </View>

                <View style={styles.historyInfo}>
                  {/* 제목 + 태그 */}
                  <View style={styles.historyTop}>
                    <Text style={styles.historyTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <View
                      style={[
                        styles.typeTag,
                        {backgroundColor: getTypeColor(item.type) + '20'},
                      ]}>
                      <Text
                        style={[
                          styles.typeTagText,
                          {color: getTypeColor(item.type)},
                        ]}>
                        {getTypeLabel(item.type)}
                      </Text>
                    </View>
                  </View>

                  {/* 설명 + 출처 */}
                  <View style={styles.historyMiddle}>
                    <Text style={styles.historyDescription} numberOfLines={1}>
                      {item.description}
                    </Text>
                    {item.source && (
                      <View style={styles.sourceContainer}>
                        <Icon name="location-outline" size={iconSize(10)} color={isDark ? '#666666' : '#999999'} />
                        <Text style={styles.sourceText}>{item.source}</Text>
                      </View>
                    )}
                  </View>

                  {/* 날짜 + 금액 */}
                  <View style={styles.historyBottom}>
                    <Text style={styles.historyDate}>{formatDate(item.date)}</Text>
                    <View style={styles.amountRow}>
                      <Text
                        style={[
                          styles.historyAmount,
                          {color: getTypeColor(item.type)},
                        ]}>
                        {item.amount > 0 ? '+' : ''}
                        {item.amount.toLocaleString()}
                      </Text>
                      {item.currency === 'pencil' ? (
                        <PencilIcon size={iconSize(14)} />
                      ) : (
                        <BallpenIcon size={iconSize(14)} />
                      )}
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* 하단 여백 */}
        <View style={{height: hp(40)}} />
      </ScrollView>
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
      padding: sp(16),
    },
    // 필터 스타일
    filterSection: {
      marginBottom: hp(16),
    },
    filterRow: {
      flexDirection: 'row',
      gap: sp(8),
    },
    filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: sp(14),
      paddingVertical: hp(8),
      borderRadius: sp(20),
      backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#2A2A2A' : '#E0E0E0',
      gap: sp(6),
    },
    filterChipActive: {
      backgroundColor: '#007AFF',
      borderColor: '#007AFF',
    },
    filterChipText: {
      fontSize: fp(13),
      fontWeight: '600',
      color: isDark ? '#AAAAAA' : '#666666',
    },
    filterChipTextActive: {
      color: '#FFFFFF',
    },
    // 요약 카드
    summaryCard: {
      backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
      borderRadius: sp(16),
      padding: sp(16),
      marginBottom: hp(20),
      borderWidth: 1,
      borderColor: isDark ? '#2A2A2A' : '#E0E0E0',
    },
    summaryTitle: {
      fontSize: fp(16),
      fontWeight: '700',
      color: isDark ? '#FFFFFF' : '#1A1A1A',
      marginBottom: hp(16),
    },
    currencySummary: {
      paddingVertical: hp(12),
    },
    currencySummaryBorder: {
      borderTopWidth: 1,
      borderTopColor: isDark ? '#2A2A2A' : '#E0E0E0',
      marginTop: hp(8),
    },
    currencyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp(8),
      marginBottom: hp(12),
    },
    currencyLabel: {
      fontSize: fp(14),
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#1A1A1A',
    },
    summaryStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    summaryStatItem: {
      alignItems: 'center',
      flex: 1,
    },
    summaryStatValue: {
      fontSize: fp(16),
      fontWeight: '700',
    },
    summaryStatLabel: {
      fontSize: fp(11),
      color: isDark ? '#888888' : '#999999',
      marginTop: hp(4),
    },
    summaryStatDivider: {
      width: 1,
      height: hp(30),
      backgroundColor: isDark ? '#2A2A2A' : '#E0E0E0',
    },
    // 거래 유형 필터
    transactionFilterSection: {
      marginBottom: hp(12),
    },
    sectionTitle: {
      fontSize: fp(16),
      fontWeight: '700',
      color: isDark ? '#FFFFFF' : '#1A1A1A',
      marginBottom: hp(12),
    },
    transactionFilterRow: {
      flexDirection: 'row',
      gap: sp(8),
    },
    transactionFilterChip: {
      paddingHorizontal: sp(14),
      paddingVertical: hp(6),
      borderRadius: sp(16),
      backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#2A2A2A' : '#E0E0E0',
    },
    transactionFilterText: {
      fontSize: fp(12),
      fontWeight: '600',
      color: isDark ? '#AAAAAA' : '#666666',
    },
    // 내역 리스트
    historySection: {
      gap: sp(10),
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: hp(40),
    },
    emptyText: {
      fontSize: fp(14),
      color: isDark ? '#666666' : '#999999',
      marginTop: hp(12),
    },
    historyCard: {
      backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
      borderRadius: sp(12),
      padding: sp(14),
      flexDirection: 'row',
      gap: sp(12),
      borderWidth: 1,
      borderColor: isDark ? '#2A2A2A' : '#E0E0E0',
    },
    historyIconWrapper: {
      position: 'relative',
    },
    typeIcon: {
      width: sp(44),
      height: sp(44),
      borderRadius: sp(22),
      justifyContent: 'center',
      alignItems: 'center',
    },
    currencyBadge: {
      position: 'absolute',
      bottom: -hp(2),
      right: -sp(2),
      width: sp(20),
      height: sp(20),
      borderRadius: sp(10),
      backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: isDark ? '#2A2A2A' : '#E0E0E0',
    },
    historyInfo: {
      flex: 1,
      gap: hp(6),
    },
    historyTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    historyTitle: {
      fontSize: fp(15),
      fontWeight: '700',
      color: isDark ? '#FFFFFF' : '#1A1A1A',
      flex: 1,
      marginRight: sp(8),
    },
    typeTag: {
      paddingHorizontal: sp(8),
      paddingVertical: hp(3),
      borderRadius: sp(6),
    },
    typeTagText: {
      fontSize: fp(10),
      fontWeight: '700',
    },
    historyMiddle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp(8),
    },
    historyDescription: {
      fontSize: fp(12),
      color: isDark ? '#AAAAAA' : '#666666',
      flex: 1,
    },
    sourceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp(3),
      backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
      paddingHorizontal: sp(6),
      paddingVertical: hp(2),
      borderRadius: sp(4),
    },
    sourceText: {
      fontSize: fp(10),
      color: isDark ? '#888888' : '#999999',
    },
    historyBottom: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    historyDate: {
      fontSize: fp(11),
      color: isDark ? '#666666' : '#999999',
    },
    amountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp(4),
    },
    historyAmount: {
      fontSize: fp(16),
      fontWeight: '700',
    },
  });

export default PaymentHistoryScreen;
