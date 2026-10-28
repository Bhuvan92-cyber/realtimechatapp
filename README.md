# Pulse Chat

A single-room, real-time chat application built with Expo, React Native, TypeScript, Node.js, Express, Socket.IO, and Supabase PostgreSQL.

Pulse Chat demonstrates a mobile-first client, a REST API, bidirectional realtime events, persisted message history, presence, and typing indicators. It uses username-only demo identity and is **not** a production-secure messaging service.

## Live demo

- **Web client:** [realtimechatapp-alpha-ten.vercel.app](https://realtimechatapp-alpha-ten.vercel.app/)
- **Backend service:** [realtimechatapp-e08b.onrender.com](https://realtimechatapp-e08b.onrender.com/)
- **Backend health endpoint:** [GET /api/health](https://realtimechatapp-e08b.onrender.com/api/health)

The hosted client depends on the backend and the Supabase project configured for that backend. When the API or database is unavailable, sign-in, message history, and message persistence may not work. The health endpoint verifies the Express process, not database readiness.

## Features

- Username-based demo sign-in (2–24 characters)
- Shared single-room conversation
- Realtime message broadcast over Socket.IO
- Message history persisted in Supabase PostgreSQL
- Online user list and connected-socket count
- Typing indicators
- Connection status and Socket.IO reconnection
- Local session persistence via AsyncStorage
- Expo web build and native Expo development workflow
- REST endpoints for health, login, users, and messages

## Architecture

~~~mermaid
flowchart LR
    CLIENT["Expo / React Native client<br/>Web, iOS, Android"] --> REST["REST API<br/>Express"]
    CLIENT <--> SOCKET["Socket.IO"]
    REST --> DB["Supabase PostgreSQL"]
    SOCKET --> HANDLERS["Socket handlers"]
    HANDLERS --> DB
    DB --> USERS["chat_users"]
    DB --> MESSAGES["chat_messages"]
    CLIENT --> STORAGE["AsyncStorage<br/>local session"]
~~~

### Request and realtime flow

1. The client posts a username to `POST /api/users/login`.
2. The backend finds or creates the corresponding row in `chat_users`.
3. The client loads message history from `GET /api/messages`.
4. Socket.IO connects and the client emits `user:join` with its user ID and username.
5. A message is emitted as `message:send`; the backend persists it before broadcasting `message:new`.
6. Presence and typing changes are broadcast to connected clients.

The server keeps the per-socket identity map in process memory. User and message records are stored in Supabase. This design assumes one backend instance; horizontal scaling needs shared socket/presence infrastructure.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for component responsibilities, contracts, and operational notes.

## Technology stack

| Layer | Technology |
| --- | --- |
| Mobile/web client | Expo SDK 54, React Native 0.81, React 19 |
| Navigation | Expo Router 6 |
| Language | TypeScript 5.9 |
| UI | React Native components, Inter, Lucide |
| HTTP API | Node.js 22, Express 4 |
| Realtime | Socket.IO 4 |
| Persistence | Supabase PostgreSQL |
| Web hosting | Vercel static output |
| API hosting | Render web service |

## Prerequisites

- Node.js 22.x (the backend declares Node 22 in `server/package.json`)
- npm
- A Supabase project with permission to run SQL migrations
- Git
- Optional: Expo Go or an emulator for native testing

Check versions:

~~~bash
node --version
npm --version
~~~

## Local setup

### 1. Create the database schema

Open the Supabase SQL Editor for the project you will use locally and execute:

`supabase/migrations/20260721085927_create_chat_tables.sql.sql`

It creates `chat_users` and `chat_messages`, including the message timestamp index and row-level security policies.

**Security note:** the migration intentionally allows anonymous and authenticated access to the shared demo tables. That matches the username-only, single-room demo design; it is not an appropriate access policy for private conversations or production user data.

### 2. Configure and start the backend

From the repository root:

~~~bash
cd server
npm ci
~~~

Copy `server/.env.example` to `server/.env` and set the values:

~~~env
PORT=3001
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SERVICE_ROLE_KEY
CLIENT_ORIGINS=http://localhost:8081,http://localhost:8082,http://localhost:19006,http://localhost:3000
~~~

Start the service:

~~~bash
npm start
~~~

For development with file watching:

~~~bash
npm run dev
~~~

Verify it in a browser or terminal:

~~~text
http://localhost:3001/api/health
~~~

Expected response:

~~~json
{"status":"ok"}
~~~

Run the included health smoke test from `server/`:

~~~bash
npm run test:smoke
~~~

The health check validates the HTTP process only. To validate persistence, use a configured Supabase project and test login and message history through the app.

### 3. Configure and start the Expo client

Open a second terminal at the repository root:

~~~bash
npm ci
~~~

Create a root `.env` file:

~~~env
EXPO_PUBLIC_API_BASE=http://localhost:3001
~~~

Start Expo:

~~~bash
npm run dev
~~~

To test the web target:

~~~bash
npm run dev -- --web
~~~

For a physical device, set `EXPO_PUBLIC_API_BASE` to the computer's LAN IP and port (for example, `http://192.168.1.20:3001`). Add the browser origin to `CLIENT_ORIGINS` when testing through a web browser. The phone and development computer must be able to reach one another over the network.

### Windows PowerShell

Use `npm.cmd` when PowerShell execution policy blocks the `npm.ps1` shim. For example, use `npm.cmd ci`, `npm.cmd start`, and `npm.cmd run dev`.

## Environment variables

| Variable | Location | Required | Purpose |
| --- | --- | --- | --- |
| `EXPO_PUBLIC_API_BASE` | Repository root `.env` | Recommended | Backend base URL used by the Expo client |
| `PORT` | `server/.env` | No | HTTP/Socket.IO listening port; defaults to 3001 |
| `SUPABASE_URL` | `server/.env` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `server/.env` | Yes | Server-only Supabase credential |
| `CLIENT_ORIGINS` | `server/.env` | Set explicitly | Comma-separated allowed web origins |

Never put `SUPABASE_SERVICE_ROLE_KEY` in an `EXPO_PUBLIC_*` variable, the client bundle, a screenshot, or a committed environment file. The service-role key bypasses row-level security.

## HTTP API

Local base URL: `http://localhost:3001`.

| Method | Endpoint | Success response |
| --- | --- | --- |
| GET | `/api/health` | `{"status":"ok"}` |
| POST | `/api/users/login` | `{"user": User}` |
| GET | `/api/users` | `{"users": User[]}` |
| GET | `/api/messages?limit=100` | `{"messages": Message[]}` |
| POST | `/api/messages` | `{"message": Message}` |

The history endpoint accepts a `limit` from 1 to 500; invalid values fall back to 100.

Example login request:

~~~bash
curl -X POST http://localhost:3001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice"}'
~~~

## Socket.IO events

| Direction | Event | Payload |
| --- | --- | --- |
| Client → server | `user:join` | `{ userId, username }` |
| Client → server | `message:send` | `{ text }` |
| Client → server | `typing:start` | none |
| Client → server | `typing:stop` | none |
| Server → client | `message:new` | `Message` |
| Server → client | `presence` | `{ online }` |
| Server → client | `users:online` | `{ users }` |
| Server → client | `typing:start` | `{ username }` |
| Server → client | `typing:stop` | `{ username }` |

## Test and validation instructions

Run these commands after installing dependencies.

**Client (repository root):**

~~~bash
npm run typecheck
npm run build:web
~~~

**Backend (from `server/`, with environment variables configured and the service running):**

~~~bash
npm run test:smoke
~~~

The smoke test sends one HTTP request to `/api/health` and checks for `{"status":"ok"}`. It does not exercise Supabase writes or realtime messaging.

**Manual end-to-end check:**

1. Open the web app in two separate browser profiles or one normal and one private window.
2. Sign in with two different usernames.
3. Confirm both clients show a connected state and presence count.
4. Send a message from one client and verify it appears in the other.
5. Reload one client and verify the message is still present in history.
6. Trigger the typing indicator and verify it is visible on the other client.

There is no automated Socket.IO/Supabase integration-test suite in this repository yet. Do not describe the manual flow or health check as proof of full end-to-end test coverage.

## Deployment

### Backend on Render

Create a Web Service linked to this repository:

| Setting | Value |
| --- | --- |
| Root directory | `server` |
| Runtime | Node.js 22 |
| Build command | `npm ci` |
| Start command | `npm start` |
| Health check path | `/api/health` |

Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `CLIENT_ORIGINS` in the Render service environment. Render supplies `PORT`.

### Frontend on Vercel

Configure the Vercel project:

| Setting | Value |
| --- | --- |
| Framework preset | Other / Expo static output |
| Build command | `npm run build:web` |
| Output directory | `dist` |
| Environment variable | `EXPO_PUBLIC_API_BASE=https://YOUR_RENDER_SERVICE.onrender.com` |

The client uses Expo's static web output as configured in `app.json`. Rebuild the frontend after changing `EXPO_PUBLIC_API_BASE`.

## Screenshots

The repository includes app icons but not verified screenshots captured from a running product session. Follow [docs/SCREENSHOTS.md](docs/SCREENSHOTS.md) to capture the login, conversation, presence, and typing states from the live or local application.

## Security and known limitations

- Username-only demo identity is not authentication. A visitor can claim another person's display name.
- The app is one shared room; there are no private conversations or room-level permissions.
- The included Supabase migration grants broad anonymous access to demo tables. Do not store private or regulated messages in this database configuration.
- The backend uses a Supabase service-role key and must keep it server-side.
- No account verification, password authentication, authorization model, rate limiting, abuse reporting/moderation, end-to-end encryption, or secure attachment handling is implemented.
- Presence and per-socket identity state are not backed by a shared store; multi-instance deployment requires additional infrastructure.
- The health endpoint does not prove that Supabase is reachable or correctly migrated.

## Contributing

1. Create a feature branch from `main`.
2. Make a focused change and add/update tests or validation notes.
3. Run the client checks and backend smoke test where applicable.
4. Update the architecture or setup docs when behavior changes.
5. Open a pull request with a summary and exact validation results.

## License

MIT. See [LICENSE](LICENSE).
