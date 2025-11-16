import type { ReactNode } from 'react'

type EditorLayoutProps = {
  children: ReactNode
}

export function EditorLayout({ children }: EditorLayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-slate-950 text-white">
      <main className="flex-1 min-h-0 flex flex-col">{children}</main>
    </div>
  )
}
