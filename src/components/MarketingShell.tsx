import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { Route as RootRoute } from '@/routes/__root'

type MarketingShellProps = {
  children: ReactNode
}

export function MarketingShell({ children }: MarketingShellProps) {
  const { currentUser } = RootRoute.useLoaderData()

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <header className="p-4 flex items-center justify-between bg-gray-900 text-white shadow-lg">
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Codezoo"
            className="h-10 w-10 rounded-full border border-white/20"
          />
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">
              Codezoo
            </p>
            <p className="text-lg font-semibold">Playground</p>
          </div>
        </Link>
        {!currentUser ? (
          <div className="flex items-center gap-3">
            <Link
              to="/auth/login"
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-sm"
            >
              Sign in
            </Link>
            <Link
              to="/auth/register"
              className="px-4 py-2 rounded-lg bg-cyan-500 text-black font-semibold hover:bg-cyan-400 transition-colors text-sm"
            >
              Create account
            </Link>
          </div>
        ) : (
          <Link
            to="/app"
            className="px-4 py-2 rounded-lg bg-cyan-500 text-black font-semibold hover:bg-cyan-400 transition-colors text-sm"
          >
            Go to dashboard
          </Link>
        )}
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  )
}
