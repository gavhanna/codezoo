import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import type { CurrentUserPayload } from '@/server/auth/current-user'
import type { AppServerContext } from '@/server/context'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  loader: async ({ context }) => {
    // Dynamic imports to prevent client bundle inclusion
    const { getCurrentUser, serializeCurrentUser } = await import('@/server/auth/current-user')
    
    if (context && 'prisma' in context) {
      const ctx = context as AppServerContext

      return {
        currentUser: serializeCurrentUser(ctx.currentUser),
      }
    }

    return {
      currentUser: (await getCurrentUser()) as CurrentUserPayload,
    }
  },
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'CodeZoo',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
