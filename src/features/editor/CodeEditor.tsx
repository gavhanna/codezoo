import React, { useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { SplitPane } from '@/components/ui/SplitPane'
import { CodeEditorPane } from './components/CodeEditorPane'
import { PreviewPane } from './components/PreviewPane'
import { useEditorLayout } from './hooks/useEditorLayout'
import { useCodePreview } from './hooks/useCodePreview'
import { EDITOR_PANES, MIN_PANE_PERCENT } from './constants'
import {
  DEFAULT_PREPROCESSORS,
  type PreprocessorSelection,
} from '@/types/preprocessors'
import type { CompileError, CompileResult } from '@/types/preprocessors'

interface CodeEditorProps {
  penId: string
  initialHtml?: string
  initialCss?: string
  initialJs?: string
  onCodeChange?: (code: { html: string; css: string; js: string }) => void
  layout?: 'horizontal' | 'vertical'
  className?: string
  preprocessors?: PreprocessorSelection
  onCompileErrorsChange?: (errors?: CompileError[]) => void
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  penId,
  initialHtml,
  initialCss,
  initialJs,
  onCodeChange,
  className = '',
  layout = 'horizontal',
  preprocessors = DEFAULT_PREPROCESSORS,
  onCompileErrorsChange,
}) => {
  const [leftPaneSize, setLeftPaneSize] = useState(33)
  const compilePenFn = useServerFn(async (payload: any) => {
    const { compilePen } = await import('@/server/pens/compile-pen')
    return compilePen(payload)
  })
  const compile = React.useCallback(
    (input: any) => compilePenFn({ data: input }) as Promise<CompileResult>,
    [compilePenFn],
  )

  const {
    paneSizes,
    collapsedPanes,
    handleToggleCollapse,
    visiblePanes,
    handleDividerMouseDown,
    editorStackRef,
    draggingDivider,
    editorStackDirection
  } = useEditorLayout(layout)

  const {
    previewCode,
    handleCodeChange,
    editorKeys,
    htmlRef,
    cssRef,
    jsRef,
    compileErrors,
    isCompiling,
  } = useCodePreview({
    initialHtml: initialHtml || '',
    initialCss: initialCss || '',
    initialJs: initialJs || '',
    penId,
    preprocessors,
    compile,
    onCodeChange
  })

  const resolveLanguage = (paneId: keyof typeof editorKeys, defaultLanguage: string) => {
    if (paneId === 'html') {
      if (preprocessors.html === 'pug') return 'pug'
      if (preprocessors.html === 'markdown') return 'markdown'
      return 'html'
    }
    if (paneId === 'css') {
      if (preprocessors.css === 'scss') return 'scss'
      if (preprocessors.css === 'less') return 'less'
      return 'css'
    }
    if (paneId === 'js') {
      if (preprocessors.js === 'typescript') return 'typescript'
      if (preprocessors.js === 'coffeescript') return 'coffeescript'
      return 'javascript'
    }
    return defaultLanguage
  }

  React.useEffect(() => {
    onCompileErrorsChange?.(compileErrors)
  }, [compileErrors, onCompileErrorsChange])

  const resolveBadge = (paneId: keyof typeof editorKeys): string | null => {
    if (paneId === 'html') {
      return preprocessors.html !== 'none' ? preprocessors.html.toUpperCase() : null
    }
    if (paneId === 'css') {
      return preprocessors.css !== 'none' ? preprocessors.css.toUpperCase() : null
    }
    if (paneId === 'js') {
      return preprocessors.js !== 'none' ? preprocessors.js.toUpperCase() : null
    }
    return null
  }

  const editorPanel = (
    <div className="h-full w-full flex flex-col overflow-hidden">

      <div className="flex-1 min-h-0 overflow-hidden">
        <div
          ref={editorStackRef}
          className={`h-full w-full flex ${editorStackDirection === 'vertical' ? 'flex-col' : 'flex-row'
            }`}
        >
          {EDITOR_PANES.map((pane, _index) => {
            const Icon = pane.icon
            const isCollapsed = collapsedPanes[pane.id]
            const isVisible = !isCollapsed

            // Calculate style based on collapsed state
            let paneStyle: React.CSSProperties = {}

            if (isCollapsed) {
              paneStyle = {
                flex: '0 0 auto',
              }
            } else {
              paneStyle = editorStackDirection === 'vertical'
                ? {
                  flexBasis: `${paneSizes[pane.id]}%`,
                  minHeight: `${MIN_PANE_PERCENT}%`,
                  flexGrow: 1,
                }
                : {
                  flexBasis: `${paneSizes[pane.id]}%`,
                  minWidth: `${MIN_PANE_PERCENT}%`,
                  flexGrow: 1,
                }
            }

            // Find the index of this pane in the visiblePanes array to map to divider logic
            const visibleIndex = visiblePanes.findIndex(p => p.id === pane.id)
            const showDivider = isVisible && visibleIndex < visiblePanes.length - 1

            return (
              <React.Fragment key={pane.id}>
                <div
                  className="flex flex-col min-h-0 min-w-0 overflow-hidden"
                  style={paneStyle}
                >
                  <CodeEditorPane
                    title={pane.label}
                    language={resolveLanguage(pane.id, pane.language)}
                    initialValue={
                      pane.id === 'html'
                        ? htmlRef.current
                        : pane.id === 'css'
                          ? cssRef.current
                          : jsRef.current
                    }
                    onChange={(value) => handleCodeChange(pane.id, value)}
                    editorKey={`${editorKeys[pane.id]}-${(preprocessors as any)[pane.id]}`}
                    icon={<Icon className={`w-4 h-4 ${pane.accent}`} />}
                    badge={resolveBadge(pane.id)}
                    onCollapse={() => handleToggleCollapse(pane.id)}
                    collapseDisabled={visiblePanes.length === 1 && isVisible}
                    collapsed={isCollapsed}
                  />
                </div>
                {showDivider && (
                  <div
                    role="separator"
                    aria-orientation={editorStackDirection as 'horizontal' | 'vertical'}
                    onMouseDown={handleDividerMouseDown(visibleIndex)}
                    className={`
                      ${editorStackDirection === 'vertical'
                        ? 'h-1 cursor-row-resize'
                        : 'w-1 cursor-col-resize'
                      }
                      bg-slate-800 hover:bg-cyan-600 transition-colors shrink-0 rounded-full flex items-center justify-center
                      ${draggingDivider === visibleIndex ? 'bg-cyan-500' : ''}
                    `}
                  />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>
    </div>
  )

  return (
    <div className={`h-full w-full overflow-hidden ${className}`}>
      <SplitPane
        left={editorPanel}
        right={<PreviewPane html={previewCode.html} css={previewCode.css} js={previewCode.js} isCompiling={isCompiling} />}
        defaultLeftSize={leftPaneSize}
        leftSize={leftPaneSize}
        onResize={setLeftPaneSize}
        split={layout}
      />
    </div>
  )
}
