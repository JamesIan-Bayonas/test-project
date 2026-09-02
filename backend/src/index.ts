import { app } from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';

const server = app.listen(env.PORT, () => {
  console.log(`[AEGIS SERVER] Listening on http://localhost:${env.PORT}`);
  console.log(`[AEGIS SERVER] Target client origin: ${env.FRONTEND_URL}`);
});

const handleTermination = async (signal: string): Promise<void> => {
  console.log(`[AEGIS SERVER] Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    console.log('[AEGIS SERVER] HTTP listeners terminated.');
    await prisma.$disconnect();
    console.log('[AEGIS SERVER] Database connection closed. Exiting process.');
    process.exit(0);
  });
};

process.on('SIGINT', () => void handleTermination('SIGINT'));
process.on('SIGTERM', () => void handleTermination('SIGTERM'));