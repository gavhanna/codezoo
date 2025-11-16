import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { ArrowLeftCircle, LayoutDashboard } from 'lucide-react'
import { Route as RootRoute } from '@/routes/__root'

type AppShellProps = {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { currentUser } = RootRoute.useLoaderData()

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <header className="px-6 py-4 border-b border-white/5 bg-slate-900 flex flex-wrap items-center justify-between gap-4">
        <Link to="/app" className="flex items-center gap-3 text-white">
          <LayoutDashboard className="w-5 h-5 text-cyan-400" />
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">
              Codezoo
            </p>
            <p className="text-lg font-semibold">Workbench</p>
          </div>
        </Link>
        <div className="flex items-center gap-3 text-sm text-gray-300">
          <Link
            to="/"
            className="px-3 py-1.5 rounded-lg border border-white/10 hover:border-cyan-400 transition-colors"
          >
            Marketing site
          </Link>
          <div className="flex items-center gap-2">
            <ArrowLeftCircle className="w-4 h-4 text-gray-500" />
            <span>{currentUser?.email ?? 'Signed in'}</span>
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  )
}
