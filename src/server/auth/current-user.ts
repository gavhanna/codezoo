import { createServerFn } from '@tanstack/react-start'
import type { User } from '@prisma/client'
import { requireContext } from '@/server/context'

export type CurrentUserPayload = {
  id: string
  displayName: string | null
  email: string
} | null

export function serializeCurrentUser(user: User | null): CurrentUserPayload {
  if (!user) return null
  return {
    id: user.id,
    displayName: user.displayName,
    email: user.email,
  }
}

export const getCurrentUser = createServerFn({ method: 'GET' }).handler(
  async ({ context }) => {
    const ctx = requireContext(context)
    return serializeCurrentUser(ctx.currentUser)
  },
)
