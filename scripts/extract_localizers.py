#!/usr/bin/env python3
"""
Download a real brain MRI (NIfTI, RAS+ orientation) and extract matched
localizer slices with correct radiological orientation for the planner.

Coordinate convention (matches planner):
  Axial view   (x horizontal, y vertical):  x=-1 left=patient R, y=1 top=anterior
  Sagittal view (y horizontal, z vertical):  y=1 right=anterior,  z=1 top=superior
  Coronal view (x horizontal, z vertical):  x=-1 left=patient R, z=1 top=superior

Source: Chris Rorden, McCausland Center for Brain Imaging
License: CC BY-NC 4.0
"""

import os
import urllib.request
import tempfile

import nibabel as nib
import numpy as np
from PIL import Image

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "localizers", "brain", "default")

URLS = {
    "t1": "https://raw.githubusercontent.com/neurolabusc/niivue-images/main/chris_t1.nii.gz",
    "t2": "https://raw.githubusercontent.com/neurolabusc/niivue-images/main/chris_t2.nii.gz",
}

def download(url: str, dest: str):
    print(f"  Downloading {os.path.basename(dest)} ...")
    urllib.request.urlretrieve(url, dest)

def normalize_slice(s: np.ndarray) -> np.ndarray:
    s = s.astype(np.float64)
    lo, hi = np.percentile(s, 1), np.percentile(s, 99.5)
    if hi - lo < 1e-6:
        return np.zeros_like(s, dtype=np.uint8)
    return np.clip((s - lo) / (hi - lo) * 255, 0, 255).astype(np.uint8)

def save_png(arr: np.ndarray, name: str, size: int = 512):
    os.makedirs(OUT_DIR, exist_ok=True)
    img = Image.fromarray(normalize_slice(arr), mode="L")
    img = img.resize((size, size), Image.LANCZOS)
    path = os.path.join(OUT_DIR, f"{name}.png")
    img.save(path, optimize=True)
    print(f"  {name}.png  {img.size}  ({os.path.getsize(path)} bytes)")

def extract_localizers(data: np.ndarray):
    """
    Extract axial, sagittal, coronal mid-slices from RAS+ volume.

    RAS+ axes:
      axis 0 (R): voxel index increases → patient's right
      axis 1 (A): voxel index increases → anterior
      axis 2 (S): voxel index increases → superior
    """
    n_r, n_a, n_s = data.shape

    # --- Axial (slice through S axis) ---
    # Show at ~60% height (basal ganglia / lateral ventricles level)
    z_slice = int(n_s * 0.52)
    axial = data[:, :, z_slice]          # shape (R, A)
    axial = np.rot90(axial, k=1)         # top=anterior, left=patient's left (neurological)
    axial = np.fliplr(axial)             # flip to radiological: left=patient's right
    save_png(axial, "axial")

    # --- Sagittal (slice through R axis at midline) ---
    x_slice = n_r // 2
    sagittal = data[x_slice, :, :]       # shape (A, S)
    sagittal = np.rot90(sagittal, k=1)   # top=superior, left=posterior, right=anterior
    # No horizontal flip: right=anterior matches planner y=1=right=anterior
    save_png(sagittal, "sagittal")

    # --- Coronal (slice through A axis) ---
    # Show at ~52% depth (through lateral ventricles / temporal horns)
    y_slice = int(n_a * 0.52)
    coronal = data[:, y_slice, :]        # shape (R, S)
    coronal = np.rot90(coronal, k=1)     # top=superior, left=patient's left
    coronal = np.fliplr(coronal)         # flip to radiological: left=patient's right
    save_png(coronal, "coronal")

def main():
    with tempfile.TemporaryDirectory() as tmpdir:
        t2_path = os.path.join(tmpdir, "chris_t2.nii.gz")
        download(URLS["t2"], t2_path)

        img = nib.load(t2_path)
        data = np.asarray(img.dataobj, dtype=np.float64)
        orientation = nib.aff2axcodes(img.affine)
        print(f"  Volume: {data.shape}, orientation: {orientation}")
        assert orientation == ("R", "A", "S"), f"Expected RAS+, got {orientation}"

        print("\nExtracting localizer slices...")
        extract_localizers(data)
        print(f"\nDone → {OUT_DIR}")

if __name__ == "__main__":
    main()
