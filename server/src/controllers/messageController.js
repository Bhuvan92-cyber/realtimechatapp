import { randomUUID } from 'node:crypto';
import { supabase } from '../config/supabase.js';

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
    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            throw error;
        }

        res.json(data);
    } catch (error) {
        console.error('Failed to fetch messages:', error);
        res.status(500).json({
            error: 'Failed to fetch messages'
        });
    }
}

// POST /api/messages
// Body: { userId, username, text }
export async function postMessage(req, res) {
  const { userId, username, text } = req.body ?? {};

  if (!userId || !username || !text || !text.trim()) {
    return res.status(400).json({
      error: 'userId, username and non-empty text are required',
    });
  }

  try {
    const id = randomUUID();

    const { data, error } = await db
      .from('messages')
      .insert({
        id,
        user_id: userId,
        username,
        text: text.trim(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(201).json({
      message: rowToMessage(data),
    });
  } catch (err) {
    console.error('[messages] insert failed:', err.message);
    return res.status(500).json({
      error: 'Failed to send message',
    });
  }
}

export async function createMessage(userId, username, text) {
  const id = randomUUID();

  const { data, error } = await db
    .from('messages')
    .insert({
      id,
      user_id: userId,
      username,
      text,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return rowToMessage(data);
}