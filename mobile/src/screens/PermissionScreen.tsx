import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  InteractionManager,
  SafeAreaView,
} from 'react-native';
import {check, request, PERMISSIONS, RESULTS, Permission} from 'react-native-permissions';
import Icon from '@react-native-vector-icons/ionicons';
import {useThemeStore} from '../store/themeStore';
import {safeGetColorScheme, safeAddAppearanceListener} from '../utils/appearance';

interface PermissionItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  permission: Permission;
  required: boolean;
}

const PermissionScreen: React.FC<{onComplete: () => void}> = ({onComplete}) => {
  const [systemColorScheme, setSystemColorScheme] = useState<'light' | 'dark'>('light');
  const [permissionStates, setPermissionStates] = useState<{[key: string]: string}>({});

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

  const permissions: PermissionItem[] = Platform.select({
    ios: [
      {
        id: 'calendar',
        title: '캘린더',
        description: '일정 기록 및 관리를 위해 필요합니다',
        icon: 'calendar-outline',
        permission: PERMISSIONS.IOS.CALENDARS,
        required: true,
      },
      {
        id: 'notification',
        title: '알림',
        description: '타이머 완료 알림을 받기 위해 필요합니다',
        icon: 'notifications-outline',
        permission: PERMISSIONS.IOS.NOTIFICATIONS,
        required: true,
      },
      {
        id: 'camera',
        title: '카메라',
        description: '프로필 사진 촬영을 위해 필요합니다',
        icon: 'camera-outline',
        permission: PERMISSIONS.IOS.CAMERA,
        required: false,
      },
    ],
    android: [
      {
        id: 'calendar',
        title: '캘린더',
        description: '일정 기록 및 관리를 위해 필요합니다',
        icon: 'calendar-outline',
        permission: PERMISSIONS.ANDROID.READ_CALENDAR,
        required: true,
      },
      {
        id: 'notification',
        title: '알림',
        description: '타이머 완료 알림을 받기 위해 필요합니다',
        icon: 'notifications-outline',
        permission: PERMISSIONS.ANDROID.POST_NOTIFICATIONS,
        required: true,
      },
      {
        id: 'camera',
        title: '카메라',
        description: '프로필 사진 촬영을 위해 필요합니다',
        icon: 'camera-outline',
        permission: PERMISSIONS.ANDROID.CAMERA,
        required: false,
      },
    ],
  }) || [];

  useEffect(() => {
    checkAllPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAllPermissions = async () => {
    const states: {[key: string]: string} = {};
    for (const item of permissions) {
      const result = await check(item.permission);
      states[item.id] = result;
    }
    setPermissionStates(states);
  };

  const requestPermission = async (item: PermissionItem) => {
    const result = await request(item.permission);
    setPermissionStates(prev => ({...prev, [item.id]: result}));
  };

  const requestAllPermissions = async () => {
    for (const item of permissions) {
      if (permissionStates[item.id] !== RESULTS.GRANTED) {
        await requestPermission(item);
      }
    }
  };

  const canSkip = permissions
    .filter(p => p.required)
    .every(p => permissionStates[p.id] === RESULTS.GRANTED);

  const styles = getStyles(isDark);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>앱 사용을 위한{'\n'}권한을 허용해주세요</Text>
          <Text style={styles.subtitle}>
            더 나은 서비스 제공을 위해{'\n'}아래 권한이 필요합니다
          </Text>
        </View>

        <View style={styles.permissionList}>
          {permissions.map(item => {
            const isGranted = permissionStates[item.id] === RESULTS.GRANTED;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.permissionItem, isGranted && styles.permissionItemGranted]}
                onPress={() => requestPermission(item)}>
                <View style={styles.permissionIcon}>
                  <Icon
                    name={item.icon}
                    size={28}
                    color={isGranted ? '#4CAF50' : isDark ? '#FFFFFF' : '#1A1A1A'}
                  />
                </View>
                <View style={styles.permissionInfo}>
                  <View style={styles.permissionTitleRow}>
                    <Text style={styles.permissionTitle}>{item.title}</Text>
                    {item.required && (
                      <View style={styles.requiredBadge}>
                        <Text style={styles.requiredText}>필수</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.permissionDescription}>{item.description}</Text>
                </View>
                <Icon
                  name={isGranted ? 'checkmark-circle' : 'chevron-forward'}
                  size={24}
                  color={isGranted ? '#4CAF50' : isDark ? '#666666' : '#AAAAAA'}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={requestAllPermissions}>
          <Text style={styles.buttonText}>모두 허용하기</Text>
        </TouchableOpacity>
        {canSkip && (
          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={onComplete}>
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>시작하기</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#121212' : '#FAFAFA',
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: 24,
      paddingTop: 60,
    },
    header: {
      marginBottom: 40,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: isDark ? '#FFFFFF' : '#1A1A1A',
      marginBottom: 12,
      lineHeight: 36,
    },
    subtitle: {
      fontSize: 16,
      color: isDark ? '#AAAAAA' : '#666666',
      lineHeight: 24,
    },
    permissionList: {
      gap: 12,
    },
    permissionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: isDark ? '#2A2A2A' : '#E0E0E0',
    },
    permissionItemGranted: {
      borderColor: '#4CAF50',
      backgroundColor: isDark ? '#1A2E1A' : '#F1F8F4',
    },
    permissionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    permissionInfo: {
      flex: 1,
    },
    permissionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    permissionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: isDark ? '#FFFFFF' : '#1A1A1A',
    },
    requiredBadge: {
      backgroundColor: '#FF5252',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    requiredText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    permissionDescription: {
      fontSize: 13,
      color: isDark ? '#AAAAAA' : '#666666',
      lineHeight: 18,
    },
    footer: {
      padding: 24,
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#2A2A2A' : '#E0E0E0',
    },
    button: {
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    primaryButton: {
      backgroundColor: '#007AFF',
    },
    secondaryButton: {
      backgroundColor: isDark ? '#2A2A2A' : '#F0F0F0',
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    secondaryButtonText: {
      color: isDark ? '#FFFFFF' : '#1A1A1A',
    },
  });

export default PermissionScreen;
