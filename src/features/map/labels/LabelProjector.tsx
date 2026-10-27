"use client";

import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import { labelRegistry } from "./registry";

const point = new Vector3();

/** Projeta cada rótulo registrado na tela. Deve vir depois do `CameraRig` na cena. */
export function LabelProjector() {
  useFrame(({ camera, size }) => {
    for (const { el, position } of labelRegistry.values()) {
      const world = position();
      if (world) point.set(world[0], world[1], world[2]).project(camera);
      // Fora do campo de visão (atrás da câmera ou além do plano distante).
      if (!world || point.z > 1 || point.z < -1) {
        if (el.style.display !== "none") el.style.display = "none";
        continue;
      }
      const x = ((point.x + 1) / 2) * size.width;
      const y = ((1 - point.y) / 2) * size.height;
      el.style.display = "";
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
    }
  });
  return null;
}
