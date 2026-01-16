import {useEffect, useCallback} from 'react';
import {Alert} from 'react-native';
import {FirebaseMessagingTypes} from '@react-native-firebase/messaging';
import fcmService from '../services/fcm';
import {useAuthStore} from '../store/authStore';

type RemoteMessage = FirebaseMessagingTypes.RemoteMessage;

/**
 * 푸시 알림 초기화 및 관리 훅
 *
 * 사용법:
 * - App.tsx 또는 메인 네비게이션에서 호출
 * - 로그인 상태에서만 디바이스 등록
 */
export function usePushNotification() {
  const {user, isLoggedIn} = useAuthStore();

  // 디바이스 등록
  const registerDevice = useCallback(async () => {
    if (!isLoggedIn || !user?.id) {
      return;
    }

    const hasPermission = await fcmService.requestPermission();
    if (!hasPermission) {
      console.log('[Push] Permission denied');
      return;
    }

    await fcmService.registerDevice(user.id);
  }, [isLoggedIn, user?.id]);

  // 초기화
  useEffect(() => {
    registerDevice();
  }, [registerDevice]);

  // 토큰 갱신 리스너
  useEffect(() => {
    if (!isLoggedIn || !user?.id) {
      return;
    }

    const unsubscribe = fcmService.onTokenRefresh(async (token) => {
      console.log('[Push] Token refreshed:', token);
      await fcmService.registerDevice(user.id);
    });

    return unsubscribe;
  }, [isLoggedIn, user?.id]);

  // 포그라운드 메시지 리스너
  useEffect(() => {
    const unsubscribe = fcmService.onMessage(async (remoteMessage) => {
      console.log('[Push] Foreground message:', remoteMessage);

      // 포그라운드에서 알림 표시 (선택사항)
      if (remoteMessage.notification) {
        Alert.alert(
          remoteMessage.notification.title || '알림',
          remoteMessage.notification.body || '',
        );
      }
    });

    return unsubscribe;
  }, []);

  // 백그라운드에서 알림 클릭 리스너
  useEffect(() => {
    const unsubscribe = fcmService.onNotificationOpenedApp((remoteMessage) => {
      console.log('[Push] Notification opened app:', remoteMessage);
      handleNotificationPress(remoteMessage);
    });

    return unsubscribe;
  }, []);

  // 앱 종료 상태에서 알림으로 실행된 경우
  useEffect(() => {
    fcmService.getInitialNotification().then((remoteMessage) => {
      if (remoteMessage) {
        console.log('[Push] Initial notification:', remoteMessage);
        handleNotificationPress(remoteMessage);
      }
    });
  }, []);

  return {
    registerDevice,
  };
}

/**
 * 알림 클릭 시 처리
 */
function handleNotificationPress(message: RemoteMessage) {
  const data = message.data;

  if (!data) {
    return;
  }

  // 알림 타입에 따라 화면 이동
  // TODO: 네비게이션 연동
  console.log('[Push] Handle notification:', data);
}

export default usePushNotification;
