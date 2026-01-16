import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import {Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './api';

type RemoteMessage = FirebaseMessagingTypes.RemoteMessage;

const FCM_TOKEN_KEY = '@tymee_fcm_token';

export interface DeviceRegistrationRequest {
  deviceId: string;
  deviceType: 'IOS' | 'ANDROID';
  pushToken: string;
  appVersion: string;
  osVersion: string;
}

/**
 * FCM 서비스
 * - 푸시 알림 권한 요청
 * - FCM 토큰 관리 및 서버 등록
 */
export const fcmService = {
  /**
   * 푸시 알림 권한 요청 (iOS)
   */
  async requestPermission(): Promise<boolean> {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('[FCM] Authorization status:', authStatus);
    }

    return enabled;
  },

  /**
   * FCM 토큰 가져오기
   */
  async getToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      console.log('[FCM] Token:', token);
      return token;
    } catch (error) {
      console.error('[FCM] Failed to get token:', error);
      return null;
    }
  },

  /**
   * 저장된 FCM 토큰 가져오기
   */
  async getSavedToken(): Promise<string | null> {
    return AsyncStorage.getItem(FCM_TOKEN_KEY);
  },

  /**
   * FCM 토큰 저장
   */
  async saveToken(token: string): Promise<void> {
    await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
  },

  /**
   * 서버에 디바이스 등록
   */
  async registerDevice(userId: number): Promise<void> {
    try {
      const token = await this.getToken();
      if (!token) {
        console.warn('[FCM] No token available');
        return;
      }

      const savedToken = await this.getSavedToken();
      if (savedToken === token) {
        console.log('[FCM] Token unchanged, skip registration');
        return;
      }

      const deviceId = await apiClient.getDeviceId();
      const deviceType = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';
      const appVersion = '1.0.0'; // TODO: react-native-device-info에서 가져오기
      const osVersion = Platform.Version.toString();

      const request: DeviceRegistrationRequest = {
        deviceId,
        deviceType,
        pushToken: token,
        appVersion,
        osVersion,
      };

      await apiClient.post(`/users/${userId}/devices`, request);
      await this.saveToken(token);
      console.log('[FCM] Device registered successfully');
    } catch (error) {
      console.error('[FCM] Failed to register device:', error);
    }
  },

  /**
   * 서버에서 디바이스 삭제 (로그아웃 시)
   */
  async unregisterDevice(userId: number): Promise<void> {
    try {
      const deviceId = await apiClient.getDeviceId();
      await apiClient.delete(`/users/${userId}/devices/${deviceId}`);
      await AsyncStorage.removeItem(FCM_TOKEN_KEY);
      console.log('[FCM] Device unregistered successfully');
    } catch (error) {
      console.error('[FCM] Failed to unregister device:', error);
    }
  },

  /**
   * 토큰 갱신 리스너 설정
   */
  onTokenRefresh(callback: (token: string) => void): () => void {
    return messaging().onTokenRefresh(callback);
  },

  /**
   * 포그라운드 메시지 리스너 설정
   */
  onMessage(callback: (message: RemoteMessage) => void): () => void {
    return messaging().onMessage(callback);
  },

  /**
   * 백그라운드/종료 상태에서 알림 클릭 리스너
   */
  onNotificationOpenedApp(
    callback: (message: RemoteMessage) => void,
  ): () => void {
    return messaging().onNotificationOpenedApp(callback);
  },

  /**
   * 앱이 종료된 상태에서 알림으로 실행된 경우 초기 알림 가져오기
   */
  async getInitialNotification(): Promise<RemoteMessage | null> {
    return messaging().getInitialNotification();
  },
};

export default fcmService;
