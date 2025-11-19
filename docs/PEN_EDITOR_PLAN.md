# Pen Editor & Viewer Planning Doc

## Goal
Deliver the MVP experience for creating, editing, and viewing Codezoo pens. This should feel cohesive for a single user: landing on a dashboard, opening an editor, seeing live preview updates, persisting revisions, and sharing a read-only viewer route. The plan should derisk the most complex parts (real-time preview, autosave cadence, revision storage) before diving into implementation.

---

## 1. User Journeys & States

| Persona | Goals | Key States |
| --- | --- | --- |
| **Authenticated maker** | Create a new pen, edit code, preview changes, save snapshots, share link | pens listing → editor → preview → save/fork |
| **Viewer (public link)** | Load a pen in read-only mode, inspect current revision, see metadata | `/p/:slug` page, no editing |
| **Future collaborator** | Real-time updates, comments (Phase 3) | Out of scope now but influences data model (revision history) |

### Editor States
1. **Initial load** – fetch pen metadata + latest revision; hydrate Monaco editors (HTML/CSS/JS panels) from server data or localStorage fallback.
2. **Typing** – local panel state updates, schedule preview postMessage updates (250–300ms debounce).
3. **Autosave** – after inactivity threshold (e.g., 3s) create `pen_revisions` row (kind `autosave`) + update `pens.updated_at`. Keep last N autosaves.
4. **Manual snapshot** – user clicks “Save snapshot” to create `pen_revisions` row (kind `snapshot`) with friendly label/tags.
5. **Fork** – from viewer, clone pen + initial revision referencing `forked_from_id`.
6. **Error states** – DB failure, preview compile error, validation issues → show inline banners/toasts.

### Viewer States
1. **Public view** – fetch pen by slug, load chosen revision (latest by default). Render read-only preview + metadata (author, tags, updated at).
2. **Shared snapshot** – route with `?rev=<revNumber>` to pin a revision.
3. **Unavailable** – pen deleted/private → show error with CTA to home.

---

## 2. Architecture Overview

```
┌────────────┐
│ Loader     │ fetch pen + latest revision (SSR)
└────┬───────┘
     │ (serialize)
┌────▼───────┐       ┌────────────┐
│ Editor UI  │◀──────│ preview iframe route (/preview/:penId/:hash)
└────┬───────┘       └────────────┘
     │                          ▲
┌────▼───────────┐  postMessage │
│ Autosave queue │──────────────┘
└────┬───────────┘
     │ mutation (createServerFn)
┌────▼───────────┐
│ Prisma         │ writes pens + revisions
└────────────────┘
```

### Key Modules
1. **Loader** – `createFileRoute('/pens/$penId')` loader fetches pen + latest revision + tag metadata. Requires auth guard.
2. **Editor shell component** – splits layout (Header, panel arrangement). Owns Monaco instances, preview iframe, toolbar.
3. **Preview route** – `/preview/:penId/:revId` or hashed version. Receives compiled HTML/CSS/JS, renders sandboxed iframe, listens to updates.
4. **Server functions**:
   - `saveAutosave` (POST) – accepts HTML/CSS/JS, metadata, rev number, returns new revision + compiled hash.
   - `createPen` – creates `pens` + initial revision.
   - `updatePenMeta` – title, tags, visibility.
   - `forkPen` – clones pen + revision.
5. **Client-side data orchestration** – TanStack Query or Router loaders + `useServerFn` to handle optimistic UI, status indicators, error toasts.

---

## 3. Technical Decisions

### Editor Stack
- **Monaco** – already in plan; integrate with `@monaco-editor/react` for ease.
- **State management** – local `useState` + derived `useRef` for current doc; optional `useReducer` if needed.
- **Autosave strategy**:
  - Use `setTimeout` or `useEffect` with `setTimeout` to schedule autosave after inactivity.
  - Keep unsaved diff flag for UI.
  - On successful save, update loader cache (TanStack Router `router.invalidate` or inline state).

### Preview
- Option A: Inline `iframe` with `srcDoc` generated from combined output. Pros: simple; cons: no sandboxed route.
- Option B (preferred): dedicated route `/preview/:penId/:hash` served via TanStack Start route. Loader produces sanitized HTML/CSS/JS, sets CSP. Editor posts messages to update preview for unsaved changes (client-only). This matches architecture doc.
- Use `postMessage` channel defined in plan; maintain type-safe contract via Zod schema.

### Revisions
- Unique rev numbers per pen (auto-increment server-side).
- Autosave retention: store count in `.env` (e.g., `MAX_AUTOSAVES=20`). Mutation should delete oldest autosave beyond limit.
- Snapshot naming: include `meta` JSON for user-supplied label/tags.
- Provide revision list UI (right sidebar) with ability to restore/fork.

### Permission Model
- Loader requires `context.currentUser` and ensures `pen.ownerId === currentUser.id` unless pen is `public` and viewer route.
- Server functions enforce same check; use shared guard helper.
- Future org support: design with `owner_id` = user for now, but keep pattern that can extend to orgs.

### URL Strategy
- Editor: `/app/p/:penId` (or `/pens/:penId/edit`). Query param `rev` optionally.
- Viewer: `/p/:slug` (public) – default to `slug`, fallback to penId.
- Preview iframe: `/preview/:penId/:revHash` to leverage CSP + caching.

### Storage of External Resources
- `pen_revisions.meta.externalResources`: array of URLs for CSS/JS libraries (loaded in preview). Editor UI needs UI for managing these (maybe MVP skip, but keep DB field).

---

## 4. Task Breakdown

1. **Dashboard & Navigation**
   - `/app` route listing pens with “New Pen” CTA.
   - `createPen` server function: generates slug (slugify title or random), seeds blank revision, redirects to editor.
2. **Editor Shell**
   - Layout with Header, file tabs, preview pane, metadata toolbar.
   - Monaco integration with splitted panes (HTML/CSS/JS).
   - Local state for code + preview state.
3. **Preview Infrastructure**
   - Create `/preview/$penId/$revHash` route; implement loader and CSP headers.
   - Implement postMessage API between editor and iframe.
4. **Autosave & Snapshots**
   - `saveAutosave` server function; client queue handles debounced saves, handles offline fallback.
   - Snapshot button calling `createSnapshot`.
   - UI for revision history (list, restore, fork).
5. **Viewer Route**
   - `/p/$slug` read-only page showing metadata + preview (server-rendered).
   - Share button copying link.
6. **Error & Edge Cases**
   - Handle user leaving editor with unsaved changes (browser confirm).
   - Prevent multiple autosaves in flight (dedupe by generation counter).
   - Display save status (saving, saved, error).
7. **Testing/Instrumentation**
   - Unit tests for server functions (maybe via Vitest).
   - E2E plan (Playwright) later.

---

## 5. Risks & Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Autosave spamming DB | Large `pen_revisions` table | Debounce + retention policy; add background job to prune old autosaves (future). |
| Preview security | XSS / data exfiltration | Strict CSP, sandboxed iframe, sanitized inline content, no `allow-same-origin`. |
| Monaco perf | Slow load for large files | Lazy-load Monaco, support collapse/hide panels, consider dynamic imports. |
| Collaboration later | Re-architect required | Keep revision API generic; store `meta` w/ arbitrary data; consider websockets later. |

---

## 6. Open Questions
1. Should autosave return compiled preview assets or just raw code? (lean toward raw, compile client-side for MVP).
2. How to handle external assets (images, fonts) before asset upload feature? Possibly allow remote URLs only.
3. Revision diffing UI? Out of scope now but plan for data shape (maybe store hashed compiled output for caching).
4. Undo/redo persistence? Monaco handles locally; no server involvement beyond revisions.

---

## 7. Next Steps
1. Finalize route structure (`/app`, `/app/p/:penId`, `/p/:slug`, `/preview/:penId/:hash`).
2. Build `createPen` + dashboard UI (auth-guarded).
3. Scaffold editor route with loader + placeholder layout; integrate Monaco + preview route next.
4. Implement autosave server function + client queue.
5. Flesh out viewer + sharing once editing flow is solid.
