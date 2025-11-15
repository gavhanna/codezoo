import { createMiddleware, createStart } from '@tanstack/react-start'

type ContextBag = Record<string, unknown> | undefined

const withPrismaContext =
  import.meta.env.SSR
    ? async (existing?: ContextBag) => {
        const { prisma } = await import('@/server/db')
        return {
          ...(existing ?? {}),
          prisma,
        }
      }
    : async (existing?: ContextBag) => existing ?? {}

const prismaRequestMiddleware = createMiddleware({ type: 'request' }).server(
  async ({ context, next }) =>
    next({
      context: await withPrismaContext(context),
    }),
)

const prismaFunctionMiddleware = createMiddleware({
  type: 'function',
}).server(async ({ context, next }) =>
  next({
    context: await withPrismaContext(context),
  }),
)

export const startInstance = createStart(() => ({
  requestMiddleware: [prismaRequestMiddleware],
  functionMiddleware: [prismaFunctionMiddleware],
}))
