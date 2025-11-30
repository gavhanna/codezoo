import type { Pen, PenRevision } from '@prisma/client'
import {
  DEFAULT_PREPROCESSORS,
  type PreprocessorSelection,
} from '@/types/preprocessors'

export type EditorRevisionPayload = {
  id: string
  revNumber: number
  kind: string
  html: string
  css: string
  js: string
  updatedAt: string
  preprocessors: PreprocessorSelection
  compiled?: {
    html: string
    css: string
    js: string
  }
}

export type PenEditorPayload = {
  id: string
  title: string
  slug: string | null
  visibility: string
  latestRevision: EditorRevisionPayload
}

const normalizePreprocessors = (
  meta?: unknown,
): PreprocessorSelection => {
  const maybe = (meta as any)?.preprocessors
  if (!maybe || typeof maybe !== 'object') {
    return DEFAULT_PREPROCESSORS
  }

  const normalize = <T extends keyof PreprocessorSelection>(
    key: T,
  ): PreprocessorSelection[T] => {
    const value = maybe[key]
    switch (key) {
      case 'html':
        return value === 'pug' || value === 'markdown' ? value : 'none'
      case 'css':
        return value === 'scss' || value === 'less' ? value : 'none'
      case 'js':
        return value === 'typescript' ||
          value === 'babel' ||
          value === 'coffeescript'
          ? value
          : 'none'
    }
  }

  return {
    html: normalize('html'),
    css: normalize('css'),
    js: normalize('js'),
  }
}

export function serializePenForEditor(
  pen: Pen & { revisions: Array<PenRevision> },
): PenEditorPayload {
  const latestRevision = pen.revisions[0]
  if (!latestRevision) {
    throw new Error('Pen is missing revisions')
  }

  return {
    id: pen.id,
    title: pen.title,
    slug: pen.slug,
    visibility: pen.visibility,
    latestRevision: {
      id: latestRevision.id,
      revNumber: latestRevision.revNumber,
      kind: latestRevision.kind,
      html: latestRevision.html,
      css: latestRevision.css,
      js: latestRevision.js,
      updatedAt: latestRevision.updatedAt.toISOString(),
      preprocessors: normalizePreprocessors(latestRevision.meta),
      compiled: (latestRevision.meta as any)?.compiled,
    },
  }
}
