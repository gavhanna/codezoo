import React, { useRef, useCallback } from 'react'
import { GripVertical, Monitor } from 'lucide-react'
import Editor from '@monaco-editor/react'

interface SplitPaneProps {
  left: React.ReactNode
  right: React.ReactNode
  defaultLeftSize?: number
  minLeftSize?: number
  maxLeftSize?: number
  split?: 'horizontal' | 'vertical'
  className?: string
}

export const SplitPane: React.FC<SplitPaneProps> = ({
  left,
  right,
  defaultLeftSize = 50,
  minLeftSize = 20,
  maxLeftSize = 80,
  split = 'horizontal',
  className = ''
}) => {
  const isHorizontal = split === 'horizontal'

  return (
    <div className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'} ${className} h-full w-full overflow-hidden`}>
      <div
        className="overflow-hidden"
        style={{
          width: isHorizontal ? `${defaultLeftSize}%` : '100%',
          height: !isHorizontal ? `${defaultLeftSize}%` : '100%',
          minWidth: isHorizontal ? `${minLeftSize}%` : undefined,
          minHeight: !isHorizontal ? `${minLeftSize}%` : undefined,
          maxWidth: isHorizontal ? `${maxLeftSize}%` : undefined,
          maxHeight: !isHorizontal ? `${maxLeftSize}%` : undefined,
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
        `}
      >
        <GripVertical className={`w-3 h-3 ${isHorizontal ? '' : 'rotate-90'}`} />
      </div>

      <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
        {right}
      </div>
    </div>
  )
}

interface CodeEditorPaneProps {
  title: string
  language: string
  value: string
  onChange: (value: string) => void
  icon?: React.ReactNode
  className?: string
  editorKey?: string | number
}

export const CodeEditorPane: React.FC<CodeEditorPaneProps> = ({
  title,
  language,
  value,
  onChange,
  icon,
  className = '',
  editorKey,
}) => {
  return (
    <div className={`bg-slate-900 border border-white/5 rounded-2xl overflow-hidden flex flex-col h-full ${className}`}>
      <div className="bg-slate-800 px-4 py-3 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-medium text-gray-300">{title}</h3>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <Editor
          key={editorKey}
          height="100%"
          language={language}
          defaultValue={value}
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
          sandbox="allow-scripts allow-same-origin"
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
