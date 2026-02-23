# Choices and Alternatives

## Locked defaults
- Protocol model: typed data-first model with pure functions.
- Scoring answer key: primary target plus optional accepted target set.
- Data source policy: public and de-identified images only.
- Product scope: training simulator.
- Reveal behavior default: score first, then allow target review.
- Placement session keying default: deterministic tuple-serialized keys (`JSON.stringify([caseId, protocolId])`) for collision-safe save/restore.
- Contribution export default: ZIP download only (no backend persistence) with a versioned manifest contract.
- Contribution image contract default: exactly three labeled views (`axial`, `sagittal`, `coronal`) are required for export.
- Contribution placement default: every selected protocol must include its own saved placement and params at export time.
- `/createNew` access default (temporary): no auth gate until identity/access control is introduced.

## Alternatives kept open
- Protocol model alternative: class-first inheritance hierarchy.
- Scoring alternative: strict single-target only.
- Reveal alternatives: always visible target, attempts-based unlock.
- Validation alternative: schema library (for example Zod) instead of lightweight custom validation.
- Placement persistence alternative: centralized exam-session store (Zustand slice or backend) with event log, instead of hook-local map plus helper functions.
- Contribution persistence alternative: optional backend draft persistence and review queue before final export.
- Contribution view input alternative: upload-any-three plus manual mapping instead of strict fixed view labels.
- Contribution protocol capture alternative: free-name-only protocol list (without typed parameter specs) for lower-friction intake.

## Easy-to-change UX defaults
- Reveal strategy should remain config-driven and can change without core data/scoring rewrites.
- Feedback verbosity and phrasing can change without changing score math.
- Parameter panel layout can change without changing protocol/parameter domain contracts.
- Protocol completion/activation UX can change without changing placement keying or session data contracts.

## Current non-goals
- Clinical planning assistant workflows.
- PHI-containing ingestion and enterprise compliance features.
- Institutional certification/reporting workflows.
