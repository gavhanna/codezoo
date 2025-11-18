import type { Monaco } from '@monaco-editor/react'
import { doComplete, type VSCodeEmmetConfig } from 'emmet-monaco-es/src/emmetHelper'
import { isValidLocationForEmmetAbbreviation } from 'emmet-monaco-es/src/abbreviationActions'

const LANGUAGE_MODES: Record<string, string[]> = {
  html: ['!', '.', '}', ':', '*', '$', ']', '/', '>', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  jade: ['!', '.', '}', ':', '*', '$', ']', '/', '>', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  slim: ['!', '.', '}', ':', '*', '$', ']', '/', '>', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  haml: ['!', '.', '}', ':', '*', '$', ']', '/', '>', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  xml: ['.', '}', '*', '$', ']', '/', '>', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  xsl: ['!', '.', '}', '*', '$', '/', ']', '>', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  css: [':', '!', '-', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  scss: [':', '!', '-', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  sass: [':', '!', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  less: [':', '!', '-', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  stylus: [':', '!', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  javascript: ['!', '.', '}', '*', '$', ']', '/', '>', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  typescript: ['!', '.', '}', '*', '$', ']', '/', '>', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
}

const MAPPED_MODES: Record<string, string> = {
  handlebars: 'html',
  php: 'html',
  twig: 'html',
}

const DEFAULT_CONFIG: VSCodeEmmetConfig = {
  showExpandedAbbreviation: 'always',
  showAbbreviationSuggestions: true,
  showSuggestionsAsSnippets: false,
}

type SyntaxKind = 'html' | 'css' | 'jsx'

const safeIsValidLocation = (
  model: Parameters<typeof isValidLocationForEmmetAbbreviation>[0],
  position: Parameters<typeof isValidLocationForEmmetAbbreviation>[1],
  syntax: SyntaxKind,
  language: string,
) => {
  try {
    return isValidLocationForEmmetAbbreviation(model, position, syntax, language)
  } catch (error) {
    // Invalid tokenization state is expected occasionally when Monaco is still initializing.
    console.debug('[emmet] skipped invalid location check', error)
    return false
  }
}

const safeDoComplete = (
  monaco: Monaco,
  model: Parameters<typeof doComplete>[1],
  position: Parameters<typeof doComplete>[2],
  syntax: SyntaxKind,
) => {
  try {
    return doComplete(monaco, model, position, syntax, DEFAULT_CONFIG)
  } catch (error) {
    console.debug('[emmet] completion failed', error)
    return undefined
  }
}

const registerSafeProvider = (
  monaco: Monaco,
  languages: string[],
  syntax: SyntaxKind,
) => {
  if (!monaco) {
    return null
  }

  const disposables = languages.map((language) => {
    const triggerCharacters =
      LANGUAGE_MODES[MAPPED_MODES[language] ?? language] ?? []

    return monaco.languages.registerCompletionItemProvider(language, {
      triggerCharacters,
      provideCompletionItems(model, position) {
        if (!safeIsValidLocation(model, position, syntax, language)) {
          return undefined
        }
        return safeDoComplete(monaco, model, position, syntax)
      },
    })
  })

  return () => {
    disposables.forEach((disposable) => disposable.dispose())
  }
}

export const registerSafeEmmet = (monaco: Monaco) => {
  const cleanupFns = [
    registerSafeProvider(monaco, ['html'], 'html'),
    registerSafeProvider(monaco, ['css'], 'css'),
  ].filter((cleanup): cleanup is () => void => typeof cleanup === 'function')

  return () => {
    cleanupFns.forEach((cleanup) => cleanup())
  }
}
