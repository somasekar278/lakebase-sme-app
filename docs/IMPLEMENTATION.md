# Handoff implementation and acceptance notes

The supplied HANDOFF.md is the feature specification. This repository remains a frontend-only fictional demo. It does not access the referenced existing application's backend or copy its real data.

## Feature coverage

| Handoff item | Implementation |
| --- | --- |
| 1. EPL / SME views | EPL: Top 20, Top 10 by BU+2, Migration, All tracked, Archived. SME: owned, Following, Needs an SME, All SME cases. Tiger Team-led/focus accounts are excluded in the query layer for every SME tab, regardless of coverage filters. |
| 2. Ranked lists | Estimated monthly USD × 3 is the quarterly estimate. Top 20 includes all equal values at the cutoff. BU+2 lists take up to ten per group, breaking ties by later U stage, account name, then ID. The rule and source date are visible. |
| 3. Pin / exclude | Admin-only, list-specific, reason required. Overrides are persisted and audited. Pins are added to the computed cut; exclusions stay omitted until explicitly cleared. An excluded-record register allows recovery. Re-rank recomputes list tags and records membership changes. |
| 4. Tags / sets | Computed rank tags, editable app-owned tags (including Migration), editable tracking-set membership, optional intake tracking set, global tracking-set filter. |
| 5. BU hierarchy | Combined cascading BU+1/2/3 filters across portfolio tabs, follow-ups, and coverage register. Account rows display BU+2 and BU+3. Region remains a legacy source field for CSV compatibility, not a portfolio filter. |
| 6. Ranked estimates | Quarterly/monthly USD estimates on ranked tabs only; no spend column elsewhere. Commercial detail retains actual vs estimated, source, currency and date. |
| 7. Checklist | Four configurable items, inline edits, done/total headers, not-done filter, persisted audit. Admins can add a fifth item without code changes. Only admins and the assigned SME can tick a case. |
| 8. Brickroad | Canonical issue links in the table, expanded rows, and blockers. Status remains Not verified unless a source status and recorded-at date exist. |
| 9. Expanded rows | Individual and expand/collapse-all controls. Includes response provenance, open blockers, interventions, recent activity, source next steps and monthly changes. Detail drawer remains for editing. |
| 10. Flags | Coverage, no reply, overdue update, pending review count and pinned-list reasons/tags. |
| 11. Bulk actions | Admin selection of all matching rows; archive, restore, SME assignment, coverage. Atomic validation; one batch ID with per-case audits, activities and in-app notifications. Recent batches appear in administration. |
| 12. Meeting sentences | Scoped coverage, reply cadence, freshness, health, explicit movement, historical changes, distinct blockers/age, checklist, asks, SME load, and unassigned SME work. Links apply table filters. |
| 13. Since last month | Per-case collapsible section, plus expanded-row context. Stage, health, blockers, coverage, SME owner, entered/left Top 20, new membership and archives/restores use stored snapshots. Historical periods compare their stored snapshots; the current period uses current state until a snapshot is taken. Missing baseline is explicit. |
| 14. Meeting mode | EPL-only, read-only presentation; no intake or bulk/ranking controls, disabled checklist writes, every row expanded, larger context typography. |
| 15. Compact pulse | Six compact tiles in one row on desktop, wrapped on smaller screens. |
| 16. Tiger Team scope | Explicit account-level fictional source list with Tiger Team AE and SA contacts. A completed case-level handover may override source coverage. |
| 17. Tiger transfers | Settings/bulk changes redirect to the handover workflow; service rejects direct Tiger Team coverage shortcuts. Archive-for-transfer still requires a completed Tiger Team handover. |
| 18. Timeline types | EPL review, inbound/outbound correspondence with optional HTTPS permalink, source stage change, list change, and existing activity types. |
| 19. Provenance | Tracker summaries are explicitly non-verbatim; Slack DMs require a link, remain awaiting review, and never auto-adjust assessments. Originals/revisions retained. |
| 20. Auto themes | Auto-assigned themes are labelled. Assigned SMEs/admins can review/change a theme; this clears the auto marker and records activity/audit. |
| 21. Source next steps | Read-only source text in Summary and expanded rows. |
| 22. Freshness / loads | Source-as-of vs load time, disconnected notice, failed-load and >7-day stale warning, adapter/status/row count/error load history. |
| 23. People / audit | Email-keyed persistent demo people and roles, active/inactive state, unknown identities treated as viewers by the service. Monthly snapshot action, batch history, CSV audit export for admin and leadership. Real identity/auth enforcement remains backend work. |

## Explicit interpretations

- A seed of 24–30 cases across four BU+2 groups cannot contain ten eligible cases in each group. The seed has **29 cases (28 active, one archived)**, seven active per BU+2; grouped lists show up to ten, never padded records. A service test expands the group to prove the ten-case limit and stage/account tie-breaking.
- The Top 20 seed has a tie at USD 12,000/month (USD 36,000/quarter), producing **21 records**. There are nine active Tiger Team-led records and three non-Tiger cases without an SME owner.
- Pinned records remain in addition to the natural cutoff, so an admin can deliberately produce more than 20/10 records. The ranking rule explains this. Exclusion applies only to that ranked list, not portfolio membership or other lists.
- The reporting selector controls comparisons, not the live portfolio/table. Selecting a historical month compares its snapshot with the prior snapshot; rows not present in that month are explicitly identified. There are September and October snapshots; September has no August baseline. November uses current state until an admin stores its immutable monthly snapshot.
- Simulated re-ranking runs the actual deterministic ranking algorithm over the current fictional source fields. It does not fabricate new Salesforce values or contact an external service.
- Existing version-1 demo data is migrated **without deleting notes, responses, history or assignments**. Legacy rows get unassigned BU metadata; legacy commercial estimates are not re-labelled as USD monthly estimates. Use Reset demo data to opt into the new 29-case seed.

## Validation

`npm run build` is exactly `vite build`, as requested. TypeScript validation is a separate `npm run typecheck` command. Service and browser tests cover both original workflows and handoff acceptance scenarios. Browser tests accept PLAYWRIGHT_BASE_URL for a custom server port.

Package versions explicitly named in the handoff are pinned: tailwindcss 4.3.3, @tailwindcss/vite 4.3.3, lucide-react 0.554.0. AppKit is pinned to 0.90.0 and its published stylesheet dependency tw-animate-css to 1.4.0. These build in this cloud environment; the corporate npm proxy is not accessible here, so approval of additional transitive packages cannot be claimed.
