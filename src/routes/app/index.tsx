import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { requireUser } from '@/server/auth/guards'
import { createPen } from '@/server/pens/create-pen'
import { getUserPens } from '@/server/pens/get-user-pens'

type LoaderPen = {
  id: string
  title: string
  slug: string | null
  updatedAt: string
  visibility: string
}

const serializePenRecord = (pen: {
  id: string
  title: string
  slug: string | null
  updatedAt: Date
  visibility: string
}): LoaderPen => ({
  id: pen.id,
  title: pen.title,
  slug: pen.slug,
  updatedAt: pen.updatedAt.toISOString(),
  visibility: pen.visibility,
})

export const Route = createFileRoute('/app/')({
  loader: async ({ context }) => {
    if (context && 'prisma' in context) {
      const { ctx, user } = requireUser(context)
      const pens = await ctx.prisma.pen.findMany({
        where: { ownerId: user.id },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          updatedAt: true,
          visibility: true,
        },
      })

      return {
        pens: pens.map(serializePenRecord),
      }
    }

    const pens = await getUserPens()
    return { pens }
  },
  component: PensDashboard,
})

function PensDashboard() {
  const { pens } = Route.useLoaderData()
  const router = useRouter()
  const createPenAction = useServerFn(createPen)
  const [creatingPen, setCreatingPen] = useState(false)

  const handleCreatePen = async () => {
    if (creatingPen) return
    setCreatingPen(true)
    try {
      const pen = await createPenAction()
      await router.navigate({
        to: '/app/p/$penId',
        params: { penId: pen.id },
      })
    } catch (error) {
      console.error('Failed to create pen', error)
      throw error
    } finally {
      setCreatingPen(false)
    }
  }

  if (pens.length === 0) {
    return (
      <section className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-6 px-6 py-16">
        <div className="max-w-2xl text-center space-y-4">
          <p className="uppercase tracking-[0.4em] text-cyan-400 text-sm">
            Welcome
          </p>
          <h1 className="text-4xl font-bold">You don&apos;t have any pens yet</h1>
          <p className="text-gray-400">
            Kickstart your first experiment—pens store HTML, CSS, and JS with live
            previews, autosave, and revisions. We&apos;ll drop new pens right here.
          </p>
        </div>
        <button
          onClick={handleCreatePen}
          disabled={creatingPen}
          className="px-6 py-3 rounded-2xl bg-cyan-500 text-black font-semibold hover:bg-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {creatingPen ? 'Creating…' : 'Create your first pen'}
        </button>
      </section>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-12">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <p className="uppercase tracking-[0.3em] text-cyan-400 text-xs">
            Your workbench
          </p>
          <h1 className="text-3xl font-bold">Pens</h1>
        </div>
        <button
          onClick={handleCreatePen}
          disabled={creatingPen}
          className="px-5 py-3 rounded-2xl bg-cyan-500 text-black font-semibold hover:bg-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {creatingPen ? 'Creating…' : 'New pen'}
        </button>
      </header>
      <div className="grid gap-4">
        {pens.map((pen) => (
          <article
            key={pen.id}
            className="bg-slate-900 border border-white/10 rounded-2xl p-5 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{pen.title || 'Untitled'}</h2>
                <p className="text-sm text-gray-400">
                  Updated {new Date(pen.updatedAt).toLocaleString()} ·{' '}
                  <span className="uppercase tracking-wide text-xs">
                    {pen.visibility}
                  </span>
                </p>
              </div>
              <Link
                to="/app/p/$penId"
                params={{ penId: pen.id }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors text-sm"
              >
                Open editor
              </Link>
            </div>
            {pen.slug && (
              <div className="text-sm text-gray-400">
                Public URL:{' '}
                <Link
                  to="/p/$slug"
                  params={{ slug: pen.slug }}
                  className="text-cyan-400 hover:text-cyan-300 underline"
                >
                  /p/{pen.slug}
                </Link>
              </div>
            )}
          </article>
        ))}
      </div>
    </main>
  )
}
