import React from 'react'
import { Minimize2, Maximize2 } from 'lucide-react'
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
  collapsed?: boolean
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
  collapsed = false,
}) => {
  return (
    <div className={`bg-slate-900 border border-white/5  overflow-hidden flex flex-col ${collapsed ? 'h-auto' : 'h-full'} ${className}`}>
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
            title={collapseDisabled ? 'At least one editor must stay open' : collapsed ? 'Expand editor' : 'Collapse editor'}
            aria-label={collapsed ? 'Expand editor' : 'Collapse editor'}
          >
            {collapsed ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
        )}
      </div>
      {!collapsed && (
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
      )}
    </div>
  )
}
