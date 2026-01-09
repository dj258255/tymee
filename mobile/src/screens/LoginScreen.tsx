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
  Modal,
  ScrollView,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import Svg, {Path} from 'react-native-svg';
import {useThemeStore} from '../store/themeStore';
import {useAuthStore} from '../store/authStore';
import {safeGetColorScheme, safeAddAppearanceListener} from '../utils/appearance';
import {signInWithGoogle} from '../services/googleAuth';
import {signInWithApple, isAppleAuthSupported} from '../services/appleAuth';
import {signInWithKakao} from '../services/kakaoAuth';
import type {OAuthProvider} from '../services/authService';

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
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const {loginWithOAuth, error, clearError} = useAuthStore();

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

  useEffect(() => {
    if (error) {
      Alert.alert('로그인 실패', error);
      clearError();
    }
  }, [error, clearError]);

  const {themeMode} = useThemeStore();

  const isDark =
    themeMode === 'system'
      ? systemColorScheme === 'dark'
      : themeMode === 'dark';

  const handleSocialLogin = async (provider: OAuthProvider) => {
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
        // 백엔드 API로 로그인 시도
        const success = await loginWithOAuth(provider, token);

        if (!success) {
          // 백엔드 연동 실패시 로컬 로그인 (개발/테스트용)
          onLogin({
            email: userEmail,
            name: userName,
          });
        }
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
          시작하면{' '}
          <Text style={styles.termsLink} onPress={() => setShowTermsModal(true)}>
            서비스 이용약관
          </Text>{' '}
          및{' '}
          <Text style={styles.termsLink} onPress={() => setShowPrivacyModal(true)}>
            개인정보 처리방침
          </Text>
          에 동의하게 됩니다.
        </Text>
      </View>

      {/* 서비스 이용약관 모달 */}
      <Modal
        visible={showTermsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTermsModal(false)}>
        <TermsOfServiceContent
          isDark={isDark}
          onClose={() => setShowTermsModal(false)}
        />
      </Modal>

      {/* 개인정보 처리방침 모달 */}
      <Modal
        visible={showPrivacyModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPrivacyModal(false)}>
        <PrivacyPolicyContent
          isDark={isDark}
          onClose={() => setShowPrivacyModal(false)}
        />
      </Modal>
    </SafeAreaView>
  );
};

// 서비스 이용약관 컴포넌트
const TermsOfServiceContent: React.FC<{isDark: boolean; onClose: () => void}> = ({
  isDark,
  onClose,
}) => {
  const styles = getModalStyles(isDark);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>서비스 이용약관</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Icon name="close" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>제1조 (목적)</Text>
        <Text style={styles.text}>
          이 약관은 Tymee 앱 개발자(이하 "개발자")가 제공하는 집중 타이머 및 학습 관리 서비스(이하 "서비스")의 이용과 관련하여 개발자와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
        </Text>

        <Text style={styles.sectionTitle}>제2조 (정의)</Text>
        <Text style={styles.text}>
          1. "서비스"란 개발자가 제공하는 모바일 애플리케이션을 통해 이용 가능한 집중 타이머, 학습 기록, 커뮤니티 기능 등 관련 제반 서비스를 의미합니다.{'\n'}
          2. "이용자"란 본 약관에 따라 서비스를 이용하는 회원 및 비회원을 말합니다.{'\n'}
          3. "회원"이란 개발자에게 개인정보를 제공하여 회원등록을 한 자로서, 서비스를 계속적으로 이용할 수 있는 자를 말합니다.
        </Text>

        <Text style={styles.sectionTitle}>제3조 (약관의 게시와 개정)</Text>
        <Text style={styles.text}>
          1. 개발자는 이 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 내에 게시합니다.{'\n'}
          2. 개발자는 필요한 경우 관련 법령을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.{'\n'}
          3. 개발자가 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 현행약관과 함께 서비스 내에 그 적용일자 7일 전부터 공지합니다.
        </Text>

        <Text style={styles.sectionTitle}>제4조 (서비스의 제공)</Text>
        <Text style={styles.text}>
          개발자는 다음과 같은 서비스를 제공합니다:{'\n'}
          1. 뽀모도로 타이머 및 집중 모드 기능{'\n'}
          2. 학습 시간 기록 및 통계 서비스{'\n'}
          3. 그룹 학습 및 커뮤니티 기능{'\n'}
          4. 앱 차단 및 집중 도우미 기능{'\n'}
          5. 기타 개발자가 추가 개발하여 이용자에게 제공하는 서비스
        </Text>

        <Text style={styles.sectionTitle}>제5조 (회원가입)</Text>
        <Text style={styles.text}>
          1. 이용자는 소셜 로그인(카카오, 애플, 구글)을 통해 이 약관에 동의한다는 의사표시를 함으로써 회원가입을 신청합니다.{'\n'}
          2. 개발자는 제1항과 같이 회원으로 가입할 것을 신청한 이용자 중 다음 각 호에 해당하지 않는 한 회원으로 등록합니다.
        </Text>

        <Text style={styles.sectionTitle}>제6조 (회원 탈퇴 및 자격 상실)</Text>
        <Text style={styles.text}>
          1. 회원은 앱 내 설정 메뉴를 통해 언제든지 탈퇴를 요청할 수 있습니다.{'\n'}
          2. 탈퇴 요청 시 회원 계정 및 관련 데이터는 삭제 처리됩니다.{'\n'}
          3. 단, 부정 이용 방지 및 법령상 의무 이행을 위해 일부 정보는 관련 법령에서 정한 기간 동안 보관될 수 있습니다. (개인정보 처리방침 참조){'\n'}
          4. 회원이 다음 각 호의 사유에 해당하는 경우, 개발자는 회원자격을 제한 및 정지시킬 수 있습니다:{'\n'}
          - 가입 신청 시에 허위 내용을 등록한 경우{'\n'}
          - 다른 사람의 서비스 이용을 방해하거나 그 정보를 도용하는 경우{'\n'}
          - 서비스를 이용하여 법령 또는 이 약관이 금지하거나 공서양속에 반하는 행위를 하는 경우{'\n'}
          - 타 이용자에게 불쾌감을 주는 콘텐츠를 게시하는 경우
        </Text>

        <Text style={styles.sectionTitle}>제7조 (회원에 대한 통지)</Text>
        <Text style={styles.text}>
          1. 개발자가 회원에 대한 통지를 하는 경우, 회원이 등록한 이메일 주소 또는 푸시 알림으로 할 수 있습니다.{'\n'}
          2. 개발자는 불특정다수 회원에 대한 통지의 경우 7일 이상 서비스 내 공지사항에 게시함으로써 개별 통지에 갈음할 수 있습니다.
        </Text>

        <Text style={styles.sectionTitle}>제8조 (이용자의 의무)</Text>
        <Text style={styles.text}>
          이용자는 다음 행위를 하여서는 안 됩니다:{'\n'}
          1. 신청 또는 변경 시 허위 내용의 등록{'\n'}
          2. 타인의 정보 도용{'\n'}
          3. 개발자가 게시한 정보의 무단 변경{'\n'}
          4. 개발자가 허용하지 않은 정보(컴퓨터 프로그램 등)의 송신 또는 게시{'\n'}
          5. 개발자 및 제3자의 저작권 등 지적재산권에 대한 침해{'\n'}
          6. 개발자 및 제3자의 명예를 손상시키거나 업무를 방해하는 행위{'\n'}
          7. 외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 서비스에 게시하는 행위
        </Text>

        <Text style={styles.sectionTitle}>제9조 (저작권의 귀속)</Text>
        <Text style={styles.text}>
          1. 서비스에 의해 작성된 저작물에 대한 저작권 기타 지적재산권은 개발자에게 귀속합니다.{'\n'}
          2. 이용자는 서비스를 이용함으로써 얻은 정보 중 개발자에게 지적재산권이 귀속된 정보를 개발자의 사전 승낙 없이 복제, 송신, 출판, 배포 기타 방법에 의하여 영리목적으로 이용하거나 제3자에게 이용하게 하여서는 안됩니다.
        </Text>

        <Text style={styles.sectionTitle}>제10조 (면책조항)</Text>
        <Text style={styles.text}>
          1. 개발자는 천재지변, 기간통신사업자의 서비스 중지 및 기타 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 대한 책임이 면제됩니다.{'\n'}
          2. 개발자는 이용자의 귀책사유로 인한 서비스 이용 장애에 대하여 책임을 지지 않습니다.{'\n'}
          3. 개발자는 이용자가 서비스를 이용하여 기대하는 수익을 얻지 못한 것에 대하여 책임을 지지 않습니다.{'\n'}
          4. 본 서비스는 무료로 제공되며, 개발자는 서비스의 중단, 변경, 종료에 대해 책임을 지지 않습니다.
        </Text>

        <Text style={styles.sectionTitle}>제11조 (분쟁해결)</Text>
        <Text style={styles.text}>
          1. 개발자는 이용자가 제기하는 정당한 의견이나 불만을 반영하기 위해 노력합니다.{'\n'}
          2. 개발자와 이용자 간에 발생한 분쟁에 관한 소송은 대한민국 법원을 관할 법원으로 합니다.
        </Text>

        <Text style={styles.sectionTitle}>부칙</Text>
        <Text style={styles.text}>
          본 약관은 2025년 1월 1일부터 시행됩니다.
        </Text>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

// 개인정보 처리방침 컴포넌트
const PrivacyPolicyContent: React.FC<{isDark: boolean; onClose: () => void}> = ({
  isDark,
  onClose,
}) => {
  const styles = getModalStyles(isDark);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>개인정보 처리방침</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Icon name="close" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.text}>
          Tymee 앱 개발자(이하 "개발자")는 개인정보보호법, 정보통신망 이용촉진 및 정보보호 등에 관한 법률 등 관련 법령에 따라 이용자의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 다음과 같이 개인정보 처리방침을 수립·공개합니다.
        </Text>

        <Text style={styles.sectionTitle}>제1조 (개인정보의 수집 항목)</Text>
        <Text style={styles.text}>
          개발자는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다:{'\n\n'}
          <Text style={styles.bold}>1. 필수 수집 항목</Text>{'\n'}
          - 소셜 로그인 정보: 이메일, 이름(닉네임), 프로필 사진{'\n'}
          - 서비스 이용 기록: 학습 시간, 집중 기록, 앱 사용 패턴{'\n'}
          - 기기 정보: 기기 식별자(Device ID), OS 버전{'\n\n'}
          <Text style={styles.bold}>2. 선택 수집 항목</Text>{'\n'}
          - 프로필 정보: 상태 메시지, 사용자 설정 프로필 이미지{'\n'}
          - 알림 관련 정보: 푸시 알림 토큰
        </Text>

        <Text style={styles.sectionTitle}>제2조 (개인정보의 수집 방법)</Text>
        <Text style={styles.text}>
          개발자는 다음과 같은 방법으로 개인정보를 수집합니다:{'\n'}
          1. 소셜 로그인(카카오, 애플, 구글)을 통한 회원가입 시{'\n'}
          2. 서비스 이용 과정에서 자동 수집
        </Text>

        <Text style={styles.sectionTitle}>제3조 (개인정보의 이용 목적)</Text>
        <Text style={styles.text}>
          개발자는 수집한 개인정보를 다음의 목적으로 이용합니다:{'\n\n'}
          <Text style={styles.bold}>1. 서비스 제공</Text>{'\n'}
          - 회원 식별 및 본인 인증{'\n'}
          - 학습 기록 저장 및 통계 제공{'\n'}
          - 그룹 학습 및 커뮤니티 기능 제공{'\n\n'}
          <Text style={styles.bold}>2. 서비스 개선</Text>{'\n'}
          - 서비스 이용 통계 분석{'\n'}
          - 신규 서비스 개발 및 기존 서비스 개선
        </Text>

        <Text style={styles.sectionTitle}>제4조 (개인정보의 보유 및 이용 기간)</Text>
        <Text style={styles.text}>
          1. 개발자는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의 받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.{'\n\n'}
          2. 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다:{'\n'}
          - 회원 정보: 회원 탈퇴 시 즉시 삭제{'\n'}
          - 학습 기록: 회원 탈퇴 시 즉시 삭제{'\n'}
          - 부정 이용 방지 기록: 탈퇴 후 30일 (부정 이용 방지 목적){'\n\n'}
          3. 관계 법령에 의해 보존이 필요한 경우:{'\n'}
          - 계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래법){'\n'}
          - 대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래법){'\n'}
          - 소비자의 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래법){'\n'}
          - 표시/광고에 관한 기록: 6개월 (전자상거래법){'\n'}
          - 접속 로그 기록: 3개월 (통신비밀보호법)
        </Text>

        <Text style={styles.sectionTitle}>제5조 (개인정보의 제3자 제공)</Text>
        <Text style={styles.text}>
          개발자는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다:{'\n'}
          1. 이용자가 사전에 동의한 경우{'\n'}
          2. 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우
        </Text>

        <Text style={styles.sectionTitle}>제6조 (개인정보의 파기)</Text>
        <Text style={styles.text}>
          1. 개발자는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.{'\n\n'}
          2. 파기 방법:{'\n'}
          - 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제
        </Text>

        <Text style={styles.sectionTitle}>제7조 (이용자의 권리와 행사 방법)</Text>
        <Text style={styles.text}>
          1. 이용자는 개발자에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다:{'\n'}
          - 개인정보 열람 요구{'\n'}
          - 오류 등이 있을 경우 정정 요구{'\n'}
          - 삭제 요구{'\n'}
          - 처리정지 요구{'\n\n'}
          2. 제1항에 따른 권리 행사는 앱 내 설정 메뉴 또는 이메일을 통해 하실 수 있습니다.
        </Text>

        <Text style={styles.sectionTitle}>제8조 (개인정보의 안전성 확보 조치)</Text>
        <Text style={styles.text}>
          개발자는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:{'\n'}
          1. 기술적 조치: 개인정보 암호화, 접근권한 관리{'\n'}
          2. 안전한 클라우드 서비스 이용
        </Text>

        <Text style={styles.sectionTitle}>제9조 (개인정보 보호책임자)</Text>
        <Text style={styles.text}>
          개발자는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 이용자의 불만처리 및 피해구제를 위하여 아래와 같이 연락처를 안내합니다.{'\n\n'}
          <Text style={styles.bold}>개인정보 관련 문의</Text>{'\n'}
          - 이메일: privacy@tymee.app{'\n'}
          - 처리 기간: 접수 후 영업일 기준 7일 이내
        </Text>

        <Text style={styles.sectionTitle}>제10조 (개인정보 처리방침 변경)</Text>
        <Text style={styles.text}>
          이 개인정보 처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
        </Text>

        <Text style={styles.sectionTitle}>부칙</Text>
        <Text style={styles.text}>
          본 개인정보 처리방침은 2025년 1월 1일부터 시행됩니다.
        </Text>

        <View style={styles.bottomPadding} />
      </ScrollView>
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

const getModalStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#121212' : '#FFFFFF',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#333333' : '#E5E5E5',
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: isDark ? '#FFFFFF' : '#000000',
    },
    closeButton: {
      padding: 4,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: isDark ? '#FFFFFF' : '#000000',
      marginTop: 24,
      marginBottom: 12,
    },
    text: {
      fontSize: 14,
      color: isDark ? '#CCCCCC' : '#333333',
      lineHeight: 22,
    },
    bold: {
      fontWeight: '700',
      color: isDark ? '#FFFFFF' : '#000000',
    },
    bottomPadding: {
      height: 40,
    },
  });

export default LoginScreen;
