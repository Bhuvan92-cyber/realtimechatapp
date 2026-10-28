# Pulse Chat architecture

## Components

| Component | Location | Responsibility |
| --- | --- | --- |
| Expo app shell | `app/` | Expo Router navigation and root layout |
| Login and chat UI | `screens/`, `components/` | Username entry, message list, composer, avatars, typing and connection state |
| Chat state | `hooks/useChat.ts` | Message history, Socket.IO subscriptions, connection state, presence, typing |
| API client | `lib/api.ts` | HTTP requests and response parsing |
| Socket.IO client | `lib/socket.ts` | Singleton client connection and reconnection |
| Express API | `server/src/routes`, `controllers` | Login, user listing, message history and message creation |
| Socket handlers | `server/src/socket/socketHandler.js` | Join, broadcast, typing and presence events |
| Database adapter | `server/src/config`, `server/src/lib` | Server-side Supabase client |
| Database | `supabase/migrations` | Shared demo users and messages in PostgreSQL |

## Message flow

~~~mermaid
sequenceDiagram
    participant A as Expo client A
    participant API as Express / Socket.IO
    participant DB as Supabase PostgreSQL
    participant B as Expo client B
    A->>API: POST /api/users/login
    API->>DB: Find or create chat_users row
    DB-->>API: User record
    API-->>A: { user }
    A->>API: Socket.IO connect + user:join
    A->>API: message:send { text }
    API->>DB: Insert chat_messages row
    DB-->>API: Persisted message
    API-->>A: message:new
    API-->>B: message:new
~~~

## Data model

### chat_users

- `id`: UUID primary key
- `username`: unique display name
- `avatar_color`: deterministic display color
- `is_online`: informational presence flag
- `last_seen`, `created_at`: timestamps

### chat_messages

- `id`: UUID primary key
- `user_id`: reference to `chat_users.id`
- `username`: display-name snapshot
- `text`: message body
- `created_at`: timestamp indexed for history ordering

The migration currently permits anonymous shared-table access because this is a single-room demo with no actual authentication. That policy must be redesigned before private or production use.

## API response contract

The Expo HTTP client reads these keys:

- `POST /api/users/login` → `{ "user": User }`
- `GET /api/users` → `{ "users": User[] }`
- `GET /api/messages?limit=100` → `{ "messages": Message[] }`
- `POST /api/messages` → `{ "message": Message }`

Keep backend response keys and the corresponding TypeScript parsing types in `lib/api.ts` in sync.

## Realtime contract

The client joins with `user:join`, sends messages through `message:send`, and listens for `message:new`, `presence`, `users:online`, and typing events. Message persistence completes before the backend broadcasts a new message.

## Operational boundaries

- Supabase stores durable user and message records.
- The current Socket.IO server keeps a process-local map from socket IDs to user identities.
- The HTTP health endpoint reports that Express is responding; it is not a database readiness check.
- A multi-instance backend needs a Socket.IO adapter and a shared presence/connection strategy.
- The service-role key is used only on the backend and bypasses row-level security.
