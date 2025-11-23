import type { PrismaClient, Session, User } from '@prisma/client'

export const SESSION_COOKIE_NAME = 'cz_session'
const SESSION_TTL_DAYS = 30
const SESSION_MAX_AGE = SESSION_TTL_DAYS * 24 * 60 * 60

export type ActiveSession = {
  session: Session
  user: User
}

function parseCookies(header: string | null) {
  if (!header) return {}
  return header.split(';').reduce<Record<string, string>>((acc, part) => {
    const [name, ...rest] = part.split('=')
    if (!name) return acc
    acc[name.trim()] = decodeURIComponent(rest.join('=').trim())
    return acc
  }, {})
}

function getExpiryDate() {
  const expires = new Date()
  expires.setUTCSeconds(expires.getUTCSeconds() + SESSION_MAX_AGE)
  return expires
}

export function buildSessionCookie(token: string, expiresAt: Date) {
  const base = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Strict`,
  ]
  if (process.env.NODE_ENV !== 'development' && process.env.DISABLE_SECURE_COOKIES !== 'true') {
    base.push('Secure')
  }
  base.push(`Expires=${expiresAt.toUTCString()}`)
  base.push(`Max-Age=${SESSION_MAX_AGE}`)
  return base.join('; ')
}

export function buildSessionDestroyCookie() {
  const base = [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    'Max-Age=0',
    `Expires=${new Date(0).toUTCString()}`,
  ]
  if (process.env.NODE_ENV !== 'development' && process.env.DISABLE_SECURE_COOKIES !== 'true') {
    base.push('Secure')
  }
  return base.join('; ')
}

export async function createSession(opts: {
  prisma: PrismaClient
  userId: string
  ip?: string | null
  userAgent?: string | null
}) {
  const token = crypto.randomUUID()
  const expiresAt = getExpiryDate()
  const session = await opts.prisma.session.create({
    data: {
      userId: opts.userId,
      sessionToken: token,
      expiresAt,
      ip: opts.ip ?? undefined,
      userAgent: opts.userAgent ?? undefined,
      lastSeenAt: new Date(),
    },
  })

  return {
    session,
    cookie: buildSessionCookie(token, expiresAt),
  }
}

export async function deleteSession(opts: {
  prisma: PrismaClient
  sessionToken?: string
  sessionId?: string
}) {
  if (!opts.sessionToken && !opts.sessionId) return
  await opts.prisma.session.deleteMany({
    where: {
      OR: [
        opts.sessionToken ? { sessionToken: opts.sessionToken } : undefined,
        opts.sessionId ? { id: opts.sessionId } : undefined,
      ].filter(Boolean) as Array<object>,
    },
  })
}

async function hydrateSession(
  prisma: PrismaClient,
  token: string,
): Promise<ActiveSession | null> {
  const session = await prisma.session.findUnique({
    where: { sessionToken: token },
    include: {
      user: true,
    },
  })

  if (!session) {
    return null
  }

  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({
      where: { id: session.id },
    })
    return null
  }

  await prisma.session.update({
    where: { id: session.id },
    data: {
      lastSeenAt: new Date(),
    },
  })

  return {
    session,
    user: session.user,
  }
}

export async function getSessionFromRequest(
  prisma: PrismaClient,
  request: Request,
) {
  const cookies = parseCookies(request.headers.get('cookie'))
  const token = cookies[SESSION_COOKIE_NAME]
  if (!token) {
    return null
  }

  return hydrateSession(prisma, token)
}
