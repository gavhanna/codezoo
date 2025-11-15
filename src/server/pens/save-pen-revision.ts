import { RevisionKind } from '@prisma/client'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireUser } from '@/server/auth/guards'
import { serializePenForEditor } from './serialize'

const inputSchema = z.object({
  penId: z.string().uuid(),
  html: z.string(),
  css: z.string(),
  js: z.string(),
  kind: z.nativeEnum(RevisionKind).optional(),
})

export const savePenRevision = createServerFn({ method: 'POST' })
  .inputValidator((input: z.infer<typeof inputSchema>) => inputSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { ctx, user } = requireUser(context)

    const penRecord = await ctx.prisma.pen.findFirst({
      where: {
        id: data.penId,
        ownerId: user.id,
      },
      select: {
        id: true,
        revisions: {
          orderBy: { revNumber: 'desc' },
          take: 1,
          select: { revNumber: true },
        },
      },
    })

    if (!penRecord) {
      throw new Error('Pen not found')
    }

    const nextRevNumber = (penRecord.revisions[0]?.revNumber ?? 0) + 1

    const revisionKind = data.kind ?? RevisionKind.SNAPSHOT

    const [, updatedPen] = await ctx.prisma.$transaction([
      ctx.prisma.penRevision.create({
        data: {
          penId: penRecord.id,
          authorId: user.id,
          revNumber: nextRevNumber,
          kind: revisionKind,
          html: data.html,
          css: data.css,
          js: data.js,
        },
      }),
      ctx.prisma.pen.update({
        where: { id: penRecord.id },
        data: { updatedAt: new Date() },
        include: {
          revisions: {
            orderBy: { revNumber: 'desc' },
            take: 1,
          },
        },
      }),
    ])

    return serializePenForEditor(updatedPen)
  })
