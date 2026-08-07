import { createMessage } from '../controllers/messageController.js';
import { setUserOnline, listOnlineUsernames } from '../controllers/userController.js';

// In-memory registry of connected sockets. Map<socketId, { userId, username }>.
// This is ephemeral presence state — it lives only for the duration of a
// socket connection and is never persisted. The authoritative message and
// user records live in SQLite.
const connected = new Map();

function broadcastPresence(io) {
  io.emit('presence', { online: io.sockets.sockets.size });
  io.emit('users:online', { users: listOnlineUsernames() });
}

export function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log(`[socket] connected: ${socket.id}`);

    // A client identifies itself right after connecting with its user record.
    socket.on('user:join', (payload, ack) => {
      try {
        if (!payload || !payload.userId || !payload.username) {
          if (typeof ack === 'function') ack({ ok: false, error: 'userId and username required' });
          return;
        }

        connected.set(socket.id, { userId: payload.userId, username: payload.username });
        socket.data.userId = payload.userId;
        socket.data.username = payload.username;

        setUserOnline(payload.userId, true);
        broadcastPresence(io);

        if (typeof ack === 'function') {
          ack({ ok: true, online: io.sockets.sockets.size });
        }
        socket.emit('users:online', { users: listOnlineUsernames() });
      } catch (err) {
        console.error('[socket] user:join failed:', err.message);
        if (typeof ack === 'function') ack({ ok: false, error: 'Join failed' });
      }
    });

    // Real-time message: persist then broadcast to everyone.
    socket.on('message:send', (payload, ack) => {
      try {
        const ctx = connected.get(socket.id);
        if (!ctx) {
          if (typeof ack === 'function') ack({ ok: false, error: 'Not joined' });
          return;
        }
        const text = (payload?.text ?? '').trim();
        if (!text) {
          if (typeof ack === 'function') ack({ ok: false, error: 'Empty message' });
          return;
        }

        const message = createMessage(ctx.userId, ctx.username, text);
        io.emit('message:new', message);
        if (typeof ack === 'function') ack({ ok: true, message });
      } catch (err) {
        console.error('[socket] message:send failed:', err.message);
        if (typeof ack === 'function') ack({ ok: false, error: 'Failed to send message' });
      }
    });

    // Typing indicator. Debounced client-side; we just relay.
    socket.on('typing:start', () => {
      const ctx = connected.get(socket.id);
      if (!ctx) return;
      socket.broadcast.emit('typing:start', { username: ctx.username });
    });

    socket.on('typing:stop', () => {
      const ctx = connected.get(socket.id);
      if (!ctx) return;
      socket.broadcast.emit('typing:stop', { username: ctx.username });
    });

    socket.on('disconnect', () => {
      const ctx = connected.get(socket.id);
      console.log(`[socket] disconnected: ${socket.id}`);
      connected.delete(socket.id);
      if (ctx) {
        socket.broadcast.emit('typing:stop', { username: ctx.username });
        setUserOnline(ctx.userId, false);
        broadcastPresence(io);
      }
    });
  });
}
