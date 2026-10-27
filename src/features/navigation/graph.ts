import { entranceNodeId, roomNodeId } from "@/features/campus/builder";
import type { Campus, CorridorSpec, Floor, Point2 } from "@/features/campus/types";
import {
  ELEVATOR_SECONDS_PER_FLOOR,
  ELEVATOR_WAIT_SECONDS,
  STAIRS_DISTANCE_PER_FLOOR,
  STAIRS_SECONDS_PER_FLOOR,
  WALK_SPEED,
} from "./constants";
import type { GraphEdge, GraphNode, NavGraph } from "./types";

export function exitNodeId(floorId: string, exitId: string) {
  return `exit:${floorId}:${exitId}`;
}

function doorNodeId(roomId: string) {
  return `door:${roomId}`;
}

function isHorizontal(corridor: CorridorSpec) {
  return corridor.from.z === corridor.to.z;
}

function clamp(value: number, a: number, b: number) {
  return Math.min(Math.max(value, Math.min(a, b)), Math.max(a, b));
}

/** Ponto do eixo do corredor mais próximo de `point`. */
export function projectOnCorridor(corridor: CorridorSpec, point: Point2): Point2 {
  return isHorizontal(corridor)
    ? { x: clamp(point.x, corridor.from.x, corridor.to.x), z: corridor.from.z }
    : { x: corridor.from.x, z: clamp(point.z, corridor.from.z, corridor.to.z) };
}

function distance(a: Point2, b: Point2) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

class GraphBuilder {
  nodes = new Map<string, GraphNode>();
  edges = new Map<string, GraphEdge[]>();

  addNode(node: GraphNode) {
    if (!this.nodes.has(node.id)) {
      this.nodes.set(node.id, node);
      this.edges.set(node.id, []);
    }
    return this.nodes.get(node.id)!;
  }

  /** Aresta de caminhada nos dois sentidos; `extraSeconds` só no sentido a → b. */
  walk(a: string, b: string, extraSeconds = 0) {
    if (a === b) return;
    const meters = distance(this.nodes.get(a)!, this.nodes.get(b)!);
    this.push({ from: a, to: b, kind: "walk", distance: meters, seconds: meters / WALK_SPEED + extraSeconds });
    this.push({ from: b, to: a, kind: "walk", distance: meters, seconds: meters / WALK_SPEED });
  }

  vertical(a: string, b: string, kind: "stairs" | "elevator") {
    const seconds = kind === "stairs" ? STAIRS_SECONDS_PER_FLOOR : ELEVATOR_SECONDS_PER_FLOOR;
    const meters = kind === "stairs" ? STAIRS_DISTANCE_PER_FLOOR : 0;
    this.push({ from: a, to: b, kind, seconds, distance: meters });
    this.push({ from: b, to: a, kind, seconds, distance: meters });
  }

  private push(edge: GraphEdge) {
    const list = this.edges.get(edge.from)!;
    if (!list.some((item) => item.to === edge.to && item.kind === edge.kind)) list.push(edge);
  }
}

/**
 * Monta a rede de um andar: nós ao longo dos corredores (em frente a cada porta,
 * nos cruzamentos e nas pontas) e um ramal porta → centro para cada sala.
 * Como os ramais são becos sem saída, nenhuma rota atravessa salas ou paredes.
 */
function addFloor(builder: GraphBuilder, floor: Floor) {
  const corridorPoints = new Map<string, string[]>(floor.corridors.map((corridor) => [corridor.id, []]));

  function corridorNode(corridor: CorridorSpec, point: Point2) {
    const id = `${floor.id}:c:${point.x.toFixed(1)}:${point.z.toFixed(1)}`;
    builder.addNode({ id, kind: "corridor", area: floor.buildingId, buildingId: floor.buildingId, level: floor.level, ...point });
    corridorPoints.get(corridor.id)!.push(id);
    return id;
  }

  for (const corridor of floor.corridors) {
    corridorNode(corridor, corridor.from);
    corridorNode(corridor, corridor.to);
  }

  // Cruzamentos entre corredores horizontais e verticais.
  for (const a of floor.corridors) {
    for (const b of floor.corridors) {
      if (!isHorizontal(a) || isHorizontal(b)) continue;
      const point = { x: b.from.x, z: a.from.z };
      const onA = clamp(point.x, a.from.x, a.to.x) === point.x;
      const onB = clamp(point.z, b.from.z, b.to.z) === point.z;
      if (onA && onB) {
        corridorNode(a, point);
        corridorNode(b, point);
      }
    }
  }

  for (const room of floor.rooms) {
    const corridor = floor.corridors.find((item) => item.id === room.corridor)!;
    const isShaft = room.type === "escada" || room.type === "elevador";
    const base = { area: floor.buildingId, buildingId: floor.buildingId, level: floor.level, roomId: room.id } as const;

    const door = builder.addNode({ ...base, id: doorNodeId(room.id), kind: "door", ...room.door });
    const center = builder.addNode({
      ...base,
      id: roomNodeId(room.id),
      kind: isShaft ? "shaft" : "room",
      shaftType: isShaft ? (room.type as "escada" | "elevador") : undefined,
      ...room.center,
    });
    const front = corridorNode(corridor, projectOnCorridor(corridor, room.door));

    builder.walk(front, door.id);
    builder.walk(door.id, center.id, room.type === "elevador" ? ELEVATOR_WAIT_SECONDS : 0);
  }

  for (const exit of floor.exits) {
    const corridor = floor.corridors.find((item) => item.id === exit.corridor)!;
    const node = builder.addNode({
      id: exitNodeId(floor.id, exit.id),
      kind: "exit",
      area: floor.buildingId,
      buildingId: floor.buildingId,
      level: floor.level,
      label: exit.name,
      ...exit.point,
    });
    builder.walk(corridorNode(corridor, projectOnCorridor(corridor, exit.point)), node.id);
  }

  // Liga os pontos de cada corredor em sequência, ao longo do eixo.
  for (const corridor of floor.corridors) {
    const axis = isHorizontal(corridor) ? "x" : "z";
    const ids = [...new Set(corridorPoints.get(corridor.id))].sort((a, b) => builder.nodes.get(a)![axis] - builder.nodes.get(b)![axis]);
    for (let i = 1; i < ids.length; i++) builder.walk(ids[i - 1], ids[i]);
  }
}

/** Grafo de navegação do campus inteiro, com as mesmas coordenadas do mapa 3D. */
export function buildNavGraph(campus: Campus): NavGraph {
  const builder = new GraphBuilder();

  for (const building of campus.buildings) {
    for (const floor of building.floors) addFloor(builder, floor);

    // Escadas e elevadores com o mesmo poço, de andar em andar.
    const shafts = new Map<string, { level: number; nodeId: string; type: string }[]>();
    for (const floor of building.floors) {
      for (const room of floor.rooms) {
        if (!room.shaftId) continue;
        const list = shafts.get(room.shaftId) ?? [];
        list.push({ level: floor.level, nodeId: roomNodeId(room.id), type: room.type });
        shafts.set(room.shaftId, list);
      }
    }
    for (const list of shafts.values()) {
      list.sort((a, b) => a.level - b.level);
      for (let i = 1; i < list.length; i++) {
        if (list[i].level - list[i - 1].level !== 1) continue;
        builder.vertical(list[i - 1].nodeId, list[i].nodeId, list[i].type === "elevador" ? "elevator" : "stairs");
      }
    }
  }

  for (const connection of campus.connections) {
    const from = exitNodeId(`${connection.from.buildingId}-${connection.from.level}`, connection.from.exitId);
    const to = exitNodeId(`${connection.to.buildingId}-${connection.to.level}`, connection.to.exitId);
    let previous = from;
    connection.path.forEach((point, index) => {
      const node = builder.addNode({
        id: `out:${connection.id}:${index}`,
        kind: "outdoor",
        area: "EXT",
        buildingId: connection.from.buildingId,
        level: connection.level,
        label: connection.name,
        ...point,
      });
      builder.walk(previous, node.id);
      previous = node.id;
    });
    builder.walk(previous, to);
  }

  for (const entrance of campus.entrances) {
    const node = builder.addNode({
      id: entranceNodeId(entrance.id),
      kind: "entrance",
      area: "EXT",
      buildingId: entrance.exit.buildingId,
      level: entrance.exit.level,
      label: entrance.name,
      ...entrance.outside,
    });
    builder.walk(node.id, exitNodeId(`${entrance.exit.buildingId}-${entrance.exit.level}`, entrance.exit.exitId));
  }

  return { nodes: builder.nodes, edges: builder.edges };
}
