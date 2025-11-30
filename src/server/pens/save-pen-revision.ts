import { RevisionKind } from '@prisma/client'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireUser } from '@/server/auth/guards'
import { serializePenForEditor } from './serialize'
import {
  DEFAULT_PREPROCESSORS,
  type PreprocessorSelection,
} from '@/types/preprocessors'

const inputSchema = z.object({
  penId: z.string().uuid(),
  html: z.string(),
  css: z.string(),
  js: z.string(),
  preprocessors: z
    .object({
      html: z.enum(['none', 'pug', 'markdown']).optional(),
      css: z.enum(['none', 'scss', 'less']).optional(),
      js: z.enum(['none', 'typescript', 'babel', 'coffeescript']).optional(),
    })
    .optional(),
  compiled: z
    .object({
      html: z.string(),
      css: z.string(),
      js: z.string(),
    })
    .optional(),
  kind: z.nativeEnum(RevisionKind).optional(),
})

export const savePenRevision = createServerFn({ method: 'POST' })
  .inputValidator((input: z.infer<typeof inputSchema>) => inputSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { ctx, user } = await requireUser(context)

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
          select: { revNumber: true, meta: true },
        },
      },
    })

    if (!penRecord) {
      throw new Error('Pen not found')
    }

    const nextRevNumber = (penRecord.revisions[0]?.revNumber ?? 0) + 1

    const revisionKind = data.kind ?? RevisionKind.SNAPSHOT

    const latestMeta = penRecord.revisions[0]?.meta ?? {}
    const nextPreprocessors: PreprocessorSelection = {
      ...DEFAULT_PREPROCESSORS,
      ...(latestMeta as any)?.preprocessors,
      ...data.preprocessors,
    }

    const nextMeta = {
      ...latestMeta,
      preprocessors: nextPreprocessors,
      ...(data.compiled ? { compiled: data.compiled } : { compiled: undefined }),
    }

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
          meta: nextMeta,
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
