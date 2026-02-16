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

