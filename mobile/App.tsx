import React, {useState, useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Icon from '@react-native-vector-icons/ionicons';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {useWindowDimensions, InteractionManager, StyleSheet} from 'react-native';
import {useTranslation} from 'react-i18next';

// Import i18n
import './src/i18n';

// Import preserved UI screens
import PomodoroScreen from './src/screens/PomodoroScreen';
import CommunityScreen from './src/screens/CommunityScreen';
import StudyRecordScreen from './src/screens/StudyRecordScreen';
import MoreScreen from './src/screens/MoreScreen';
import StoreScreen from './src/screens/StoreScreen';
import PaymentHistoryScreen from './src/screens/PaymentHistoryScreen';
import FriendChatScreen from './src/screens/FriendChatScreen';
import FloatingTabBar from './src/components/FloatingTabBarSkia';
import {usePomodoroStore} from './src/store/pomodoroStore';
import {useThemeStore} from './src/store/themeStore';
import {useNavigationStore} from './src/store/navigationStore';
import {safeGetColorScheme, safeAddAppearanceListener} from './src/utils/appearance';
import {TabName} from './src/types/pomodoro';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Tab Navigator를 별도 컴포넌트로 분리
function TabNavigator() {
  const {t} = useTranslation();
  const {isFullscreen, isLocked, settings} = usePomodoroStore();
  const {isGroupDetailVisible} = useNavigationStore();

  const isTabBlocked = (tabName: TabName): boolean => {
    return isLocked && settings.blockedTabs.includes(tabName);
  };

  const shouldHideTabBar = isFullscreen || isGroupDetailVisible;

  return (
    <Tab.Navigator
      tabBar={(props) =>
        shouldHideTabBar ? null : <FloatingTabBar {...props} />
      }
      screenOptions={{
        headerShown: false,
        sceneContainerStyle: {
          paddingBottom: shouldHideTabBar ? 0 : 160, // 탭바(70) + 여백(20) + 광고배너(50) + 추가여백(20)
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
            }
          },
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{tabBarLabel: '커뮤니티'}}
        listeners={{
          tabPress: (e) => {
            if (isTabBlocked('Community')) {
              e.preventDefault();
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
            }
          },
        }}
      />
    </Tab.Navigator>
  );
}

function App(): React.JSX.Element {
  const [systemColorScheme, setSystemColorScheme] = useState<'light' | 'dark'>('light');
  const {themeMode} = useThemeStore();

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

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}>
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen
            name="Store"
            component={StoreScreen}
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="PaymentHistory"
            component={PaymentHistoryScreen}
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="FriendChat"
            component={FriendChatScreen}
            options={{
              animation: 'slide_from_right',
              gestureEnabled: true,
              fullScreenGestureEnabled: true,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({});

export default App;
