/*
# Create chat tables (users + messages)

1. New Tables
- `chat_users`
  - `id` (uuid, primary key)
  - `username` (text, unique, not null) — display name for dummy auth
  - `avatar_color` (text, not null) — hex color used to render the avatar bubble
  - `is_online` (boolean, default false) — toggled by presence events; informational only
  - `last_seen` (timestamptz) — updated when a user disconnects
  - `created_at` (timestamptz, default now())
- `chat_messages`
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to chat_users.id, cascade on delete)
  - `username` (text, not null) — denormalized for cheap history queries without joins
  - `text` (text, not null) — message body
  - `created_at` (timestamptz, default now())
  - Index on `created_at` ascending for efficient history pagination

2. Security
- Enable RLS on both tables.
- `chat_users` is intentionally public/shared (dummy auth app): allow anon + authenticated CRUD.
- `chat_messages` is intentionally public/shared (single global chat room): allow anon + authenticated CRUD.
- Policies are scoped `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)` because this is a single-tenant demo chat app with no real auth — every connected client can read and write the shared room. This is explicitly the "intentionally public/shared" case.

3. Important notes
- This is a demo chat app with username-based dummy authentication (no password). All messages live in a single shared room.
- The anon-key client is the only client the frontend uses, so `anon` MUST be in every policy or the app will see empty data.
- Foreign key from chat_messages.user_id -> chat_users.id keeps message history consistent if a user is deleted.
- created_at index keeps the "fetch chat history" REST endpoint fast as the room grows.
*/

CREATE TABLE IF NOT EXISTS chat_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  avatar_color text NOT NULL DEFAULT '#3B82F6',
  is_online boolean NOT NULL DEFAULT false,
  last_seen timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chat_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_chat_users" ON chat_users;
CREATE POLICY "anon_select_chat_users" ON chat_users FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_chat_users" ON chat_users;
CREATE POLICY "anon_insert_chat_users" ON chat_users FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_chat_users" ON chat_users;
CREATE POLICY "anon_update_chat_users" ON chat_users FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_chat_users" ON chat_users;
CREATE POLICY "anon_delete_chat_users" ON chat_users FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES chat_users(id) ON DELETE CASCADE,
  username text NOT NULL,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_chat_messages" ON chat_messages;
CREATE POLICY "anon_select_chat_messages" ON chat_messages FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_chat_messages" ON chat_messages;
CREATE POLICY "anon_insert_chat_messages" ON chat_messages FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_chat_messages" ON chat_messages;
CREATE POLICY "anon_delete_chat_messages" ON chat_messages FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at
  ON chat_messages (created_at ASC);