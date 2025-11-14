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
### Frontend
- Vite + React + TypeScript SPA using TanStack Router for routing, TanStack Query for data fetching/cache, and Zod for shared validation.
- Editor surface powered by Monaco (primary choice) with state mirrored to local storage for offline resilience.
- Preview iframe receives compiled payloads through `postMessage`; uses CSP + sandbox attributes.

### Backend API
- Bun runtime + TypeScript, leveraging a lightweight framework such as Elysia/Hono for routing and middleware.
- REST + lightweight WebSocket (Socket.IO or `ws`) endpoint reserved for future collab/live preview events.
- Shared request/response validation via Zod schemas to keep client/server contracts aligned.
- Authentication via argon2 password hashes, session cookies signed w/ JWT secret, optional Redis for session store when scaling.

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
- Single `docker-compose.yml` running: web (static assets), API, Postgres, optional Redis, reverse proxy (Caddy/Traefik) handling TLS.
- `.env.example` enumerates secrets (DB URL, JWT secret, SMTP, S3 buckets) with sane defaults.
- Health checks + readiness probes for each service; log aggregation via stdout + optional Loki/ELK instructions.

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
1. Draft detailed schema for users/pens/revisions (ERD + migration plan).
2. Prototype iframe preview + CSP locally to confirm sandbox strategy.
3. Choose editor component and spike integration inside Vite.
4. Write `docker-compose.yml` skeleton to validate self-host install story.
5. Document the preview sandbox message protocol (event types, payload sizes, CSP expectations) so host/iframe implementations stay in sync.
