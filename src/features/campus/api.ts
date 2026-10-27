import { buildCampus } from "./builder";
import { getSite, sites } from "./sites";
import type { CampusSpec } from "./types";

/**
 * Acesso aos dados do campus. Hoje devolve os mocks; ao integrar com o backend
 * (NestJS/Spring + PostgreSQL), troque o corpo por um `fetch("/api/locais/{id}")`
 * que devolva o mesmo `CampusSpec`. O resto do app não muda.
 */
export async function getCampusSpec(siteId: string): Promise<CampusSpec> {
  return getSite(siteId).spec;
}

/**
 * Local ativo, montado de forma síncrona enquanto os dados são mockados.
 * `loadSite` troca o conteúdo deste mesmo objeto, então quem o importou vê o
 * local novo. O grafo de rotas acompanha via `switchSite` (navigation/route.ts).
 */
export const campus = buildCampus(sites[0].spec);

export function loadSite(siteId: string) {
  Object.assign(campus, buildCampus(getSite(siteId).spec));
}

export function getBuildingName(id: string) {
  return campus.buildings.find((building) => building.id === id)?.name ?? id;
}

export function getFloor(buildingId: string, level: number) {
  return campus.buildings.find((building) => building.id === buildingId)?.floors.find((floor) => floor.level === level);
}

export function getPlace(id: string) {
  return campus.places.find((place) => place.id === id);
}

export function getRoom(id: string) {
  for (const building of campus.buildings) {
    for (const floor of building.floors) {
      const room = floor.rooms.find((item) => item.id === id);
      if (room) return room;
    }
  }
  return undefined;
}
