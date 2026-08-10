# Pulse Chat

Pulse Chat is a real-time, single-room chat application built with Expo, React Native, TypeScript, Node.js, Express, Socket.IO, and Supabase PostgreSQL.

The application provides username-based demo access, real-time messaging, message history, typing indicators, presence updates, and session persistence. It is intended as a portfolio/demo application and is not yet a production-grade authenticated messaging platform.

## Live environments

- Frontend: [realtimechatapp-alpha-ten.vercel.app](https://realtimechatapp-alpha-ten.vercel.app/)
- Backend: [realtimechatapp-e08b.onrender.com](https://realtimechatapp-e08b.onrender.com/)
- Source repository: [github.com/Bhuvan92-cyber/realtimechatapp](https://github.com/Bhuvan92-cyber/realtimechatapp)

The backend currently requires the Supabase schema migration to be applied before login and message persistence can work. See [Local development](#local-development).

## Product capabilities

- Username-based demo login with deterministic avatar colors
- Real-time message delivery through Socket.IO
- Persisted message history in Supabase PostgreSQL
- Online user count and online-user list
- Typing indicators
- Connection status and reconnect handling
- Local session persistence through AsyncStorage
- Responsive Expo web interface with React Native components
- REST endpoints for health, login, users, and messages

## Technology stack

| Area               | Technology                                         |
| ------------------ | -------------------------------------------------- |
| Client             | React Native, Expo SDK 54, Expo Router, TypeScript |
| UI                 | Inter font, Lucide icons, centralized theme tokens |
| Realtime transport | Socket.IO client/server                            |
| API                | Node.js 22, Express                                |
| Database           | Supabase PostgreSQL                                |
| Web hosting        | Vercel static deployment                           |
| API hosting        | Render web service                                 |

## Repository layout

```text
app/                 Expo Router routes and application entry points
components/          Chat UI, messages, avatars, indicators, and status badges
screens/             Login screen
hooks/               Chat, typing, and Expo lifecycle hooks
lib/                 API client, Socket.IO client, formatting, and theme
types/               Shared TypeScript domain types
server/src/          Express and Socket.IO backend
server/src/config/   Runtime and Supabase configuration
server/src/controllers/  User and message operations
server/src/socket/   Realtime event handlers
supabase/migrations/ Database schema and row-level security policies
assets/              Application icons and web favicon
```

## Prerequisites

- Node.js 22.x
- npm
- A Supabase project
- An Expo account for EAS Hosting, if deploying the frontend through EAS
- A Render account, if deploying the backend through Render

Node 22 is required by the backend runtime configuration. Use `npm.cmd` on Windows if PowerShell blocks `npm.ps1`.

## Local development

### 1. Configure Supabase

Create a Supabase project and run the SQL in:

```text
supabase/migrations/20260721085927_create_chat_tables.sql.sql
```

The migration creates the following public tables:

- `chat_users`
- `chat_messages`

Confirm the tables exist in the same Supabase project referenced by `SUPABASE_URL`.

### 2. Start the backend

```powershell
cd server
npm.cmd ci
```

Create `server/.env`:

```env
PORT=3001
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SERVICE_ROLE_KEY
CLIENT_ORIGINS=http://localhost:8081,http://localhost:3000
```

Start the service:

```powershell
npm.cmd start
```

Verify the backend:

```text
http://localhost:3001/api/health
```

Expected response:

```json
{"status":"ok"}
```

### 3. Start the Expo frontend

From the repository root:

```powershell
npm.cmd ci
```

Create or update the root `.env`:

```env
EXPO_PUBLIC_API_BASE=http://localhost:3001
```

Start Expo:

```powershell
npm.cmd run dev
```

For the web target:

```powershell
npm.cmd run dev -- --web
```

For a physical device, replace `localhost` with the backend machine's LAN IP and allow the corresponding frontend origin in `CLIENT_ORIGINS`.

## Environment variables

### Frontend

| Variable | Required | Purpose |
| --- | --- | --- |
| `EXPO_PUBLIC_API_BASE` | Yes | Public URL of the deployed backend |

`EXPO_PUBLIC_*` values are embedded into the web bundle at build time. Never place Supabase service-role credentials in the frontend or in Vercel's public runtime configuration.

### Backend

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | Render-provided | HTTP and Socket.IO listening port |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only Supabase credential |
| `CLIENT_ORIGINS` | Yes in production | Comma-separated allowed browser origins |

For the current Vercel deployment, `CLIENT_ORIGINS` must include:

```text
https://realtimechatapp-alpha-ten.vercel.app
```

## HTTP API

Base URL: `http://localhost:3001` locally or the Render service URL in production.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Service health check |
| `POST` | `/api/users/login` | Create or retrieve a username-based demo user |
| `GET` | `/api/users` | List users and presence state |
| `GET` | `/api/messages?limit=100` | Read message history |
| `POST` | `/api/messages` | Persist a message through REST |

Login request example:

```json
{
  "username": "alice"
}
```

## Socket.IO events

### Client to server

| Event | Payload | Purpose |
| --- | --- | --- |
| `user:join` | `{ userId, username }` | Register the connected user |
| `message:send` | `{ text }` | Persist and broadcast a message |
| `typing:start` | none | Notify other users that typing started |
| `typing:stop` | none | Notify other users that typing stopped |

### Server to client

| Event | Payload | Purpose |
| --- | --- | --- |
| `message:new` | `Message` | New persisted message |
| `presence` | `{ online }` | Connected socket count |
| `users:online` | `{ users }` | Current online usernames |
| `typing:start` | `{ username }` | Another user started typing |
| `typing:stop` | `{ username }` | Another user stopped typing |

## Deployment

### Backend on Render

Create a Render Web Service connected to the repository with:

| Render setting | Value |
| --- | --- |
| Root Directory | `server` |
| Build Command | `npm ci` |
| Start Command | `npm start` |
| Node.js | `22.x` |
| Health Check Path | `/api/health` |

Add the backend environment variables listed above. Render automatically provides the service `PORT`; the application reads it from the environment.

Render supports Socket.IO/WebSocket connections on web services. The current backend uses one process and in-memory presence state. If the service is scaled horizontally, a shared Socket.IO adapter and shared presence store will be required.

### Frontend on Vercel

The Expo web output is configured as static in `app.json`:

```json
{
  "expo": {
    "web": {
      "bundler": "metro",
      "output": "static"
    }
  }
}
```

Configure the project with:

| Vercel setting | Value |
| --- | --- |
| Framework | Other / Expo static output |
| Build Command | `npm run build:web` |
| Output Directory | `dist` |
| Environment Variable | `EXPO_PUBLIC_API_BASE=https://YOUR_RENDER_SERVICE.onrender.com` |

Deploy using the Vercel dashboard or CLI. Rebuild after changing `EXPO_PUBLIC_API_BASE`.

### Frontend on EAS Hosting

Alternatively:

```powershell
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest deploy --prod
```

## Validation commands

From the repository root:

```powershell
npm.cmd run typecheck
npm.cmd run build:web
```

From `server/`:

```powershell
npm.cmd ci
npm.cmd start
```

The backend should respond with `{"status":"ok"}` at `/api/health` before testing the frontend.

## Current integration notes

The repository and hosted services are actively being aligned with the Supabase schema. Before treating the public deployment as production-ready, verify the following:

- The `chat_users` and `chat_messages` tables have been applied to the Supabase project used by Render.
- Backend and frontend response envelopes use the same field names (`messages` and `users`).
- Socket.IO message persistence uses `chat_messages` consistently.
- Render `CLIENT_ORIGINS` includes the exact Vercel production origin.
- Server-only Supabase credentials are stored only in Render.

## Security and operational scope

This project uses username-only demo identity and has no password authentication, account verification, authorization model, rate limiting, moderation, or message encryption. Do not use it for confidential or regulated communications without adding those controls.

The Supabase service-role key bypasses row-level security and must remain server-side. Rotate it immediately if it is exposed or committed.

## Contributing

1. Create a feature branch from `main`.
2. Make a focused change.
3. Run the typecheck and web build.
4. Review the diff and update documentation when behavior or deployment changes.
5. Open a pull request with a concise description and validation notes.

## License

No license file is currently included. Until one is added, the repository should be treated as all-rights-reserved by default.
