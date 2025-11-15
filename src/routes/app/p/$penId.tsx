import { createFileRoute, redirect } from '@tanstack/react-router'
import { requireUser } from '@/server/auth/guards'
import { getCurrentUser } from '@/server/auth/current-user'

export const Route = createFileRoute('/app/p/$penId')({
  loader: async ({ context, params }) => {
    if (context && 'prisma' in context) {
      requireUser(context)
    } else {
      const user = await getCurrentUser()
      if (!user) {
        throw redirect({ to: '/auth/login' })
      }
    }

    return {
      penId: params.penId,
    }
  },
  component: () => (
    <section className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4 px-6 py-16">
      <h1 className="text-3xl font-bold">Pen editor coming soon</h1>
      <p className="text-gray-400">
        We&apos;re still wiring the full editor experience. Stay tuned!
      </p>
    </section>
  ),
})
