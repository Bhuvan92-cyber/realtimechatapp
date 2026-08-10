import {
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';

import { getSocket, disposeSocket } from '@/lib/socket';
import { api } from '@/lib/api';
import type {
  Message,
  ConnectionStatus,
  TypingEvent,
} from '@/types/chat';

interface UseChatOptions {
  userId: string;
  username: string;
}

interface UseChatResult {
  messages: Message[];
  connectionStatus: ConnectionStatus;
  onlineCount: number;
  onlineUsers: string[];
  typingUser: string | null;
  sendMessage: (text: string) => Promise<boolean>;
  error: string | null;
  historyLoaded: boolean;
}

const TYPING_TIMEOUT_MS = 3000;

export function useChat({
  userId,
  username,
}: UseChatOptions): UseChatResult {
  // Always initialize messages as an array.
  const [messages, setMessages] = useState<Message[]>([]);

  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('connecting');

  const [onlineCount, setOnlineCount] = useState(0);

  const [onlineUsers, setOnlineUsers] =
    useState<string[]>([]);

  const [typingUser, setTypingUser] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [historyLoaded, setHistoryLoaded] =
    useState(false);

  const typingTimer = useRef<
    ReturnType<typeof setTimeout> | null
  >(null);

  const joined = useRef(false);

  // ---------------------------------------------------------
  // Load persisted message history
  // ---------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    api
      .fetchMessages()
      .then((history) => {
        if (cancelled) return;

        // Defensive check:
        // messages must ALWAYS be an array because
        // ChatScreen uses messages.forEach(...).
        setMessages(
          Array.isArray(history)
            ? history
            : [],
        );

        setHistoryLoaded(true);
      })
      .catch((err: unknown) => {
        if (cancelled) return;

        const message =
          err instanceof Error
            ? err.message
            : 'Unknown error';

        console.error(
          'Failed to load message history:',
          err,
        );

        setMessages([]);
        setError(
          `Could not load message history: ${message}`,
        );
        setHistoryLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // ---------------------------------------------------------
  // Connect Socket.IO and register listeners
  // ---------------------------------------------------------
  useEffect(() => {
    if (!userId || !username) {
      return;
    }

    const socket = getSocket();

    const clearTyping = () => {
      if (typingTimer.current) {
        clearTimeout(typingTimer.current);
        typingTimer.current = null;
      }
    };

    const onConnect = () => {
      setConnectionStatus('connected');
      setError(null);

      if (!joined.current) {
        joined.current = true;

        socket.emit(
          'user:join',
          {
            userId,
            username,
          },
          (ack: {
            ok: boolean;
            online?: number;
          }) => {
            if (
              ack?.ok &&
              typeof ack.online === 'number'
            ) {
              setOnlineCount(ack.online);
            }
          },
        );
      }
    };

    const onDisconnect = () => {
      setConnectionStatus('disconnected');
    };

    const onConnectError = () => {
      setConnectionStatus('error');
      setError(
        'Cannot reach the chat server. Retrying…',
      );
    };

    const onNewMessage = (msg: Message) => {
      // Ignore malformed socket messages.
      if (!msg || !msg.id) {
        console.warn(
          'Received invalid message from socket:',
          msg,
        );
        return;
      }

      setMessages((prev) => [
        ...prev,
        msg,
      ]);
    };

    const onPresence = ({
      online,
    }: {
      online: number;
    }) => {
      if (typeof online === 'number') {
        setOnlineCount(online);
      }
    };

    const onUsersOnline = ({
      users,
    }: {
      users: string[];
    }) => {
      setOnlineUsers(
        Array.isArray(users)
          ? users
          : [],
      );
    };

    const onTypingStart = ({
      username: who,
    }: TypingEvent) => {
      if (who === username) {
        return;
      }

      setTypingUser(who);

      clearTyping();

      typingTimer.current = setTimeout(() => {
        setTypingUser(null);
        typingTimer.current = null;
      }, TYPING_TIMEOUT_MS);
    };

    const onTypingStop = () => {
      clearTyping();
      setTypingUser(null);
    };

    // Register Socket.IO listeners.
    socket.on('connect', onConnect);
    socket.on(
      'disconnect',
      onDisconnect,
    );
    socket.on(
      'connect_error',
      onConnectError,
    );
    socket.on(
      'message:new',
      onNewMessage,
    );
    socket.on(
      'presence',
      onPresence,
    );
    socket.on(
      'users:online',
      onUsersOnline,
    );
    socket.on(
      'typing:start',
      onTypingStart,
    );
    socket.on(
      'typing:stop',
      onTypingStop,
    );

    // Connect if not already connected.
    if (!socket.connected) {
      socket.connect();
    }

    // Cleanup.
    return () => {
      clearTyping();

      socket.off(
        'connect',
        onConnect,
      );

      socket.off(
        'disconnect',
        onDisconnect,
      );

      socket.off(
        'connect_error',
        onConnectError,
      );

      socket.off(
        'message:new',
        onNewMessage,
      );

      socket.off(
        'presence',
        onPresence,
      );

      socket.off(
        'users:online',
        onUsersOnline,
      );

      socket.off(
        'typing:start',
        onTypingStart,
      );

      socket.off(
        'typing:stop',
        onTypingStop,
      );

      disposeSocket();

      joined.current = false;
    };
  }, [userId, username]);

  // ---------------------------------------------------------
  // Send message through Socket.IO
  // ---------------------------------------------------------
  const sendMessage = useCallback(
    async (
      text: string,
    ): Promise<boolean> => {
      const trimmed = text.trim();

      if (!trimmed) {
        return false;
      }

      const socket = getSocket();

      if (!socket.connected) {
        setError(
          'Not connected. Please wait and try again.',
        );

        return false;
      }

      return new Promise<boolean>(
        (resolve) => {
          let settled = false;

          const finish = (
            success: boolean,
          ) => {
            if (settled) {
              return;
            }

            settled = true;
            resolve(success);
          };

          socket.emit(
            'message:send',
            {
              text: trimmed,
            },
            (ack: {
              ok: boolean;
              error?: string;
            }) => {
              if (ack?.ok) {
                setError(null);
                finish(true);
              } else {
                setError(
                  ack?.error ??
                    'Failed to send message',
                );

                finish(false);
              }
            },
          );

          // Safety timeout.
          setTimeout(() => {
            if (!settled) {
              setError(
                'Message send timed out. Please try again.',
              );

              finish(false);
            }
          }, 5000);
        },
      );
    },
    [],
  );

  return {
    messages,
    connectionStatus,
    onlineCount,
    onlineUsers,
    typingUser,
    sendMessage,
    error,
    historyLoaded,
  };
}

