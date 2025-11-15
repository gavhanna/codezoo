import { redirect } from '@tanstack/react-router'
import type { AppServerContext } from '@/server/context'
import { requireContext } from '@/server/context'

export function requireUser(
  context: AppServerContext | undefined | unknown,
  options?: { redirectTo?: string },
) {
  const ctx = requireContext(context as AppServerContext | undefined)
  const user = ctx.currentUser

  if (!user) {
    throw redirect({
      to: options?.redirectTo ?? '/auth/login',
    })
  }

  return { ctx, user }
}
