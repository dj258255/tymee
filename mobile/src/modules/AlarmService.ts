import {NativeModules, Platform, Vibration} from 'react-native';
import notifee, {
  AndroidImportance,
  AndroidVisibility,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';
import Sound from 'react-native-sound';
import {AlarmSoundType} from '../types/pomodoro';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';

const {AlarmServiceModule} = NativeModules;

// 미디어 볼륨으로 재생하도록 설정
Sound.setCategory('Playback');

// 알람 사운드 정의
export interface AlarmSound {
  id: AlarmSoundType | string;
  name: string;
  description: string;
  isCustom?: boolean;
  uri?: string; // 커스텀 사운드 파일 경로
}

// 기본 시스템 사운드
export const DEFAULT_ALARM_SOUNDS: AlarmSound[] = [
  {id: 'default', name: '기본 알림', description: '미디어 볼륨으로 재생 (이어폰 연결 시 이어폰으로)'},
  {id: 'none', name: '진동만', description: '소리 없이 진동만'},
  {id: 'silent', name: '완전 무음', description: '소리와 진동 모두 없음'},
];

// 진동 패턴: [대기, 진동, 대기, 진동, ...]
const ALARM_VIBRATION_PATTERN = [0, 500, 200, 500, 200, 500];

// 커스텀 사운드 저장 경로
const CUSTOM_SOUNDS_DIR = Platform.select({
  ios: `${RNFS.DocumentDirectoryPath}/alarm_sounds`,
  android: `${RNFS.DocumentDirectoryPath}/alarm_sounds`,
}) || '';

// 기본 알람 사운드 파일 (앱 번들에 포함)
const DEFAULT_SOUND_FILE = Platform.select({
  ios: 'alarm_default.mp3',
  android: 'alarm_default.mp3',
}) || 'alarm_default.mp3';

class AlarmServiceClass {
  private customSounds: AlarmSound[] = [];
  private channelId: string = 'timer-alarm';
  private currentSound: Sound | null = null;

  constructor() {
    this.initNotificationChannel();
    this.loadCustomSounds();
  }

  // 알림 채널 초기화 (Android) - 무음 채널 (소리는 별도로 재생)
  private async initNotificationChannel() {
    if (Platform.OS === 'android') {
      // 무음 채널 (소리는 react-native-sound로 미디어 볼륨으로 재생)
      await notifee.createChannel({
        id: this.channelId,
        name: '타이머 알람',
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
        vibration: false, // 진동은 별도로 처리
        sound: undefined, // 소리 없음 (미디어로 재생)
      });
    }
  }

  // 저장된 커스텀 사운드 로드
  private async loadCustomSounds() {
    try {
      const exists = await RNFS.exists(CUSTOM_SOUNDS_DIR);
      if (!exists) {
        await RNFS.mkdir(CUSTOM_SOUNDS_DIR);
        return;
      }

      const files = await RNFS.readDir(CUSTOM_SOUNDS_DIR);
      this.customSounds = files
        .filter(file => file.isFile() && /\.(mp3|wav|m4a|aac)$/i.test(file.name))
        .map(file => ({
          id: `custom_${file.name}`,
          name: file.name.replace(/\.[^/.]+$/, ''), // 확장자 제거
          description: '사용자 추가 사운드',
          isCustom: true,
          uri: file.path,
        }));
    } catch (error) {
      console.warn('Failed to load custom sounds:', error);
    }
  }

  // 모든 사운드 목록 가져오기
  getAllSounds(): AlarmSound[] {
    return [...DEFAULT_ALARM_SOUNDS, ...this.customSounds];
  }

  // 커스텀 사운드 추가
  async addCustomSound(): Promise<AlarmSound | null> {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.audio],
      });

      const file = result[0];
      if (!file.uri || !file.name) return null;

      // 사운드 파일 복사
      const destPath = `${CUSTOM_SOUNDS_DIR}/${file.name}`;

      // iOS에서는 content:// URI를 file:// 로 변환해야 할 수 있음
      const sourcePath = Platform.OS === 'ios'
        ? decodeURIComponent(file.uri.replace('file://', ''))
        : file.uri;

      await RNFS.copyFile(sourcePath, destPath);

      const newSound: AlarmSound = {
        id: `custom_${file.name}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        description: '사용자 추가 사운드',
        isCustom: true,
        uri: destPath,
      };

      this.customSounds.push(newSound);
      return newSound;
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        return null;
      }
      console.warn('Failed to add custom sound:', error);
      return null;
    }
  }

  // 커스텀 사운드 삭제
  async removeCustomSound(soundId: string): Promise<boolean> {
    try {
      const sound = this.customSounds.find(s => s.id === soundId);
      if (!sound || !sound.uri) return false;

      await RNFS.unlink(sound.uri);
      this.customSounds = this.customSounds.filter(s => s.id !== soundId);
      return true;
    } catch (error) {
      console.warn('Failed to remove custom sound:', error);
      return false;
    }
  }

  // 미디어 볼륨으로 사운드 재생
  private playMediaSound(soundType: AlarmSoundType | string): Promise<boolean> {
    return new Promise((resolve) => {
      // 이전 사운드 중지
      this.stopCurrentSound();

      // 커스텀 사운드 찾기
      const customSound = this.customSounds.find(s => s.id === soundType);

      let sound: Sound;

      if (customSound?.uri) {
        // 커스텀 사운드 재생
        sound = new Sound(customSound.uri, '', (error) => {
          if (error) {
            console.warn('Failed to load custom sound:', error);
            resolve(false);
            return;
          }
          this.currentSound = sound;
          sound.play((success) => {
            if (!success) {
              console.warn('Sound playback failed');
            }
            resolve(success);
          });
        });
      } else {
        // 기본 사운드 재생 (앱 번들에서)
        sound = new Sound(DEFAULT_SOUND_FILE, Sound.MAIN_BUNDLE, (error) => {
          if (error) {
            console.warn('Failed to load default sound:', error);
            // 폴백: 시스템 사운드 사용
            this.playSystemSound();
            resolve(true);
            return;
          }
          this.currentSound = sound;
          sound.play((success) => {
            if (!success) {
              console.warn('Sound playback failed');
            }
            resolve(success);
          });
        });
      }
    });
  }

  // 시스템 사운드 재생 (폴백용)
  private playSystemSound() {
    if (Platform.OS === 'ios' && AlarmServiceModule) {
      AlarmServiceModule.previewSound('default');
    }
  }

  // 현재 재생 중인 사운드 중지
  private stopCurrentSound() {
    if (this.currentSound) {
      this.currentSound.stop();
      this.currentSound.release();
      this.currentSound = null;
    }
  }

  // 알람 재생 (앱이 포그라운드일 때) - 미디어 볼륨으로 재생
  async playAlarm(soundType: AlarmSoundType | string, withVibration = true): Promise<boolean> {
    try {
      // 완전 무음이면 아무것도 하지 않음
      if (soundType === 'silent') {
        return true;
      }

      // 진동 처리
      if (withVibration && soundType !== 'silent') {
        Vibration.vibrate(ALARM_VIBRATION_PATTERN);
      }

      // 진동만이면 소리는 재생하지 않음
      if (soundType === 'none') {
        return true;
      }

      // 미디어 볼륨으로 사운드 재생 (이어폰 연결 시 이어폰으로)
      await this.playMediaSound(soundType);

      // 알림도 표시 (소리 없이, 사용자에게 알리기 위해)
      await this.showNotification(
        '타이머 완료',
        '설정한 시간이 완료되었습니다',
        soundType,
        false // 알림에서는 소리/진동 없음 (별도 처리됨)
      );

      return true;
    } catch (error) {
      console.warn('AlarmService.playAlarm error:', error);
      if (withVibration && soundType !== 'silent') {
        Vibration.vibrate(ALARM_VIBRATION_PATTERN);
      }
      return false;
    }
  }

  // 알림 표시 (소리 없음 - 미디어로 별도 재생)
  async showNotification(
    title: string,
    body: string,
    soundType: AlarmSoundType | string = 'default',
    withSound = false
  ): Promise<void> {
    try {
      await notifee.displayNotification({
        title,
        body,
        android: {
          channelId: this.channelId,
          importance: AndroidImportance.HIGH,
          pressAction: {id: 'default'},
          // 소리는 미디어 볼륨으로 별도 재생하므로 알림에서는 무음
          sound: undefined,
        },
        ios: {
          // 소리 없음 (미디어로 재생)
          sound: withSound ? 'default' : undefined,
        },
      });
    } catch (error) {
      console.warn('Failed to show notification:', error);
    }
  }

  // 사운드 미리듣기 (미디어 볼륨)
  async previewSound(soundType: AlarmSoundType | string): Promise<boolean> {
    try {
      // 완전 무음이면 아무것도 하지 않음
      if (soundType === 'silent') {
        return true;
      }

      // 진동만이면 짧은 진동
      if (soundType === 'none') {
        Vibration.vibrate(200);
        return true;
      }

      // 미디어 볼륨으로 사운드 재생
      return await this.playMediaSound(soundType);
    } catch (error) {
      console.warn('AlarmService.previewSound error:', error);
      return false;
    }
  }

  // 알람 중지
  async stopAlarm(): Promise<boolean> {
    try {
      Vibration.cancel();
      this.stopCurrentSound();
      await notifee.cancelAllNotifications();
      return true;
    } catch (error) {
      console.warn('AlarmService.stopAlarm error:', error);
      return false;
    }
  }

  // 예약 알림 설정 (백그라운드 알람)
  // 주의: 백그라운드에서는 미디어 재생이 제한적이므로 알림 소리 사용
  async scheduleAlarm(
    title: string,
    body: string,
    triggerTime: Date,
    soundType: AlarmSoundType | string = 'default'
  ): Promise<string | null> {
    try {
      // 완전 무음이면 알림만
      if (soundType === 'silent') {
        return await this.scheduleNotificationOnly(title, body, triggerTime, false);
      }

      // 진동만이면 진동 알림
      if (soundType === 'none') {
        return await this.scheduleNotificationOnly(title, body, triggerTime, true);
      }

      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: triggerTime.getTime(),
      };

      // 백그라운드에서는 알림 소리 사용 (미디어 재생 불가)
      const notificationId = await notifee.createTriggerNotification(
        {
          title,
          body,
          android: {
            channelId: this.channelId,
            importance: AndroidImportance.HIGH,
            pressAction: {id: 'default'},
            sound: 'default', // 백그라운드에서는 알림 소리 사용
            vibrationPattern: ALARM_VIBRATION_PATTERN,
          },
          ios: {
            sound: 'default', // 백그라운드에서는 알림 소리 사용
          },
        },
        trigger
      );

      return notificationId;
    } catch (error) {
      console.warn('Failed to schedule alarm:', error);
      return null;
    }
  }

  // 소리 없는 예약 알림
  private async scheduleNotificationOnly(
    title: string,
    body: string,
    triggerTime: Date,
    withVibration: boolean
  ): Promise<string | null> {
    try {
      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: triggerTime.getTime(),
      };

      const notificationId = await notifee.createTriggerNotification(
        {
          title,
          body,
          android: {
            channelId: this.channelId,
            importance: AndroidImportance.HIGH,
            pressAction: {id: 'default'},
            sound: undefined,
            vibrationPattern: withVibration ? ALARM_VIBRATION_PATTERN : undefined,
          },
          ios: {
            sound: undefined,
          },
        },
        trigger
      );

      return notificationId;
    } catch (error) {
      console.warn('Failed to schedule notification:', error);
      return null;
    }
  }

  // 예약 알림 취소
  async cancelScheduledAlarm(notificationId: string): Promise<void> {
    try {
      await notifee.cancelNotification(notificationId);
    } catch (error) {
      console.warn('Failed to cancel scheduled alarm:', error);
    }
  }

  // 알림 권한 요청
  async requestPermission(): Promise<boolean> {
    try {
      const settings = await notifee.requestPermission();
      return settings.authorizationStatus >= 1; // AUTHORIZED or PROVISIONAL
    } catch (error) {
      console.warn('Failed to request notification permission:', error);
      return false;
    }
  }

  // 지원 여부 확인
  async isSupported(): Promise<boolean> {
    return true;
  }
}

const AlarmService = new AlarmServiceClass();
export default AlarmService;

// 하위 호환성을 위한 ALARM_SOUNDS export
export const ALARM_SOUNDS = DEFAULT_ALARM_SOUNDS;
