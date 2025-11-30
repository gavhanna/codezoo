import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import type { PenEditorPayload } from '@/server/pens/serialize'

export const Route = createFileRoute('/app/p/$penId')({
  loader: async ({ context, params }) => {
    // Dynamic imports to prevent client bundle inclusion
    const { requireUser } = await import('@/server/auth/guards')
    const { getCurrentUser } = await import('@/server/auth/current-user')
    const { getPenForEditor } = await import('@/server/pens/get-pen-for-editor')
    const { serializePenForEditor } = await import('@/server/pens/serialize')

    const penId = params.penId

    if (context && 'prisma' in context) {
      const { ctx, user } = await requireUser(context)
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

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, Clock, Save } from 'lucide-react'
import { Suspense, lazy } from 'react'
import { LayoutToggle } from '@/features/editor/components/LayoutToggle'
import { EditorLayout } from '@/components/EditorLayout'
import { EditorSettingsDialog } from '@/features/editor/components/EditorSettingsDialog'
import {
  DEFAULT_PREPROCESSORS,
  type PreprocessorSelection,
} from '@/types/preprocessors'
import type { CompileError } from '@/types/preprocessors'

const CodeEditor = lazy(() => import('@/features/editor/CodeEditor').then(module => ({ default: module.CodeEditor })))

const AUTOSAVE_DELAY_MS = 4000

const logAutosave = (...args: Array<unknown>) => {
  if (import.meta.env.DEV) {
    console.debug('[autosave]', ...args)
  }
}

type SaveMode = 'manual' | 'autosave'

function PenEditorShell() {
  const { pen: loaderPen } = Route.useLoaderData() as { pen: PenEditorPayload }
  // Dynamic import for savePenRevision
  const savePenRevisionFn = useServerFn(async (data: any) => {
    const { savePenRevision } = await import('@/server/pens/save-pen-revision')
    return savePenRevision(data)
  })

  const [pen, setPen] = useState(loaderPen)
  const [currentCode, setCurrentCode] = useState({
    html: loaderPen.latestRevision.html,
    css: loaderPen.latestRevision.css,
    js: loaderPen.latestRevision.js,
  })
  const [preprocessors, setPreprocessors] = useState<PreprocessorSelection>(
    loaderPen.latestRevision.preprocessors || DEFAULT_PREPROCESSORS,
  )
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [lastSaveTime, setLastSaveTime] = useState<Date>(
    () => new Date(loaderPen.latestRevision.updatedAt),
  )
  const [saveStatus, setSaveStatus] = useState<
    'idle' | 'saving' | 'autosaving' | 'error'
  >('idle')
  const [saveError, setSaveError] = useState<string | null>(null)
  const autosaveTimeoutRef = useRef<number | null>(null)
  const [autosaveSignal, setAutosaveSignal] = useState(0)
  const lastProcessedSignalRef = useRef(0)
  const [editorLayout, setEditorLayout] = useState<'horizontal' | 'vertical'>('horizontal')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [compileErrors, setCompileErrors] = useState<CompileError[] | undefined>(
    undefined,
  )
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    setPen(loaderPen)
    setCurrentCode({
      html: loaderPen.latestRevision.html,
      css: loaderPen.latestRevision.css,
      js: loaderPen.latestRevision.js,
    })
    setPreprocessors(
      loaderPen.latestRevision.preprocessors || DEFAULT_PREPROCESSORS,
    )
    setLastSaveTime(new Date(loaderPen.latestRevision.updatedAt))
    setHasUnsavedChanges(false)
    setSaveStatus('idle')
    setSaveError(null)
    clearAutosaveTimer()
  }, [loaderPen])

  const clearAutosaveTimer = useCallback(() => {
    if (autosaveTimeoutRef.current) {
      logAutosave('clearing pending autosave timer')
      window.clearTimeout(autosaveTimeoutRef.current)
      autosaveTimeoutRef.current = null
    }
  }, [])

  const handleSave = useCallback(
    async (mode: SaveMode = 'manual') => {
      if (
        !hasUnsavedChanges ||
        saveStatus === 'saving' ||
        saveStatus === 'autosaving'
      ) {
        logAutosave('skipping save', { hasUnsavedChanges, saveStatus })
        return
      }

      clearAutosaveTimer()

      logAutosave('starting save', { mode })

      setSaveStatus(mode === 'autosave' ? 'autosaving' : 'saving')
      setSaveError(null)
      try {
        const revisionKind = mode === 'autosave' ? 'AUTOSAVE' : 'SNAPSHOT'

        const updatedPen = (await savePenRevisionFn({
          data: {
            penId: pen.id,
            html: currentCode.html,
            css: currentCode.css,
          js: currentCode.js,
          kind: revisionKind,
          preprocessors,
        },
      })) as PenEditorPayload

      setPen(updatedPen)
      setLastSaveTime(new Date(updatedPen.latestRevision.updatedAt))
      setHasUnsavedChanges(false)
      setSaveStatus('idle')
        logAutosave('save success', {
          mode,
          latestRev: updatedPen.latestRevision.revNumber,
        })
      } catch (error) {
        console.error('Failed to save pen', error)
        setSaveStatus('error')
        setSaveError(
          mode === 'autosave'
            ? 'Autosave failed. Use Save to try again.'
            : 'Could not save changes. Please try again.',
        )
        logAutosave('save error', { mode, error })
      }
    },
    [
      clearAutosaveTimer,
      currentCode.css,
      currentCode.html,
      currentCode.js,
      hasUnsavedChanges,
      pen.id,
      savePenRevisionFn,
      saveStatus,
    ],
  )

  const scheduleAutosave = useCallback(() => {
    clearAutosaveTimer()
    logAutosave('scheduling autosave', { delay: AUTOSAVE_DELAY_MS })
    autosaveTimeoutRef.current = window.setTimeout(() => {
      logAutosave('autosave timer fired')
      setAutosaveSignal((signal) => signal + 1)
    }, AUTOSAVE_DELAY_MS)
  }, [clearAutosaveTimer])

  const handlePreprocessorChange = useCallback((next: PreprocessorSelection) => {
    setPreprocessors(next)
    setHasUnsavedChanges(true)
    setSaveStatus('idle')
    setSaveError(null)
    scheduleAutosave()
  }, [scheduleAutosave])

  const handleToggleLayout = useCallback(() => {
    setEditorLayout(prev => (prev === 'horizontal' ? 'vertical' : 'horizontal'))
  }, [])

  const handleCodeChange = useCallback(
    (code: { html: string; css: string; js: string }) => {
      logAutosave('handleCodeChange called', { code })
      setCurrentCode(code)
      setHasUnsavedChanges(true)
      setSaveStatus('idle')
      setSaveError(null)
      scheduleAutosave()
    },
    [scheduleAutosave],
  )

  useEffect(() => {
    return () => {
      clearAutosaveTimer()
    }
  }, [clearAutosaveTimer])

  useEffect(() => {
    if (autosaveSignal === 0) return
    // Prevent re-triggering if signal hasn't changed
    if (autosaveSignal === lastProcessedSignalRef.current) return

    lastProcessedSignalRef.current = autosaveSignal
    logAutosave('autosave signal observed', { autosaveSignal })
    void handleSave('autosave')
  }, [autosaveSignal, handleSave])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        void handleSave()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleSave])

  const saveDescription = (() => {
    if (saveStatus === 'saving') {
      return 'Saving changes…'
    }
    if (saveStatus === 'autosaving') {
      return 'Autosaving…'
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
    <EditorLayout>
      <div className="flex-1 flex flex-col bg-slate-950 text-white">
        <header className="bg-slate-900 border-b border-white/5 px-6 py-4 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                to="/app"
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Back to dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="h-8 w-px bg-white/10 mx-2 hidden sm:block" />
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-white">{pen.title || 'Untitled pen'}</h1>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    Editor
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-3 h-3 text-gray-500" />
                  <p className="text-gray-500 text-xs font-medium">{saveDescription}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <LayoutToggle layout={editorLayout} onToggle={handleToggleLayout} />
              <button
                onClick={() => setSettingsOpen(true)}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-sm border border-white/5"
              >
                Settings
              </button>
              <button
                onClick={() => {
                  void handleSave()
                }}
                disabled={
                  !hasUnsavedChanges ||
                  saveStatus === 'saving' ||
                  saveStatus === 'autosaving'
                }
                className={`
                  px-4 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2 text-sm
                  ${hasUnsavedChanges
                    ? 'bg-cyan-500 text-black hover:bg-cyan-400 shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-800 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                <Save className="w-4 h-4" />
                {saveStatus === 'saving' ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 min-h-0">
          <Suspense fallback={
            <div className="h-full w-full bg-slate-950 text-white flex items-center justify-center">
              <div className="text-gray-400">Loading editor...</div>
            </div>
          }>
            {isClient ? (
              <CodeEditor
                penId={pen.id}
                initialHtml={pen.latestRevision.html}
                initialCss={pen.latestRevision.css}
                initialJs={pen.latestRevision.js}
                onCodeChange={handleCodeChange}
                layout={editorLayout}
                className="h-full"
                preprocessors={preprocessors}
                onCompileErrorsChange={setCompileErrors}
              />
            ) : (
              <div className="h-full w-full bg-slate-950 text-white flex items-center justify-center">
                <div className="text-gray-400">Loading editor...</div>
              </div>
            )}
          </Suspense>
        </div>
        <EditorSettingsDialog
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          preprocessors={preprocessors}
          onChange={handlePreprocessorChange}
          onReset={() => handlePreprocessorChange(DEFAULT_PREPROCESSORS)}
          errors={compileErrors}
        />
      </div>
    </EditorLayout>
  )
}
