# MRI Planning Trainer MVP

Simple browser-based core simulator for MRI prescription training.

## What this MVP includes

- Case selection: `Brain` or `Spine`
- 3-view localizer interface: `Axial`, `Sagittal`, `Coronal`
- Protocol selection per case
- Parameter editing: `TR`, `TE`, `FOV`, `Slices`, `Slice Thickness`, `Slice Gap`
- Shared 3D planning box model (`center + size + rx/ry/rz`)
- 3D wireframe projection to each localizer view
- Drag-to-position in 2 views (axial + sagittal), coronal derived automatically
- Scoring feedback (`PASS`/`NOT YET`) from protocol-specific position, coverage, angulation, and parameters
- Localizer image loading from `assets/localizers/<case>/<view>.*`
- Per-view image upload overrides (stored in browser local storage)
- Instructor calibration mode: save/replace target box and parameters per protocol
- Score export to JSON for audit/review

## Run

No build step is required.

1. Open `/Users/vedank/Github/Med test/index.html` in your browser.
2. Select case and protocol.
3. Drag planning box in axial/sagittal.
4. Tune coverage/angles/parameters.
5. Click `Check Planning`.

## Instructor workflow

1. Enable `Instructor mode`.
2. Select case + protocol.
3. Place the box and set parameters to your clinical preference.
4. Click `Save Current As Target`.
5. Ask students to plan against this calibrated target.

Calibrations are stored in browser local storage and applied per `case:protocol`.

## Localizer image sources

For each case/view, the app loads images in this priority:

1. Uploaded image from UI (persisted in browser storage).
2. File from `/Users/vedank/Github/Med test/assets/localizers`.
3. Built-in synthetic sketch fallback.

Default sample image files are already included in `/Users/vedank/Github/Med test/assets/localizers`.
Those defaults are generated from open 3D MRI volumes (see `/Users/vedank/Github/Med test/assets/localizers/SOURCES.md`).

To use your own real localizers, replace those files with de-identified PNG/JPG/WebP/SVG (or upload from the UI).

## Next realistic upgrade path

1. Add DICOM parsing and orientation handling (e.g., Cornerstone + dicom-parser).
2. Add landmarks and target plane definitions from experts.
3. Score with tighter anatomy-aware metrics.
4. Save attempts and track learner progress over time.
