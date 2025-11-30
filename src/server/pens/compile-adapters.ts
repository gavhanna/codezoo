import pug from 'pug'
import less from 'less'
import sass from 'sass'
import * as ts from 'typescript'
import CoffeeScript from 'coffeescript'
import { marked } from 'marked'
import * as babel from '@babel/core'
import type {
  CssPreprocessor,
  HtmlPreprocessor,
  JsPreprocessor,
  PreprocessorSelection,
  CompileResult,
  CompileError,
} from '@/types/preprocessors'

type Pane = keyof PreprocessorSelection

const safeError = (pane: Pane, error: unknown): CompileError => {
  if (error instanceof Error) {
    return { pane, message: error.message }
  }
  return { pane, message: 'Unknown compile error' }
}

const compileHtml = async (
  source: string,
  preprocessor: HtmlPreprocessor,
): Promise<{ code: string; error?: CompileError }> => {
  try {
    if (preprocessor === 'pug') {
      const fn = pug.compile(source, {
        doctype: 'html',
      })
      return { code: fn({}) }
    }
    if (preprocessor === 'markdown') {
      const html = marked.parse(source, { gfm: true })
      return { code: typeof html === 'string' ? html : html.toString() }
    }
    return { code: source }
  } catch (error) {
    return { code: '', error: safeError('html', error) }
  }
}

const compileCss = async (
  source: string,
  preprocessor: CssPreprocessor,
): Promise<{ code: string; error?: CompileError }> => {
  try {
    if (preprocessor === 'scss') {
      const result = sass.compileString(source, {
        style: 'expanded',
        sourceMap: false,
        quietDeps: true,
      })
      return { code: result.css }
    }
    if (preprocessor === 'less') {
      const result = await less.render(source, {
        filename: 'input.less',
        math: 'always',
        javascriptEnabled: false,
      })
      return { code: result.css }
    }
    return { code: source }
  } catch (error) {
    return { code: '', error: safeError('css', error) }
  }
}

const compileJs = async (
  source: string,
  preprocessor: JsPreprocessor,
): Promise<{ code: string; error?: CompileError }> => {
  try {
    if (preprocessor === 'typescript') {
      const result = ts.transpileModule(source, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2020,
          jsx: ts.JsxEmit.ReactJSX,
          sourceMap: false,
        },
      })
      return { code: result.outputText }
    }
    if (preprocessor === 'coffeescript') {
      const compiled = CoffeeScript.compile(source, {
        bare: true,
        header: false,
        sourceMap: false,
      })
      return { code: compiled }
    }
    if (preprocessor === 'babel') {
      const result = await babel.transformAsync(source, {
        presets: [['@babel/preset-env', {
          targets: { esmodules: true },
          bugfixes: true,
          modules: false,
        }]],
        sourceMaps: false,
        babelrc: false,
        configFile: false,
      })

      return { code: result?.code ?? '' }
    }
    return { code: source }
  } catch (error) {
    return { code: '', error: safeError('js', error) }
  }
}

export const compilePenSource = async (
  code: { html: string; css: string; js: string },
  preprocessors: PreprocessorSelection,
): Promise<CompileResult> => {
  const errors: CompileError[] = []

  const [htmlResult, cssResult, jsResult] = await Promise.all([
    compileHtml(code.html, preprocessors.html),
    compileCss(code.css, preprocessors.css),
    compileJs(code.js, preprocessors.js),
  ])

  if (htmlResult.error) errors.push(htmlResult.error)
  if (cssResult.error) errors.push(cssResult.error)
  if (jsResult.error) errors.push(jsResult.error)

  return {
    compiledHtml: htmlResult.code,
    compiledCss: cssResult.code,
    compiledJs: jsResult.code,
    errors: errors.length ? errors : undefined,
  }
}
