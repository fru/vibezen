import { useCallback, useEffect, useState } from 'react';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  KeyboardAvoidingView,
  useReanimatedKeyboardAnimation,
} from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Crypto from 'expo-crypto';

import {
  getMessages,
  sendMessage,
  type ChatMessageDto,
} from '@/services/ChatService';

const ROOM = 'common';
const USERNAME = 'A';

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [draft, setDraft] = useState('');

  // Spacer below the input bar that fills the navigation-bar inset when the
  // keyboard is closed and shrinks to 0 as the keyboard rises (in sync with
  // the IME animation), so there's no dead whitespace above the keyboard.
  const navBarSpacerStyle = useAnimatedStyle(() => ({
    // keyboardHeight.value is negative while the keyboard is rising.
    height: Math.max(0, insets.bottom + keyboardHeight.value),
  }));

  const load = useCallback(async () => {
    try {
      setMessages(await getMessages(ROOM));
    } catch (err) {
      console.warn('load messages failed', err);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSend = async () => {
    const content = draft.trim();
    if (!content) return;
    setDraft('');
    try {
      const msg = await sendMessage(ROOM, {
        id: Crypto.randomUUID(),
        username: USERNAME,
        content,
      });
      setMessages((prev) => [...prev, msg]);
    } catch (err) {
      console.warn('send failed', err);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior="padding">
      <View style={styles.column}>
        {/* Top bar */}
        <View
          style={[
            styles.topBar,
            { paddingTop: insets.top, height: 56 + insets.top },
          ]}>
          <Pressable
            hitSlop={8}
            onPress={() => console.log('back pressed')}
            style={styles.backButton}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <Text style={styles.title} numberOfLines={1}>
            {ROOM}
          </Text>
        </View>

        {/* Messages — inverted so the latest message is pinned to the
            bottom and the list stays put during keyboard/layout changes. */}
        <FlatList
          data={[...messages].reverse()}
          keyExtractor={(m) => m.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          inverted
          renderItem={({ item }) => {
            const outgoing = item.username === USERNAME;
            return (
              <View
                style={[
                  styles.bubbleRow,
                  outgoing ? styles.outgoing : styles.incoming,
                ]}>
                <View
                  style={[
                    styles.bubble,
                    outgoing ? styles.bubbleOut : styles.bubbleIn,
                  ]}>
                  <Text style={styles.bubbleText}>{item.content}</Text>
                  <Text style={styles.bubbleTime}>
                    {new Date(item.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Type a message"
            style={styles.input}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <Pressable
            onPress={handleSend}
            disabled={!draft.trim()}
            style={({ pressed }) => [
              styles.sendButton,
              !draft.trim() && styles.sendButtonDisabled,
              pressed && styles.sendButtonPressed,
            ]}>
            <Text style={styles.sendIcon}>➤</Text>
          </Pressable>
        </View>

        {/* Animated spacer: fills the nav-bar inset when the keyboard is
            closed, shrinks to 0 in sync with the keyboard rising. */}
        <Animated.View style={[styles.navBarSpacer, navBarSpacerStyle]} />
      </View>
    </KeyboardAvoidingView>
  );
}

const BUBBLE_OUT = '#d9fdd3';
const BUBBLE_IN = '#ffffff';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#ece5dd' },
  column: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#075e54',
    paddingHorizontal: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: { color: '#fff', fontSize: 32, lineHeight: 34, marginTop: -2 },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 40,
  },
  list: { flex: 1 },
  listContent: { padding: 12, gap: 6 },
  bubbleRow: { flexDirection: 'row', width: '100%' },
  incoming: { justifyContent: 'flex-start' },
  outgoing: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '75%', padding: 6, borderRadius: 12 },
  bubbleIn: { backgroundColor: BUBBLE_IN, borderBottomLeftRadius: 2 },
  bubbleOut: { backgroundColor: BUBBLE_OUT, borderBottomRightRadius: 2 },
  bubbleText: { fontSize: 14, lineHeight: 18 },
  bubbleTime: {
    fontSize: 10,
    color: 'rgba(0,0,0,0.45)',
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0f2f5',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  navBarSpacer: {
    // Matches the chat background so the spacer blends seamlessly
    // whether the keyboard is open or closed.
    backgroundColor: 'black',
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#075e54',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: { backgroundColor: '#9bb5b0' },
  sendButtonPressed: { opacity: 0.8 },
  sendIcon: { color: '#fff', fontSize: 18, marginLeft: 2 },
});
