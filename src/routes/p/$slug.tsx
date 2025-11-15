import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/p/$slug')({
  loader: async ({ params }) => ({
    slug: params.slug,
  }),
  component: () => (
    <section className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4 px-6 py-16">
      <h1 className="text-3xl font-bold">Public viewer coming soon</h1>
      <p className="text-gray-400">
        We&apos;re building the viewer experience now. Check back later.
      </p>
    </section>
  ),
})
