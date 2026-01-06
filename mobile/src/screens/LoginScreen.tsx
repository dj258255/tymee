import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  InteractionManager,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import Svg, {Path} from 'react-native-svg';
import {useThemeStore} from '../store/themeStore';
import {safeGetColorScheme, safeAddAppearanceListener} from '../utils/appearance';
import {signInWithGoogle} from '../services/googleAuth';
import {signInWithApple, isAppleAuthSupported} from '../services/appleAuth';
import {signInWithKakao} from '../services/kakaoAuth';

// 카카오 아이콘 컴포넌트
const KakaoIcon = ({size = 20}: {size?: number}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M12 3C6.477 3 2 6.477 2 10.5c0 2.47 1.607 4.647 4.041 5.882l-.633 3.089a.3.3 0 0 0 .457.319l3.687-2.318c.787.108 1.6.128 2.448.028 5.523 0 10-3.477 10-7.5S17.523 3 12 3z"
      fill="#000000"
    />
  </Svg>
);

interface LoginScreenProps {
  onLogin: (user: {email: string; name: string}) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({onLogin}) => {
  const [systemColorScheme, setSystemColorScheme] = useState<'light' | 'dark'>('light');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

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

  const handleSocialLogin = async (provider: 'google' | 'apple' | 'kakao') => {
    setIsLoading(true);
    setLoadingProvider(provider);
    try {
      let token: string | null = null;
      let userName: string = '';
      let userEmail: string = '';

      if (provider === 'google') {
        const result = await signInWithGoogle();
        if (result) {
          token = result.idToken;
          userName = result.user?.user.name ?? 'Google 사용자';
          userEmail = result.user?.user.email ?? '';
        }
      } else if (provider === 'apple') {
        const result = await signInWithApple();
        if (result) {
          token = result.idToken;
          userName = result.user.name ?? 'Apple 사용자';
          userEmail = result.user.email ?? '';
        }
      } else if (provider === 'kakao') {
        const result = await signInWithKakao();
        if (result) {
          token = result.accessToken;
          userName = result.user.nickname ?? '카카오 사용자';
          userEmail = result.user.email ?? '';
        }
      }

      if (token) {
        // TODO: 백엔드로 토큰 전송하여 검증 후 자체 JWT 발급받기
        // const response = await api.post(`/auth/login/${provider}`, { token, deviceId });
        onLogin({
          email: userEmail,
          name: userName,
        });
      }
    } catch (error) {
      Alert.alert('로그인 실패', '다시 시도해주세요.');
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  const styles = getStyles(isDark);

  return (
    <SafeAreaView style={styles.container}>
      {/* 상단: 로고 & 앱 이름 */}
      <View style={styles.headerSection}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/app-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.appName}>Tymee</Text>
        <Text style={styles.tagline}>집중의 시작, 타이미와 함께</Text>
      </View>

      {/* 하단: 소셜 로그인 버튼들 */}
      <View style={styles.bottomSection}>
        <Text style={styles.loginGuide}>SNS 계정으로 간편하게 시작하세요</Text>

        <View style={styles.socialButtons}>
          {/* 카카오 로그인 */}
          <TouchableOpacity
            style={[styles.socialButton, styles.kakaoButton]}
            onPress={() => handleSocialLogin('kakao')}
            disabled={isLoading}>
            {loadingProvider === 'kakao' ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <>
                <KakaoIcon size={20} />
                <Text style={[styles.socialButtonText, styles.kakaoText]}>
                  카카오로 시작하기
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Apple 로그인 (iOS만, iOS 13+) */}
          {Platform.OS === 'ios' && isAppleAuthSupported() && (
            <TouchableOpacity
              style={[styles.socialButton, styles.appleButton]}
              onPress={() => handleSocialLogin('apple')}
              disabled={isLoading}>
              {loadingProvider === 'apple' ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Icon name="logo-apple" size={22} color="#FFFFFF" />
                  <Text style={[styles.socialButtonText, styles.appleText]}>
                    Apple로 시작하기
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Google 로그인 */}
          <TouchableOpacity
            style={[styles.socialButton, styles.googleButton, {borderColor: isDark ? '#333333' : '#E0E0E0'}]}
            onPress={() => handleSocialLogin('google')}
            disabled={isLoading}>
            {loadingProvider === 'google' ? (
              <ActivityIndicator color={isDark ? '#FFFFFF' : '#1A1A1A'} />
            ) : (
              <>
                <Icon name="logo-google" size={20} color="#EA4335" />
                <Text style={[styles.socialButtonText, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
                  Google로 시작하기
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.termsText}>
          시작하면 <Text style={styles.termsLink}>서비스 이용약관</Text> 및{' '}
          <Text style={styles.termsLink}>개인정보 처리방침</Text>에 동의하게 됩니다.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#121212' : '#FFFFFF',
    },
    headerSection: {
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: 60,
      marginBottom: 40,
    },
    logoContainer: {
      width: 120,
      height: 120,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },
    logoImage: {
      width: 80,
      height: 80,
    },
    appName: {
      fontSize: 36,
      fontWeight: '800',
      color: isDark ? '#FFFFFF' : '#1A1A1A',
      marginBottom: 8,
      letterSpacing: -0.5,
    },
    tagline: {
      fontSize: 16,
      color: isDark ? '#888888' : '#666666',
      fontWeight: '500',
    },
    bottomSection: {
      paddingHorizontal: 24,
    },
    loginGuide: {
      fontSize: 14,
      color: isDark ? '#666666' : '#999999',
      textAlign: 'center',
      marginBottom: 20,
    },
    socialButtons: {
      gap: 12,
    },
    socialButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      borderRadius: 12,
      gap: 10,
    },
    kakaoButton: {
      backgroundColor: '#FEE500',
    },
    kakaoText: {
      color: '#000000',
    },
    appleButton: {
      backgroundColor: '#000000',
    },
    appleText: {
      color: '#FFFFFF',
    },
    googleButton: {
      backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
      borderWidth: 1,
    },
    socialButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    termsText: {
      fontSize: 12,
      color: isDark ? '#666666' : '#999999',
      textAlign: 'center',
      marginTop: 24,
      lineHeight: 18,
    },
    termsLink: {
      color: isDark ? '#888888' : '#666666',
      textDecorationLine: 'underline',
    },
  });

export default LoginScreen;
