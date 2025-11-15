import { createFileRoute, redirect } from '@tanstack/react-router'
import { requireUser } from '@/server/auth/guards'
import { getCurrentUser } from '@/server/auth/current-user'
import { getPenForEditor } from '@/server/pens/get-pen-for-editor'
import {
  serializePenForEditor,
  type PenEditorPayload,
} from '@/server/pens/serialize'

export const Route = createFileRoute('/app/p/$penId')({
  loader: async ({ context, params }) => {
    const penId = params.penId

    if (context && 'prisma' in context) {
      const { ctx, user } = requireUser(context)
      const penRecord = await ctx.prisma.pen.findFirst({
        where: {
          id: penId,
          ownerId: user.id,
        },
        include: {
          revisions: {
            orderBy: { revNumber: 'desc' },
            take: 1,
          },
        },
      })

      if (!penRecord) {
        throw redirect({ to: '/app' })
      }

      return {
        pen: serializePenForEditor(penRecord),
      }
    }

    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw redirect({ to: '/auth/login' })
    }

    const pen = (await getPenForEditor({ data: { penId } })) as PenEditorPayload
    return { pen }
  },
  component: PenEditorShell,
})

function PenEditorShell() {
  const { pen } = Route.useLoaderData() as { pen: PenEditorPayload }

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-10 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="uppercase tracking-[0.3em] text-cyan-400 text-xs">
            Editing pen
          </p>
          <h1 className="text-3xl font-bold">{pen.title || 'Untitled pen'}</h1>
          <p className="text-gray-400 text-sm">
            Last saved {new Date(pen.latestRevision.updatedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors">
            Settings
          </button>
          <button className="px-4 py-2 rounded-xl bg-cyan-500 text-black font-semibold hover:bg-cyan-400 transition-colors">
            Share
          </button>
        </div>
      </header>

      <section className="grid md:grid-cols-2 gap-6">
        <article className="bg-slate-900 border border-white/5 rounded-2xl p-4 space-y-4">
          <h2 className="text-lg font-semibold">HTML</h2>
          <pre className="bg-slate-950 rounded-xl p-4 overflow-auto text-sm text-gray-200">
            {pen.latestRevision.html}
          </pre>
        </article>
        <article className="bg-slate-900 border border-white/5 rounded-2xl p-4 space-y-4">
          <h2 className="text-lg font-semibold">CSS</h2>
          <pre className="bg-slate-950 rounded-xl p-4 overflow-auto text-sm text-gray-200">
            {pen.latestRevision.css}
          </pre>
        </article>
        <article className="bg-slate-900 border border-white/5 rounded-2xl p-4 space-y-4 md:col-span-2">
          <h2 className="text-lg font-semibold">JavaScript</h2>
          <pre className="bg-slate-950 rounded-xl p-4 overflow-auto text-sm text-gray-200">
            {pen.latestRevision.js}
          </pre>
        </article>
      </section>

      <section className="bg-slate-900 border border-white/5 rounded-2xl p-4">
        <h2 className="text-lg font-semibold mb-3">Live preview</h2>
        <div className="bg-slate-950 border border-white/5 rounded-xl h-72 flex items-center justify-center text-gray-500">
          Preview iframe coming soon
        </div>
      </section>
    </main>
  )
}
