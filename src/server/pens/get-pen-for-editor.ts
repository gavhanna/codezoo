import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireUser } from '@/server/auth/guards'
import { serializePenForEditor } from './serialize'
import { redirect } from '@tanstack/react-router'

const inputSchema = z.object({
  penId: z.string().uuid(),
})

export const getPenForEditor = createServerFn({ method: 'POST' })
  .inputValidator((input: z.infer<typeof inputSchema>) => inputSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { ctx, user } = requireUser(context)

    const pen = await ctx.prisma.pen.findFirst({
      where: {
        id: data.penId,
        ownerId: user.id,
      },
      include: {
        revisions: {
          orderBy: {
            revNumber: 'desc',
          },
          take: 1,
        },
      },
    })

    if (!pen) {
      throw redirect({ to: '/app' })
    }

    return serializePenForEditor(pen)
  })
