import React, {useState, useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from '@react-native-vector-icons/ionicons';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {useWindowDimensions, InteractionManager} from 'react-native';
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

const Tab = createBottomTabNavigator();

function App(): React.JSX.Element {
  const {t} = useTranslation();
  const [systemColorScheme, setSystemColorScheme] = useState<'light' | 'dark'>('light');
  const {width, height} = useWindowDimensions();
  const isLandscape = width > height;
  const {isFullscreen} = usePomodoroStore();
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
          }}>
          <Tab.Screen
            name="Timer"
            component={PomodoroScreen}
            options={{tabBarLabel: t('tabs.timer')}}
          />
          <Tab.Screen
            name="Store"
            component={StoreScreen}
            options={{tabBarLabel: t('tabs.store')}}
          />
          <Tab.Screen
            name="Group"
            component={GroupScreen}
            options={{tabBarLabel: t('tabs.group')}}
          />
          <Tab.Screen
            name="StudyRecord"
            component={StudyRecordScreen}
            options={{tabBarLabel: t('tabs.study')}}
          />
          <Tab.Screen
            name="More"
            component={MoreScreen}
            options={{tabBarLabel: t('tabs.more')}}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

export default App;
