import { useState, useRef, useCallback, useEffect } from 'react'
import { PaneId } from '../constants'
import type {
  CompileError,
  CompileResult,
  PreprocessorSelection,
} from '@/types/preprocessors'

interface UseCodePreviewProps {
  initialHtml: string
  initialCss: string
  initialJs: string
  penId: string
  preprocessors: PreprocessorSelection
  compile: (input: {
    code: { html: string; css: string; js: string }
    preprocessors: PreprocessorSelection
  }) => Promise<CompileResult>
  onCodeChange?: (code: { html: string; css: string; js: string }) => void
}

export const useCodePreview = ({
  initialHtml,
  initialCss,
  initialJs,
  penId,
  preprocessors,
  compile,
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
  const [compileErrors, setCompileErrors] = useState<CompileError[] | undefined>(
    undefined,
  )
  const [isCompiling, setIsCompiling] = useState(false)
  const lastGoodCompiledRef = useRef({
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
    setCompileErrors(undefined)
    setIsCompiling(false)
    lastGoodCompiledRef.current = {
      html: initialHtml,
      css: initialCss,
      js: initialJs,
    }
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

  useEffect(() => {
    schedulePreviewUpdate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preprocessors])

  const schedulePreviewUpdate = useCallback(() => {
    if (previewTimeoutRef.current) {
      window.clearTimeout(previewTimeoutRef.current)
    }

    previewTimeoutRef.current = window.setTimeout(async () => {
      setIsCompiling(true)
      try {
        const result = await compile({
          code: {
            html: htmlRef.current,
            css: cssRef.current,
            js: jsRef.current,
          },
          preprocessors,
        })

        if (result.errors?.length) {
          setCompileErrors(result.errors)
          setPreviewCode(lastGoodCompiledRef.current)
        } else {
          setCompileErrors(undefined)
          lastGoodCompiledRef.current = {
            html: result.compiledHtml,
            css: result.compiledCss,
            js: result.compiledJs,
          }
          setPreviewCode(lastGoodCompiledRef.current)
        }
      } catch (error) {
        console.error('Failed to compile', error)
        setCompileErrors([{ pane: 'html', message: 'Compile failed' }])
        setPreviewCode(lastGoodCompiledRef.current)
      } finally {
        setIsCompiling(false)
      }
    }, debounceDelay)
  }, [compile, debounceDelay, preprocessors])

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
    jsRef,
    compileErrors,
    isCompiling,
  }
}
