import { redirect } from '@tanstack/react-router'
import type { AppServerContext } from '@/server/context'

export async function requireUser(
  context: AppServerContext | undefined | unknown,
  options?: { redirectTo?: string },
) {
  // Dynamic import to prevent Prisma from being bundled in client
  const { requireContext } = await import('@/server/context')
  const ctx = requireContext(context as AppServerContext | undefined)
  const user = ctx.currentUser

  if (!user) {
    throw redirect({
      to: options?.redirectTo ?? '/auth/login',
    })
  }

  return { ctx, user }
}
