import React, {useState, useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from '@react-native-vector-icons/ionicons';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {useWindowDimensions, InteractionManager, View, Text, StyleSheet, TouchableOpacity, Modal} from 'react-native';
import {useTranslation} from 'react-i18next';

// Import i18n
import './src/i18n';

// Import preserved UI screens
import PomodoroScreen from './src/screens/PomodoroScreen';
import StoreScreen from './src/screens/StoreScreen';
import GroupScreen from './src/screens/GroupScreen';
import StudyRecordScreen from './src/screens/StudyRecordScreen';
import MoreScreen from './src/screens/MoreScreen';
import FloatingTabBar from './src/components/FloatingTabBarSkia';
import {usePomodoroStore} from './src/store/pomodoroStore';
import {useThemeStore} from './src/store/themeStore';
import {safeGetColorScheme, safeAddAppearanceListener} from './src/utils/appearance';
import {TabName} from './src/types/pomodoro';

const Tab = createBottomTabNavigator();

function App(): React.JSX.Element {
  const {t} = useTranslation();
  const [systemColorScheme, setSystemColorScheme] = useState<'light' | 'dark'>('light');
  const [showUnlockPrompt, setShowUnlockPrompt] = useState(false);
  const {width, height} = useWindowDimensions();
  const isLandscape = width > height;
  const {isFullscreen, isLocked, setIsRunning, settings} = usePomodoroStore();
  const {themeMode} = useThemeStore();

  // Helper function to check if a tab should be blocked
  const isTabBlocked = (tabName: TabName): boolean => {
    return isLocked && settings.blockedTabs.includes(tabName);
  };

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

  const isDark =
    themeMode === 'system'
      ? systemColorScheme === 'dark'
      : themeMode === 'dark';

  // 전체화면일 때 탭바 숨기기 (가로/세로 모두)
  const shouldHideTabBar = isFullscreen;

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <NavigationContainer>
        <Tab.Navigator
          tabBar={(props) =>
            shouldHideTabBar ? null : <FloatingTabBar {...props} />
          }
          screenOptions={{
            headerShown: false,
            sceneContainerStyle: {
              paddingBottom: shouldHideTabBar ? 0 : 110, // Space for floating tab bar (70 height + 20 bottom + 20 extra)
            },
            tabBarStyle: isLocked ? {display: 'none'} : undefined,
          }}>
          <Tab.Screen
            name="Timer"
            component={PomodoroScreen}
            options={{tabBarLabel: t('tabs.timer')}}
            listeners={{
              tabPress: (e) => {
                if (isLocked) {
                  e.preventDefault();
                  setShowUnlockPrompt(true);
                }
              },
            }}
          />
          <Tab.Screen
            name="Store"
            component={StoreScreen}
            options={{tabBarLabel: t('tabs.store')}}
            listeners={{
              tabPress: (e) => {
                if (isTabBlocked('Store')) {
                  e.preventDefault();
                  setShowUnlockPrompt(true);
                }
              },
            }}
          />
          <Tab.Screen
            name="Group"
            component={GroupScreen}
            options={{tabBarLabel: t('tabs.group')}}
            listeners={{
              tabPress: (e) => {
                if (isTabBlocked('Group')) {
                  e.preventDefault();
                  setShowUnlockPrompt(true);
                }
              },
            }}
          />
          <Tab.Screen
            name="StudyRecord"
            component={StudyRecordScreen}
            options={{tabBarLabel: t('tabs.study')}}
            listeners={{
              tabPress: (e) => {
                if (isTabBlocked('StudyRecord')) {
                  e.preventDefault();
                  setShowUnlockPrompt(true);
                }
              },
            }}
          />
          <Tab.Screen
            name="More"
            component={MoreScreen}
            options={{tabBarLabel: t('tabs.more')}}
            listeners={{
              tabPress: (e) => {
                if (isTabBlocked('More')) {
                  e.preventDefault();
                  setShowUnlockPrompt(true);
                }
              },
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>

      {/* App Lock Overlay */}
      {isLocked && (
        <View style={[styles.lockOverlay, {backgroundColor: isDark ? 'rgba(18, 18, 18, 0.98)' : 'rgba(250, 250, 250, 0.98)'}]} pointerEvents="box-only">
          <View style={styles.lockMessage}>
            <Icon name="lock-closed" size={72} color="#FF5252" />
            <Text style={[styles.lockText, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
              집중 시간입니다
            </Text>
            <Text style={[styles.lockSubtext, {color: isDark ? '#AAAAAA' : '#666666'}]}>
              타이머 화면에서 일시정지하면{'\n'}다른 기능을 사용할 수 있습니다
            </Text>
            <TouchableOpacity
              style={styles.lockButton}
              onPress={() => setShowUnlockPrompt(true)}>
              <Text style={styles.lockButtonText}>잠금 해제하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Unlock Confirmation Prompt */}
      <Modal
        visible={showUnlockPrompt && isLocked}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowUnlockPrompt(false)}>
        <View style={styles.unlockPromptOverlay}>
          <View style={[styles.unlockPromptContent, {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'}]}>
            <Icon name="alert-circle" size={56} color="#FF5252" />
            <Text style={[styles.unlockPromptTitle, {color: isDark ? '#FFFFFF' : '#1A1A1A'}]}>
              집중을 중단하시겠습니까?
            </Text>
            <Text style={[styles.unlockPromptMessage, {color: isDark ? '#AAAAAA' : '#666666'}]}>
              타이머를 일시정지하면 잠금이 해제됩니다
            </Text>
            <View style={styles.unlockPromptButtons}>
              <TouchableOpacity
                style={[styles.unlockPromptButton, styles.unlockCancelButton, {backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5'}]}
                onPress={() => setShowUnlockPrompt(false)}>
                <Text style={[styles.unlockCancelButtonText, {color: isDark ? '#AAAAAA' : '#666666'}]}>
                  취소
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.unlockPromptButton, styles.unlockConfirmButton]}
                onPress={() => {
                  setIsRunning(false);
                  setShowUnlockPrompt(false);
                }}>
                <Text style={styles.unlockConfirmButtonText}>일시정지</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  lockMessage: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  lockText: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 24,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  lockSubtext: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  lockButton: {
    backgroundColor: '#FF5252',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  lockButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  unlockPromptOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockPromptContent: {
    width: '85%',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  unlockPromptTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  unlockPromptMessage: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  unlockPromptButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  unlockPromptButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  unlockCancelButton: {
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  unlockConfirmButton: {
    backgroundColor: '#FF5252',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  unlockCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  unlockConfirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});

export default App;
