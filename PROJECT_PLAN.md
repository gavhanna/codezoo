# Codezoo Living Project Plan

## Vision
Create a self-hostable, open-source playground ("CodePen clone") for HTML/CSS/JS pens that prioritizes simplicity, predictable hosting requirements, and a straightforward contributor experience.

## Guiding Principles
1. **MVP first** – ship the smallest usable slice (single-user pens, simple auth, shareable URLs) before tackling collaboration or heavy integrations.
2. **Self-host friendly** – minimize moving parts; every dependency must run via a single `docker-compose` file.
3. **Secure by default** – pens run in sandboxed iframes with strict CSP and origin isolation; no user code ever touches the host runtime.
4. **Extendable** – leave hooks in the data model and architecture for future features (organizations, templates, asset uploads) without rewriting the core.

## MVP Feature Set
### Must-have
- Create/edit/save pens containing HTML, CSS, JS panels (CodeMirror/Monaco-based editors).
- Live preview rendered via sandboxed iframe and `postMessage` updates.
- User authentication (email/password) with secure session cookies.
- Pen listing page with basic metadata (title, tags, updated date) and public share links.
- Revision history per pen (auto-saved versions, manual snapshot/fork).
- Basic settings UI (theme toggle, editor layout) stored per user.

### Nice-to-have (post-MVP)
- OAuth login providers.
- Real-time collaboration primitives via WebSockets (presence, live cursors).
- Built-in preprocessors (SCSS, TypeScript, Babel) behind feature flags/queues.
- Asset uploads (images/fonts) stored in pluggable object storage.
- Template/gallery system and cloning from templates.

## Architecture Overview
### Application Stack
- TanStack Start (React) provides a single codebase for UI + server, leveraging TanStack Router’s file-based routes, loaders, actions, and streaming SSR to keep client/server contracts in one place (per [TanStack Start docs](https://tanstack.com/start/latest/docs/framework/react/guide/execution-model)).
- TanStack Query remains the cache/fetch layer, now wired directly into Start loaders/mutations for fully type-safe data flow.
- Monaco stays the primary editor with local-storage mirroring for offline resilience; components live inside the Start app routes/layouts.
- Preview iframe still receives compiled payloads via `postMessage` but is hosted by a dedicated Start route tree (`/preview/:penId/:hash`) that only runs server functions needed for sandboxing.

### Runtime & Server Functions
- Bun is the runtime/toolchain (per [bun.sh docs](https://bun.sh/docs)) powering the Start dev server, production SSR, package management, and test runner; we use `bun install`, `bun start`, and `bun test` everywhere for consistency.
- Start server functions (loaders, actions, server routes) encapsulate what used to be “backend API” concerns: auth flows, pen CRUD, revision snapshots, and preview orchestration. These handlers run on Bun’s HTTP server, so no separate API container is needed.
- WebSocket-style features (presence, console streaming) can attach to Bun’s native `Bun.serve` upgrade hooks when Phase 3 arrives.
- Shared Zod schemas enforce request/response validation across Start loaders/actions and the preview iframe messaging contract.

### Preview/Compile Worker
- First iteration keeps compilation client-side (in-browser) to avoid server load.
- Future: isolate on the server in worker threads or a sidecar service when preprocessors or SSR features arrive.

### Data Storage
- PostgreSQL for core data (users, pens, revisions, sessions, organizations later).
- S3-compatible bucket optional for assets/backups.
- Knex/Prisma for migrations + type-safe queries.

### Data Model Draft
- `users` – `id UUID PK`, `email CITEXT UNIQUE`, `password_hash`, `display_name`, `role`, `email_verified_at`, `settings JSONB` (theme/layout), timestamps. Future org/plan relationships hang off this table.
- `sessions` – `id UUID PK`, `user_id FK users(id)`, `session_token` (random), `expires_at`, `ip`, `user_agent`, `last_seen_at`; indexed by `session_token` for cookie lookup and `user_id` for revocation.
- `pens` – `id UUID PK`, `owner_id FK users(id)`, `title`, `slug`, `visibility ENUM('private','unlisted','public')`, `forked_from_id FK pens(id)`, `tags_cache TEXT[]`, `preview_hash`, timestamps. Composite index on `(owner_id, updated_at DESC)` feeds dashboards.
- `pen_revisions` – `id UUID PK`, `pen_id FK pens(id)`, `author_id FK users(id)`, `rev_number INT`, `kind ENUM('autosave','snapshot','fork')`, `html TEXT`, `css TEXT`, `js TEXT`, `meta JSONB` (panel layout, external resources), `compiled_hash`, timestamps. Unique `(pen_id, rev_number)` enforces ordering; partial index on latest revision for quick loads.
- `tags` + `pen_tags` – normalized tag catalog (`id SERIAL PK`, `slug`, `label`, counts) plus join table (`pen_id`, `tag_id`, PK composite) so we can evolve into curated galleries without schema churn.
- `user_settings` (optional if not in `users.settings`) – `user_id PK`, `editor_layout JSONB`, `feature_flags JSONB`, `updated_at` to keep per-device overrides.
- `audit_events` (stretch) – append-only log of auth + pen actions for debugging abuse, enabling future org billing/export.
- Revision retention: keep last `N` autosaves per pen (configurable, default 20) plus every manual snapshot/fork forever; nightly job prunes older autosaves and can archive compressed blobs to S3 for long-term storage.
- Text columns use `TEXT` for simplicity now; if bundle sizes grow we can evaluate compressed columns or external storage for large assets.

### Security & Isolation
- Each preview served from a unique origin path (e.g., `/preview/:penId/:hash`) with `sandbox="allow-scripts allow-same-origin"` stripped down as needed.
- Preview iframes never receive `allow-same-origin`, `allow-storage-access-by-user-activation`, or other flags that would expose cookies/localStorage even though the URL shares the parent origin.
- Strict CSP preventing preview iframe from reaching app origin.
- All preview data (HTML/CSS/JS payloads, console output, lifecycle events) flows exclusively through a validated `postMessage` channel described in shared Zod schemas.
- Session cookies remain HttpOnly, `SameSite=Strict`, and previews routes never set auth cookies; CSRF tokens protect any state-changing API call coming from the main app shell.
- Rate limiting on preview/compile endpoints; size/time guards when executing user JS in iframe.

## Deployment & Self-Hosting
- Single `docker-compose.yml` now runs the Bun-powered TanStack Start app (serving SSR + API + preview routes), Postgres, optional Redis, and a reverse proxy (Caddy/Traefik) for TLS + CSP headers.
- `.env.example` enumerates secrets (DB URL, SESSION_SECRET/JWT, SMTP, S3 buckets) plus Start/Bun toggles (`BUN_ENV`, preview retention limits, feature flags) with sane defaults.
- Health checks expose the Start `/healthz` route and database readiness; logs aggregate via stdout with optional Loki/ELK instructions.

## Operational Considerations
- Backups: daily DB dumps + optional S3 sync script documented.
- Monitoring: expose `/healthz` and `/metrics` (Prometheus) endpoints early.
- Upgrade story: versioned migrations with rollback notes; pinned container images.

## Roadmap & Milestones
1. **Phase 0 – Research/Spikes**
   - Validate iframe sandbox strategy and CSP headers.
   - Compare CodeMirror vs Monaco integration complexity.
2. **Phase 1 – MVP Core**
   - Auth, pen CRUD, iframe preview, persistence, Dockerized deploy.
3. **Phase 2 – Quality & Sharing**
   - Revisions/forking UI, tags/search, limited preprocessors.
4. **Phase 3 – Collaboration & Extensions**
   - WebSocket collab, asset uploads, org/team features.

## Risks & Mitigations
- **Security** – malicious JS exfiltration → enforce per-pen sandbox, consider subdomain routing, add content scanning later.
- **Performance** – large previews blocking main thread → offload heavy compilation to worker/worker service, add debounce.
- **Self-host complexity** – too many deps → keep stack small, optional services truly optional.
- **Data growth** – revisions balloon DB size → add cleanup/archival jobs, per-pen retention policies.

## Open Questions & Decisions
- **Decision:** Previews will use path-based routing rather than per-pen subdomains to keep reverse-proxy configuration simple for self-hosters.
- **Decision:** Monaco is the default editor thanks to richer language tooling; evaluate performance trade-offs during Phase 0 spikes.
- **Decision:** MVP ships with no live collaboration features; collaboration remains a Phase 3 goal.
- **Decision:** All pen actions require login; anonymous pens can be revisited once auth + abuse controls mature.

## Next Actions
1. Scaffold the Bun-powered TanStack Start project (`npm create @tanstack/start@latest` or `bun create`) and capture the initial repo structure.
2. Integrate Prisma (schema, migrations, env wiring) into Start server functions for auth + pen CRUD.
3. Prototype the iframe preview route + CSP locally inside Start to confirm the sandbox + `postMessage` flow.
4. Write the unified `docker-compose.yml` (Start app, Postgres, optional Redis, reverse proxy) to validate the self-host story.
5. Document the preview sandbox message protocol (event types, payload sizes, CSP expectations) so host/iframe implementations stay in sync.
