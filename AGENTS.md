# Project Working Rules

## Current Scope

- Primary scope is **Brain planning only** until core clinical behavior is validated.
- Spine support is secondary and should not drive architecture or priorities.

## Non-Negotiable Priorities

1. **Tests first for core logic**
   - Core modules must have automated tests (geometry, protocol logic, scoring, validation, state transitions).
   - New core behavior is not complete without tests.

2. **Core correctness before UI/UX**
   - Do not prioritize visual polish while core planning logic is still evolving.
   - UI/UX work should be minimal and functional until core is validated.

3. **Medical accuracy focus**
   - Protocol definitions, parameters, target logic, and feedback behavior must be medically grounded.
   - Prefer explicit, reviewable protocol data over hidden heuristics.

4. **Engineering quality standards**
   - Keep code clean, modular, reusable, extensible, and easy to edit.
   - Separate domain logic from rendering/UI.
   - Avoid large monolithic files and duplicate logic.

## Implementation Style

- Use TypeScript strict typing for domain models.
- Keep business logic in testable modules.
- Keep components thin and focused on composition.
- Preserve backward compatibility in data structures when possible.

## Decision Logging

- All important architecture choices must be recorded in `doc/ARCHITECTURE_DECISIONS.md`.
- All defaults and alternatives (especially easy-to-change UX behavior) must be recorded in `doc/CHOICES_AND_ALTERNATIVES.md`.
- For easy-to-change UI behavior, pick a sensible default and document the other options instead of blocking core progress.

## Core Data Principles

- Prefer typed data registries and pure functions over class-heavy inheritance for protocol modeling.
- Protocol definitions must include explicit parameter specs, scoring/tolerance rules, and reviewable notes.
- Core scoring and validation logic must be deterministic and covered by tests.
