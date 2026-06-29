import { useEffect, useState } from 'react';
import {
  Keyboard,
  type KeyboardAvoidingViewProps,
  Platform,
} from 'react-native';

/**
 * Returns a `behavior` value for KeyboardAvoidingView that adapts to the
 * keyboard visibility.
 *
 * - When the keyboard is shown: "padding" on iOS, "height" on Android.
 * - When the keyboard is hidden: `undefined`, which prevents the layout
 *   shifts that cause black spaces under edge-to-edge display on Android
 *   (Expo SDK 53+).
 */
export function useKeyboardBehavior(): KeyboardAvoidingViewProps['behavior'] {
  const defaultValue: KeyboardAvoidingViewProps['behavior'] =
    Platform.OS === 'ios' ? 'padding' : 'height';
  const [behavior, setBehavior] =
    useState<KeyboardAvoidingViewProps['behavior']>(defaultValue);

  useEffect(() => {
    const showListener = Keyboard.addListener('keyboardDidShow', () => {
      setBehavior(defaultValue);
    });
    const hideListener = Keyboard.addListener('keyboardDidHide', () => {
      setBehavior(undefined);
    });
    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, [defaultValue]);

  return behavior;
}
