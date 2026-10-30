# Volume Rendering — Temporarily Disconnected

**Status:** Disabled via feature flag
**Date disabled:** 2026-04-30
**Re-enable:** flip `USE_VOLUME_RENDERING = false` → `true` in
[`src/features/workstation/components/workstation/PlanningCanvasPanel.tsx`](../src/features/workstation/components/workstation/PlanningCanvasPanel.tsx)

## What "volume rendering" means here

The workstation has two image-source modes for the sagittal / coronal / axial
panels:

| Mode | Source | Behavior |
|---|---|---|
| **Static localizer (current default)** | PNG files at `public/localizers/{caseId}/{set}/{axial,sagittal,coronal}.png` | Each panel shows one reference image. The planning box is interactive (drag, resize, rotate); the underlying image does not change. |
| **Volume rendering (disabled)** | NIfTI files at `public/volumes/{caseId}/*.nii.gz` | Each panel reformats a slice from a 3D volume on the fly. Scrolling navigates through slices; window/level controls adjust contrast. The image itself updates as the user moves through the volume. |

## Why we kept the volume code but turned it off

**It's cool.** Real-time volume reformatting is the experience a real radiologist
gets at a DICOM workstation. We had it working for all five regions (brain,
cspine, tspine, lspine, knee). It is not garbage code.

**But right now it adds complexity we don't need:**

1. **Implementation guide doesn't require it.** Per Soham's V2 doc, the spec is
   "draggable boxes over reference images" with cursor-mode switching (tilt
   inside / scroll outside the box). Static images satisfy that spec.

2. **Dataset selection is its own rabbit hole.** The brain volume that shipped
   was the MNI152 averaged atlas — anatomically real but visually synthetic
   because it averages hundreds of brains. Replacing it with a real
   single-patient scan (Chris Rorden's T1) was a one-file fix, but the same
   question repeats for every region: which dataset, what license, what
   pathology, what orientation, what resolution. That's a whole work-stream.

3. **Coordinate math compounds.** Volume reformatting requires keeping the
   planning box (in normalized `[-1, 1]` planner space) in sync with the volume
   (in voxel space, which depends on the file's affine matrix and orientation
   code). Bugs here are subtle and not fun to debug under a deadline.

4. **The PNG path is already real clinical data.** Per
   [`public/localizers/SOURCES.md`](../public/localizers/SOURCES.md), the brain
   localizers are from a single real patient (Wikimedia Commons, user 511KeV,
   CC BY-SA 4.0). We aren't degrading the experience by switching back — we're
   using a different real dataset.

## What's still working

Everything except the slice-reformatting itself:

- Box drag, resize, rotate — coordinate-space agnostic, unchanged
- Same-orientation auto-plan (if implemented) — doesn't depend on volumes
- Guidance overlays (`GuidedPlanningOverlay`, `GuidanceFlowOverlays`) — pure 2D
- Survey animation — runs in a phase before the canvas panels mount
- W/L and slice-count UI — hidden cleanly via `{volume && (...)}` guards

## What's hidden when the flag is off

- The slice-count display in the panel header (`{currentSliceIndex + 1}/{maxSlices}`)
- Window/level sliders
- Mouse-scroll → slice navigation
- The "DERIVED" smooth template-y look

## Disconnect implementation

A single feature flag at the top of `PlanningCanvasPanel.tsx`:

```ts
const USE_VOLUME_RENDERING = false;
```

The flag gates one line, the `volumeUrl` resolution:

```ts
const volumeUrl = USE_VOLUME_RENDERING
  ? (bridge.resolved?.caseConfig.volumeUrl ?? null)
  : null;
```

When `volumeUrl` is null, the cascade is automatic:

1. `useVolume(null)` returns `{ volume: null }` immediately
2. `useVolumeSlice(null, ...)` returns `null`
3. `volumeSliceBitmap` is null
4. The `imageSrc` ternary at `PlanningCanvasPanel.tsx:191-192` falls through to
   `planner.getImageSource(viewId)`
5. That returns `localizerSet.views[viewId]` — the PNG URL
6. `LocalizerCanvas` renders the PNG via `<img>` load (it already supports
   both `ImageBitmap` and URL-string sources)

No other files needed changes. All the volume code, hooks, types, and the
NIfTI files in `public/volumes/` are still on disk and untouched.

## To re-enable later

1. Flip the flag in `PlanningCanvasPanel.tsx`.
2. Sanity-check that `public/volumes/{caseId}/*.nii.gz` still exists for the
   case you're testing — those files were not removed.
3. If you swapped to a new dataset, check the orientation code matches the
   slice-extraction assumptions in `src/features/volume/lib/sliceExtractor.ts`
   (axes are assumed RAS+).
4. Reload — volumes will fetch and slices will reformat as before.

## File pointers

| Concern | File |
|---|---|
| The flag | `src/features/workstation/components/workstation/PlanningCanvasPanel.tsx` (top of file) |
| PNG localizer URLs | `src/features/planner/data/planner-config.ts` (`localizerSets[].views`) |
| PNG image sources / licensing | `public/localizers/SOURCES.md` |
| Volume URLs | `src/features/planner/data/planner-config.ts` (`volumeUrl` per case) |
| Volume loader | `src/features/volume/lib/volumeLoader.ts` |
| Slice extractor | `src/features/volume/lib/sliceExtractor.ts` |
| Image-source fallback chain | `src/features/planner/hooks/usePlannerState.ts` (`getImageSource`) |
