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
import BallpenIcon from '../components/BallpenIcon';

interface BuyBallpensScreenProps {
  onBack: () => void;
}

interface BallpenPackage {
  id: string;
  amount: number;
  price: number;
  bonus?: number;
  popular?: boolean;
}

const BuyBallpensScreen: React.FC<BuyBallpensScreenProps> = ({onBack}) => {
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

  const packages: BallpenPackage[] = [
    {id: '1', amount: 10, price: 1100},
    {id: '2', amount: 50, price: 5500, bonus: 5},
    {id: '3', amount: 100, price: 11000, bonus: 15, popular: true},
    {id: '4', amount: 300, price: 33000, bonus: 50},
    {id: '5', amount: 500, price: 55000, bonus: 100},
    {id: '6', amount: 1000, price: 110000, bonus: 250},
  ];

  const styles = getStyles(isDark);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('payment.buyBallpens')}</Text>
        <View style={{width: 40}} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Current Balance */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>현재 보유</Text>
          <View style={styles.balanceAmount}>
            <Text style={styles.balanceNumber}>350</Text>
            <BallpenIcon size={24} />
          </View>
        </View>

        {/* Packages */}
        <View style={styles.packagesSection}>
          <Text style={styles.sectionTitle}>볼펜 패키지</Text>
          {packages.map((pkg) => (
            <TouchableOpacity key={pkg.id} style={styles.packageCard}>
              {pkg.popular && (
                <View style={styles.popularBadge}>
                  <Icon name="star" size={12} color="#FFFFFF" />
                  <Text style={styles.popularText}>인기</Text>
                </View>
              )}
              <View style={styles.packageLeft}>
                <BallpenIcon size={40} />
                <View style={styles.packageInfo}>
                  <View style={styles.amountRow}>
                    <Text style={styles.packageAmount}>
                      {pkg.amount.toLocaleString()}
                    </Text>
                    <BallpenIcon size={20} />
                  </View>
                  {pkg.bonus && (
                    <View style={styles.bonusTag}>
                      <Icon name="gift" size={12} color="#4CAF50" />
                      <Text style={styles.bonusText}>
                        +{pkg.bonus.toLocaleString()} 보너스
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.packageRight}>
                <Text style={styles.priceText}>₩{pkg.price.toLocaleString()}</Text>
                <View style={styles.buyButton}>
                  <Text style={styles.buyButtonText}>구매</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Notice */}
        <View style={styles.noticeSection}>
          <Text style={styles.noticeTitle}>구매 안내</Text>
          <Text style={styles.noticeText}>• 구매한 볼펜은 즉시 지급됩니다.</Text>
          <Text style={styles.noticeText}>
            • 결제는 안전하게 보호됩니다.
          </Text>
          <Text style={styles.noticeText}>
            • 구매 후 7일 이내 환불 가능합니다.
          </Text>
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
    balanceCard: {
      backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
      borderRadius: 16,
      padding: 24,
      marginBottom: 24,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: isDark ? '#7EB6FF' : '#4A9AFF',
    },
    balanceLabel: {
      fontSize: 14,
      color: isDark ? '#AAAAAA' : '#666666',
      marginBottom: 8,
    },
    balanceAmount: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    balanceNumber: {
      fontSize: 32,
      fontWeight: '800',
      color: isDark ? '#7EB6FF' : '#4A9AFF',
    },
    packagesSection: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: isDark ? '#FFFFFF' : '#1A1A1A',
      marginBottom: 16,
    },
    packageCard: {
      backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: isDark ? '#2A2A2A' : '#E0E0E0',
      position: 'relative',
    },
    popularBadge: {
      position: 'absolute',
      top: -8,
      left: 12,
      backgroundColor: '#FF6B6B',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    popularText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    packageLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    packageInfo: {
      gap: 6,
    },
    amountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    packageAmount: {
      fontSize: 20,
      fontWeight: '700',
      color: isDark ? '#FFFFFF' : '#1A1A1A',
    },
    bonusTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: isDark ? '#1A3A1A' : '#E8F5E9',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    bonusText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#4CAF50',
    },
    packageRight: {
      alignItems: 'flex-end',
      gap: 8,
    },
    priceText: {
      fontSize: 16,
      fontWeight: '700',
      color: isDark ? '#FFFFFF' : '#1A1A1A',
    },
    buyButton: {
      backgroundColor: '#007AFF',
      paddingHorizontal: 20,
      paddingVertical: 8,
      borderRadius: 8,
    },
    buyButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    noticeSection: {
      backgroundColor: isDark ? '#1E1E1E' : '#F5F5F5',
      borderRadius: 12,
      padding: 16,
      gap: 8,
    },
    noticeTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: isDark ? '#FFFFFF' : '#1A1A1A',
      marginBottom: 4,
    },
    noticeText: {
      fontSize: 13,
      color: isDark ? '#AAAAAA' : '#666666',
      lineHeight: 20,
    },
  });

export default BuyBallpensScreen;
