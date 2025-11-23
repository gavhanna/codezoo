import React from 'react'

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
