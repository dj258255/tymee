import React from 'react';
import {View, StyleSheet, StatusBar, SafeAreaView} from 'react-native';
import {RingTimer} from '../components/timer/RingTimer';
import {TimerControls} from '../components/timer/TimerControls';
import {THEMES, DEFAULT_THEME} from '../constants/themes';

const HomeScreen = () => {
  const theme = THEMES[DEFAULT_THEME];

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <StatusBar
        barStyle={theme.name === 'Dark Night' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      <View style={styles.content}>
        <RingTimer />
        <TimerControls />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
});

export default HomeScreen;
