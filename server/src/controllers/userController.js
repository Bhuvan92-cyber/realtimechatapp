import { randomUUID } from 'node:crypto';
import { db } from '../lib/db.js';

const AVATAR_COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#F97316',
];

function pickColor(username) {
  let hash = 0;

  for (let i = 0; i < username.length; i += 1) {
    hash = (hash << 5) - hash + username.charCodeAt(i);
    hash |= 0;
  }

  return AVATAR_COLORS[
    Math.abs(hash) % AVATAR_COLORS.length
  ];
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
export async function login(req, res) {
  const username = (req.body?.username ?? '').trim();

  if (!username || username.length < 2 || username.length > 24) {
    return res.status(400).json({
      error: 'Username must be 2–24 characters',
    });
  }

  try {
    const { data: existing, error: findError } = await db
      .from('users')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (findError) {
      throw findError;
    }

    if (existing) {
      return res.status(200).json({
        user: rowToUser(existing),
      });
    }

    const id = randomUUID();
    const color = pickColor(username);

    const { data: created, error: insertError } = await db
      .from('users')
      .insert({
        id,
        username,
        avatar_color: color,
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return res.status(201).json({
      user: rowToUser(created),
    });
  } catch (err) {
    console.error(
      '[users] login failed:',
      err.message
    );

    return res.status(500).json({
      error: 'Failed to log in',
    });
  }
}

// GET /api/users
export async function listUsers(_req, res) {
  try {
    const { data, error } = await db
      .from('users')
      .select('*')
      .order('username', { ascending: true });

    if (error) {
      throw error;
    }

    return res.status(200).json({
      users: (data ?? []).map(rowToUser),
    });
  } catch (err) {
    console.error(
      '[users] list failed:',
      err.message
    );

    return res.status(500).json({
      error: 'Failed to fetch users',
    });
  }
}

export async function setUserOnline(userId, online) {
  try {
    const { error } = await db
      .from('users')
      .update({
        is_online: online,
        last_seen: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      throw error;
    }
  } catch (err) {
    console.error(
      '[presence] update failed:',
      err.message
    );
  }
}

export async function listOnlineUsernames() {
  try {
    const { data, error } = await db
      .from('users')
      .select('username')
      .eq('is_online', true)
      .order('username', { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => row.username);
  } catch (err) {
    console.error(
      '[presence] list failed:',
      err.message
    );

    return [];
  }
}