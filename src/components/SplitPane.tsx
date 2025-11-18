import React, { useRef, useCallback, useEffect, useState } from 'react'
import { GripVertical, Monitor, Minimize2 } from 'lucide-react'
import Editor, { type Monaco } from '@monaco-editor/react'
import { registerSafeEmmet } from '@/utils/safeEmmet'

let isEmmetInitialized = false
let disposeEmmet: (() => void) | null = null

const enableEmmetSupport = (monaco: Monaco) => {
  if (isEmmetInitialized) {
    return
  }

  disposeEmmet = registerSafeEmmet(monaco)
  isEmmetInitialized = true
}

interface SplitPaneProps {
  left: React.ReactNode
  right: React.ReactNode
  defaultLeftSize?: number
  minLeftSize?: number
  maxLeftSize?: number
  split?: 'horizontal' | 'vertical'
  className?: string
  leftSize?: number
  onResize?: (leftSize: number) => void
}

export const SplitPane: React.FC<SplitPaneProps> = ({
  left,
  right,
  defaultLeftSize = 50,
  minLeftSize = 20,
  maxLeftSize = 80,
  split = 'horizontal',
  className = '',
  leftSize,
  onResize,
}) => {
  const isHorizontal = split === 'horizontal'
  const containerRef = useRef<HTMLDivElement>(null)
  const startPos = useRef(0)
  const startSize = useRef(0)
  const [internalSize, setInternalSize] = useState(defaultLeftSize)
  const [isResizing, setIsResizing] = useState(false)

  const currentSize = leftSize ?? internalSize

  useEffect(() => {
    if (typeof leftSize === 'number') {
      setInternalSize(leftSize)
    }
  }, [leftSize])

  const clampSize = useCallback(
    (sizePercent: number) =>
      Math.max(minLeftSize, Math.min(maxLeftSize, sizePercent)),
    [minLeftSize, maxLeftSize],
  )

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()
      if (!containerRef.current) {
        return
      }

      setIsResizing(true)
      startPos.current = isHorizontal ? event.clientX : event.clientY
      startSize.current = currentSize
    },
    [currentSize, isHorizontal],
  )

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isResizing || !containerRef.current) {
        return
      }

      const containerSize = isHorizontal
        ? containerRef.current.offsetWidth
        : containerRef.current.offsetHeight
      const currentPos = isHorizontal ? event.clientX : event.clientY
      const delta = currentPos - startPos.current
      const deltaPercent = (delta / containerSize) * 100
      const nextSize = clampSize(startSize.current + deltaPercent)

      if (typeof leftSize !== 'number') {
        setInternalSize(nextSize)
      }

      onResize?.(nextSize)
    },
    [clampSize, isHorizontal, isResizing, leftSize, onResize],
  )

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
  }, [])

  useEffect(() => {
    if (!isResizing) {
      return
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.userSelect = 'none'
    document.body.style.cursor = isHorizontal ? 'col-resize' : 'row-resize'

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [handleMouseMove, handleMouseUp, isHorizontal, isResizing])

  return (
    <div
      ref={containerRef}
      className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'} ${className} h-full w-full overflow-hidden`}
    >
      <div
        className="overflow-hidden"
        style={{
          width: isHorizontal ? `${currentSize}%` : '100%',
          height: !isHorizontal ? `${currentSize}%` : '100%',
          minWidth: isHorizontal ? `${minLeftSize}%` : undefined,
          minHeight: !isHorizontal ? `${minLeftSize}%` : undefined,
          maxWidth: isHorizontal ? `${maxLeftSize}%` : undefined,
          maxHeight: !isHorizontal ? `${maxLeftSize}%` : undefined,
          pointerEvents: isResizing ? 'none' : undefined,
        }}
      >
        {left}
      </div>

      {/* Resize handle */}
      <div
        className={`
          ${isHorizontal ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize'}
          bg-slate-700 hover:bg-cyan-600 transition-colors
          flex items-center justify-center flex-shrink-0
          ${isResizing ? 'bg-cyan-500' : ''}
        `}
        onMouseDown={handleMouseDown}
      >
        <GripVertical className={`w-3 h-3 ${isHorizontal ? '' : 'rotate-90'}`} />
      </div>

      <div
        className="flex-1 min-h-0 min-w-0 overflow-hidden"
        style={{ pointerEvents: isResizing ? 'none' : undefined }}
      >
        {right}
      </div>
    </div>
  )
}

interface CodeEditorPaneProps {
  title: string
  language: string
  value?: string
  initialValue?: string
  onChange: (value: string) => void
  icon?: React.ReactNode
  className?: string
  editorKey?: string | number
  onCollapse?: () => void
  collapseDisabled?: boolean
}

export const CodeEditorPane: React.FC<CodeEditorPaneProps> = ({
  title,
  language,
  value,
  initialValue,
  onChange,
  icon,
  className = '',
  editorKey,
  onCollapse,
  collapseDisabled = false,
}) => {
  return (
    <div className={`bg-slate-900 border border-white/5 rounded-2xl overflow-hidden flex flex-col h-full ${className}`}>
      <div className="bg-slate-800 px-4 py-3 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-medium text-gray-300">{title}</h3>
        </div>
        {onCollapse && (
          <button
            onClick={onCollapse}
            disabled={collapseDisabled}
            className={`p-1 rounded-lg transition-colors ${
              collapseDisabled
                ? 'text-slate-600 cursor-not-allowed'
                : 'text-gray-400 hover:text-white hover:bg-slate-700'
            }`}
            title={collapseDisabled ? 'At least one editor must stay open' : 'Collapse editor'}
            aria-label="Collapse editor"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="flex-1 min-h-0">
        <Editor
          key={editorKey}
          height="100%"
          language={language}
          {...(value !== undefined
            ? { value }
            : { defaultValue: initialValue ?? '' })}
          beforeMount={enableEmmetSupport}
          onChange={(value) => onChange(value || '')}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: '"Cascadia Code", "Fira Code", "Consolas", monospace',
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            wordWrap: 'on',
            folding: true,
            lineDecorationsWidth: 0,
            lineNumbersMinChars: 3,
            padding: { top: 16, bottom: 16 },
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            parameterHints: { enabled: true },
            showFoldingControls: 'always',
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorStyle: 'line',
            bracketPairColorization: { enabled: true },
            guides: {
              bracketPairs: true,
              indentation: true,
              highlightActiveIndentation: true,
            },
          }}
        />
      </div>
    </div>
  )
}

interface PreviewPaneProps {
  html: string
  css: string
  js: string
  className?: string
}

export const PreviewPane: React.FC<PreviewPaneProps> = ({
  html,
  css,
  js,
  className = ''
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const updatePreview = useCallback(() => {
    if (!iframeRef.current) return

    const combinedContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            ${css}
          </style>
        </head>
        <body>
          ${html}
          <script>
            ${js}
          </script>
        </body>
      </html>
    `

    iframeRef.current.srcdoc = combinedContent
  }, [html, css, js])

  React.useEffect(() => {
    updatePreview()
  }, [updatePreview])

  return (
    <div className={`bg-slate-900 border border-white/5 rounded-2xl overflow-hidden flex flex-col h-full w-full ${className}`}>
      <div className="bg-slate-800 px-4 py-3 flex items-center justify-between border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-300">Preview</h3>
        </div>
      </div>
      <div className="flex-1 min-h-0 bg-white overflow-hidden">
        <iframe
          ref={iframeRef}
          className="w-full h-full border-0"
          title="Preview"
          sandbox="allow-scripts"
        />
      </div>
    </div>
  )
}

interface LayoutToggleProps {
  layout: 'horizontal' | 'vertical'
  onToggle: () => void
  className?: string
}

export const LayoutToggle: React.FC<LayoutToggleProps> = ({
  layout,
  onToggle,
  className = ''
}) => {
  return (
    <button
      onClick={onToggle}
      className={`
        px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700
        transition-colors flex items-center gap-2
        ${className}
      `}
      title={`Switch to ${layout === 'horizontal' ? 'vertical' : 'horizontal'} layout`}
    >
      <div className={`
        w-4 h-4 border-2 border-cyan-500 relative
        ${layout === 'horizontal' ? 'border-t-0 border-b-4' : 'border-l-0 border-r-4'}
      `}>
        <div className={`
          absolute top-0 left-0 w-2 h-2 bg-cyan-500
          ${layout === 'horizontal' ? 'top-[-2px] left-[-2px]' : 'top-[-2px] left-[-2px]'}
        `} />
      </div>
      <span className="text-sm text-gray-300">
        {layout === 'horizontal' ? 'Horizontal' : 'Vertical'}
      </span>
    </button>
  )
}
