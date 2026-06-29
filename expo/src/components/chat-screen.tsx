import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  getMessages,
  sendMessage,
  type ChatMessageDto,
} from '@/services/ChatService';

const ROOM = 'common';
const USERNAME = 'A';

function uuid(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<ChatMessageDto>>(null);

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
        id: uuid(),
        username: USERNAME,
        content,
      });
      setMessages((prev) => [...prev, msg]);
    } catch (err) {
      console.warn('send failed', err);
    }
  };

  return (
    <View style={styles.root}>
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

        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: false })
          }
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
        <View style={[styles.inputBar, { paddingBottom: 8 + insets.bottom }]}>
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
      </View>
    </View>
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
