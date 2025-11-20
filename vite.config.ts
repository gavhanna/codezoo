import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

// Plugin to stub Prisma client for browser only (not SSR)
function prismaClientStub() {
  const virtualModuleId = '.prisma/client/index-browser'
  const resolvedVirtualModuleId = '\0' + virtualModuleId

  return {
    name: 'prisma-client-stub',
    resolveId(id: string, importer: string | undefined, options: any) {
      // Only stub for client builds, not SSR
      if (options?.ssr) {
        return null
      }
      
      if (id === virtualModuleId || id === '.prisma/client/default') {
        return resolvedVirtualModuleId
      }
    },
    load(id: string, options: any) {
      // Only stub for client builds, not SSR
      if (options?.ssr) {
        return null
      }
      
      if (id === resolvedVirtualModuleId) {
        return 'export default {};'
      }
    },
  }
}

const config = defineConfig({
  plugins: [
    prismaClientStub(),
    devtools(),
    nitro(),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
  ssr: {
    external: ['.prisma/client/index-browser', '.prisma/client/default', '@prisma/client'],
    resolve: {
      externalConditions: ['node', 'import'],
    },
  },
  build: {
    rollupOptions: {
      external: ['.prisma/client/index-browser', '.prisma/client/default'],
    },
  },
  optimizeDeps: {
    exclude: ['@prisma/client', '.prisma/client'],
  },
  resolve: {
    conditions: ['node', 'import', 'module', 'browser', 'default'],
  },
})

export default config
