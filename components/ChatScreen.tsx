import { useState, useRef, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Send, LogOut, Users } from 'lucide-react-native';
import { theme } from '@/lib/theme';
import { useChat } from '@/hooks/useChat';
import { useTyping } from '@/hooks/useTyping';
import { Avatar } from '@/components/Avatar';
import { MessageBubble } from '@/components/MessageBubble';
import { TypingIndicator } from '@/components/TypingIndicator';
import { ConnectionBadge } from '@/components/ConnectionBadge';
import type { Message, User } from '@/types/chat';

interface ChatScreenProps {
  currentUser: User;
  onLogout: () => void;
}

type ListItem =
  | { kind: 'message'; message: Message; isSelf: boolean; showUsername: boolean }
  | { kind: 'date'; id: string; label: string };

function sameDay(a: string, b: string): boolean {
  const da = new Date(a.includes('T') ? a : a.replace(' ', 'T') + 'Z');
  const db = new Date(b.includes('T') ? b : b.replace(' ', 'T') + 'Z');
  return da.toDateString() === db.toDateString();
}

export default function ChatScreen({ currentUser, onLogout }: ChatScreenProps) {
  const { messages, connectionStatus, onlineCount, onlineUsers, typingUser, sendMessage, error, historyLoaded } =
    useChat({ userId: currentUser.id, username: currentUser.username });
  const { notifyTyping } = useTyping(currentUser.username);

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [showOnlineList, setShowOnlineList] = useState(false);
  const listRef = useRef<FlatList<ListItem>>(null);

  const listData: ListItem[] = useMemo(() => {
    const items: ListItem[] = [];
    let lastDate = '';
    messages.forEach((msg, idx) => {
      if (!sameDay(lastDate, msg.created_at)) {
        lastDate = msg.created_at;
        items.push({ kind: 'date', id: `date-${msg.id}`, label: formatDateLabel(msg.created_at) });
      }
      const prev = messages[idx - 1];
      const showUsername = !prev || prev.username !== msg.username || !sameDay(prev.created_at, msg.created_at);
      items.push({
        kind: 'message',
        message: msg,
        isSelf: msg.username === currentUser.username,
        showUsername,
      });
    });
    return items;
  }, [messages, currentUser.username]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setDraft('');
    Keyboard.dismiss();
    await sendMessage(text);
    setSending(false);
  };

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.kind === 'date') {
      return (
        <View style={styles.dateRow}>
          <View style={styles.datePill}>
            <Text style={styles.dateText}>{item.label}</Text>
          </View>
        </View>
      );
    }
    const { message, isSelf, showUsername } = item;
    return (
      <View style={styles.messageRow}>
        {!isSelf && showUsername && (
          <View style={styles.avatarCol}>
            <Avatar
              name={message.username}
              color={avatarColorFor(message.username, currentUser)}
              size={32}
            />
          </View>
        )}
        <View style={[styles.bubbleCol, !isSelf && !showUsername && styles.bubbleColIndented]}>
          <MessageBubble message={message} isSelf={isSelf} showUsername={showUsername} />
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Avatar name={currentUser.username} color={currentUser.avatar_color} size={36} />
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Pulse Chat</Text>
            <ConnectionBadge status={connectionStatus} onlineCount={onlineCount} />
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowOnlineList((v) => !v)}
            activeOpacity={0.6}
          >
            <Users size={20} color={theme.colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={onLogout} activeOpacity={0.6}>
            <LogOut size={20} color={theme.colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Online users popover */}
      {showOnlineList && (
        <View style={styles.onlinePanel}>
          <Text style={styles.onlinePanelTitle}>Online now — {onlineUsers.length}</Text>
          {onlineUsers.length === 0 ? (
            <Text style={styles.onlineEmpty}>No one else is online right now.</Text>
          ) : (
            onlineUsers.map((name) => (
              <View key={name} style={styles.onlineRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineName}>{name}</Text>
              </View>
            ))
          )}
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={listData}
        keyExtractor={(item) => (item.kind === 'date' ? item.id : item.message.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          historyLoaded ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptySubtitle}>Be the first to say something!</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.emptySubtitle}>Loading messages…</Text>
            </View>
          )
        }
        ListFooterComponent={typingUser ? <TypingIndicator username={typingUser} /> : null}
      />

      {/* Error banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Composer */}
      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={(v) => {
            setDraft(v);
            if (v.trim()) notifyTyping();
          }}
          placeholder="Type a message…"
          placeholderTextColor={theme.colors.textMuted}
          multiline
          maxLength={1000}
          editable={connectionStatus === 'connected'}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!draft.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!draft.trim() || sending}
          activeOpacity={0.8}
        >
          {sending ? (
            <ActivityIndicator size="small" color={theme.colors.textInverse} />
          ) : (
            <Send size={18} color={theme.colors.textInverse} strokeWidth={2} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function formatDateLabel(iso: string): string {
  const date = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z');
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function avatarColorFor(username: string, currentUser: User): string {
  if (username === currentUser.username) return currentUser.avatar_color;
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];
  let hash = 0;
  for (let i = 0; i < username.length; i += 1) {
    hash = (hash << 5) - hash + username.charCodeAt(i);
    hash |= 0;
  }
  return colors[Math.abs(hash) % colors.length];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    paddingTop: Platform.OS === 'ios' ? 50 : theme.spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm + 2,
  },
  headerInfo: {
    gap: 2,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: theme.fonts.semibold,
    color: theme.colors.textPrimary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlinePanel: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  onlinePanelTitle: {
    fontSize: 12,
    fontFamily: theme.fonts.semibold,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  onlineEmpty: {
    fontSize: 13,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textSecondary,
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.online,
  },
  onlineName: {
    fontSize: 14,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textPrimary,
  },
  listContent: {
    paddingVertical: theme.spacing.md,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  avatarCol: {
    paddingLeft: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    marginRight: theme.spacing.xs,
  },
  bubbleCol: {
    flex: 1,
  },
  bubbleColIndented: {
    paddingLeft: 44,
  },
  dateRow: {
    alignItems: 'center',
    marginVertical: theme.spacing.md,
  },
  datePill: {
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
  },
  dateText: {
    fontSize: 11,
    fontFamily: theme.fonts.medium,
    color: theme.colors.textMuted,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
    gap: theme.spacing.sm,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: theme.fonts.semibold,
    color: theme.colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textSecondary,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.error,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  errorText: {
    fontSize: 12,
    fontFamily: theme.fonts.regular,
    color: theme.colors.error,
    textAlign: 'center',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 24 : theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textPrimary,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
