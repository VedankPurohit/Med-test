"use client";

import { useState, useEffect } from "react";
import type { VolumeData } from "../types/volume";
import { loadNiftiVolume } from "../lib/volumeLoader";

export function useVolume(url: string | null) {
  const [volume, setVolume] = useState<VolumeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setVolume(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    loadNiftiVolume(url)
      .then((v) => {
        if (!cancelled) {
          setVolume(v);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Load failed");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return { volume, loading, error };
}
