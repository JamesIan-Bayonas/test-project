import { PrismaClient } from '@prisma/client';

declare global {
  // Prevent multiple instances in development when reloaded
  var __globalPrisma__: PrismaClient | undefined;
}

export const prisma =
  global.__globalPrisma__ ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__globalPrisma__ = prisma;
}