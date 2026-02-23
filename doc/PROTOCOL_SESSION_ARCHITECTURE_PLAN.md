# Protocol Session Persistence, Export, and Evaluation Plan

## Context
- Scope priority: brain planning behavior correctness first.
- Current issue: users lose box/parameter progress when moving between protocols and returning.
- Product need: later export all protocol placements/cube data and evaluate full user performance across selected protocols.

## Root Cause (Current Code)
- Protocol/case switching state lived in hook-local mutable flow without a single deterministic transition path.
- Saves were performed via async state updates while restores could read stale saved maps in the same switch action.
- Case switches always initialized default protocol state, even when a saved snapshot already existed for that protocol.

## Implemented Fix (Now)
- Added deterministic placement session helpers in `src/features/planner/lib/protocolPlacements.ts`.
- Updated `usePlannerState` to:
  - persist current snapshot through pure helper functions before switching,
  - restore from saved snapshot for both `selectProtocol` and `selectCase`,
  - avoid stale reads by deriving restore data from the same computed placement map.
- Added regression tests in `src/features/planner/lib/__tests__/protocolPlacements.test.ts`.

## Target Architecture (Next)
### 1) Domain model for session data
- `ExamSession`
  - `sessionId`
  - `startedAt`, `endedAt`
  - selected case/sub-region metadata
  - selected protocol list order
- `ProtocolAttempt`
  - `caseId`, `protocolId`
  - `status` (`pending|active|completed|skipped`)
  - `startedAt`, `completedAt`, `lastUpdatedAt`
  - `latestPlacement` (box, params, score)
  - `attemptCount`
- `PlacementEvent` (optional but recommended)
  - event type (`move|resize|rotate|param-change|check|reset|activate`)
  - timestamp
  - protocol context
  - before/after payload (sampled or full)

### 2) Source-of-truth boundaries
- Keep rendering components stateless and thin.
- Keep planner domain logic pure (geometry/scoring/validation/session transitions).
- Keep session state orchestration in one place:
  - near term: planner hook + pure placement/session transition helpers.
  - long term: workstation-level session store slice with versioned serialization.

### 3) Export-ready schema
- Introduce versioned export schema:
  - `schemaVersion`
  - `session` metadata
  - `protocolAttempts[]`
  - `aggregateMetrics`
  - optional `events[]` for replay/audit
- Keep export deterministic and complete for all selected protocols, not only active one.

### 4) Persistence strategy
- Stage A: in-memory + explicit export.
- Stage B: localStorage autosave (recover from accidental refresh).
- Stage C: optional backend persistence for multi-device/session analytics.

## Phased Implementation Plan
1. Stabilize session transitions
- Keep all save/restore transitions in pure tested helpers.
- Add a thin adapter for planner/workstation integration.

2. Introduce protocol attempt records
- On protocol activation: ensure attempt record exists.
- On every meaningful interaction: update `latestPlacement` + `lastUpdatedAt`.
- On check/reset: append explicit attempt outcome updates.

3. Build export pipeline
- `exportSession(sessionId)` should include every selected protocol record.
- Include both geometry (`center/size/rotation`) and parameters and score history.
- Add import-safe validation for exported JSON shape.

4. Add performance evaluation layer
- Protocol-level metrics: best score, latest score, completion time, attempts.
- Session-level metrics: completion rate, average component scores, protocol mix coverage.

## Testing Plan (100% Confidence-Oriented)
### A) Unit tests (must-have)
- Placement/session transition helpers:
  - save, restore, overwrite, skip-same-protocol behavior.
  - case switch with default protocol restore.
  - no mutation leaks (deep clone safety).
- Export serializer:
  - schema validation, missing field handling, version tagging.
- Metric aggregation:
  - deterministic outputs for fixed event/attempt fixtures.

### B) Integration tests
- Workstation protocol flow:
  - activate protocol A, edit box/params, switch to B, return to A -> unchanged placement.
  - cross-case protocol switching (cspine/lspine/tspine) restores correctly.
- Reset behavior:
  - `Reset` affects active protocol attempt only, not other saved protocols.
- Check planning:
  - score updates are attached to correct protocol attempt.

### C) UI consistency checks
- Active protocol label and shown box are always aligned.
- No flicker-to-initial-state when revisiting a saved protocol.
- Parameter panel values match restored placement params.

### D) Export verification tests
- Export includes all selected protocols even if not currently active.
- Exported geometry and params match in-memory session records exactly.
- Round-trip parse and validation pass for all generated exports.

## Acceptance Criteria
- Switching protocols never drops prior box/parameter work within a session.
- Returning to any previously touched protocol restores the last user state.
- Session export contains complete per-protocol placement and score data.
- Test suite includes transition + export + aggregation coverage for core flows.
