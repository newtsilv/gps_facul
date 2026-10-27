import { beforeAll, describe, expect, it } from "vitest";
import { campus } from "@/features/campus/api";
import { measureFrom } from "./astar";
import { computeRoute, navGraph, switchSite } from "./route";

beforeAll(() => switchSite("oxygeni"));

describe("Oxygeni Hub", () => {
  it("liga todos os ambientes à entrada", () => {
    const entrance = campus.places.find((place) => place.type === "entrada")!;
    const reachable = measureFrom(navGraph, entrance.nodeId);
    expect(campus.places.filter((place) => !reachable.has(place.nodeId)).map((place) => place.name)).toEqual([]);
  });

  it("vai da Sala de Aula 1 ao INCODE pela circulação", () => {
    const route = computeRoute("oxy-0-sala-de-aula-1", "oxy-0-incode-projetos")!;
    expect(route).not.toBeNull();
    expect(route.distance).toBeGreaterThan(30);
    expect(route.distance).toBeLessThan(60);
    route.nodes.slice(1, -1).forEach((node) => expect(node.kind).not.toBe("room"));
    expect(route.steps.at(-1)!.text).toBe("Você chegou ao INCODE / Projetos.");
  });

  it("entra pela recepção e chega na Cápsula, na ponta do corredor", () => {
    const route = computeRoute("oxy-entrada-principal", "oxy-0-capsula")!;
    expect(route.steps[0].text).toMatch(/^Entre no Oxygeni Hub/);
    expect(route.steps.at(-1)!.text).toBe("Você chegou à Cápsula.");
  });
});
