import { createServerFn } from '@tanstack/react-start'
import { requireContext } from '@/server/context'
import { buildSessionDestroyCookie, deleteSession } from './session'
import { redirect } from '@tanstack/react-router'

export const logoutUser = createServerFn({ method: 'POST' }).handler(
  async ({ context }) => {
    const ctx = requireContext(context)

    if (ctx.session) {
      await deleteSession({
        prisma: ctx.prisma,
        sessionId: ctx.session.id,
      })
    }

    ctx.pendingCookies.push(buildSessionDestroyCookie())

    return redirect({
      to: '/auth/login',
    })
  },
)
