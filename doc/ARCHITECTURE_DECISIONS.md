# Architecture Decisions

## ADR-001: Data-first protocol model
- Status: Accepted
- Decision: Model protocols as typed data (`ProtocolConfig`) plus pure functions for scoring, validation, and projection.
- Why: Lower code volume, easier testability, and easier scaling to many anatomies/protocols than class-per-protocol inheritance.
- Consequence: New protocols should be mostly data additions; shared behavior remains in domain/lib modules.

## ADR-002: Extensible parameter engine
- Status: Accepted
- Decision: Replace fixed hard-coded parameter scoring with `parameterSpecs` per protocol and dynamic `params` maps.
- Why: Supports sequence-specific parameters (for example `TI`, `bValue`) without changing core scorer code.
- Consequence: UI reads parameter controls from protocol specs; validation enforces spec/target consistency.

## ADR-003: Multi-target correctness
- Status: Accepted
- Decision: Allow `acceptedTargets` on protocols and score attempts against the best matching valid target.
- Why: MRI planning can have multiple acceptable placements/angles for a single protocol.
- Consequence: Scores now report matched target index/kind for auditability.

## ADR-004: Consensus-ready annotation model
- Status: Accepted
- Decision: Add expert annotation and consensus target domain types and consensus derivation utility.
- Why: Medical correctness should be grounded in expert-reviewed annotations, not fixed hardcoded assumptions.
- Consequence: Dataset curation workflows can produce robust targets and tolerances from multiple raters.

## ADR-005: Product safety scope (v1)
- Status: Accepted
- Decision: Position app as training simulator only and use de-identified/publicly licensed data.
- Why: Reduces legal/compliance risk while enabling fast educational validation cycles.
- Consequence: No clinical decision support claims in current product scope.

## ADR-006: Deterministic protocol placement session state
- Status: Accepted
- Decision: Keep protocol placement progress in a deterministic, case+protocol keyed placement map with pure save/restore helpers (`protocolPlacements.ts`) and drive protocol/case switching from that map.
- Why: Hook-local ad hoc saves could read stale state during protocol switches and case switches could reinitialize default protocols instead of restoring prior work.
- Consequence: Switching protocols/cases now restores prior placement consistently, and the placement map is now a stable foundation for future export/session analytics features.

## ADR-007: Versioned contribution manifest pipeline
- Status: Accepted
- Decision: Add a dedicated contribution domain with a versioned export contract (`ContributionManifestV1`) and deterministic ZIP packaging for uploaded views, protocol metadata, per-protocol placement, and parameter values.
- Why: Dataset curation inputs must remain stable across product iterations, and ad hoc UI-state exports are brittle and hard to validate downstream.
- Consequence: Contribution exports can be validated and consumed reliably by future tooling, and schema migrations can be explicit via versioned manifest evolution.

## ADR-008: Protocol-agnostic contribution placement session
- Status: Accepted
- Decision: Keep `/createNew` placement state in a protocol-agnostic session helper (`useContributionSession` + pure session utilities) instead of coupling to case-bound planner orchestration.
- Why: Contribution workflows must support existing and custom protocols across arbitrary anatomy labels while preserving deterministic per-protocol save/restore behavior.
- Consequence: Contribution capture can evolve independently from workstation runtime flow, while still reusing planner canvas/geometry primitives.

## ADR-009: Server-side contribution export boundary
- Status: Accepted
- Decision: Move `/createNew` ZIP generation behind a server API (`POST /api/v1/contributions/export`) with multipart parsing, payload/file validation, PHI attestation gate, and basic request rate limiting.
- Why: Client-only export made validation and packaging logic fully inspectable and harder to control for abuse/compliance in public testing.
- Consequence: Browser UI remains for data entry/placement, while export contract enforcement and ZIP generation run server-side under a versioned API.

## ADR-010: Server-owned scoring and submission summary responses
- Status: Accepted
- Decision: Move planner score evaluation and workstation submission summary generation behind server APIs (`POST /api/v1/planner/score`, `POST /api/v1/workstation/submit`) and consume those responses from UI.
- Why: Keeping scoring/submission purely client-side made behavior harder to control and evolve consistently for public deployment.
- Consequence: UI still manages interaction state, but score/reveal policy and summary computation are now enforced by server endpoints.

## ADR-011: Brain sequence-specific parameter schemas
- Status: Accepted
- Decision: Brain protocols use protocol-specific editable/scored parameter specs instead of the full advanced parameter catalog for every sequence.
- Why: Real MRI setup surfaces differ by sequence family. Routine T1 SE should not teach or score unrelated controls such as `ETL`, DWI should expose `bValue` and high-bandwidth EPI controls rather than TSE-only controls, FLAIR should expose `TI`, and computed values such as scan time should stay derived UI output.
- Consequence: Protocol target params must match the protocol's parameter specs exactly. Sequence-specific additions remain data-driven through `parameterSpecs`, while the UI computes scan time from the active params without storing or scoring `ScanTime`.
