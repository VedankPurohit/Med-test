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
