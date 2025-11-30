import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireUser } from '@/server/auth/guards'
import {
  DEFAULT_PREPROCESSORS,
  type PreprocessorSelection,
  type CompileResult,
} from '@/types/preprocessors'
import { compilePenSource } from './compile-adapters'

const preprocessorsSchema = z.object({
  html: z.enum(['none', 'pug', 'markdown']).default('none'),
  css: z.enum(['none', 'scss', 'less']).default('none'),
  js: z.enum(['none', 'typescript', 'babel', 'coffeescript']).default('none'),
})

const inputSchema = z.object({
  code: z.object({
    html: z.string(),
    css: z.string(),
    js: z.string(),
  }),
  preprocessors: preprocessorsSchema.optional(),
})

export const compilePen = createServerFn({ method: 'POST' })
  .inputValidator((input: z.infer<typeof inputSchema>) => inputSchema.parse(input))
  .handler(async ({ context, data }) => {
    await requireUser(context)

    const preprocessors: PreprocessorSelection = {
      ...DEFAULT_PREPROCESSORS,
      ...data.preprocessors,
    }

    const result: CompileResult = await compilePenSource(data.code, preprocessors)
    return result
  })
