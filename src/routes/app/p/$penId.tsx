import { createFileRoute, redirect } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { requireUser } from '@/server/auth/guards'
import { getCurrentUser } from '@/server/auth/current-user'
import { getPenForEditor } from '@/server/pens/get-pen-for-editor'
import {
  serializePenForEditor,
  type PenEditorPayload,
} from '@/server/pens/serialize'
import { savePenRevision } from '@/server/pens/save-pen-revision'

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

import { useEffect, useState } from 'react'
import { Save, Settings, Share2, Clock } from 'lucide-react'
import CodeEditor from '@/components/CodeEditor'

function PenEditorShell() {
  const { pen: loaderPen } = Route.useLoaderData() as { pen: PenEditorPayload }
  const savePenRevisionFn = useServerFn(savePenRevision)

  const [pen, setPen] = useState(loaderPen)
  const [currentCode, setCurrentCode] = useState({
    html: loaderPen.latestRevision.html,
    css: loaderPen.latestRevision.css,
    js: loaderPen.latestRevision.js,
  })
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [lastSaveTime, setLastSaveTime] = useState<Date>(
    () => new Date(loaderPen.latestRevision.updatedAt),
  )
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    setPen(loaderPen)
    setCurrentCode({
      html: loaderPen.latestRevision.html,
      css: loaderPen.latestRevision.css,
      js: loaderPen.latestRevision.js,
    })
    setLastSaveTime(new Date(loaderPen.latestRevision.updatedAt))
    setHasUnsavedChanges(false)
    setSaveStatus('idle')
    setSaveError(null)
  }, [loaderPen])

  const handleCodeChange = (code: { html: string; css: string; js: string }) => {
    setCurrentCode(code)
    setHasUnsavedChanges(true)
    setSaveStatus('idle')
    setSaveError(null)
  }

  const handleSave = async () => {
    if (!hasUnsavedChanges || saveStatus === 'saving') {
      return
    }

    setSaveStatus('saving')
    setSaveError(null)
    try {
      const updatedPen = (await savePenRevisionFn({
        data: {
          penId: pen.id,
          html: currentCode.html,
          css: currentCode.css,
          js: currentCode.js,
        },
      })) as PenEditorPayload

      setPen(updatedPen)
      setLastSaveTime(new Date(updatedPen.latestRevision.updatedAt))
      setHasUnsavedChanges(false)
      setSaveStatus('idle')
    } catch (error) {
      console.error('Failed to save pen', error)
      setSaveStatus('error')
      setSaveError('Could not save changes. Please try again.')
    }
  }

  const saveDescription = (() => {
    if (saveStatus === 'saving') {
      return 'Saving changes…'
    }
    if (saveStatus === 'error' && saveError) {
      return saveError
    }
    if (hasUnsavedChanges) {
      return 'Unsaved changes'
    }
    return `Saved ${lastSaveTime.toLocaleTimeString()}`
  })()

  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 border-b border-white/5 px-6 py-4 flex-shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <p className="uppercase tracking-[0.3em] text-cyan-400 text-xs mb-1">
                Editing pen
              </p>
              <h1 className="text-2xl font-bold">{pen.title || 'Untitled pen'}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="w-3 h-3 text-gray-400" />
                <p className="text-gray-400 text-sm">
                  {saveDescription}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </button>
            <button className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button
              onClick={handleSave}
              disabled={!hasUnsavedChanges || saveStatus === 'saving'}
              className={`
                px-4 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2
                ${hasUnsavedChanges
                  ? 'bg-cyan-500 text-black hover:bg-cyan-400'
                  : 'bg-slate-700 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              <Save className="w-4 h-4" />
              {saveStatus === 'saving' ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </header>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <CodeEditor
          initialHtml={pen.latestRevision.html}
          initialCss={pen.latestRevision.css}
          initialJs={pen.latestRevision.js}
          onCodeChange={handleCodeChange}
          className="h-full"
        />
      </div>
    </div>
  )
}
