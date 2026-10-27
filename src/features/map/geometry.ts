import type { Building, Floor, Rect, Room } from "@/features/campus/types";
import { DOOR_WIDTH } from "./layout";

/** Parede reta (eixo x ou z) no plano do piso. */
export type WallSegment = { x0: number; z0: number; x1: number; z1: number; outer: boolean };

type Edge = { axis: "x" | "z"; fixed: number; from: number; to: number };

function rectEdges(rect: Rect): (Edge & { side: Room["doorWall"] })[] {
  return [
    { side: "z0", axis: "x", fixed: rect.z0, from: rect.x0, to: rect.x1 },
    { side: "z1", axis: "x", fixed: rect.z1, from: rect.x0, to: rect.x1 },
    { side: "x0", axis: "z", fixed: rect.x0, from: rect.z0, to: rect.z1 },
    { side: "x1", axis: "z", fixed: rect.x1, from: rect.z0, to: rect.z1 },
  ];
}

/** Remove de [from, to] os intervalos dados. */
function subtract(from: number, to: number, holes: [number, number][]) {
  let parts: [number, number][] = [[from, to]];
  for (const [a, b] of holes) {
    parts = parts.flatMap(([start, end]): [number, number][] => {
      if (b <= start || a >= end) return [[start, end]];
      return [
        [start, Math.max(start, a)],
        [Math.min(end, b), end],
      ].filter(([s, e]) => e - s > 0.05) as [number, number][];
    });
  }
  return parts;
}

function toSegment(edge: Edge, [a, b]: [number, number], outer: boolean): WallSegment {
  return edge.axis === "x" ? { x0: a, z0: edge.fixed, x1: b, z1: edge.fixed, outer } : { x0: edge.fixed, z0: a, x1: edge.fixed, z1: b, outer };
}

function roomWalls(room: Room): WallSegment[] {
  if (room.open) return [];
  return rectEdges(room.rect).flatMap((edge) => {
    const along = edge.axis === "x" ? room.door.x : room.door.z;
    const holes: [number, number][] = edge.side === room.doorWall ? [[along - DOOR_WIDTH / 2, along + DOOR_WIDTH / 2]] : [];
    return subtract(edge.from, edge.to, holes).map((part) => toSegment(edge, part, false));
  });
}

/** Contorno do prédio (união dos retângulos), com vãos nas saídas. */
function outlineWalls(building: Building, floor: Floor): WallSegment[] {
  return building.footprint.flatMap((rect) =>
    rectEdges(rect).flatMap((edge) => {
      const holes: [number, number][] = [];
      // Trechos encostados em outro retângulo do mesmo prédio ficam por dentro.
      for (const other of building.footprint) {
        if (other === rect) continue;
        for (const otherEdge of rectEdges(other)) {
          if (otherEdge.axis === edge.axis && otherEdge.fixed === edge.fixed) holes.push([otherEdge.from, otherEdge.to]);
        }
      }
      for (const exit of floor.exits) {
        const onEdge = edge.axis === "x" ? exit.point.z === edge.fixed : exit.point.x === edge.fixed;
        const along = edge.axis === "x" ? exit.point.x : exit.point.z;
        if (onEdge) holes.push([along - 1.6, along + 1.6]);
      }
      return subtract(edge.from, edge.to, holes).map((part) => toSegment(edge, part, true));
    }),
  );
}

export function floorWalls(building: Building, floor: Floor) {
  return [...outlineWalls(building, floor), ...floor.rooms.flatMap(roomWalls)];
}

/** Retângulo do piso de um corredor (eixo ± meia largura). */
export function corridorRect(corridor: Floor["corridors"][number]): Rect {
  const half = corridor.width / 2;
  return {
    x0: Math.min(corridor.from.x, corridor.to.x) - half,
    x1: Math.max(corridor.from.x, corridor.to.x) + half,
    z0: Math.min(corridor.from.z, corridor.to.z) - half,
    z1: Math.max(corridor.from.z, corridor.to.z) + half,
  };
}
