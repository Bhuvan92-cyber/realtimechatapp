import { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '@/lib/theme';
import LoginScreen from '@/screens/LoginScreen';
import ChatScreen from '@/components/ChatScreen';
import type { User } from '@/types/chat';

const SESSION_KEY = 'pulse-chat-session';

export default function HomeScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const cached = await AsyncStorage.getItem(SESSION_KEY);
        if (cached) {
          const parsed: User = JSON.parse(cached);
          setUser(parsed);
        }
      } catch {
        // ignore — user will just see the login screen
      } finally {
        setRestoring(false);
      }
    })();
  }, []);

  const handleLogin = async (loggedIn: User) => {
    setUser(loggedIn);
    try {
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(loggedIn));
    } catch {
      // persistence failed — session still works for this tab
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore
    }
    setUser(null);
  };

  if (restoring) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return <ChatScreen currentUser={user} onLogout={handleLogout} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
});
