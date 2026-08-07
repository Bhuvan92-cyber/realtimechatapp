import { StyleSheet, View, Text } from 'react-native';
import { theme } from '@/lib/theme';
import { formatTime } from '@/lib/format';
import type { Message } from '@/types/chat';

interface MessageBubbleProps {
  message: Message;
  isSelf: boolean;
  showUsername: boolean;
}

export function MessageBubble({ message, isSelf, showUsername }: MessageBubbleProps) {
  return (
    <View style={[styles.row, isSelf ? styles.rowSelf : styles.rowOther]}>
      <View style={[styles.bubble, isSelf ? styles.bubbleSelf : styles.bubbleOther]}>
        {showUsername && !isSelf && <Text style={styles.username}>{message.username}</Text>}
        <Text style={[styles.text, isSelf ? styles.textSelf : styles.textOther]}>{message.text}</Text>
        <Text style={[styles.time, isSelf ? styles.timeSelf : styles.timeOther]}>
          {formatTime(message.created_at)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  rowSelf: {
    justifyContent: 'flex-end',
  },
  rowOther: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
    borderRadius: theme.radius.lg,
  },
  bubbleSelf: {
    backgroundColor: theme.colors.bubbleSelf,
    borderBottomRightRadius: theme.radius.sm,
  },
  bubbleOther: {
    backgroundColor: theme.colors.bubbleOther,
    borderBottomLeftRadius: theme.radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  username: {
    fontSize: 12,
    fontFamily: theme.fonts.semibold,
    color: theme.colors.primary,
    marginBottom: 2,
  },
  text: {
    fontSize: 15,
    lineHeight: 21,
    fontFamily: theme.fonts.regular,
  },
  textSelf: {
    color: theme.colors.bubbleSelfText,
  },
  textOther: {
    color: theme.colors.bubbleOtherText,
  },
  time: {
    fontSize: 10,
    fontFamily: theme.fonts.regular,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeSelf: {
    color: 'rgba(255,255,255,0.75)',
  },
  timeOther: {
    color: theme.colors.textMuted,
  },
});
