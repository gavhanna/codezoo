import { createServerFn } from '@tanstack/react-start'
import { requireUser } from '@/server/auth/guards'

type SerializedPen = {
  id: string
  title: string
  slug: string | null
  updatedAt: string
  visibility: string
}

export const getUserPens = createServerFn({ method: 'GET' }).handler(
  async ({ context }): Promise<Array<SerializedPen>> => {
    const { ctx, user } = await requireUser(context)
    const pens = await ctx.prisma.pen.findMany({
      where: { ownerId: user.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        updatedAt: true,
        visibility: true,
      },
    })

    return pens.map((pen) => ({
      id: pen.id,
      title: pen.title,
      slug: pen.slug,
      updatedAt: pen.updatedAt.toISOString(),
      visibility: pen.visibility,
    }))
  },
)
