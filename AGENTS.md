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
