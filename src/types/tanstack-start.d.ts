import type { startInstance } from '@/start'
import type { AppServerContext } from '@/server/context'

declare module '@tanstack/react-start' {
  interface Register {
    config: Awaited<ReturnType<typeof startInstance.getOptions>>
    context: AppServerContext
  }
}
