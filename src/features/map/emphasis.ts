"use client";

import { useMemo } from "react";
import { campus } from "@/features/campus/api";
import type { AreaId, BuildingId } from "@/features/campus/types";
import type { Route } from "@/features/navigation/types";
import { useNavigationStore, type NavigationStatus, type ViewMode } from "@/store/navigation";
import { floorKey } from "./layout";

export type EmphasisInput = {
  viewMode: ViewMode;
  activeBuilding: BuildingId | null;
  activeLevel: number | null;
  separated: boolean;
  route: Route | null;
  status: NavigationStatus;
  currentLevel: number;
  currentArea: AreaId;
};

export type Emphasis = {
  opacity: Map<string, number>;
  explode: number;
  /** Andares que mostram os nomes das salas. */
  labeled: Set<string>;
};

const GHOST = 0.1;

/**
 * Decide quais andares ficam em destaque, quais ficam transparentes e quanto
 * os andares se separam, conforme o modo de visualização e a navegação.
 */
export function computeEmphasis(input: EmphasisInput): Emphasis {
  const { viewMode, activeBuilding, activeLevel, separated, route, status, currentLevel, currentArea } = input;
  const opacity = new Map<string, number>();
  const floors = campus.buildings.flatMap((building) => building.floors);
  const multiLevelRoute = route ? new Set(route.floors.map((floor) => floor.level)).size > 1 : false;
  let explode = 0;

  for (const floor of floors) {
    const key = floorKey(floor.buildingId, floor.level);
    let value: number;

    if (status !== "idle") {
      // Navegando: só o andar onde a pessoa está.
      const here = floor.level === currentLevel && (currentArea === "EXT" || currentArea === floor.buildingId);
      value = here ? 1 : viewMode === "3d" ? 0.07 : 0;
    } else if (viewMode !== "3d") {
      // Planta: um nível por vez, nos dois blocos.
      value = floor.level === (activeLevel ?? 0) ? 1 : 0;
    } else if (route) {
      value = route.floors.some((item) => item.buildingId === floor.buildingId && item.level === floor.level) ? 1 : GHOST;
    } else if (activeLevel !== null) {
      value = floor.level === activeLevel && (!activeBuilding || activeBuilding === floor.buildingId) ? 1 : GHOST;
    } else if (activeBuilding) {
      value = floor.buildingId === activeBuilding ? 1 : 0.22;
    } else {
      value = 1;
    }
    opacity.set(key, value);
  }

  if (viewMode === "3d") {
    if (status !== "idle") explode = 0.6;
    else if (separated || multiLevelRoute) explode = 1;
    else if (activeLevel !== null) explode = 0.55;
  }

  const focused = [...opacity].filter(([, value]) => value >= 1).map(([key]) => key);
  const labeled = new Set(focused.length <= 3 ? focused : []);

  return { opacity, explode, labeled };
}

export function useEmphasis() {
  const viewMode = useNavigationStore((state) => state.viewMode);
  const activeBuilding = useNavigationStore((state) => state.activeBuilding);
  const activeLevel = useNavigationStore((state) => state.activeLevel);
  const separated = useNavigationStore((state) => state.separated);
  const route = useNavigationStore((state) => state.route);
  const status = useNavigationStore((state) => state.status);
  const currentLevel = useNavigationStore((state) => state.currentLevel);
  const currentArea = useNavigationStore((state) => state.currentArea);

  return useMemo(
    () => computeEmphasis({ viewMode, activeBuilding, activeLevel, separated, route, status, currentLevel, currentArea }),
    [viewMode, activeBuilding, activeLevel, separated, route, status, currentLevel, currentArea],
  );
}
