import { Generator, getConfig } from '@tanstack/router-generator'

async function main() {
  const root = process.cwd()
  const config = getConfig(
    {
      target: 'react',
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
      addExtensions: true,
    },
    root,
  )

  const generator = new Generator({
    config,
    root,
  })

  await generator.run()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
