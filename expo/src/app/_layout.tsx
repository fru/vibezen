import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { KeyboardAvoidingView, Platform, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { notifications } from '@/services/NotificationService';

function AppTreeWithKeyboardAvoiding() {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: 'transparent' }}
      // iOS uses "padding"; Android relies on softwareKeyboardLayoutMode
      // "resize" (set in app.json) and needs no behavior here.
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
