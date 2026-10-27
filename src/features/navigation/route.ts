import { campus, getPlace, loadSite } from "@/features/campus/api";
import type { BuildingId, FloorRef } from "@/features/campus/types";
import { findPath, measureFrom } from "./astar";
import { VERTICAL_TRACK_LENGTH } from "./constants";
import { buildNavGraph } from "./graph";
import { buildSteps } from "./instructions";
import type { PathResult, Route, RouteLeg, RouteOptions, Track } from "./types";

export const navGraph = buildNavGraph(campus);

/** Troca o local ativo: dados do campus e grafo de rotas. */
export function switchSite(siteId: string) {
  loadSite(siteId);
  const graph = buildNavGraph(campus);
  navGraph.nodes = graph.nodes;
  navGraph.edges = graph.edges;
}

function buildTrack(path: PathResult): Track {
  const at = [0];
  const walked = [0];
  path.edges.forEach((edge, index) => {
    const a = path.nodes[index];
    const b = path.nodes[index + 1];
    const horizontal = Math.hypot(a.x - b.x, a.z - b.z);
    at.push(at[index] + (edge.kind === "walk" ? horizontal : VERTICAL_TRACK_LENGTH));
    walked.push(walked[index] + (edge.kind === "walk" ? horizontal : 0));
  });
  return { at, walked, length: at.at(-1)! };
}

/** Divide o caminho em trechos de caminhada (por andar/área) e de troca de andar. */
function buildLegs(path: PathResult): RouteLeg[] {
  const legs: RouteLeg[] = [];
  path.edges.forEach((edge, index) => {
    const a = path.nodes[index];
    const b = path.nodes[index + 1];
    const kind = edge.kind === "walk" ? "walk" : "vertical";
    // O trecho da saída até a passagem já conta como área externa.
    const area = a.area === "EXT" || b.area === "EXT" ? "EXT" : a.area;
    const via = edge.kind === "stairs" ? "escada" : edge.kind === "elevator" ? "elevador" : undefined;
    const current = legs.at(-1);
    if (current && current.kind === kind && current.area === area && (kind === "vertical" || current.level === a.level)) {
      current.end = index + 1;
      current.toLevel = b.level;
    } else {
      legs.push({ kind, area, level: a.level, toLevel: b.level, start: index, end: index + 1, via });
    }
  });
  return legs;
}

export function computeRoute(originId: string, destinationId: string, options: RouteOptions = {}): Route | null {
  const origin = getPlace(originId);
  const destination = getPlace(destinationId);
  if (!origin || !destination || originId === destinationId) return null;

  const path = findPath(navGraph, origin.nodeId, destination.nodeId, options);
  if (!path) return null;

  const track = buildTrack(path);
  const legs = buildLegs(path);

  const floors: FloorRef[] = [];
  for (const leg of legs) {
    if (leg.kind !== "walk" || leg.area === "EXT") continue;
    const ref = { buildingId: leg.area as BuildingId, level: leg.level };
    if (!floors.some((floor) => floor.buildingId === ref.buildingId && floor.level === ref.level)) floors.push(ref);
  }

  return {
    originId,
    destinationId,
    nodes: path.nodes,
    edges: path.edges,
    legs,
    steps: buildSteps(path, track, origin, destination),
    track,
    distance: path.distance,
    seconds: path.seconds,
    floors,
    avoidStairs: Boolean(options.avoidStairs),
  };
}

/** Distância a pé da origem até cada destino pesquisável. */
export function distancesToPlaces(originId: string, options: RouteOptions = {}) {
  const origin = getPlace(originId);
  const result = new Map<string, { seconds: number; distance: number }>();
  if (!origin) return result;
  const measures = measureFrom(navGraph, origin.nodeId, options);
  for (const place of campus.places) {
    const measure = measures.get(place.nodeId);
    if (measure) result.set(place.id, measure);
  }
  return result;
}
