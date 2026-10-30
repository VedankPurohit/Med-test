#!/usr/bin/env python3
"""
Download real MRI NIfTI volumes and extract localizer slices for all supported regions.

Sources (all freely licensed):
  - Brain T2:       Chris Rorden, niivue-images (CC BY-NC 4.0)
  - C-Spine T2:     Spinal Cord Toolbox example data (MIT)
  - Spine T2w:      OpenNeuro ds004507 (CC0) — covers cervical-to-thoracic
  - Knee T2 cor:    Zenodo 4563667 (CC BY 4.0)

For T-Spine and L-Spine, we reuse the spine volume and adjust slice positions.
"""

import os
import sys
import urllib.request
import tempfile

import nibabel as nib
import numpy as np
from PIL import Image

BASE_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "localizers")
VOLUME_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "volumes")

SOURCES = {
    "brain": {
        "url": "https://raw.githubusercontent.com/neurolabusc/niivue-images/main/chris_t2.nii.gz",
        "desc": "Brain T2 (Chris Rorden)",
    },
    "cspine": {
        "url": "https://raw.githubusercontent.com/spinalcordtoolbox/sct_example_data/master/t2/t2.nii.gz",
        "desc": "Cervical Spine T2 (SCT example)",
    },
    "spine_full": {
        "url": "https://s3.amazonaws.com/openneuro.org/ds004507/sub-002/ses-headNormal/anat/sub-002_ses-headNormal_T2w.nii.gz",
        "desc": "Full Spine T2w (OpenNeuro ds004507, CC0)",
    },
    "knee": {
        "url": "https://zenodo.org/api/records/4563667/files/4_t2_tse_cor65slice_2avg.nii.gz/content",
        "desc": "Knee T2 TSE Coronal (Zenodo, CC BY 4.0)",
    },
}


def download(url: str, dest: str):
    if os.path.exists(dest):
        print(f"  [cached] {os.path.basename(dest)}")
        return
    print(f"  Downloading {os.path.basename(dest)} ...")
    urllib.request.urlretrieve(url, dest)
    size_mb = os.path.getsize(dest) / (1024 * 1024)
    print(f"  Downloaded: {size_mb:.1f} MB")


def normalize_slice(s: np.ndarray) -> np.ndarray:
    s = s.astype(np.float64)
    lo, hi = np.percentile(s, 1), np.percentile(s, 99.5)
    if hi - lo < 1e-6:
        return np.zeros_like(s, dtype=np.uint8)
    return np.clip((s - lo) / (hi - lo) * 255, 0, 255).astype(np.uint8)


def save_png(arr: np.ndarray, out_dir: str, name: str, size: int = 512):
    os.makedirs(out_dir, exist_ok=True)
    img = Image.fromarray(normalize_slice(arr), mode="L")
    img = img.resize((size, size), Image.LANCZOS)
    path = os.path.join(out_dir, f"{name}.png")
    img.save(path, optimize=True)
    print(f"    {name}.png  {img.size}  ({os.path.getsize(path):,} bytes)")


def load_volume(path: str) -> tuple:
    """Load NIfTI, reorient to RAS+ if needed, return (data, orientation)."""
    img = nib.load(path)
    orientation = nib.aff2axcodes(img.affine)
    # Reorient to RAS+ if not already
    target = ("R", "A", "S")
    if orientation != target:
        print(f"    Reorienting from {orientation} to RAS+")
        ornt = nib.orientations.axcodes2ornt(orientation)
        target_ornt = nib.orientations.axcodes2ornt(target)
        transform = nib.orientations.ornt_transform(ornt, target_ornt)
        data = nib.orientations.apply_orientation(np.asarray(img.dataobj, dtype=np.float64), transform)
    else:
        data = np.asarray(img.dataobj, dtype=np.float64)
    print(f"    Volume: {data.shape}, orientation: RAS+")
    return data, target


def extract_brain(data: np.ndarray, out_dir: str):
    """Extract brain localizer slices from RAS+ volume."""
    n_r, n_a, n_s = data.shape

    # Axial — basal ganglia level (~52% height)
    z = int(n_s * 0.52)
    axial = np.rot90(data[:, :, z], k=1)
    axial = np.fliplr(axial)
    save_png(axial, out_dir, "axial")

    # Sagittal — midline
    x = n_r // 2
    sagittal = np.rot90(data[x, :, :], k=1)
    save_png(sagittal, out_dir, "sagittal")

    # Coronal — through lateral ventricles (~52% depth)
    y = int(n_a * 0.52)
    coronal = np.rot90(data[:, y, :], k=1)
    coronal = np.fliplr(coronal)
    save_png(coronal, out_dir, "coronal")


def extract_spine(data: np.ndarray, out_dir: str, region: str, z_frac: float = 0.5):
    """Extract spine localizer slices. z_frac controls the axial slice level."""
    n_r, n_a, n_s = data.shape

    # Sagittal — midline (most important for spine)
    x = n_r // 2
    sagittal = np.rot90(data[x, :, :], k=1)
    save_png(sagittal, out_dir, "sagittal")

    # Coronal — mid-depth
    y = n_a // 2
    coronal = np.rot90(data[:, y, :], k=1)
    coronal = np.fliplr(coronal)
    save_png(coronal, out_dir, "coronal")

    # Axial — at specified level
    z = int(n_s * z_frac)
    z = max(0, min(z, n_s - 1))
    axial = np.rot90(data[:, :, z], k=1)
    axial = np.fliplr(axial)
    save_png(axial, out_dir, "axial")


def extract_knee(data: np.ndarray, out_dir: str):
    """Extract knee localizer slices — handles non-standard orientations."""
    # Knee data may be in various orientations. Just extract mid-slices along each axis.
    dims = data.shape
    print(f"    Knee volume shape: {dims}")

    if len(dims) < 3:
        print("    ERROR: Knee volume has fewer than 3 dimensions!")
        return

    # Use the smallest dimension as the slice axis (typically the coronal/axial direction for 2D acquisitions)
    # For a coronal T2 TSE: shape might be (slices, phase, freq) = (36, 256, 512)

    # Axis 0 slices (likely coronal if thin)
    s0 = data[dims[0] // 2, :, :]
    # Axis 1 slices
    s1 = data[:, dims[1] // 2, :]
    # Axis 2 slices
    s2 = data[:, :, dims[2] // 2]

    # Assign based on which axis is thinnest (that's the slice direction)
    min_axis = np.argmin(dims)
    if min_axis == 0:
        # Axis 0 is slice direction → coronal acquisition
        save_png(np.rot90(s0, k=1), out_dir, "coronal")
        save_png(np.rot90(s1, k=1), out_dir, "sagittal")
        save_png(np.rot90(s2, k=1), out_dir, "axial")
    elif min_axis == 1:
        save_png(np.rot90(s0, k=1), out_dir, "sagittal")
        save_png(np.rot90(s1, k=1), out_dir, "coronal")
        save_png(np.rot90(s2, k=1), out_dir, "axial")
    else:
        save_png(np.rot90(s0, k=1), out_dir, "sagittal")
        save_png(np.rot90(s1, k=1), out_dir, "coronal")
        save_png(np.rot90(s2, k=1), out_dir, "axial")


def copy_volume_for_app(src_path: str, region: str):
    """Copy a NIfTI volume to public/volumes/{region}/ for the app to load."""
    dest_dir = os.path.join(VOLUME_DIR, region)
    os.makedirs(dest_dir, exist_ok=True)
    dest = os.path.join(dest_dir, f"{region}_t2.nii.gz")
    if not os.path.exists(dest):
        import shutil
        shutil.copy2(src_path, dest)
        size_mb = os.path.getsize(dest) / (1024 * 1024)
        print(f"    Copied volume to {dest} ({size_mb:.1f} MB)")
    else:
        print(f"    [cached] {dest}")


def main():
    with tempfile.TemporaryDirectory() as tmpdir:
        # Download all volumes
        print("\n=== Downloading MRI volumes ===\n")
        paths = {}
        for key, info in SOURCES.items():
            dest = os.path.join(tmpdir, f"{key}.nii.gz")
            print(f"[{key}] {info['desc']}")
            download(info["url"], dest)
            paths[key] = dest

        # --- Brain ---
        print("\n=== Brain ===")
        brain_dir = os.path.join(BASE_DIR, "brain", "default")
        data, _ = load_volume(paths["brain"])
        extract_brain(data, brain_dir)

        # --- C-Spine ---
        print("\n=== Cervical Spine ===")
        cspine_dir = os.path.join(BASE_DIR, "cspine", "default")
        data, _ = load_volume(paths["cspine"])
        extract_spine(data, cspine_dir, "cspine", z_frac=0.5)
        copy_volume_for_app(paths["cspine"], "cspine")

        # --- T-Spine (from full spine volume, upper portion) ---
        print("\n=== Thoracic Spine ===")
        tspine_dir = os.path.join(BASE_DIR, "tspine", "default")
        data_full, _ = load_volume(paths["spine_full"])
        # Thoracic is roughly the middle portion
        extract_spine(data_full, tspine_dir, "tspine", z_frac=0.45)
        copy_volume_for_app(paths["spine_full"], "tspine")

        # --- L-Spine (from full spine volume, lower portion) ---
        print("\n=== Lumbar Spine ===")
        lspine_dir = os.path.join(BASE_DIR, "lspine", "default")
        # Lumbar is the lower portion
        extract_spine(data_full, lspine_dir, "lspine", z_frac=0.3)
        copy_volume_for_app(paths["spine_full"], "lspine")

        # --- Knee ---
        print("\n=== Knee ===")
        knee_dir = os.path.join(BASE_DIR, "knee", "default")
        data, _ = load_volume(paths["knee"])
        extract_knee(data, knee_dir)
        copy_volume_for_app(paths["knee"], "knee")

    print("\n=== All regions complete ===")
    print(f"Localizers: {BASE_DIR}")
    print(f"Volumes:    {VOLUME_DIR}")


if __name__ == "__main__":
    main()
