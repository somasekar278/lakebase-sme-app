# Lakebase SME Hub: new UI (mock) vs current app (fevm)

Purpose: one render pass that merges the two, so we can iterate in code afterwards.
Mock = github.com/somasekar278/lakebase-sme-app (frontend only, browser storage, fictional data).
Current app = lakebase-sme-hub on fevm-som-workspace (FastAPI + Lakebase, real data, server-side permissions, audit).

## 1. In the current app, missing from the mock (add these)

Views and lists
1. EPL view vs SME view switch. EPL view = every tracked opportunity whoever leads it (tabs: Top 20, Top 10 by BU+2, Migration, All tracked, Archived). SME view = SME work only, Tiger Team-led cases excluded (tabs: My portfolio: owned, Following, Needs an SME, All SME cases). "Needs an SME" = not Tiger Team-led and no SME owner.
2. Ranked lists. Top 20 by Salesforce estimated $ across Emerging EMEA Lakebase use cases at U1-U4, whoever leads them, ties at the cut included (so it can show 21). Top 10 per BU+2, grouped with a header row per BU+2 showing count and how many are Tiger Team-led; ties broken by later stage, then account name. Each ranked tab states its rule and data date.
3. Pin and exclude on ranked lists (admin): pinned cases stay through the monthly re-rank; excluded cases never come back, with a reason shown.
4. List tags per case (Migration, Top 20, BU+2 Top 10, UKI Top 10) and tracking sets (for example "Nov 2026 check-in"); filter by set.
5. Org hierarchy: BU+1, BU+2 and BU+3 filters on every tab (example values: BU+1 Emerging; BU+2 EE UKI, EE Southern, EE Startups, EE Northern; BU+3 EE UKI DNB Flagship Core, EE UKI DNB Scaleups Core, ...). Show BU+2 · BU+3 under the account name. The mock's single "region" filter becomes these.
6. $ column on ranked tabs only: Salesforce estimate per quarter, with per month underneath, labelled as an estimate, not actual spend. No $ on the other tabs.

Table and rows
7. Checklist columns, ticked inline: Account follow-up done, Brickroad filed, PRISM, Validated pipeline. Header shows done/total per column; "Not done: <item>" filter; items are configurable (add a fifth without code changes). Editable by admin and the assigned SME only.
8. Brickroad links: issue IDs link to https://brickster.databricks.com/brickroad/issues/<id> next to the Brickroad checkbox and in blockers; external status shown "as recorded in Salesforce on <date>", else "Not verified".
9. Expand/collapse per row (chevron) showing latest account response, open blockers with Brickroad links, SME interventions, recent activity and Salesforce next steps; "Expand all / Collapse all". The right-side drawer stays for editing.
10. Row flags: No reply on record, Update overdue, N to review, Pinned: <list>, coverage chip.
11. Bulk actions (admin): row checkboxes plus select all matching the filter; Archive (one reason), Restore, Assign SME, Change coverage; each bulk action is one batch with an ID, listed on the admin page. Archiving a whole set and loading a fresh one is the normal monthly reset.

Overview and meeting support
12. "At a glance" strip of plain sentences scoped to the current tab: coverage split; replies within cadence / no reply / overdue; health split; movement since last period (or "baseline being established"); top blocker theme with distinct use-case count and oldest open blocker age; checklist progress; open leadership asks; SME load and how many non-Tiger cases still need an SME. Each sentence filters the table on click.
13. Since last month, per use case: a collapsible list of what changed (stage moves, health changes, blockers opened/resolved, coverage changes, entered/left Top 20, newly tracked, archived). Requires a monthly snapshot that also stores list membership and SME owner.
14. Meeting mode (EPL view): hides editing controls and bulk tools, expands every row, slightly larger type. For the monthly call with leadership.
15. Make the six pulse tiles compact (one row, about a third of their current height) so leadership asks and the table are visible without scrolling.

Coverage and Tiger Team
16. Tiger Team scope comes from a source list (account-level). Cases on Tiger Team focus accounts show Tiger Team-led with the Tiger Team AE/SA as contact, are excluded from SME views and from the "Where SMEs can unblock" cards, but stay in all EPL views.
17. Changing a case to Tiger Team-led through settings is redirected to the handover form; archive with reason "Moved to Tiger Team" is blocked until a handover is complete (the mock already has the archive rule; add the settings redirect).

Timeline content
18. Extra timeline entry types: EPL review (long-form review notes, for example a review shared with a BU+2 leader), Correspondence (in/out check-in messages with Slack link), Salesforce sync (stage changed in Salesforce), List change (entered/left a ranked list).
19. Response provenance: "summary from tracker sheet, not verbatim" vs Slack DM with permalink; responses ingested from Slack are marked "awaiting review" and never change health/movement by themselves.
20. Blocker themes assigned automatically are marked "auto" and can be changed by the SME.
21. Salesforce next steps (source text, read-only) in the drawer and in the expanded row.

Data freshness and admin
22. Header line: "Salesforce fields: snapshot as of <date>, loaded <time>; not a live Salesforce connection", with warnings for a failed load and data older than 7 days. Admin page shows load history (adapter, status, rows, source as of, error).
23. Admin: people and roles (add/update by email: admin, SME, leadership viewer, account contributor, viewer; unknown sign-ins are read-only viewers), take monthly snapshot, recent bulk actions, audit CSV export (admin and leadership only).

## 2. In the mock, missing from the current app (keep these)

1. Left navigation, workspace switcher, breadcrumbs, demo-role switcher (keep the switcher for demos only).
2. Detail as tabs (Summary, Interventions, Blockers, Responses, Activity, Coverage, Commercial, Audit) instead of one long drawer.
3. Add use case flow: search source records, preview, already tracked / archived detection, inclusion reason, SME, coverage, cadence; CSV import with field mapping, validation, preview and atomic duplicate rejection.
4. Reporting period selector.
5. Leadership asks with an explicit "consequence of delay" field; "help needed" creating a follow-up.
6. Commercial tab distinguishing actual spend vs estimate with currency, source and as-of date.
7. Cadence and stale-threshold policy settings; simulated sync failure; reset demo data.
8. Responsive layout, mobile drawer, reduced motion, Radix dialogs with focus management; dismissible notifications under the bell.

## 3. Both have, behave the same (no change)
Health, movement and freshness as separate concepts with rationale; no-change confirmation that does not reset blocker age; responses kept with linked revisions; assessments linked to evidence; follow-ups queue with nudge (does not complete the task or reset freshness) and copyable reminder drafts; handovers propose / acknowledge / complete with continuing role; account coverage defaults with case overrides; followers; leadership asks with status history; append-only audit.

## 4. Brief to paste into the UI generator

Evolve the existing Lakebase SME Hub frontend (this repo). Keep the architecture: models.ts, HubService commands, seed.ts with fictional data only, Radix primitives, no backend, no real names or accounts.

Standardise the look on Databricks:
- Use @databricks/appkit-ui components and theme where they exist (it is shadcn/Radix/Tailwind-based, like this app), and lucide-react 0.554.0 icons as AppKit uses.
- Palette: Navy #1B3139 (primary text, nav), Dark mid #143D4A, Teal #1B5162 (primary actions), Teal muted #618794 (secondary text), Lava #FF3621 (accent and critical only), Green #00A972, Amber #FFAB00, Rose #98102A, Oat background #F5F3F0, Border #C4CCD6, White surfaces. Status colours always paired with text and an icon.
- Pin package versions the Databricks npm proxy allows: tailwindcss and @tailwindcss/vite 4.3.3 (4.3.4 is blocked), lucide-react 0.554.0. The build script must be "vite build" (no tsc step needed). Fix select text clipping in the filter bar.

Add the features in section 1 of HANDOFF.md, in this order of priority: 1, 2, 5, 15, 7, 8, 9, 12, 14, 13, 16, 3, 6, 4, 10, 11, 17-23. Extend the seed: 24-30 fictional cases across four BU+2 groups (EE UKI, EE Southern, EE Startups, EE Northern) with two or three BU+3 values each, about a third Tiger Team-led, Salesforce estimates per month between 2,000 and 50,000 with some ties at the Top 20 cut, a few Brickroad IDs, two months of snapshots so "since last month" has content, and one EPL review note. Keep everything from section 2.

Acceptance: switching EPL/SME changes the tab set and excludes Tiger Team-led cases from SME tabs and cards; Top 20 shows ties and the rule text; BU+2 tab groups exactly 10 per BU+2; BU+1/2/3 filters combine with all others and tile counts always equal the filtered table; checklist ticks persist and show in audit; meeting mode hides edit controls and expands all rows; pinned cases survive a simulated re-rank and excluded ones do not return.
