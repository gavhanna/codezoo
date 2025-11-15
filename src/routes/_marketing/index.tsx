import { createFileRoute, Link } from '@tanstack/react-router'
import { NotebookPen, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import { MarketingShell } from '@/components/MarketingShell'

export const Route = createFileRoute('/_marketing/')({
  component: Landing,
})

const highlights = [
  {
    icon: <Zap className="w-10 h-10 text-cyan-400" />,
    title: 'Live preview',
    blurb:
      'Instant feedback with sandboxed iframes and strict CSP so your host stays safe.',
  },
  {
    icon: <NotebookPen className="w-10 h-10 text-cyan-400" />,
    title: 'Revision history',
    blurb:
      'Automatic autosaves with manual snapshots so you never lose a creative burst.',
  },
  {
    icon: <ShieldCheck className="w-10 h-10 text-cyan-400" />,
    title: 'Secure sessions',
    blurb:
      'HttpOnly cookies, CSRF protection, and per-session revocation built in from day one.',
  },
  {
    icon: <Sparkles className="w-10 h-10 text-cyan-400" />,
    title: 'Extendable core',
    blurb:
      'Start with pens, unlock templates, orgs, and asset uploads without rewriting anything.',
  },
]

function Landing() {
  return (
    <MarketingShell>
      <section className="px-6 py-16 md:py-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <p className="uppercase tracking-[0.4em] text-cyan-400 text-sm">
            Build, preview, share
          </p>
          <h1 className="text-4xl md:text-6xl font-black leading-tight">
            The open-source playground for modern web pens.
          </h1>
          <p className="text-gray-300 text-lg md:text-xl max-w-3xl mx-auto">
            Codezoo pairs Bun-powered server functions with Monaco editors to
            deliver a predictable, self-hostable alternative to CodePen. Sign up
            to compose HTML/CSS/JS experiments, save revisions, and share
            sandboxed previews without surrendering privacy or control.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/auth/register"
              className="px-6 py-3 rounded-xl bg-cyan-500 text-black font-semibold w-full sm:w-auto"
            >
              Create your free account
            </Link>
            <Link
              to="/auth/login"
              className="px-6 py-3 rounded-xl border border-white/30 w-full sm:w-auto"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>
      <section className="px-6 pb-16 bg-slate-950 text-white">
        <div className="max-w-5xl mx-auto grid gap-6 md:grid-cols-2">
          {highlights.map((item) => (
            <div
              key={item.title}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4"
            >
              {item.icon}
              <h3 className="text-2xl font-semibold">{item.title}</h3>
              <p className="text-gray-300 leading-relaxed">{item.blurb}</p>
            </div>
          ))}
        </div>
      </section>
    </MarketingShell>
  )
}
