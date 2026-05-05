# MRI Planning Trainer (Next.js + TypeScript)

This project is now a Next.js App Router application with typed domain modules for MRI planning training.

## Tech

- Next.js (App Router)
- React
- TypeScript (strict)

## Run

```bash
npm install
npm run dev
```

Open: `http://localhost:47823`

## Architecture

- `src/features/planner/types/planner.ts`
  - Core types for cases, protocols, localizer sets, box geometry, params, scoring.
- `src/features/planner/data/planner-config.ts`
  - Case/protocol/localizer configuration.
  - Add more brain/spine localizer sets and protocols here.
- `src/features/planner/lib/geometry.ts`
  - Shared 3D geometry, projection, hit-testing, drag math.
- `src/features/planner/lib/scoring.ts`
  - Scoring model and calibration target fallback merge.
- `src/features/planner/lib/storage.ts`
  - Local storage persistence for uploads and calibration targets.
- `src/features/planner/lib/media.ts`
  - Image upload parsing, triptych splitting, JSON export.
- `src/features/planner/hooks/usePlannerState.ts`
  - Main planner state orchestration and actions.
- `src/features/planner/components/PlannerShell.tsx`
  - Feature UI shell.
- `src/features/planner/components/LocalizerCanvas.tsx`
  - Canvas rendering and pointer interaction.

## Supported features (migrated)

- Case selection (`Brain`, `Spine`)
- Protocol selection
- Localizer set selection (extensible)
- 3 synchronized planning views (`Axial`, `Sagittal`, `Coronal`)
- 3D prescription state projected as 2D slab outlines
- Drag interactions in axial/sagittal with shared model update
- Parameter controls:
  - `TR`, `TE`, `FOV`, `Slices`, `Slice Thickness`, `Slice Gap`
- Coverage/angulation controls
- Per-view uploads
- 3-panel screenshot import (`Sag|Cor|Ax` and other orders)
- Instructor calibration mode
- Score evaluation + JSON export
- `/createNew` contribution studio with server-side ZIP export API (`POST /api/v1/contributions/export`)
- Server-side planner scoring API (`POST /api/v1/planner/score`)
- Server-side workstation submission summary API (`POST /api/v1/workstation/submit`)

## Localizer images

Current defaults are served from:

- `public/localizers/brain/default/*.png`
- `public/localizers/spine/default/*.png`

To add more image sets for a case, create additional folders under `public/localizers/<case>/<set-id>/...` and register them in `planner-config.ts`.
