import { beforeAll, describe, expect, it } from "vitest";
import { computeRoute, switchSite } from "@/features/navigation/route";
import { RouteProgressProvider } from "./RouteProgressProvider";

beforeAll(() => switchSite("demo"));

/** Roda a animação até o marcador alcançar os passos. */
function settle(provider: RouteProgressProvider) {
  for (let i = 0; i < 600; i++) provider.tick(1 / 30);
}

describe("navegação por passos", () => {
  it("cada passo avança o marcador pela rota", () => {
    const provider = new RouteProgressProvider(computeRoute("a-1-sala-101", "a-1-sala-104")!, "pedometer");
    const total = provider.remainingDistance;
    for (let i = 0; i < 10; i++) provider.advance(0.7);
    settle(provider);
    expect(provider.remainingDistance).toBeCloseTo(total - 7, 5);
  });

  it("para na escada/elevador até a confirmação e ignora passos enquanto isso", () => {
    const provider = new RouteProgressProvider(computeRoute("entrada-principal-a", "a-3-laboratorio-304")!, "pedometer");
    for (let i = 0; i < 200; i++) provider.advance(0.7);
    settle(provider);
    expect(provider.awaitingConfirmation).toBe(true);
    const stoppedAt = provider.progress;
    provider.advance(5);
    settle(provider);
    expect(provider.progress).toBe(stoppedAt);

    provider.confirmFloorChange();
    settle(provider);
    expect(Math.round(provider.position.level)).toBe(3);
    for (let i = 0; i < 100; i++) provider.advance(0.7);
    settle(provider);
    expect(provider.arrived).toBe(true);
  });

  it("voltar 2 m não desfaz a troca de andar já confirmada", () => {
    const provider = new RouteProgressProvider(computeRoute("entrada-principal-a", "a-3-laboratorio-304")!, "pedometer");
    for (let i = 0; i < 200; i++) provider.advance(0.7);
    settle(provider);
    provider.confirmFloorChange();
    settle(provider);
    for (let i = 0; i < 10; i++) provider.retreat(2);
    settle(provider);
    expect(Math.round(provider.position.level)).toBe(3);
  });
});
