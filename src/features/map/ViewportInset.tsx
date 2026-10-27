"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import type { PerspectiveCamera } from "three";
import { useNavigationStore } from "@/store/navigation";
import { sceneState } from "./sceneState";

/** Largura da coluna de painéis à esquerda no desktop (lg:w-[26rem] + margem). */
const DESKTOP_PANEL = 432;
/** Seletor de andar + controles à direita no desktop. */
const DESKTOP_CONTROLS = 150;
/** Altura aproximada do painel do destino no celular. */
const MOBILE_SHEET = 340;

/**
 * Os painéis cobrem parte do mapa (a coluna à esquerda no desktop, a folha de
 * baixo no celular). Desloca o centro óptico da câmera para o meio da área
 * livre, assim a rota, o destino e o usuário não ficam escondidos.
 */
export function ViewportInset() {
  const camera = useThree((state) => state.camera) as PerspectiveCamera;
  const size = useThree((state) => state.size);
  const sheetOpen = useNavigationStore((state) => state.destinationId !== null && state.status === "idle");

  useEffect(() => {
    const desktop = size.width >= 1024;
    const insets = {
      left: desktop ? DESKTOP_PANEL : 0,
      right: desktop ? DESKTOP_CONTROLS : 0,
      top: desktop ? 0 : 120,
      bottom: !desktop && sheetOpen ? Math.min(MOBILE_SHEET, size.height * 0.45) : 0,
    };
    sceneState.insets = insets;
    // Centro da área livre em relação ao centro da tela.
    const x = -(insets.left - insets.right) / 2;
    const y = (insets.bottom - insets.top) / 2;
    if (x || y) camera.setViewOffset(size.width, size.height, x, y, size.width, size.height);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }, [camera, size, sheetOpen]);

  return null;
}
