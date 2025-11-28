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
import {useTranslation} from 'react-i18next';
import {useThemeStore} from '../store/themeStore';
import {safeGetColorScheme, safeAddAppearanceListener} from '../utils/appearance';
import PencilIcon from '../components/PencilIcon';

interface PaymentHistoryScreenProps {
  onBack: () => void;
}

interface PaymentHistory {
  id: string;
  type: 'purchase' | 'spend' | 'earn';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'cancelled';
}

const PaymentHistoryScreen: React.FC<PaymentHistoryScreenProps> = ({onBack}) => {
  const {t} = useTranslation();
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

  const history: PaymentHistory[] = [
    {
      id: '1',
      type: 'purchase',
      amount: 1000,
      description: '연필 1,000개 구매',
      date: '2025-01-15 14:30',
      status: 'completed',
    },
    {
      id: '2',
      type: 'spend',
      amount: -50,
      description: '프로필 테마 구매',
      date: '2025-01-14 10:15',
      status: 'completed',
    },
    {
      id: '3',
      type: 'earn',
      amount: 100,
      description: '일일 출석 보상',
      date: '2025-01-14 09:00',
      status: 'completed',
    },
    {
      id: '4',
      type: 'spend',
      amount: -200,
      description: '닉네임 카드 구매',
      date: '2025-01-13 18:45',
      status: 'completed',
    },
    {
      id: '5',
      type: 'purchase',
      amount: 500,
      description: '연필 500개 구매',
      date: '2025-01-12 16:20',
      status: 'completed',
    },
    {
      id: '6',
      type: 'earn',
      amount: 50,
      description: '레벨업 보상',
      date: '2025-01-11 12:30',
      status: 'completed',
    },
  ];

  const getTypeIcon = (type: string) => {
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

  const getTypeColor = (type: string) => {
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

  const getTypeLabel = (type: string) => {
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

  const styles = getStyles(isDark);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('payment.history')}</Text>
        <View style={{width: 40}} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>이번 달 총 구매</Text>
            <View style={styles.summaryAmount}>
              <Text style={[styles.summaryNumber, {color: '#007AFF'}]}>
                +1,500
              </Text>
              <PencilIcon size={16} />
            </View>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>이번 달 총 사용</Text>
            <View style={styles.summaryAmount}>
              <Text style={[styles.summaryNumber, {color: '#FF6B6B'}]}>
                -250
              </Text>
              <PencilIcon size={16} />
            </View>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>이번 달 총 획득</Text>
            <View style={styles.summaryAmount}>
              <Text style={[styles.summaryNumber, {color: '#4CAF50'}]}>
                +150
              </Text>
              <PencilIcon size={16} />
            </View>
          </View>
        </View>

        {/* History List */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>최근 내역</Text>
          {history.map((item) => (
            <View key={item.id} style={styles.historyCard}>
              <View
                style={[
                  styles.typeIcon,
                  {backgroundColor: getTypeColor(item.type) + '20'},
                ]}>
                <Icon
                  name={getTypeIcon(item.type)}
                  size={20}
                  color={getTypeColor(item.type)}
                />
              </View>
              <View style={styles.historyInfo}>
                <View style={styles.historyTop}>
                  <Text style={styles.historyDescription}>
                    {item.description}
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
                <View style={styles.historyBottom}>
                  <Text style={styles.historyDate}>{item.date}</Text>
                  <View style={styles.amountRow}>
                    <Text
                      style={[
                        styles.historyAmount,
                        {
                          color: getTypeColor(item.type),
                        },
                      ]}>
                      {item.amount > 0 ? '+' : ''}
                      {item.amount.toLocaleString()}
                    </Text>
                    <PencilIcon size={14} />
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
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
      padding: 16,
    },
    summaryCard: {
      backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: isDark ? '#2A2A2A' : '#E0E0E0',
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    summaryLabel: {
      fontSize: 14,
      color: isDark ? '#AAAAAA' : '#666666',
    },
    summaryAmount: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    summaryNumber: {
      fontSize: 16,
      fontWeight: '700',
    },
    summaryDivider: {
      height: 1,
      backgroundColor: isDark ? '#2A2A2A' : '#E0E0E0',
      marginVertical: 8,
    },
    historySection: {
      gap: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: isDark ? '#FFFFFF' : '#1A1A1A',
      marginBottom: 4,
    },
    historyCard: {
      backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      gap: 12,
      borderWidth: 1,
      borderColor: isDark ? '#2A2A2A' : '#E0E0E0',
    },
    typeIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
    },
    historyInfo: {
      flex: 1,
      gap: 8,
    },
    historyTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    historyDescription: {
      fontSize: 15,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#1A1A1A',
      flex: 1,
    },
    typeTag: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    typeTagText: {
      fontSize: 11,
      fontWeight: '700',
    },
    historyBottom: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    historyDate: {
      fontSize: 12,
      color: isDark ? '#888888' : '#999999',
    },
    amountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    historyAmount: {
      fontSize: 16,
      fontWeight: '700',
    },
  });

export default PaymentHistoryScreen;
