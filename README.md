# Pulse Chat — Real-Time Chat Application

A real-time chat application built with **React Native (Expo)** on the frontend and **Node.js + Express + Socket.io** on the backend, with SQLite for message persistence.

Users can send and receive messages instantly, view chat history after refreshing, see timestamps, know who's online, and see when someone is typing.

---

## Features

### Core (required)
- **Send & receive messages** instantly via Socket.io (no page refresh)
- **Real-time broadcast** — new messages appear for all connected users immediately
- **Message persistence** — chat history is stored in SQLite and loaded on app refresh
- **Timestamps** — every message shows its send time
- **REST APIs** — `POST /api/messages`, `GET /api/messages` alongside the realtime layer
- **Graceful connection handling** — auto-reconnect, connection status badge, error banners

### Bonus (implemented)
- **Username-based login** (dummy authentication — no password)
- **Typing indicator** — see when another user is typing
- **Online/offline user status** — live online count + user list
- **Message persistence** — SQLite database (via Node's built-in `node:sqlite`)
- **Session persistence** — username is remembered across refreshes (AsyncStorage)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native (Expo SDK 54), Expo Router, TypeScript |
| Real-time | Socket.io (client + server) |
| Backend | Node.js, Express |
| Database | SQLite (Node built-in `node:sqlite`) |
| Fonts | Inter (`@expo-google-fonts/inter`) |
| Icons | Lucide (`lucide-react-native`) |

---

## Project Structure

```
.
├── app/                        # Expo Router routes
│   ├── _layout.tsx             # Root layout (Stack)
│   ├── +not-found.tsx          # 404 screen
│   └── (tabs)/
│       ├── _layout.tsx         # Tab bar layout
│       └── index.tsx           # Main screen (login ↔ chat orchestrator)
├── components/
│   ├── Avatar.tsx              # Initials avatar bubble
│   ├── ChatScreen.tsx          # Main chat UI (message list + composer)
│   ├── ConnectionBadge.tsx     # Online/connecting/disconnected indicator
│   ├── MessageBubble.tsx       # Individual message with timestamp
│   └── TypingIndicator.tsx     # Animated "user is typing…" indicator
├── screens/
│   └── LoginScreen.tsx         # Username login screen
├── hooks/
│   ├── useChat.ts              # Socket.io + message state management
│   ├── useTyping.ts            # Typing event emitter (debounced)
│   └── useFrameworkReady.ts    # Expo framework init (required)
├── lib/
│   ├── api.ts                  # REST client (login, fetchMessages, listUsers)
│   ├── socket.ts               # Socket.io client singleton
│   ├── theme.ts                # Centralized color/font/spacing tokens
│   └── format.ts               # Time + initials helpers
├── types/
│   ├── chat.ts                 # Shared Message / User / status types
│   └── env.d.ts                # Environment variable type declarations
├── server/                     # Node.js + Express + Socket.io backend
│   ├── src/
│   │   ├── config/env.js       # Environment config
│   │   ├── controllers/
│   │   │   ├── messageController.js
│   │   │   └── userController.js
│   │   ├── lib/db.js           # SQLite connection + schema init
│   │   ├── routes/index.js     # Express route definitions
│   │   ├── socket/socketHandler.js  # Socket.io event handlers
│   │   └── index.js            # HTTP + Socket.io server entry
│   ├── data/                   # SQLite database file (auto-created)
│   ├── .env.example
│   └── package.json
├── .env                        # Frontend environment variables
├── app.json                    # Expo config
└── package.json                # Frontend dependencies
```

---

## Setup Instructions

### Prerequisites
- **Node.js v22+** (required for the built-in `node:sqlite` module used by the backend)
- **npm** (comes with Node)
- A modern browser (for the web build) or the Expo Go app (for mobile)

### 1. Backend Setup

```bash
cd server

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env — see "Environment Variables" below

# Start the server
npm start          # production
# or
npm run dev        # development with auto-reload
```

The server starts on **http://localhost:3001** by default.

Verify it's running:
```bash
curl http://localhost:3001/api/health
# → {"status":"ok"}
```

### 2. Frontend Setup

From the project root (not the `server/` folder):

```bash
# Install dependencies
npm install

# Start the Expo dev server (web)
npm run dev
```

This opens the app in your browser. The default web dev server runs on port 8081 (or 9091 depending on the environment).

**To build a production web bundle:**
```bash
npm run build:web
# Output is in ./dist
```

### 3. Connecting Frontend to Backend

The frontend connects to the backend URL defined in the `EXPO_PUBLIC_API_BASE` environment variable (in the root `.env` file). By default this is `http://localhost:3001`.

- **Web (same machine):** `http://localhost:3001` works as-is.
- **Mobile / physical device:** Replace with your machine's LAN IP, e.g. `http://192.168.1.50:3001`, and ensure both devices are on the same network.

---

## Environment Variables

### Frontend (root `.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_BASE` | Backend server URL | `http://localhost:3001` |
| `EXPO_PUBLIC_SUPABASE_URL` | (Pre-provisioned, unused by this app) | — |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | (Pre-provisioned, unused by this app) | — |

### Backend (`server/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Port the backend listens on | `3001` |
| `CLIENT_ORIGINS` | Comma-separated allowed CORS origins | `http://localhost:8081,http://localhost:19006` |

---

## REST API Reference

Base URL: `http://localhost:3001`

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| `GET` | `/api/health` | Health check | — |
| `GET` | `/api/messages?limit=100` | Fetch chat history (oldest→newest) | — |
| `POST` | `/api/messages` | Send a message (REST) | `{ userId, username, text }` |
| `POST` | `/api/users/login` | Dummy login (upsert by username) | `{ username }` |
| `GET` | `/api/users` | List all users with online status | — |

---

## Socket.io Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `user:join` | `{ userId, username }` | Identify on connect (ack returns online count) |
| `message:send` | `{ text }` | Send a message (persisted + broadcast) |
| `typing:start` | — | Notify others the user is typing |
| `typing:stop` | — | Notify others the user stopped typing |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `message:new` | `Message` | A new message was sent by any user |
| `presence` | `{ online: number }` | Online socket count changed |
| `users:online` | `{ users: string[] }` | List of online usernames |
| `typing:start` | `{ username }` | Another user started typing |
| `typing:stop` | `{ username }` | Another user stopped typing |

---

## Design Decisions

1. **SQLite over MongoDB** — The backend uses Node.js's built-in `node:sqlite` module (zero external DB dependencies, no separate server process). This keeps setup to a single `npm install && npm start`. The schema (users + messages tables) is simple enough that a relational DB is a natural fit. A Supabase/Postgres migration is also included as an alternative.

2. **Socket.io for all realtime** — Messages are sent over Socket.io (not REST) for instant delivery. The REST `POST /api/messages` endpoint exists per the spec for non-realtime clients, but the live app uses the socket path. Messages are persisted server-side *before* being broadcast, guaranteeing durability.

3. **Dummy username auth** — Login is username-only with no password (per the bonus). The server upserts a user row by username and assigns a deterministic avatar color. This keeps the demo frictionless while still giving each user an identity.

4. **Session persistence via AsyncStorage** — The logged-in user is cached in AsyncStorage so a page refresh doesn't kick you back to the login screen. This works on both web and native.

5. **Centralized theme** — All colors, fonts, spacing, and radii live in `lib/theme.ts`. This ensures visual consistency and makes restyling a one-file change.

6. **Clean separation of concerns** — The `useChat` hook owns all socket + message state; components are purely presentational. The socket client is a singleton (`lib/socket.ts`) so there's exactly one connection per app instance.

7. **Error handling at every boundary** — REST calls check response status and surface errors in a visible banner. Socket events use acknowledgement callbacks to confirm success/failure. Connection errors auto-retry with a visible "Connection error" badge.

---

## Assumptions

1. **Single chat room** — All users join one global room (no private/group channels). The spec describes a single chat application, so multi-room routing is out of scope.
2. **No real authentication** — Per the bonus, login is username-based with no password. Usernames are unique (enforced by the DB) but not secured.
3. **Node.js v22+** — The backend requires Node 22+ for the built-in `node:sqlite` module (experimental but stable enough for this use case).
4. **Web-first testing** — The app builds for web and mobile, but the primary testing target is the web build (Expo web). An APK can be generated via EAS Build (`eas build -p android`) but requires an Expo account and native build infrastructure.
5. **Messages are plaintext** — No markdown, image uploads, or rich media. Text only, max 1000 characters.
6. **No message pagination** — History loads the most recent 100 messages. Infinite scroll pagination is feasible but out of scope for the 24-hour window.
7. **Same-network for mobile** — If running the frontend on a physical device, the device and the backend must be on the same network, and `EXPO_PUBLIC_API_BASE` must point to the host machine's LAN IP.

---

## Running the App

1. Start the backend: `cd server && npm install && npm start`
2. Start the frontend: `npm run dev` (from the project root)
3. Open the app in your browser, enter a username, and start chatting.
4. Open a second browser tab/window with a different username to see real-time delivery, typing indicators, and presence in action.

---

## Generating an APK (React Native)

This project uses Expo's managed workflow. To generate an APK:

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in to your Expo account
eas login

# Build the APK
eas build -p android --profile preview
```

Alternatively, use `expo prebuild` to generate native projects and build with Android Studio. Note that the `node:sqlite` backend must be deployed separately (e.g. on Render or Railway) for the mobile app to connect — update `EXPO_PUBLIC_API_BASE` to the deployed URL before building.
