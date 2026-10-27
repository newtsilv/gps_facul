import { campus } from "@/features/campus/api";
import type { AreaId, Building, BuildingId, Point2, Rect } from "@/features/campus/types";

/** Distância vertical entre andares com eles empilhados. */
export const FLOOR_GAP = 4.2;
/** Espaço extra entre andares quando separados (explode = 1). */
export const EXPLODE_EXTRA = 8;

export const SLAB_THICKNESS = 0.35;
export const WALL_HEIGHT = 1.15;
export const WALL_THICKNESS = 0.18;
export const DOOR_WIDTH = 1.6;
/** Altura da linha da rota acima do piso. */
export const ROUTE_LIFT = 0.45;

/** Altura (y) do piso de um andar. `level` pode ser fracionário (animação). */
export function floorY(level: number, explode: number) {
  return level * (FLOOR_GAP + explode * EXPLODE_EXTRA);
}

export function floorKey(buildingId: BuildingId, level: number) {
  return `${buildingId}-${level}`;
}

export function getBuilding(id: BuildingId) {
  return campus.buildings.find((building) => building.id === id)!;
}

export function maxLevel(building: Building) {
  return Math.max(...building.floors.map((floor) => floor.level));
}

export type Bounds = { minX: number; maxX: number; minZ: number; maxZ: number };

export function rectsBounds(rects: Rect[]): Bounds {
  return {
    minX: Math.min(...rects.map((rect) => rect.x0)),
    maxX: Math.max(...rects.map((rect) => rect.x1)),
    minZ: Math.min(...rects.map((rect) => rect.z0)),
    maxZ: Math.max(...rects.map((rect) => rect.z1)),
  };
}

export function pointsBounds(points: Point2[]): Bounds {
  return {
    minX: Math.min(...points.map((point) => point.x)),
    maxX: Math.max(...points.map((point) => point.x)),
    minZ: Math.min(...points.map((point) => point.z)),
    maxZ: Math.max(...points.map((point) => point.z)),
  };
}

export function buildingBounds(id: BuildingId | null) {
  const buildings = id ? [getBuilding(id)] : campus.buildings;
  return rectsBounds(buildings.flatMap((building) => building.footprint));
}

/** Áreas externas (passagens) aparecem junto com os andares do mesmo nível. */
export function areaOpacity(opacity: Map<string, number>, area: AreaId, level: number) {
  if (area !== "EXT") return opacity.get(floorKey(area, level)) ?? 0;
  return Math.max(...campus.buildings.map((building) => opacity.get(floorKey(building.id, level)) ?? 0));
}
