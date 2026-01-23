import app from './app';
import config from './config/env';
import { closeRedis } from './services/cacheService';

const server = app.listen(config.port, () => {
  console.log(`Proxy server running on port ${config.port}`);
});

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down gracefully...');
  
  server.close(() => {
    console.log('HTTP server closed');
  });

  await closeRedis();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
