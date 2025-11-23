import { useState, useRef, useCallback, useEffect } from 'react'
import { PaneId } from '../constants'

interface UseCodePreviewProps {
  initialHtml: string
  initialCss: string
  initialJs: string
  penId: string
  onCodeChange?: (code: { html: string; css: string; js: string }) => void
}

export const useCodePreview = ({
  initialHtml,
  initialCss,
  initialJs,
  penId,
  onCodeChange,
}: UseCodePreviewProps) => {
  const htmlRef = useRef(initialHtml)
  const cssRef = useRef(initialCss)
  const jsRef = useRef(initialJs)
  
  const [previewCode, setPreviewCode] = useState({
    html: initialHtml,
    css: initialCss,
    js: initialJs,
  })
  
  const [editorKeys, setEditorKeys] = useState<Record<PaneId, number>>({
    html: 0,
    css: 0,
    js: 0,
  })
  
  const previewTimeoutRef = useRef<number | null>(null)
  const debounceDelay = 350

  // Only remount editors and reset refs when navigating to a different pen
  useEffect(() => {
    htmlRef.current = initialHtml
    cssRef.current = initialCss
    jsRef.current = initialJs
    setPreviewCode({
      html: initialHtml,
      css: initialCss,
      js: initialJs,
    })
    setEditorKeys((prev) => ({
      html: prev.html + 1,
      css: prev.css + 1,
      js: prev.js + 1,
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [penId])

  useEffect(() => {
    return () => {
      if (previewTimeoutRef.current) {
        window.clearTimeout(previewTimeoutRef.current)
      }
    }
  }, [])

  const schedulePreviewUpdate = useCallback(() => {
    if (previewTimeoutRef.current) {
      window.clearTimeout(previewTimeoutRef.current)
    }

    previewTimeoutRef.current = window.setTimeout(() => {
      setPreviewCode({
        html: htmlRef.current,
        css: cssRef.current,
        js: jsRef.current,
      })
    }, debounceDelay)
  }, [debounceDelay])

  const handleCodeChange = useCallback(
    (type: PaneId, value: string) => {
      switch (type) {
        case 'html':
          htmlRef.current = value
          break
        case 'css':
          cssRef.current = value
          break
        case 'js':
          jsRef.current = value
          break
      }

      schedulePreviewUpdate()
      onCodeChange?.({
        html: htmlRef.current,
        css: cssRef.current,
        js: jsRef.current,
      })
    },
    [onCodeChange, schedulePreviewUpdate],
  )

  return {
    previewCode,
    handleCodeChange,
    editorKeys,
    htmlRef,
    cssRef,
    jsRef
  }
}
