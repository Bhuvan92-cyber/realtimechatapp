import { createMessage } from '../controllers/messageController.js';
import {
  setUserOnline,
  listOnlineUsernames,
} from '../controllers/userController.js';

// In-memory registry of connected sockets.
// This is ephemeral presence state and only lives for the duration
// of a socket connection. Persistent user and message records live
// in Supabase PostgreSQL.
const connected = new Map();

async function broadcastPresence(io) {
  io.emit('presence', {
    online: io.sockets.sockets.size,
  });

  io.emit('users:online', {
    users: await listOnlineUsernames(),
  });
}

export function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log(`[socket] connected: ${socket.id}`);

    // A client identifies itself right after connecting with its user record.
    socket.on('user:join', async (payload, ack) => {
      try {
        if (!payload || !payload.userId || !payload.username) {
          if (typeof ack === 'function') {
            ack({
              ok: false,
              error: 'userId and username required',
            });
          }
          return;
        }

        connected.set(socket.id, {
          userId: payload.userId,
          username: payload.username,
        });

        socket.data.userId = payload.userId;
        socket.data.username = payload.username;

        // Update persistent presence in Supabase.
        await setUserOnline(payload.userId, true);

        // Broadcast updated presence to all connected clients.
        await broadcastPresence(io);

        if (typeof ack === 'function') {
          ack({
            ok: true,
            online: io.sockets.sockets.size,
          });
        }

        // Send the current online-user list to the joining client.
        socket.emit('users:online', {
          users: await listOnlineUsernames(),
        });
      } catch (err) {
        console.error(
          '[socket] user:join failed:',
          err.message
        );

        if (typeof ack === 'function') {
          ack({
            ok: false,
            error: 'Join failed',
          });
        }
      }
    });

    // Real-time message: persist to Supabase, then broadcast to everyone.
    socket.on('message:send', async (payload, ack) => {
      try {
        const ctx = connected.get(socket.id);

        if (!ctx) {
          if (typeof ack === 'function') {
            ack({
              ok: false,
              error: 'Not joined',
            });
          }
          return;
        }

        const text = (payload?.text ?? '').trim();

        if (!text) {
          if (typeof ack === 'function') {
            ack({
              ok: false,
              error: 'Empty message',
            });
          }
          return;
        }

        const message = await createMessage(
          ctx.userId,
          ctx.username,
          text
        );

        io.emit('message:new', message);

        if (typeof ack === 'function') {
          ack({
            ok: true,
            message,
          });
        }
      } catch (err) {
        console.error(
          '[socket] message:send failed:',
          err.message
        );

        if (typeof ack === 'function') {
          ack({
            ok: false,
            error: 'Failed to send message',
          });
        }
      }
    });

    // Typing indicator.
    // The client handles debouncing; the server only relays the event.
    socket.on('typing:start', () => {
      const ctx = connected.get(socket.id);

      if (!ctx) {
        return;
      }

      socket.broadcast.emit('typing:start', {
        username: ctx.username,
      });
    });

    socket.on('typing:stop', () => {
      const ctx = connected.get(socket.id);

      if (!ctx) {
        return;
      }

      socket.broadcast.emit('typing:stop', {
        username: ctx.username,
      });
    });

    // User disconnected.
    socket.on('disconnect', async () => {
      const ctx = connected.get(socket.id);

      console.log(`[socket] disconnected: ${socket.id}`);

      connected.delete(socket.id);

      if (ctx) {
        socket.broadcast.emit('typing:stop', {
          username: ctx.username,
        });

        // Mark the user offline in Supabase.
        await setUserOnline(ctx.userId, false);

        // Broadcast the updated presence state.
        await broadcastPresence(io);
      }
    });
  });
}

