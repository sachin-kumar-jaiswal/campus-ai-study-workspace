import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import connectDB from './config/database';

const PORT = parseInt(process.env.PORT || '5000', 10);

const start = async (): Promise<void> => {
  // Connect to MongoDB first — server won't start if DB connection fails
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`[Server] CampusAI API running on port ${PORT}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[Server] Health check: http://localhost:${PORT}/api/health`);
  });

  // ─── Graceful Shutdown ──────────────────────────────────────────────────────

  const shutdown = (signal: string) => {
    console.log(`\n[Server] ${signal} received. Shutting down gracefully...`);
    server.close(() => {
      console.log('[Server] HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason: unknown) => {
    const message = reason instanceof Error ? reason.message : String(reason);
    console.error('[Server] Unhandled promise rejection:', message);
    server.close(() => process.exit(1));
  });
};

start();
