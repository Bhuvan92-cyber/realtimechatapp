import { randomUUID } from 'node:crypto';
import { db } from '../lib/db.js';

const AVATAR_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

function pickColor(username) {
  let hash = 0;
  for (let i = 0; i < username.length; i += 1) {
    hash = (hash << 5) - hash + username.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function rowToUser(row) {
  return {
    id: row.id,
    username: row.username,
    avatar_color: row.avatar_color,
    is_online: Boolean(row.is_online),
    last_seen: row.last_seen,
    created_at: row.created_at,
  };
}

// POST /api/users/login
// Body: { username }
// Dummy authentication: upserts a user row by username and returns it.
export async function login(req, res) {
  const username = (req.body?.username ?? '').trim();

  if (!username || username.length < 2 || username.length > 24) {
    return res.status(400).json({ error: 'Username must be 2–24 characters' });
  }

  try {
    const existing = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.status(200).json({ user: rowToUser(existing) });
    }

    const id = randomUUID();
    const color = pickColor(username);
    db.prepare('INSERT INTO users (id, username, avatar_color) VALUES (?, ?, ?)').run(id, username, color);
    const created = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    return res.status(201).json({ user: rowToUser(created) });
  } catch (err) {
    console.error('[users] login failed:', err.message);
    return res.status(500).json({ error: 'Failed to log in' });
  }
}

// GET /api/users
export async function listUsers(_req, res) {
  try {
    const rows = db.prepare('SELECT * FROM users ORDER BY username ASC').all();
    return res.status(200).json({ users: rows.map(rowToUser) });
  } catch (err) {
    console.error('[users] list failed:', err.message);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
}

export function setUserOnline(userId, online) {
  try {
    db.prepare('UPDATE users SET is_online = ?, last_seen = datetime(\'now\') WHERE id = ?')
      .run(online ? 1 : 0, userId);
  } catch (err) {
    console.error('[presence] update failed:', err.message);
  }
}

export function listOnlineUsernames() {
  try {
    const rows = db.prepare('SELECT username FROM users WHERE is_online = 1 ORDER BY username ASC').all();
    return rows.map((r) => r.username);
  } catch (err) {
    console.error('[presence] list failed:', err.message);
    return [];
  }
}
