import { PenVisibility, RevisionKind } from '@prisma/client'
import { createServerFn } from '@tanstack/react-start'
import { requireUser } from '@/server/auth/guards'

const DEFAULT_HTML = '<!-- Start building your pen -->'
const DEFAULT_CSS = '/* Add your styles */'
const DEFAULT_JS = '// Write JavaScript here'

export const createPen = createServerFn({ method: 'POST' }).handler(
  async ({ context }) => {
    const { ctx, user } = await requireUser(context)

    const pen = await ctx.prisma.pen.create({
      data: {
        ownerId: user.id,
        title: 'Untitled Pen',
        visibility: PenVisibility.PRIVATE,
        revisions: {
          create: {
            authorId: user.id,
            revNumber: 1,
            kind: RevisionKind.SNAPSHOT,
            html: DEFAULT_HTML,
            css: DEFAULT_CSS,
            js: DEFAULT_JS,
            meta: {
              panelLayout: 'stacked',
              preprocessors: {
                html: 'none',
                css: 'none',
                js: 'none',
              },
            },
          },
        },
      },
      select: {
        id: true,
      },
    })

    return pen
  },
)
