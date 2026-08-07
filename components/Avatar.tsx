import { StyleSheet, View, Text } from 'react-native';
import { theme } from '@/lib/theme';
import { initials } from '@/lib/format';

interface AvatarProps {
  name: string;
  color: string;
  size?: number;
}

export function Avatar({ name, color, size = 40 }: AvatarProps) {
  const fontSize = size * 0.4;
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <Text style={[styles.text, { fontSize }]}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: theme.colors.textInverse,
    fontFamily: theme.fonts.semibold,
    letterSpacing: 0.5,
  },
});
