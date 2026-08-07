import { useRef } from 'react';
import { getSocket } from '@/lib/socket';

// Emits typing:start on every keystroke and typing:stop after the user pauses.
// The backend relays these to other clients; the debounce keeps it tidy.
export function useTyping(username: string) {
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notifyTyping = () => {
    const socket = getSocket();
    if (!socket.connected) return;
    socket.emit('typing:start');

    if (stopTimer.current) clearTimeout(stopTimer.current);
    stopTimer.current = setTimeout(() => {
      socket.emit('typing:stop');
    }, 1500);
  };

  const stopTyping = () => {
    if (stopTimer.current) {
      clearTimeout(stopTimer.current);
      stopTimer.current = null;
    }
    const socket = getSocket();
    if (socket.connected) socket.emit('typing:stop');
  };

  return { notifyTyping, stopTyping };
}
