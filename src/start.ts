import { createMiddleware, createStart } from '@tanstack/react-start'
import { buildServerContext } from '@/server/context'

const requestContextMiddleware = createMiddleware({
  type: 'request',
}).server(async ({ request, context, next }) => {
  if (!import.meta.env.SSR) {
    return next({ context })
  }

  const resolvedContext = await buildServerContext(request, context)
  const result = await next({
    context: resolvedContext,
  })

  const pendingCookies = result.context?.pendingCookies
  if (pendingCookies?.length) {
    pendingCookies.forEach((cookie) => {
      result.response.headers.append('Set-Cookie', cookie)
    })
  }

  return result
})

export const startInstance = createStart(() => ({
  requestMiddleware: [requestContextMiddleware],
}))
