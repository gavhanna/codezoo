import { Code, Cpu, FileText } from 'lucide-react'
import type {
  HtmlPreprocessor,
  CssPreprocessor,
  JsPreprocessor,
} from '@/types/preprocessors'

export const EDITOR_PANES = [
  {
    id: 'html',
    label: 'HTML',
    language: 'html',
    icon: FileText,
    accent: 'text-orange-400',
  },
  {
    id: 'css',
    label: 'CSS',
    language: 'css',
    icon: Code,
    accent: 'text-blue-400',
  },
  {
    id: 'js',
    label: 'JavaScript',
    language: 'javascript',
    icon: Cpu,
    accent: 'text-yellow-400',
  },
] as const

export type PaneId = (typeof EDITOR_PANES)[number]['id']
export const MIN_PANE_PERCENT = 10

export const HTML_PREPROCESSOR_OPTIONS: Array<{
  value: HtmlPreprocessor
  label: string
}> = [
  { value: 'none', label: 'None' },
  { value: 'pug', label: 'Pug' },
  { value: 'markdown', label: 'Markdown' },
]

export const CSS_PREPROCESSOR_OPTIONS: Array<{
  value: CssPreprocessor
  label: string
}> = [
  { value: 'none', label: 'None' },
  { value: 'scss', label: 'SCSS' },
  { value: 'less', label: 'Less' },
]

export const JS_PREPROCESSOR_OPTIONS: Array<{
  value: JsPreprocessor
  label: string
}> = [
  { value: 'none', label: 'None' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'babel', label: 'Babel' },
  { value: 'coffeescript', label: 'CoffeeScript' },
]
