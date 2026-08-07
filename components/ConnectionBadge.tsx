import { StyleSheet, View, Text } from 'react-native';
import { theme } from '@/lib/theme';
import type { ConnectionStatus } from '@/types/chat';

const LABELS: Record<ConnectionStatus, string> = {
  connecting: 'Connecting…',
  connected: 'Online',
  disconnected: 'Disconnected',
  error: 'Connection error',
};

const DOT_COLOR: Record<ConnectionStatus, string> = {
  connecting: theme.colors.warning,
  connected: theme.colors.online,
  disconnected: theme.colors.offline,
  error: theme.colors.error,
};

export function ConnectionBadge({ status, onlineCount }: { status: ConnectionStatus; onlineCount: number }) {
  const label = status === 'connected' ? `${onlineCount} online` : LABELS[status];
  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: DOT_COLOR[status] }]} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  text: {
    fontSize: 12,
    fontFamily: theme.fonts.medium,
    color: theme.colors.textSecondary,
  },
});
