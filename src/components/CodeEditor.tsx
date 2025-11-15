import React, { useState, useCallback, useEffect } from 'react'
import { Code, Cpu, FileText, Layout } from 'lucide-react'
import {
  SplitPane,
  CodeEditorPane,
  PreviewPane,
  LayoutToggle
} from './SplitPane'

interface CodeEditorProps {
  initialHtml?: string
  initialCss?: string
  initialJs?: string
  onCodeChange?: (code: { html: string; css: string; js: string }) => void
  className?: string
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  initialHtml = `<div class="container">
  <h1>Hello World!</h1>
  <p>Welcome to CodeZoo Pen Editor</p>
  <button id="clickMe">Click Me!</button>
</div>`,
  initialCss = `body {
  font-family: 'Arial', sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  margin: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.container {
  text-align: center;
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
}

h1 {
  color: #333;
  margin-bottom: 1rem;
}

p {
  color: #666;
  margin-bottom: 1.5rem;
}

button {
  background: #667eea;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
}

button:hover {
  background: #5a6fd8;
  transform: translateY(-2px);
}`,
  initialJs = `document.getElementById('clickMe').addEventListener('click', function() {
  alert('Hello from CodeZoo! 🚀');

  // Animate the button
  this.style.transform = 'scale(0.95)';
  setTimeout(() => {
    this.style.transform = 'scale(1)';
  }, 200);
});`,
  onCodeChange,
  className = ''
}) => {
  const [html, setHtml] = useState(initialHtml)
  const [css, setCss] = useState(initialCss)
  const [js, setJs] = useState(initialJs)
  const [layout, setLayout] = useState<'horizontal' | 'vertical'>('horizontal')
  const [leftPaneSize, setLeftPaneSize] = useState(50)
  const [activeEditor, setActiveEditor] = useState<'html' | 'css' | 'js'>('html')
  const [htmlEditorVersion, setHtmlEditorVersion] = useState(0)
  const [cssEditorVersion, setCssEditorVersion] = useState(0)
  const [jsEditorVersion, setJsEditorVersion] = useState(0)
  const [previewCode, setPreviewCode] = useState({
    html: initialHtml,
    css: initialCss,
    js: initialJs,
  })

  const debounceDelay = 350

  useEffect(() => {
    setHtml(initialHtml)
    setHtmlEditorVersion((version) => version + 1)
  }, [initialHtml])

  useEffect(() => {
    setCss(initialCss)
    setCssEditorVersion((version) => version + 1)
  }, [initialCss])

  useEffect(() => {
    setJs(initialJs)
    setJsEditorVersion((version) => version + 1)
  }, [initialJs])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const nextCode = { html, css, js }
      setPreviewCode(nextCode)
      onCodeChange?.(nextCode)
    }, debounceDelay)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [html, css, js, onCodeChange, debounceDelay])

  const handleCodeChange = useCallback((
    type: 'html' | 'css' | 'js',
    value: string
  ) => {
    let newHtml = html
    let newCss = css
    let newJs = js

    switch (type) {
      case 'html':
        setHtml(value)
        newHtml = value
        break
      case 'css':
        setCss(value)
        newCss = value
        break
      case 'js':
        setJs(value)
        newJs = value
        break
    }

    onCodeChange?.({
      html: newHtml,
      css: newCss,
      js: newJs
    })
  }, [html, css, js, onCodeChange])

  const toggleLayout = useCallback(() => {
    setLayout(prev => prev === 'horizontal' ? 'vertical' : 'horizontal')
  }, [])

  const toggleLeftRight = useCallback(() => {
    setLeftPaneSize(prev => {
      // Swap left and right pane sizes
      return 100 - prev
    })
  }, [])

  const editorPanel = (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <div className="bg-slate-800 px-4 py-3 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <LayoutToggle layout={layout} onToggle={toggleLayout} />
              <button
                onClick={toggleLeftRight}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                title="Swap editor and preview panels"
              >
                <Layout className="w-4 h-4 text-gray-300 rotate-90" />
              </button>
            </div>
            <div className="h-6 w-px bg-slate-600" />
            <div className="flex gap-2">
              <button
                onClick={() => setActiveEditor('html')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeEditor === 'html'
                    ? 'bg-cyan-500 text-black'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                HTML
              </button>
              <button
                onClick={() => setActiveEditor('css')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeEditor === 'css'
                    ? 'bg-cyan-500 text-black'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                <Code className="w-4 h-4 inline mr-2" />
                CSS
              </button>
              <button
                onClick={() => setActiveEditor('js')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeEditor === 'js'
                    ? 'bg-cyan-500 text-black'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                <Cpu className="w-4 h-4 inline mr-2" />
                JavaScript
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        {layout === 'horizontal' ? (
          <div className="h-full w-full flex flex-col overflow-hidden">
            {activeEditor === 'html' && (
              <div className="flex-1 min-h-0 overflow-hidden">
                <CodeEditorPane
                  title="HTML"
                  language="html"
                  value={html}
                  onChange={(value) => handleCodeChange('html', value)}
                  icon={<FileText className="w-4 h-4 text-orange-400" />}
                  editorKey={`html-${htmlEditorVersion}`}
                />
              </div>
            )}
            {activeEditor === 'css' && (
              <div className="flex-1 min-h-0 overflow-hidden">
                <CodeEditorPane
                  title="CSS"
                  language="css"
                  value={css}
                  onChange={(value) => handleCodeChange('css', value)}
                  icon={<Code className="w-4 h-4 text-blue-400" />}
                  editorKey={`css-${cssEditorVersion}`}
                />
              </div>
            )}
            {activeEditor === 'js' && (
              <div className="flex-1 min-h-0 overflow-hidden">
                <CodeEditorPane
                  title="JavaScript"
                  language="javascript"
                  value={js}
                  onChange={(value) => handleCodeChange('js', value)}
                  icon={<Cpu className="w-4 h-4 text-yellow-400" />}
                  editorKey={`js-${jsEditorVersion}`}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="h-full w-full overflow-hidden">
            <CodeEditorPane
              title={activeEditor.toUpperCase()}
              language={activeEditor}
              value={activeEditor === 'html' ? html : activeEditor === 'css' ? css : js}
              onChange={(value) => handleCodeChange(activeEditor, value)}
              icon={
                activeEditor === 'html' ? (
                  <FileText className="w-4 h-4 text-orange-400" />
                ) : activeEditor === 'css' ? (
                  <Code className="w-4 h-4 text-blue-400" />
                ) : (
                  <Cpu className="w-4 h-4 text-yellow-400" />
                )
              }
              editorKey={
                activeEditor === 'html'
                  ? `html-${htmlEditorVersion}`
                  : activeEditor === 'css'
                    ? `css-${cssEditorVersion}`
                    : `js-${jsEditorVersion}`
              }
            />
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className={`h-full w-full overflow-hidden ${className}`}>
      <SplitPane
        left={editorPanel}
        right={<PreviewPane html={previewCode.html} css={previewCode.css} js={previewCode.js} />}
        defaultLeftSize={leftPaneSize}
        split={layout}
      />
    </div>
  )
}

export default CodeEditor
