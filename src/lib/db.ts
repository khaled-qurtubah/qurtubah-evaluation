import { PrismaClient } from '@prisma/client'

// Prisma client singleton with model migration support
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Check if the cached client has the progressSnapshot model (handles schema migrations)
const cachedClient = globalForPrisma.prisma
const needsNewClient = cachedClient && !('progressSnapshot' in cachedClient)

export const db =
  (!needsNewClient && cachedClient) ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? [] : ['warn', 'error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db