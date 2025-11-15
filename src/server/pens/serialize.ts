import type { Pen, PenRevision } from '@prisma/client'

export type EditorRevisionPayload = {
  id: string
  revNumber: number
  kind: string
  html: string
  css: string
  js: string
  updatedAt: string
}

export type PenEditorPayload = {
  id: string
  title: string
  slug: string | null
  visibility: string
  latestRevision: EditorRevisionPayload
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
    },
  }
}
