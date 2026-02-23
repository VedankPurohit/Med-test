# Plan: Extensible `/createNew` Contribution Studio (ZIP-First Dataset Curation)

## Summary
Build `/createNew` as a dedicated internal curation flow that collects:
- Exactly 3 labeled images (`axial`, `sagittal`, `coronal`)
- Anatomy type (`enum + optional custom text`)
- Selected protocols (existing + custom)
- Per-protocol 2D/3D placement and parameter values
- Export as one versioned ZIP containing correctly named images and a complete manifest

This is better than a simple page because it creates a stable, versioned data contract that won’t break when planner logic evolves.

## Critique of Current Idea
- Good: you already identified the right data sources (images + type + protocol + placement + params + export).
- Gap: without a strict schema/version, future system changes will break old collected data.
- Gap: mixing “supported anatomy” and “unsupported anatomy text fallback” without a normalized contract creates noisy datasets.
- Gap: if protocols are freeform without typed parameter specs, later scoring/modeling will be inconsistent.
- Gap: exporting only UI state without deterministic naming/validation will produce unusable training data.
- Gap: reusing `usePlannerState` directly will block extensibility because it is hard-coupled to fixed `CaseId` and `CASE_MAP`.

## Better Architecture
## 1. New feature module
Create a new module `src/features/contribution/*` (separate from planner/workstation orchestration), while reusing planner rendering/math primitives.

## 2. Keep reusable core, avoid hard coupling
Reuse:
- `LocalizerCanvas`
- geometry/hit-testing helpers
- box render modes (`flat2d`, `cube3d`)
- drag semantics

Do not reuse directly:
- `usePlannerState` fixed case/protocol selection logic
- planner scoring dependency for this flow

Introduce a new hook:
- `useContributionSession` with protocol-agnostic placement state keyed by selected protocol IDs.

## 3. Data contract first (versioned)
Define `ContributionManifestV1` and validate it before export.

Required fields:
- `schemaVersion: 1`
- `createdAt`
- `sourceAppVersion`
- `anatomy`: `{ primaryType, customTypeText? }`
- `views`: required `axial/sagittal/coronal` image metadata
- `protocols`: array of protocol entries
- `placements`: per-protocol placement snapshots
- `exportMeta`: deterministic naming and checksums/sizes

## 4. Protocol model for extensibility
Use a typed protocol entry shape for both existing and custom protocols:
- `id`, `label`, `origin` (`existing|custom`)
- `parameterSpecs` (typed min/max/step/unit)
- `parameterValues`
- optional notes

This preserves compatibility with your data-first protocol architecture and supports future migration into planner configs.

## 5. UI flow in `/createNew`
Implement as a 5-step wizard:
1. `Case Setup`: anatomy enum + optional custom text
2. `Image Upload`: strict 3-view upload + validation
3. `Protocol Setup`: choose existing protocols and add custom protocols
4. `Placement`: per-protocol placement with `LocalizerCanvas` and box mode toggle
5. `Review & Export`: manifest preview, validation summary, ZIP download

Rules:
- `Export` disabled until all required data is valid.
- Per-protocol placement required for all selected protocols.
- Export includes all selected protocols (as requested), not only active one.

## 6. ZIP export format (deterministic)
ZIP root:
- `manifest.json`
- `images/axial.<ext>`
- `images/sagittal.<ext>`
- `images/coronal.<ext>`
- `protocols/<protocol-id>/placement.json` (optional duplicate of manifest slice for easier downstream pipelines)

Naming:
- protocol IDs slugified and collision-safe
- deterministic ordering of arrays/files

## 7. Route and access
- Add `src/app/createNew/page.tsx`
- No auth gate for now (chosen), but code should isolate access policy behind one guard function so auth can be added later without refactor.

## Important API/Type Additions
- `src/features/contribution/types.ts`
  - `ContributionManifestV1`
  - `ContributionAnatomy`
  - `ContributionProtocolEntry`
  - `ContributionPlacement`
  - `ContributionDraft`
- `src/features/contribution/lib/validation.ts`
  - `validateContributionDraft(draft): ValidationIssue[]`
- `src/features/contribution/lib/export.ts`
  - `buildManifest(draft): ContributionManifestV1`
  - `buildContributionZip(manifest, files): Blob`
- `src/features/contribution/hooks/useContributionSession.ts`
  - per-protocol placement/parameter state transitions

## Tests (test-first core logic)
Add tests before UI completion:
- `validation.test.ts`
  - rejects missing views
  - rejects missing custom anatomy text when `primaryType=other`
  - rejects protocols with invalid parameter specs
- `manifest.test.ts`
  - deterministic manifest output and ordering
  - includes all selected protocols
  - schema version and required fields present
- `export.test.ts`
  - ZIP contains expected file paths and names
  - manifest references match included files
- `session.test.ts`
  - per-protocol placement persistence across protocol switching
  - no cross-protocol mutation leaks
  - deep clone safety of placement snapshots

## Documentation Updates (required by project rules)
- `doc/ARCHITECTURE_DECISIONS.md`
  - Add ADR: “Versioned contribution-manifest pipeline for dataset curation”
  - Add ADR: “Protocol-agnostic contribution session state separate from planner runtime”
- `doc/CHOICES_AND_ALTERNATIVES.md`
  - Record defaults: ZIP-only export, fixed 3-view labeled uploads, per-protocol placement required, no-auth temporary access
  - Record alternatives: backend draft persistence, flexible view mapping, partial placement capture

## Acceptance Criteria
- `/createNew` exists and supports full end-to-end flow.
- User can upload exactly three labeled views.
- User can select existing protocols and add custom protocols with typed parameters.
- User can place box/cube per protocol and switch protocols without losing data.
- Export produces one valid ZIP with deterministic filenames and manifest.
- Core contribution logic is covered by automated tests.

## Assumptions and Defaults Chosen
- Brain-only scope is intentionally superseded; this feature captures all anatomy types.
- Internal/admin intent exists, but temporary implementation is ungated until auth is added.
- Export is ZIP-download only (no backend persistence).
- Upload contract is strict fixed labels: `axial`, `sagittal`, `coronal`.
- Per-protocol placement is mandatory, and export always includes all selected protocols.
