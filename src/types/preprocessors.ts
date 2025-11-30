export type HtmlPreprocessor = 'none' | 'pug' | 'markdown'
export type CssPreprocessor = 'none' | 'scss' | 'less'
export type JsPreprocessor = 'none' | 'typescript' | 'babel' | 'coffeescript'

export type PreprocessorSelection = {
  html: HtmlPreprocessor
  css: CssPreprocessor
  js: JsPreprocessor
}

export const DEFAULT_PREPROCESSORS: PreprocessorSelection = {
  html: 'none',
  css: 'none',
  js: 'none',
}

export type CompileError = {
  pane: keyof PreprocessorSelection
  message: string
}

export type CompileResult = {
  compiledHtml: string
  compiledCss: string
  compiledJs: string
  errors?: CompileError[]
}
