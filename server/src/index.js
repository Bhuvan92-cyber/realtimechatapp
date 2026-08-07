import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { Server as SocketServer } from 'socket.io';
import { config } from './config/env.js';
import routes from './routes/index.js';
import { setupSocket } from './socket/socketHandler.js';

const app = express();

app.use(cors({ origin: config.clientOrigins, credentials: true }));
app.use(express.json());

app.use('/api', routes);

app.get('/', (_req, res) => {
  res.json({
    name: 'chat-backend',
    status: 'running',
    endpoints: ['/api/health', 'GET /api/messages', 'POST /api/messages', 'POST /api/users/login', 'GET /api/users'],
  });
});

// Centralized error handler — any thrown route error lands here.
app.use((err, _req, res, _next) => {
  console.error('[express] unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

const httpServer = http.createServer(app);

const io = new SocketServer(httpServer, {
  cors: { origin: config.clientOrigins, methods: ['GET', 'POST'], credentials: true },
});

setupSocket(io);

httpServer.listen(config.port, () => {
  console.log(`[server] listening on http://localhost:${config.port}`);
  console.log(`[server] CORS origins: ${config.clientOrigins.join(', ')}`);
});

// Graceful shutdown — stop accepting new connections, close existing ones.
function shutdown(signal) {
  console.log(`[server] ${signal} received, shutting down...`);
  httpServer.close(() => {
    io.close(() => {
      console.log('[server] closed');
      process.exit(0);
    });
  });
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
