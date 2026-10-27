"use client";

import { useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import type { Emphasis } from "./emphasis";
import { sceneState } from "./sceneState";

/** Aproxima suavemente separação e opacidade dos andares dos valores-alvo. */
export function SceneAnimator({ emphasis }: { emphasis: Emphasis }) {
  useEffect(() => {
    sceneState.explodeTarget = emphasis.explode;
    sceneState.opacityTarget = emphasis.opacity;
    // Primeira renderização: começa já no estado final.
    if (sceneState.opacity.size === 0) sceneState.opacity = new Map(emphasis.opacity);
  }, [emphasis]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const k = 1 - Math.exp(-4.5 * dt);
    sceneState.explode += (sceneState.explodeTarget - sceneState.explode) * k;
    if (Math.abs(sceneState.explodeTarget - sceneState.explode) < 1e-4) sceneState.explode = sceneState.explodeTarget;
    for (const [key, target] of sceneState.opacityTarget) {
      const current = sceneState.opacity.get(key) ?? target;
      const next = current + (target - current) * k;
      sceneState.opacity.set(key, Math.abs(target - next) < 1e-3 ? target : next);
    }
  }, -1);

  return null;
}
