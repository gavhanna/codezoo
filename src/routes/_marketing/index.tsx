import { createFileRoute, Link } from '@tanstack/react-router'
import { NotebookPen, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import { MarketingShell } from '@/components/MarketingShell'

export const Route = createFileRoute('/_marketing/')({
  component: Landing,
})

const highlights = [
  {
    icon: <Zap className="w-10 h-10 text-cyan-400" />,
    title: 'Bun-Powered Performance',
    blurb:
      'Experience blazing fast server-side execution. CodeZoo leverages the raw speed of Bun for instant feedback.',
  },
  {
    icon: <NotebookPen className="w-10 h-10 text-cyan-400" />,
    title: 'Professional Editor',
    blurb:
      'A full-featured Monaco editor with TypeScript support, Emmet, and smart completions right in your browser.',
  },
  {
    icon: <ShieldCheck className="w-10 h-10 text-cyan-400" />,
    title: 'Secure & Private',
    blurb:
      'Self-hostable by design. Keep your code under your control with strict sandboxing and privacy-first architecture.',
  },
  {
    icon: <Sparkles className="w-10 h-10 text-cyan-400" />,
    title: 'Instant Preview',
    blurb:
      'See your changes in real-time. Our isolated preview environment ensures safety without sacrificing speed.',
  },
]

function Landing() {
  return (
    <MarketingShell>
      <section className="px-6 py-16 md:py-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <p className="uppercase tracking-[0.4em] text-cyan-400 text-sm">
            Code, Preview, Deploy
          </p>
          <h1 className="text-4xl md:text-6xl font-black leading-tight">
            The modern playground for <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">creative developers</span>.
          </h1>
          <p className="text-gray-300 text-lg md:text-xl max-w-3xl mx-auto">
            CodeZoo combines the power of a local dev environment with the convenience of the cloud. 
            Build, test, and share your web experiments with a tool designed for performance and privacy.
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
