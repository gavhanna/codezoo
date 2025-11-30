import React, { useRef, useCallback } from 'react'
import { Monitor } from 'lucide-react'

interface PreviewPaneProps {
  html: string
  css: string
  js: string
  className?: string
  isCompiling?: boolean
}

export const PreviewPane: React.FC<PreviewPaneProps> = ({
  html,
  css,
  js,
  className = '',
  isCompiling = false
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
    <div className={`bg-slate-900 border border-white/5  overflow-hidden flex flex-col h-full w-full ${className}`}>
      <div className="bg-slate-800 px-4 py-3 flex items-center justify-between border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-300">Preview</h3>
        </div>
        {isCompiling && (
          <span className="text-xs text-gray-400">Compiling…</span>
        )}
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
