# Lakebase SME Hub

A responsive, fictional frontend for coordinating Emerging EMEA Lakebase opportunities. **Demo data only.** Demo role switching is not real authentication. Salesforce, Slack and Brickroad are not connected; no messages are sent. Backend integration remains separate.

## Run locally

Use Node.js 22.12+ (validated with Node 24) and npm. Download the **latest** GitHub ZIP into a new folder, or pull the repository; do not reuse an older ZIP's package files.

```sh
npm ci
npm run dev
```

Open the local address printed by Vite, normally port 5173. If occupied, Vite selects another port; specify `npm run dev -- --port 5175 --strictPort` for an explicit port.

```sh
npm run build       # exactly vite build; writes dist/
npm run typecheck   # separate TypeScript check
npm test            # service and domain tests
npm run test:e2e    # browser workflows; requires a running dev server
```

The handoff identifies **Tailwind 4.3.3** as approved and 4.3.4 as blocked. Both Tailwind and its Vite plugin are pinned to 4.3.3; Lucide is pinned to 0.554.0. AppKit UI is pinned to 0.90.0. This replaces the earlier plain-CSS-only workaround with the handoff's version-specific configuration. Registry settings, TLS verification and company security controls are not changed. If npm reports another security-policy denial, resolve that package with your registry team; running the dev server after a failed install can leave Vite unavailable.

Playwright uses `/usr/bin/chromium` in this environment. On another machine, point `executablePath` in `playwright.config.ts` to your Chromium or remove it and install Playwright's browser. Override the test server with `PLAYWRIGHT_BASE_URL=http://127.0.0.1:5175 npm run test:e2e` when needed.

Cloud tasks are already isolated. Use the existing `/workspace/lakebase-sme-app` checkout; do not create a worktree unless explicitly requested.

## What to try

- **EPL view:** Top 20 (21 cases because the cutoff ties), Top 10 by BU+2 group headers, Migration, all tracked and archived tabs. Ranking rule, source date and estimated quarterly/monthly USD are visible on ranked tabs only.
- **SME view:** owned, following, needs an SME, all SME cases. Tiger Team focus accounts and Tiger Team-led cases are excluded from all SME tabs and intervention cards, even if other filters are cleared.
- Combine BU+1/2/3 filters with SME, AE/SA, stage, coverage, health, movement, blocker theme, tracking set, not-done checklist and search. Pulse/summary links filter the same table and its counts.
- Tick checklist items inline as the assigned SME/admin. Header counts and audit update. Expand rows for context; use the case title or row to open the tabbed detail drawer. The chevron and inline controls have separate actions.
- Switch to demo admin to pin/exclude records with reasons, simulate a re-rank, run bulk actions and inspect batch IDs. Excluded records remain recoverable in the ranked-list register.
- Try **Meeting mode** in EPL: read-only controls, expanded context and larger typography. Compact pulse tiles leave room for leadership decisions.
- Open **Since last month** for real snapshot-derived differences. Select September to see an honest missing-baseline state; select October to compare two historical snapshots.
- Detail tabs retain Summary, Interventions, Blockers, Responses, Activity, Coverage, Commercial and Audit. Original responses and corrections remain distinct. Reviewing a response explicitly links evidence to assessment changes. A reply alone never changes health or movement.
- Add notes, long-form EPL reviews or correspondence, review auto blocker themes, create leadership asks with a consequence of delay, and manage tags/tracking sets.
- Propose/acknowledge/complete coverage handovers. Tiger Team transfers cannot skip acknowledgement via coverage settings or bulk actions. Prior contributions remain visible.
- Follow-ups support personal/shared queues, recorded nudges and copyable drafts without sending messages. A nudge does not complete the task or refresh the substantive account update date.
- Intake searches fictional source records, previews them and prevents duplicate Salesforce IDs including archived cases. CSV upload/paste supports mapping, validation, preview and atomic rejection. Imports open the All use cases view so lower-ranked new records remain discoverable.
- Administration includes demo people/roles, active state, monthly immutable snapshots, configurable checklist items, cadence/stale policy, source load history, batch history, archive/restore and authorized audit export. Reset demo data requires confirmation.

[Detailed handoff coverage and interpretations](docs/IMPLEMENTATION.md) map all 23 items. [The supplied handoff](docs/HANDOFF.md) is retained for review.

## Architecture

- `src/models.ts`: typed users/roles, use-case aggregates, responses/revisions, blockers, asks, follow-ups, handovers, activities/audit, BU hierarchy, checklists, overrides, load runs, batches and reporting snapshots.
- `src/services/hub.ts`: `HubService`, discriminated commands, service-level demo authorization, atomic mock mutation and persistence. Writes serialize through a queue; failed validation writes nothing.
- `src/services/workspace.ts`: shared ranking, source-aware coverage, filter predicates, view scoping, snapshot capture and historical diffs. Components do not implement competing business rules.
- `src/services/seed.ts`: 29 fictional cases, four BU+2 groups with BU+3 subdivisions, nine active Tiger Team cases, the Top 20 tie, two historical months and illustrative activity.
- `src/services/index.ts`: composition root, the only application file that accesses browser localStorage. Injects storage into the mock adapter.
- `src/components/PortfolioWorkspace.tsx`: EPL/SME tabs, compact pulse, summary sentences, attention cards, table, expansion, meeting and bulk/ranking dialogs.
- `src/components/AdminTools.tsx`: people/roles, checklist config, snapshots, source loads and batch history.
- `src/App.tsx`: navigation, global filters, detail pane, forms and intake. UI primitives use AppKit Button/Badge/Tabs/Input/Textarea with the AppKit theme, Lucide icons and Radix accessible dialogs. Semantic CSS controls the responsive layout and Databricks palette.

Demo data uses `lakebase-sme-demo-v1` as a stable storage key and database schema version 2. Version 1 is migrated without losing user changes. Reset is the explicit opt-in to replace existing data with the richer seed. Data is local to the browser/origin; UI filters and demo identity selection are temporary.

## Backend service contract

```ts
interface HubService {
  load(): Promise<Database>;
  execute(actor: User, command: Command): Promise<Database>;
  searchSalesforce(query: string): Promise<SourceRecord[]>;
  reset(): Promise<Database>;
  exportAudit(actor: User): Promise<string>;
}
```

Replace the implementation exported by `src/services/index.ts` with an HTTP adapter. `load` returns the portfolio read model; `execute` returns committed state or rejects with a validation/permission error. `Command` in `hub.ts` defines exact payloads for existing workflows and checklist, membership, ranking override/re-rank, snapshot, timeline, people, batch and notification operations. `reset` is demo-only and must not become an unprotected production endpoint.

Required production responsibilities:

1. **Identity and RBAC:** derive the actor from server identity, never trust the demo actor payload. Resolve people by stable user IDs/email through the real platform. Unknown sign-ins are viewers. Check permissions per command and record; validate ownership and receiving-owner identity. Demo checks live beyond button visibility but are not security against browser modification.
2. **Relational persistence and concurrency:** normalize entities, enforce foreign keys/unique Salesforce IDs across archived and active cases, and use transactions/version checks. Treat flattened use cases as read models. Batch operations must validate every target before one transaction commits.
3. **Audit integrity:** generate immutable audit events server-side alongside mutations with before/after, actor, UTC time, source and batch ID. Preserve original responses and linked revisions. Keep user-authored activity separate. Audit export is admin/leadership only; CSV escaping/formula protection is included in the mock export but authorization must be server-side.
4. **Source boundaries:** Salesforce owns IDs, source names, stage, AE/SA, next steps and estimates. Refresh those fields without changing app-owned data. Use a read-only server adapter, server-held credentials, source-as-of/load metadata and durable integration history. No Salesforce write-back. Source-provided Tiger Team account scope must have explicit precedence over ordinary overrides, with audited completed handovers as exceptions.
5. **Reporting and ranking:** snapshot stage, health, blocker IDs, coverage, SME owner, archive state and list membership. Preserve historical snapshots. Rank comparable Salesforce estimates with documented units/currency; never compare currencies without a declared conversion. Do not infer movement from a reply. Production schedules need actual calendar rules rather than the demo's 30-day default.
6. **Responses and external evidence:** retain respondent/source/captured-by/on-behalf/provenance metadata. Slack ingests must await SME review. A tracker summary is not a verbatim quote. External issue status stays unverified unless an authoritative source/date exists. Real source ingestion will create source stage/list-change events, rather than relying on illustrative seed activity.
7. **Notifications and handovers:** durable in-app notifications for affected owners, verified receiving-owner acknowledgement, continuing role/exit and retained contribution history. External outreach is never automatic.

## Demo limits

The reporting anchor is **5 November 2026** for deterministic cadence and overdue examples. Runtime writes use actual UTC timestamps, displayed in the browser timezone. Historical snapshots freeze stored state; the current table always shows current records. A selected reporting period controls the comparison, not restoration of past editable data.

Quarterly ranked estimates are explicitly monthly USD estimates × 3, not actual spend. Legacy estimates without monthly USD provenance remain unavailable in ranked views and stay available in Commercial with their original currency. Missing source values are never fabricated. Source-managed next steps are read-only. Brickroad links point to illustrative IDs and do not claim verified issue state.

The source catalogue, CSV adapter, synchronization, people/roles and notifications are all simulated. The package versions named in the handoff are pinned and validated here; this environment cannot verify approval of AppKit's additional transitive packages on the corporate proxy. Browser storage is editable, so neither authentication nor real audit integrity is provided. No backend or external integration has been provisioned.
