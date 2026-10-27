import { ELEVATOR_SECONDS_PER_FLOOR, WALK_SPEED } from "./constants";
import type { GraphEdge, GraphNode, NavGraph, PathResult, RouteOptions } from "./types";

/** Fila de prioridade (heap binário) pelo menor custo. */
class MinHeap<T> {
  private items: { value: T; priority: number }[] = [];

  get size() {
    return this.items.length;
  }

  push(value: T, priority: number) {
    const items = this.items;
    items.push({ value, priority });
    let i = items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (items[parent].priority <= items[i].priority) break;
      [items[parent], items[i]] = [items[i], items[parent]];
      i = parent;
    }
  }

  pop(): T | undefined {
    const items = this.items;
    if (items.length === 0) return undefined;
    const top = items[0];
    const last = items.pop()!;
    if (items.length > 0) {
      items[0] = last;
      let i = 0;
      for (;;) {
        const left = i * 2 + 1;
        const right = left + 1;
        let smallest = i;
        if (left < items.length && items[left].priority < items[smallest].priority) smallest = left;
        if (right < items.length && items[right].priority < items[smallest].priority) smallest = right;
        if (smallest === i) break;
        [items[smallest], items[i]] = [items[i], items[smallest]];
        i = smallest;
      }
    }
    return top.value;
  }
}

function isAllowed(edge: GraphEdge, options: RouteOptions) {
  return !(options.avoidStairs && edge.kind === "stairs");
}

/**
 * Estimativa otimista do tempo até o destino: andar em linha reta e trocar de
 * andar pelo meio mais rápido. Nunca superestima, então o A* acha o ótimo.
 */
function heuristic(node: GraphNode, goal: GraphNode) {
  return Math.hypot(node.x - goal.x, node.z - goal.z) / WALK_SPEED + Math.abs(node.level - goal.level) * ELEVATOR_SECONDS_PER_FLOOR;
}

/** Caminho de menor tempo entre dois nós, ou `null` se não houver ligação. */
export function findPath(graph: NavGraph, startId: string, goalId: string, options: RouteOptions = {}): PathResult | null {
  const start = graph.nodes.get(startId);
  const goal = graph.nodes.get(goalId);
  if (!start || !goal) return null;

  const cost = new Map<string, number>([[startId, 0]]);
  const cameFrom = new Map<string, GraphEdge>();
  const closed = new Set<string>();
  const open = new MinHeap<string>();
  open.push(startId, heuristic(start, goal));

  while (open.size > 0) {
    const current = open.pop()!;
    if (current === goalId) break;
    if (closed.has(current)) continue;
    closed.add(current);

    for (const edge of graph.edges.get(current) ?? []) {
      if (!isAllowed(edge, options) || closed.has(edge.to)) continue;
      const next = cost.get(current)! + edge.seconds;
      if (next < (cost.get(edge.to) ?? Infinity)) {
        cost.set(edge.to, next);
        cameFrom.set(edge.to, edge);
        open.push(edge.to, next + heuristic(graph.nodes.get(edge.to)!, goal));
      }
    }
  }

  if (!cost.has(goalId)) return null;

  const edges: GraphEdge[] = [];
  for (let id = goalId; id !== startId; ) {
    const edge = cameFrom.get(id)!;
    edges.unshift(edge);
    id = edge.from;
  }
  const nodes = [start, ...edges.map((edge) => graph.nodes.get(edge.to)!)];
  return {
    nodes,
    edges,
    seconds: cost.get(goalId)!,
    distance: edges.reduce((sum, edge) => sum + edge.distance, 0),
  };
}

/**
 * Tempo e distância de um nó até todos os outros (Dijkstra). Usado para ordenar
 * resultados da busca pelo mais próximo ("banheiro mais perto").
 */
export function measureFrom(graph: NavGraph, startId: string, options: RouteOptions = {}) {
  const result = new Map<string, { seconds: number; distance: number }>([[startId, { seconds: 0, distance: 0 }]]);
  const closed = new Set<string>();
  const open = new MinHeap<string>();
  open.push(startId, 0);

  while (open.size > 0) {
    const current = open.pop()!;
    if (closed.has(current)) continue;
    closed.add(current);
    const here = result.get(current)!;
    for (const edge of graph.edges.get(current) ?? []) {
      if (!isAllowed(edge, options)) continue;
      const seconds = here.seconds + edge.seconds;
      if (seconds < (result.get(edge.to)?.seconds ?? Infinity)) {
        result.set(edge.to, { seconds, distance: here.distance + edge.distance });
        open.push(edge.to, seconds);
      }
    }
  }
  return result;
}
