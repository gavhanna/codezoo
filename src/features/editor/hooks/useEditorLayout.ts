import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { EDITOR_PANES, PaneId, MIN_PANE_PERCENT } from '../constants'

export const useEditorLayout = (layout: 'horizontal' | 'vertical') => {
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
  const [draggingDivider, setDraggingDivider] = useState<number | null>(null)
  const editorStackRef = useRef<HTMLDivElement>(null)
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

  return {
    paneSizes,
    collapsedPanes,
    handleToggleCollapse,
    visiblePanes,
    handleDividerMouseDown,
    editorStackRef,
    draggingDivider,
    editorStackDirection
  }
}
