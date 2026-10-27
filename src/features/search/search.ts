import { getBuildingName } from "@/features/campus/api";
import { floorName, roomTypeLabels } from "@/features/campus/labels";
import type { Place, RoomType } from "@/features/campus/types";

export type SearchResult = {
  place: Place;
  score: number;
  /** Metros a pé desde a origem, quando conhecido. */
  distance?: number;
};

export function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** Atalhos de categoria exibidos com a busca vazia. */
export const quickCategories: { label: string; query: string; type: RoomType }[] = [
  { label: "Banheiro", query: "banheiro", type: "banheiro" },
  { label: "Biblioteca", query: "biblioteca", type: "biblioteca" },
  { label: "Cantina", query: "cantina", type: "cantina" },
  { label: "Laboratórios", query: "laboratorio", type: "laboratorio" },
  { label: "Auditórios", query: "auditorio", type: "auditorio" },
  { label: "Coordenação", query: "coordenacao", type: "coordenacao" },
];

/**
 * Busca por nome, tipo, sinônimos, bloco e andar. Todas as palavras digitadas
 * precisam aparecer. Quando a busca é por categoria ("banheiro"), os mais
 * próximos da origem vêm primeiro.
 */
export function searchPlaces(query: string, places: Place[], distances?: Map<string, { distance: number }>, limit = 8): SearchResult[] {
  const q = normalize(query);
  if (!q) return [];
  const tokens = q.split(/\s+/);

  const results: SearchResult[] = [];
  for (const place of places) {
    const name = normalize(place.name);
    const haystack = [name, normalize(roomTypeLabels[place.type]), normalize(getBuildingName(place.buildingId)), normalize(floorName(place.level)), ...place.keywords.map(normalize)].join(" ");
    if (!tokens.every((token) => haystack.includes(token))) continue;

    let score = 30;
    if (name === q) score = 100;
    else if (name.startsWith(q)) score = 80;
    else if (name.split(/\s+/).some((word) => word.startsWith(tokens[0]))) score = 60;
    else if (name.includes(q)) score = 50;

    results.push({ place, score, distance: distances?.get(place.id)?.distance });
  }

  return results
    .sort((a, b) => b.score - a.score || (a.distance ?? Infinity) - (b.distance ?? Infinity) || a.place.name.localeCompare(b.place.name, "pt-BR"))
    .slice(0, limit);
}
