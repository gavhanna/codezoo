import { createMiddleware, createStart } from '@tanstack/react-start'
import { getStartContext } from '@tanstack/start-storage-context'
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

const functionContextMiddleware = createMiddleware({
  type: 'function',
}).server(async ({ context, next }) => {
  if (!import.meta.env.SSR) {
    return next({ context })
  }

  const startContext = getStartContext()
  const inheritedContext =
    (context as any) || startContext?.contextAfterGlobalMiddlewares

  if (inheritedContext) {
    return next({ context: inheritedContext })
  }

  const request = startContext?.request
  if (!request) {
    return next({ context })
  }

  const resolvedContext = await buildServerContext(request, context)
  return next({ context: resolvedContext })
})

export const startInstance = createStart(() => ({
  requestMiddleware: [requestContextMiddleware],
  functionMiddleware: [functionContextMiddleware],
}))
