import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { KeyboardAvoidingView, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useKeyboardBehavior } from '@/hooks/use-keyboard-behavior';
import { notifications } from '@/services/NotificationService';

function AppTreeWithKeyboardAvoiding() {
  const behavior = useKeyboardBehavior();
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: 'transparent' }}
      behavior={behavior}
      keyboardVerticalOffset={0}>
      <Stack screenOptions={{ headerShown: false }} />
    </KeyboardAvoidingView>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    notifications.init();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AppTreeWithKeyboardAvoiding />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
