import React, { useRef, useCallback, useEffect, useState } from 'react'
import { GripVertical } from 'lucide-react'

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
