import { Code, Cpu, FileText } from 'lucide-react'

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
