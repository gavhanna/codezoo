import React, { useEffect, useRef } from 'react'
import {
  CSS_PREPROCESSOR_OPTIONS,
  HTML_PREPROCESSOR_OPTIONS,
  JS_PREPROCESSOR_OPTIONS,
} from '../constants'
import type {
  CompileError,
  PreprocessorSelection,
} from '@/types/preprocessors'

type EditorSettingsDialogProps = {
  open: boolean
  onClose: () => void
  preprocessors: PreprocessorSelection
  onChange: (next: PreprocessorSelection) => void
  onReset?: () => void
  errors?: CompileError[]
}

const getErrorForPane = (
  pane: keyof PreprocessorSelection,
  errors?: CompileError[],
) => errors?.find((e) => e.pane === pane)?.message

export const EditorSettingsDialog: React.FC<EditorSettingsDialogProps> = ({
  open,
  onClose,
  preprocessors,
  onChange,
  onReset,
  errors,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  const handleChange = <T extends keyof PreprocessorSelection>(
    pane: T,
    value: PreprocessorSelection[T],
  ) => {
    onChange({ ...preprocessors, [pane]: value })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div
        ref={dialogRef}
        className="w-full max-w-3xl rounded-2xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-settings-title"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">
              Editor settings
            </p>
            <h2 id="editor-settings-title" className="text-lg font-semibold text-white">
              Preprocessors
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {onReset && (
              <button
                onClick={onReset}
                className="px-3 py-2 rounded-lg text-sm bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Reset to none
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-lg text-sm bg-cyan-500 text-black font-semibold hover:bg-cyan-400 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        <div className="p-5 grid gap-4">
          <SettingRow
            label="HTML"
            description="Choose a template preprocessor for the HTML pane."
            value={preprocessors.html}
            options={HTML_PREPROCESSOR_OPTIONS}
            onChange={(value) => handleChange('html', value)}
            error={getErrorForPane('html', errors)}
          />

          <SettingRow
            label="CSS"
            description="Compile styles with SCSS or Less before preview."
            value={preprocessors.css}
            options={CSS_PREPROCESSOR_OPTIONS}
            onChange={(value) => handleChange('css', value)}
            error={getErrorForPane('css', errors)}
          />

          <SettingRow
            label="JavaScript"
            description="Transpile JS with TypeScript, Babel, or CoffeeScript."
            value={preprocessors.js}
            options={JS_PREPROCESSOR_OPTIONS}
            onChange={(value) => handleChange('js', value)}
            error={getErrorForPane('js', errors)}
          />
        </div>
      </div>
    </div>
  )
}

type SettingRowProps<T extends string> = {
  label: string
  description: string
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
  error?: string
}

function SettingRow<T extends string>({
  label,
  description,
  value,
  options,
  onChange,
  error,
}: SettingRowProps<T>) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{label}</p>
          <p className="text-xs text-gray-400">{description}</p>
        </div>
        {error && (
          <span className="px-2 py-1 text-xs rounded-lg bg-red-500/20 text-red-300 border border-red-500/30">
            {error}
          </span>
        )}
      </div>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
