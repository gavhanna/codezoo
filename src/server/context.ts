import type { PrismaClient, Session, User } from '@prisma/client'
import { prisma as prismaInstance } from './db'
import { getSessionFromRequest } from './auth/session'

export type RequestMetadata = {
  ip: string | null
  userAgent: string | null
}

export type AppServerContext = {
  prisma: PrismaClient
  session: Session | null
  currentUser: User | null
  requestMetadata: RequestMetadata
  pendingCookies: Array<string>
}

type PartialContext = Partial<AppServerContext> | undefined

function extractRequestMetadata(request: Request): RequestMetadata {
  const forwarded = request.headers.get('x-forwarded-for')
  const ipCandidate = forwarded?.split(',')[0]?.trim()
  const ip =
    ipCandidate ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    null

  return {
    ip,
    userAgent: request.headers.get('user-agent'),
  }
}

export async function buildServerContext(
  request: Request,
  existing?: PartialContext,
): Promise<AppServerContext> {
  const context: AppServerContext = {
    prisma: existing?.prisma ?? prismaInstance,
    session: existing?.session ?? null,
    currentUser: existing?.currentUser ?? null,
    requestMetadata: existing?.requestMetadata ?? extractRequestMetadata(request),
    pendingCookies: existing?.pendingCookies ?? [],
  }

  if (!context.session) {
    const active = await getSessionFromRequest(context.prisma, request)
    context.session = active?.session ?? null
    context.currentUser = active?.user ?? null
  }

  return context
}

export function requireContext(context?: AppServerContext) {
  if (!context) {
    throw new Error('Server context is unavailable.')
  }

  return context
}
