import { beforeAll, describe, expect, it } from "vitest";
import { campus } from "@/features/campus/api";
import { findPath, measureFrom } from "./astar";
import { computeRoute, navGraph, switchSite } from "./route";

const ENTRANCE_A = "entrada-principal-a";

beforeAll(() => switchSite("demo"));

describe("grafo de navegação", () => {
  it("liga todos os destinos à entrada principal", () => {
    const origin = campus.places.find((place) => place.id === ENTRANCE_A)!;
    const reachable = measureFrom(navGraph, origin.nodeId);
    const unreachable = campus.places.filter((place) => !reachable.has(place.nodeId)).map((place) => place.name);
    expect(unreachable).toEqual([]);
  });

  it("só usa arestas entre nós do mesmo andar, exceto escadas e elevadores", () => {
    for (const list of navGraph.edges.values()) {
      for (const edge of list) {
        const a = navGraph.nodes.get(edge.from)!;
        const b = navGraph.nodes.get(edge.to)!;
        if (edge.kind === "walk") expect(a.level).toBe(b.level);
        else expect(Math.abs(a.level - b.level)).toBe(1);
      }
    }
  });

  it("fora das salas, os trechos são retos (rotas não cortam paredes na diagonal)", () => {
    for (const list of navGraph.edges.values()) {
      for (const edge of list) {
        const a = navGraph.nodes.get(edge.from)!;
        const b = navGraph.nodes.get(edge.to)!;
        const insideRoom = a.roomId !== undefined && a.roomId === b.roomId;
        if (edge.kind === "walk" && !insideRoom && a.area !== "EXT" && b.area !== "EXT") expect(a.x === b.x || a.z === b.z).toBe(true);
      }
    }
  });
});

describe("rotas", () => {
  it("vai da entrada até o Laboratório 304 pelo elevador", () => {
    const route = computeRoute(ENTRANCE_A, "a-3-laboratorio-304")!;
    expect(route).not.toBeNull();
    expect(route.edges.some((edge) => edge.kind === "elevator")).toBe(true);
    expect(route.floors.map((floor) => floor.level)).toEqual([0, 3]);
    expect(route.steps.at(-1)!.text).toBe("Você chegou ao Laboratório 304.");
    expect(route.steps.some((step) => step.requiresConfirmation && step.targetLevel === 3)).toBe(true);
  });

  it("nunca atravessa salas: centros de sala só aparecem nas pontas ou em escadas/elevadores", () => {
    for (const destination of ["b-2-auditorio-bloco-b", "a-2-laboratorio-de-quimica", "b-0-laboratorio-de-biologia"]) {
      const route = computeRoute("a-1-sala-101", destination)!;
      route.nodes.slice(1, -1).forEach((node) => expect(node.kind).not.toBe("room"));
    }
  });

  it("muda de bloco pela passagem ou pela passarela", () => {
    const route = computeRoute("a-1-sala-101", "b-1-sala-b-104")!;
    expect(route.nodes.some((node) => node.area === "EXT")).toBe(true);
    expect(route.steps.some((step) => step.kind === "exit-building")).toBe(true);
  });

  it("rota sem escadas usa apenas elevador", () => {
    const route = computeRoute("a-1-sala-101", "a-2-sala-201", { avoidStairs: true })!;
    expect(route.edges.some((edge) => edge.kind === "stairs")).toBe(false);
    expect(route.edges.some((edge) => edge.kind === "elevator")).toBe(true);
  });

  it("A* encontra o mesmo custo que o Dijkstra", () => {
    const origin = campus.places.find((place) => place.id === ENTRANCE_A)!;
    const all = measureFrom(navGraph, origin.nodeId);
    for (const place of campus.places.slice(0, 40)) {
      const path = findPath(navGraph, origin.nodeId, place.nodeId)!;
      expect(path.seconds).toBeCloseTo(all.get(place.nodeId)!.seconds, 6);
    }
  });
});
