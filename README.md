# Lakebase SME Hub

A responsive frontend for the Emerging EMEA Lakebase field engineering community. **Local demo only:** fictional accounts, demo role switching, simulated Salesforce intake, and browser persistence. No backend, real authentication, Salesforce connection, credentials, or outbound messaging is included.

## Run

Node.js 22.12+ (validated with Node 24), npm.

```sh
npm ci
npm run dev
npm run build
npm run typecheck
npm test
```

### Updating from the original Tailwind version

Download the latest ZIP from GitHub and extract it into a **new folder**, or run `git pull` if you cloned the repository. Then run `npm ci` followed by `npm run dev`. Do not reuse the older ZIP's package manifest or lockfile. Tailwind, its Vite plugin, and `tailwind-merge` have been removed; the layout is implemented in plain CSS. This change removes the dependency that was blocked by the corporate registry; it does not change registry settings or bypass security controls. Other dependencies still require approval by your package registry. If installation fails, resolve that error before running the dev server; a partial install can leave Vite unavailable.

Vite serves on port 5173. Production assets are generated in `dist`. Use `npm run dev -- --port 5174` if necessary. Existing cloud tasks are isolated; use this checkout without creating a worktree.

Browser checks use Playwright and the environment's `/usr/bin/chromium`:

```sh
npx playwright test
```

On another machine install a Playwright browser and remove `executablePath` in `playwright.config.ts`, or point it to your Chromium installation. Browser tests expect the dev server running. Test data is isolated per browser context. Reset demo data is available under Portfolio administration and on storage-load errors; reset asks for confirmation.

## Interface and workflows

- **Overview:** shared filters, portfolio pulse, snapshot comparisons, leadership decisions, SME interventions, distinct-case blocker themes, searchable/sortable portfolio table. Click a row to open the right-side detail pane. Click tiles or themes to filter the table. SME-led and joint coverage are the default; Clear all exposes all coverage.
- **Detail pane:** Summary, Interventions, Blockers, Responses, Activity, Coverage, Commercial and Audit tabs. Includes health rationale, independent movement assessment, milestones, freshness, named ownership and followers.
- **My portfolio:** separate ownership and following tabs; quick assessment, no-change confirmation, original account updates, evidence and help-needed follow-ups.
- **Follow-ups:** shared/personal queues, response reviews, milestones and leadership asks. Record a nudge without completing the task or changing substantive update freshness. Copy reminder drafts without sending them.
- **Leadership asks:** request, urgency, consequence, owner, decision-maker, deadline, comments and status transitions. Every change is retained in the timeline.
- **Coverage:** account defaults with case-level overrides; propose, acknowledge, complete handovers. Completion updates coverage and retains original SME contributions. Demo admins can simulate receiving-owner acknowledgement. In-app assignment/transfer notifications appear under the bell.
- **Administration:** ownership assignment, archive with reason, restore, cadence/stale policy, account defaults, simulated source refresh/failure, audit CSV export and reset. Moving to Tiger Team requires a completed handover before archival for that reason.
- **Intake:** search fictional Salesforce records, preview ownership/stage, mark already tracked/archived records, and select inclusion reason, SME, coverage and cadence. CSV alternative supports file upload/paste, field mapping, quoted values, validation, preview and duplicate checks. Required CSV fields: `salesforceId, account, name, region, stage, ae, sa` (headers may be mapped). Imports are atomic: a duplicate anywhere rejects the entire batch.

The layout prioritises clear hierarchy, grouped controls, readable dense tables, consistent actions and explicit feedback. Radix dialog primitives provide modal semantics, keyboard dismissal, focus containment and focus restoration. Responsive navigation, horizontally scrollable tables, full-width mobile drawers and reduced-motion support are included. Palette tokens can be replaced independently of workflows.

## Architecture

- `src/models.ts`: typed entities, relationships and state. Stable IDs, UTC timestamps, Salesforce ID as unique external key. Account ownership, SME ownership, followers and coverage are distinct fields.
- `src/services/hub.ts`: `HubService`, discriminated `Command` union, query helpers, role checks and mock command handling. Components never read or write localStorage.
- `src/services/index.ts`: composition root; injects browser storage into the mock service. Replace this export with an HTTP implementation of `HubService`.
- `src/services/seed.ts`: deterministic 14-case seed, fictional source catalogue, historical reporting snapshot and role fixtures.
- `src/components/ui`: shadcn/ui-style Button API (CVA, Slot, plain CSS) and accessible Radix-based dialog/drawer primitives, maintained locally.
- `src/App.tsx`: screens, global query state, detail tabs, forms and intake flow.
- `src/styles.css`: responsive layout and appearance using plain CSS and semantic layout classes. There is no Tailwind dependency or CSS-framework build plugin. The locally maintained UI primitives retain their component API; the Tailwind-dependent shadcn CLI configuration has been removed.

The mock stores one versioned database document under `lakebase-sme-demo-v1`. Commands are serialized and committed with a single storage write, with audit entries and user-facing activity produced by the service. A failed command leaves persisted state unchanged. Quota failures surface as errors; no unsaved success is reported. Persistence is browser/origin-local, not cross-device or multi-user. Demo role selection and temporary UI filters do not persist.

## Service contracts for backend replacement

```ts
interface HubService {
  load(): Promise<Database>;
  execute(actor: User, command: Command): Promise<Database>;
  searchSalesforce(query: string): Promise<SourceRecord[]>;
  reset(): Promise<Database>;
  exportAudit(actor: User): Promise<string>;
}
```

`load` returns a complete typed portfolio snapshot; `execute` accepts one validated command and returns the committed state. Errors reject the promise and are shown in forms/toasts. Query logic lives in `selectCases` and `coverageOf`; a production implementation may move this server-side with pagination and filtering. `searchSalesforce` is explicitly fictional in this adapter. `reset` is demo-only and must not expose a destructive production endpoint.

`Command` defines exact payloads for notes, follows, assignment, responses/revisions, assessment, blockers, milestones, interventions, asks, handovers, import, archive/restore, configuration and mock sync. See the exported union for field-level types. Source fields are not editable through assessment commands. Imports supply source-managed fields separately from app-owned inclusion/assignment/coverage.

Backend obligations:

1. Derive the actor from authenticated server identity, **never trust the passed demo actor**. Enforce RBAC and per-case ownership/account assignment on every endpoint; UI visibility is only a convenience. Mock checks run beyond button hiding but provide no real security. Admin manages membership/configuration; SMEs assess cases they own; assigned account contributors submit responses; leaders comment/resolve asks.
2. Persist normalized entities in a relational database with foreign keys, a unique Salesforce UCO key (including archived rows), validation, transactions and concurrency/version checks. The flattened `UseCase` aggregates can remain read models. Account defaults and case overrides have explicit precedence.
3. Generate append-only audit records server-side in the same transaction as mutations. Enforce immutable originals and linked response revisions. Capture actor, time, record, source, before/after; do not accept audit events from clients. Scope the authorized audit export server-side and protect against CSV formula injection.
4. Store response respondent, source, captured-by/time and on-behalf metadata; assessment commands explicitly link a response. Receiving a response does not automatically change health, movement, blockers or milestones. No-change confirmation leaves blocker age intact.
5. Salesforce owns identifiers, source names, stage, AE/SA and commercial source data. Implement a read-only server adapter with server-held credentials. Source refreshes must preserve app-owned data. The mock refresh only changes demo sync metadata; it makes no network calls. Do not represent external issue availability/status as verified without an actual source and checked-at timestamp.
6. Receiving-owner acknowledgement must be verified server-side. Coverage changes and account default changes should notify affected users using durable in-app notification records. No automatic external outreach is implemented.
7. Compute reporting periods from immutable historical records/snapshots. Keep health, assessed movement and substantive account freshness independent. Production schedules should use actual time and the configured cadence; do not use demo reporting constants.

## Demo reporting and known limits

The seed is anchored to **5 November 2026** so overdue state and baseline comparisons are reproducible. Runtime changes use actual UTC timestamps and display dates in the browser's local timezone. The portfolio pulse/table show the current demo state; reporting-period selection chooses a historical comparison baseline. November compares against the October snapshot. October has no September baseline and honestly shows “Baseline being established.” Movement is explicit assessment data, not inferred from replies. Update coverage is the count of substantive November updates against the selected portfolio's monthly update obligations; no-change confirmations are shown separately and are not counted as account responses.

The seed includes healthy advancing/unchanged cases, unknown health with missing updates, shared product blockers, a stalled case with an ask, pending and completed Tiger Team transfers, prior contributions and an archived case. Seed activity is illustrative and is not claimed as verified audit history; audit events begin with changes made in this demo.

Commercial figures are fictional and clearly separated into actuals and estimates. Salesforce record URLs are intentionally unavailable because there is no connected org. External issue status is always “Not verified.” Monthly cadence currently uses day intervals (default 30); exact calendar-month scheduling belongs in the backend. Browser storage can be edited or cleared, so neither audit integrity nor real permission enforcement can be guaranteed here.
