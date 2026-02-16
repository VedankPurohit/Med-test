# Choices and Alternatives

## Locked defaults
- Protocol model: typed data-first model with pure functions.
- Scoring answer key: primary target plus optional accepted target set.
- Data source policy: public and de-identified images only.
- Product scope: training simulator.
- Reveal behavior default: score first, then allow target review.

## Alternatives kept open
- Protocol model alternative: class-first inheritance hierarchy.
- Scoring alternative: strict single-target only.
- Reveal alternatives: always visible target, attempts-based unlock.
- Validation alternative: schema library (for example Zod) instead of lightweight custom validation.

## Easy-to-change UX defaults
- Reveal strategy should remain config-driven and can change without core data/scoring rewrites.
- Feedback verbosity and phrasing can change without changing score math.
- Parameter panel layout can change without changing protocol/parameter domain contracts.

## Current non-goals
- Clinical planning assistant workflows.
- PHI-containing ingestion and enterprise compliance features.
- Institutional certification/reporting workflows.

