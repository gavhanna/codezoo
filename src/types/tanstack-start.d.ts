import type { startInstance } from '@/start'
import type { PrismaClient } from '@prisma/client'

type ServerContext = {
  prisma: PrismaClient
}

declare module '@tanstack/react-start' {
  interface Register {
    config: Awaited<ReturnType<typeof startInstance.getOptions>>
    context: ServerContext
  }
}
