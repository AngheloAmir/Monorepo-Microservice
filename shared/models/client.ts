// @ts-nocheck
import { PrismaClient } from '@prisma/client';

// Singleton instance to prevent multiple connections in dev (HMR)
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'error', 'warn'], // Optional: Logic logging
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
