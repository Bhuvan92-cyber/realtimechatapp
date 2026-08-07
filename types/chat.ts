// Shared types for the chat app. Mirror the backend's JSON shapes exactly.

export interface User {
  id: string;
  username: string;
  avatar_color: string;
  is_online: boolean;
  last_seen: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  user_id: string;
  username: string;
  text: string;
  created_at: string;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface PresenceState {
  online: number;
}

export interface TypingEvent {
  username: string;
}
