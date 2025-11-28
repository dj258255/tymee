import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  InteractionManager,
  Appearance,
} from 'react-native';
import {useThemeStore, ThemeMode} from '../store/themeStore';
import {safeGetColorScheme, safeAddAppearanceListener} from '../utils/appearance';

const SettingsScreen: React.FC = () => {
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

  const {themeMode, setThemeMode} = useThemeStore();

  // 실제 적용되는 테마 결정
  const isDark =
    themeMode === 'system'
      ? systemColorScheme === 'dark'
      : themeMode === 'dark';

  const themeOptions: {mode: ThemeMode; label: string; icon: string}[] = [
    {mode: 'light', label: '라이트 모드', icon: '☀️'},
    {mode: 'dark', label: '다크 모드', icon: '🌙'},
    {mode: 'system', label: '시스템 설정', icon: '⚙️'},
  ];

  return (
    <View
      style={[
        styles.container,
        {backgroundColor: isDark ? '#121212' : '#FAFAFA'},
      ]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* 테마 섹션 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: isDark ? '#FFFFFF' : '#000000'}]}>
            테마
          </Text>
          <View
            style={[
              styles.optionContainer,
              {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'},
            ]}>
            {themeOptions.map((option, index) => (
              <React.Fragment key={option.mode}>
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => setThemeMode(option.mode)}>
                  <View style={styles.optionLeft}>
                    <Text style={styles.optionIcon}>{option.icon}</Text>
                    <Text
                      style={[
                        styles.optionLabel,
                        {color: isDark ? '#FFFFFF' : '#000000'},
                      ]}>
                      {option.label}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.radio,
                      {borderColor: isDark ? '#444444' : '#CCCCCC'},
                      themeMode === option.mode && styles.radioSelected,
                    ]}>
                    {themeMode === option.mode && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                </TouchableOpacity>
                {index < themeOptions.length - 1 && (
                  <View
                    style={[
                      styles.divider,
                      {backgroundColor: isDark ? '#2A2A2A' : '#E0E0E0'},
                    ]}
                  />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* 앱 정보 섹션 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: isDark ? '#FFFFFF' : '#000000'}]}>
            앱 정보
          </Text>
          <View
            style={[
              styles.optionContainer,
              {backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'},
            ]}>
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, {color: isDark ? '#AAAAAA' : '#666666'}]}>
                버전
              </Text>
              <Text style={[styles.infoValue, {color: isDark ? '#FFFFFF' : '#000000'}]}>
                1.0.0
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#FF5252',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF5252',
  },
  divider: {
    height: 1,
    marginLeft: 52,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
  },
});

export default SettingsScreen;
