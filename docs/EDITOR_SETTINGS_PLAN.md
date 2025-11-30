# Editor Settings Dialog Plan

## Goal
- Add a settings dialog to the editor page that lets users pick per-pane preprocessors (HTML, CSS, JS) similar to CodePen and routes the preview through server-side compilation while preserving original source text.

## Scope (MVP)
- UI: Settings button on the editor header opens a dialog with selects per pane, reset to none, and inline error/state display (per-pane error pill, top-level message). Close/save should not block; changes apply immediately.
- Persistence: Store selected preprocessors in `PenRevision.meta.preprocessors`; keep raw `html/css/js` as the saved source; compiled is transient (optional cache in `meta.compiled`).
- Preview: Debounced server-side compile on code or preprocessor change; show last good output on errors; don’t swap in broken output.
- Autosave: Include preprocessor selections in autosave payloads so a reload restores state; avoid extra revisions for transient compile errors.

## Data/Schema
- Use existing `PenRevision.meta` JSON; shape: `{ preprocessors: { html: 'none' | 'pug' | 'markdown', css: 'none' | 'scss' | 'less', js: 'none' | 'typescript' | 'babel' | 'coffeescript' }, compiled?: { html: string; css: string; js: string } }`.
- Default preprocessors to `'none'` for new revisions; backfill in serialization if missing.
- Regenerate Prisma client after schema/default adjustments (no migration concerns now).

## Backend API
- Extend `save-pen-revision` input to accept `preprocessors` and optional `compiled` blobs; persist preprocessors in `meta`. Validate with zod enums.
- Add `compile-pen` server fn (POST) that accepts `{ code: { html, css, js }, preprocessors }`, uses auth context, runs adapters, and returns `{ compiledHtml, compiledCss, compiledJs, errors?: CompileError[] }`.
- Consider small hash-based cache (input hash -> result) to cut latency; guard with timeout and safe options (no fs/network). Cache key: hash(preprocessors + code).
- Update `serializePenForEditor` to include `meta.preprocessors` (fallback to none) and optionally `meta.compiled`.
- Enforce limits: max input size per pane, timeout per compile call, strip source maps.

## Compiler Adapters
- HTML: none/passthrough; pug; markdown-to-HTML (sanitize? keep basic).
- CSS: none; SCSS (dart-sass); Less.
- JS: none; TypeScript (ts.transpile or esbuild); Babel preset-env light; CoffeeScript.
- Normalize outputs, strip source maps, return structured errors `{ pane, message }` without stack leakage.

## Frontend
- Dialog component: reusable modal; within editor header add “Settings” button; show selects per pane + reset; show latest compile error badges. Keyboard accessible (Esc, focus trap).
- State: keep `source` refs per pane; track `preprocessors` state; debounce to call `compile-pen`; update preview with compiled output while editors show source. Keep “last good” compiled snapshot.
- Monaco: change `language` per selection and remount editors when preprocessor changes; retain content. Map: html->pug/markdown, css->scss/less, js->typescript/javascript.
- Autosave: include `preprocessors` in payload; on load, initialize editors and preview with stored preprocessors and latest compiled output if present. Don’t autosave while a compile is in-flight—coalesce when it finishes.
- Error UI: per-pane error badge in dialog and header mini pill (optional); tooltip with message; keep “Compile failed” banner near preview if desired.

## Preview Flow
- On source/preprocessor change -> debounce -> call `compile-pen`.
- If success: set compiled output for preview, clear error.
- If error: keep last good compiled output, surface error in dialog/header.

## Testing
- Unit tests for compiler adapters (happy/error).
- API tests for `compile-pen` handler (auth, validation, errors).
- Serialization test ensures preprocessors default to none when missing.
- Component test: selecting a preprocessor triggers preview language swap and uses compiled output.
