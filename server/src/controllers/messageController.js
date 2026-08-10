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

// GET /api/chat_messages?limit=100
export async function getMessages(req, res) {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    // IMPORTANT:
    // Frontend expects { chat_messages: [...] }
    return res.json({
      chat_messages: data.map(rowToMessage),
    });
  } catch (error) {
    console.error('Failed to fetch chat_messages:', error);

    return res.status(500).json({
      error: 'Failed to fetch chat_messages',
    });
  }
}

// POST /api/chat_messages
export async function postMessage(req, res) {
  const { userId, username, text } = req.body ?? {};

  if (!userId || !username || !text || !text.trim()) {
    return res.status(400).json({
      error: 'userId, username and non-empty text are required',
    });
  }

  try {
    const id = randomUUID();

    const { data, error } = await supabase
      .from('chat_messages')
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
    console.error('[chat_messages] insert failed:', err);

    return res.status(500).json({
      error: 'Failed to send message',
    });
  }
}

// Used by Socket.IO
export async function createMessage(userId, username, text) {
  const id = randomUUID();

  const { data, error } = await supabase
    .from('chat_messages')
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

  return rowToMessage(data);
}