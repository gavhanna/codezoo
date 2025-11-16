import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { Code, Cpu, FileText, Layout, PlusSquare } from 'lucide-react'
import {
  SplitPane,
  CodeEditorPane,
  PreviewPane,
  LayoutToggle,
} from './SplitPane'

const EDITOR_PANES = [
  {
    id: 'html',
    label: 'HTML',
    language: 'html',
    icon: FileText,
    accent: 'text-orange-400',
  },
  {
    id: 'css',
    label: 'CSS',
    language: 'css',
    icon: Code,
    accent: 'text-blue-400',
  },
  {
    id: 'js',
    label: 'JavaScript',
    language: 'javascript',
    icon: Cpu,
    accent: 'text-yellow-400',
  },
] as const

type PaneId = (typeof EDITOR_PANES)[number]['id']
const MIN_PANE_PERCENT = 10

interface CodeEditorProps {
  initialHtml?: string
  initialCss?: string
  initialJs?: string
  onCodeChange?: (code: { html: string; css: string; js: string }) => void
  className?: string
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  initialHtml = `<div class="container">
  <h1>Hello World!</h1>
  <p>Welcome to CodeZoo Pen Editor</p>
  <button id="clickMe">Click Me!</button>
</div>`,
  initialCss = `body {
  font-family: 'Arial', sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  margin: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.container {
  text-align: center;
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
}

h1 {
  color: #333;
  margin-bottom: 1rem;
}

p {
  color: #666;
  margin-bottom: 1.5rem;
}

button {
  background: #667eea;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
}

button:hover {
  background: #5a6fd8;
  transform: translateY(-2px);
}`,
  initialJs = `document.getElementById('clickMe').addEventListener('click', function() {
  alert('Hello from CodeZoo! 🚀');

  // Animate the button
  this.style.transform = 'scale(0.95)';
  setTimeout(() => {
    this.style.transform = 'scale(1)';
  }, 200);
});`,
  onCodeChange,
  className = ''
}) => {
  const [html, setHtml] = useState(initialHtml)
  const [css, setCss] = useState(initialCss)
  const [js, setJs] = useState(initialJs)
  const [layout, setLayout] = useState<'horizontal' | 'vertical'>('horizontal')
  const [leftPaneSize, setLeftPaneSize] = useState(33)
  const [previewCode, setPreviewCode] = useState({
    html: initialHtml,
    css: initialCss,
    js: initialJs,
  })
  const [collapsedPanes, setCollapsedPanes] = useState<Record<PaneId, boolean>>({
    html: false,
    css: false,
    js: false,
  })
  const [paneSizes, setPaneSizes] = useState<Record<PaneId, number>>({
    html: 34,
    css: 33,
    js: 33,
  })
  const editorStackRef = useRef<HTMLDivElement>(null)
  const [draggingDivider, setDraggingDivider] = useState<number | null>(null)
  const resizeStateRef = useRef<{
    startPos: number
    startSizes: Record<PaneId, number>
    visibleOrder: Array<PaneId>
    index: number
  } | null>(null)
  const editorStackDirection = layout === 'horizontal' ? 'vertical' : 'horizontal'

  const visiblePanes = useMemo(
    () => EDITOR_PANES.filter((pane) => !collapsedPanes[pane.id]),
    [collapsedPanes],
  )
  const collapsedList = useMemo(
    () => EDITOR_PANES.filter((pane) => collapsedPanes[pane.id]),
    [collapsedPanes],
  )

  const collapsePane = useCallback((paneId: PaneId) => {
    setCollapsedPanes((prev) => {
      if (prev[paneId]) {
        return prev
      }
      const remainingVisible = EDITOR_PANES.filter(
        (pane) => !prev[pane.id] && pane.id !== paneId,
      ).map((pane) => pane.id)

      if (remainingVisible.length === 0) {
        return prev
      }

      setPaneSizes((sizes) => {
        const freed = sizes[paneId]
        const remainingTotal = remainingVisible.reduce(
          (sum, id) => sum + sizes[id],
          0,
        )
        const updated = { ...sizes, [paneId]: 0 }
        remainingVisible.forEach((id) => {
          const base =
            remainingTotal > 0
              ? sizes[id] / remainingTotal
              : 1 / remainingVisible.length
          updated[id] = sizes[id] + freed * base
        })
        return updated
      })

      return { ...prev, [paneId]: true }
    })
  }, [])

  const expandPane = useCallback((paneId: PaneId) => {
    setCollapsedPanes((prev) => {
      if (!prev[paneId]) {
        return prev
      }

      const next = { ...prev, [paneId]: false }

      setPaneSizes((sizes) => {
        const visibleAfter = EDITOR_PANES.filter(
          (pane) => !next[pane.id],
        ).map((pane) => pane.id)
        if (visibleAfter.length === 0) {
          return sizes
        }

        const otherIds = visibleAfter.filter((id) => id !== paneId)
        const otherTotal = otherIds.reduce((sum, id) => sum + sizes[id], 0)
        const newPaneSize = 100 / visibleAfter.length
        const remainingShare = 100 - newPaneSize
        const updated = { ...sizes, [paneId]: newPaneSize }

        if (otherIds.length === 0) {
          return updated
        }

        otherIds.forEach((id) => {
          const base =
            otherTotal > 0 ? sizes[id] / otherTotal : 1 / otherIds.length
          updated[id] = remainingShare * base
        })

        return updated
      })

      return next
    })
  }, [])

  const handleToggleCollapse = useCallback(
    (paneId: PaneId) => {
      if (collapsedPanes[paneId]) {
        expandPane(paneId)
      } else {
        collapsePane(paneId)
      }
    },
    [collapsePane, collapsedPanes, expandPane],
  )
  const handleDividerMouseDown = useCallback(
    (index: number) => (event: React.MouseEvent) => {
      if (!editorStackRef.current) {
        return
      }

      const visibleOrder = visiblePanes.map((pane) => pane.id)
      if (visibleOrder.length < 2 || !visibleOrder[index + 1]) {
        return
      }

      event.preventDefault()
      resizeStateRef.current = {
        startPos:
          editorStackDirection === 'vertical' ? event.clientY : event.clientX,
        startSizes: { ...paneSizes },
        visibleOrder,
        index,
      }
      setDraggingDivider(index)
    },
    [editorStackDirection, paneSizes, visiblePanes],
  )

  useEffect(() => {
    if (draggingDivider === null) {
      return
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (!editorStackRef.current || !resizeStateRef.current) {
        return
      }

      const { startPos, visibleOrder, index, startSizes } =
        resizeStateRef.current
      const leftId = visibleOrder[index]
      const rightId = visibleOrder[index + 1]
      if (!leftId || !rightId) {
        return
      }

      const containerSize =
        editorStackDirection === 'vertical'
          ? editorStackRef.current.offsetHeight
          : editorStackRef.current.offsetWidth

      if (!containerSize) {
        return
      }

      const currentPos =
        editorStackDirection === 'vertical' ? event.clientY : event.clientX
      const deltaPx = currentPos - startPos
      const deltaPercent = (deltaPx / containerSize) * 100
      const total = startSizes[leftId] + startSizes[rightId]

      if (total <= 0) {
        return
      }

      let nextLeft = startSizes[leftId] + deltaPercent
      const minAllowed = Math.min(MIN_PANE_PERCENT, total / 2)
      nextLeft = Math.max(
        minAllowed,
        Math.min(total - minAllowed, nextLeft),
      )
      const nextRight = total - nextLeft

      setPaneSizes((prev) => ({
        ...prev,
        [leftId]: nextLeft,
        [rightId]: nextRight,
      }))
    }

    const handleMouseUp = () => {
      setDraggingDivider(null)
      resizeStateRef.current = null
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.userSelect = 'none'
    document.body.style.cursor =
      editorStackDirection === 'vertical' ? 'row-resize' : 'col-resize'

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [draggingDivider, editorStackDirection])

  const debounceDelay = 350

  useEffect(() => {
    setHtml(initialHtml)
  }, [initialHtml])

  useEffect(() => {
    setCss(initialCss)
  }, [initialCss])

  useEffect(() => {
    setJs(initialJs)
  }, [initialJs])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const nextCode = { html, css, js }
      setPreviewCode(nextCode)
      onCodeChange?.(nextCode)
    }, debounceDelay)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [html, css, js, onCodeChange, debounceDelay])

  const handleCodeChange = useCallback(
    (type: PaneId, value: string) => {
      switch (type) {
        case 'html':
          setHtml(value)
          break
        case 'css':
          setCss(value)
          break
        case 'js':
          setJs(value)
          break
      }
    },
    [],
  )

  const toggleLayout = useCallback(() => {
    setLayout(prev => prev === 'horizontal' ? 'vertical' : 'horizontal')
  }, [])

  const toggleLeftRight = useCallback(() => {
    setLeftPaneSize(prev => {
      // Swap left and right pane sizes
      return 100 - prev
    })
  }, [])

  const editorPanel = (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <div className="bg-slate-800 px-4 py-3 border-b border-white/5 flex-shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <LayoutToggle layout={layout} onToggle={toggleLayout} />
            <button
              onClick={toggleLeftRight}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
              title="Swap editor and preview panels"
            >
              <Layout className="w-4 h-4 text-gray-300 rotate-90" />
            </button>
          </div>
          <p className="text-xs text-gray-400">
            Drag the dividers to resize panes. Collapse the ones you don&apos;t need.
          </p>
        </div>

        {collapsedList.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-300">
            <span className="uppercase tracking-[0.3em] text-[0.65rem] text-gray-500">
              Collapsed
            </span>
            {collapsedList.map((pane) => (
              <button
                key={pane.id}
                onClick={() => expandPane(pane.id)}
                className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center gap-1 text-xs font-medium"
              >
                <PlusSquare className="w-3 h-3 text-cyan-400" />
                {pane.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <div
          ref={editorStackRef}
          className={`h-full w-full flex ${
            editorStackDirection === 'vertical' ? 'flex-col' : 'flex-row'
          }`}
        >
          {visiblePanes.map((pane, index) => {
            const Icon = pane.icon
            const paneValue =
              pane.id === 'html' ? html : pane.id === 'css' ? css : js
            const paneStyle =
              editorStackDirection === 'vertical'
                ? {
                    flexBasis: `${paneSizes[pane.id]}%`,
                    minHeight: `${MIN_PANE_PERCENT}%`,
                  }
                : {
                    flexBasis: `${paneSizes[pane.id]}%`,
                    minWidth: `${MIN_PANE_PERCENT}%`,
                  }

            return (
              <React.Fragment key={pane.id}>
                <div
                  className="flex flex-col min-h-0 min-w-0 overflow-hidden"
                  style={paneStyle}
                >
                  <CodeEditorPane
                    title={pane.label}
                    language={pane.language}
                    value={paneValue}
                    onChange={(value) => handleCodeChange(pane.id, value)}
                    icon={<Icon className={`w-4 h-4 ${pane.accent}`} />}
                    onCollapse={() => handleToggleCollapse(pane.id)}
                    collapseDisabled={visiblePanes.length === 1}
                  />
                </div>
                {index < visiblePanes.length - 1 && (
                  <div
                    role="separator"
                    aria-orientation={editorStackDirection}
                    onMouseDown={handleDividerMouseDown(index)}
                    className={`
                      ${
                        editorStackDirection === 'vertical'
                          ? 'h-1 cursor-row-resize my-2'
                          : 'w-1 cursor-col-resize mx-2'
                      }
                      bg-slate-800 hover:bg-cyan-600 transition-colors flex-shrink-0 rounded-full flex items-center justify-center
                      ${draggingDivider === index ? 'bg-cyan-500' : ''}
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
        right={<PreviewPane html={previewCode.html} css={previewCode.css} js={previewCode.js} />}
        defaultLeftSize={leftPaneSize}
        leftSize={leftPaneSize}
        onResize={setLeftPaneSize}
        split={layout}
      />
    </div>
  )
}

export default CodeEditor
