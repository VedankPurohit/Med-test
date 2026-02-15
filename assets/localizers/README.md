# Localizer Image Inputs

The app auto-loads case/view images from these paths if present:

- `assets/localizers/brain/axial.(png|jpg|jpeg|webp|svg)`
- `assets/localizers/brain/sagittal.(png|jpg|jpeg|webp|svg)`
- `assets/localizers/brain/coronal.(png|jpg|jpeg|webp|svg)`
- `assets/localizers/spine/axial.(png|jpg|jpeg|webp|svg)`
- `assets/localizers/spine/sagittal.(png|jpg|jpeg|webp|svg)`
- `assets/localizers/spine/coronal.(png|jpg|jpeg|webp|svg)`

Rules:

1. Uploaded images from the UI override assets for that case/view.
2. "Clear Uploaded Images" restores assets-localizers if available.
3. If no file exists, app falls back to synthetic sketch rendering.

Default MRI localizer images are already provided from open 3D MRI volume sources.
See `assets/localizers/SOURCES.md`.

Recommended real data flow:

1. Export de-identified localizer slices as PNG/JPEG from your DICOM viewer.
2. Save them into the filenames above.
3. Keep consistent orientation labels across all three views.
