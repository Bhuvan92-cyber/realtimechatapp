import { randomUUID } from 'node:crypto';
import { db } from '../lib/db.js';

function rowToMessage(row) {
  return {
    id: row.id,
    user_id: row.user_id,
    username: row.username,
    text: row.text,
    created_at: row.created_at,
  };
}

// GET /api/messages?limit=100
// Fetches chat history (most recent `limit` messages, oldest-first).
export async function getMessages(req, res) {
  const limit = Math.min(Number(req.query.limit) || 100, 500);

  try {
    const rows = db.prepare('SELECT * FROM messages ORDER BY created_at DESC LIMIT ?').all(limit);
    const messages = rows.reverse().map(rowToMessage); // oldest -> newest
    return res.status(200).json({ messages });
  } catch (err) {
    console.error('[messages] fetch failed:', err.message);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
}

// POST /api/messages
// Body: { userId, username, text }
export async function postMessage(req, res) {
  const { userId, username, text } = req.body ?? {};

  if (!userId || !username || !text || !text.trim()) {
    return res.status(400).json({ error: 'userId, username and non-empty text are required' });
  }

  try {
    const id = randomUUID();
    db.prepare('INSERT INTO messages (id, user_id, username, text) VALUES (?, ?, ?, ?)')
      .run(id, userId, username, text.trim());
    const row = db.prepare('SELECT * FROM messages WHERE id = ?').get(id);
    return res.status(201).json({ message: rowToMessage(row) });
  } catch (err) {
    console.error('[messages] insert failed:', err.message);
    return res.status(500).json({ error: 'Failed to send message' });
  }
}

export function createMessage(userId, username, text) {
  const id = randomUUID();
  db.prepare('INSERT INTO messages (id, user_id, username, text) VALUES (?, ?, ?, ?)')
    .run(id, userId, username, text);
  const row = db.prepare('SELECT * FROM messages WHERE id = ?').get(id);
  return rowToMessage(row);
}
