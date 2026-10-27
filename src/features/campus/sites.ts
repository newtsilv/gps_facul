import { campusSpec } from "@/mocks/campus";
import { oxygeniHubSpec } from "@/mocks/oxygeni-hub";
import type { CampusSpec } from "./types";

export type Site = {
  id: string;
  name: string;
  spec: CampusSpec;
  /** Ponto de partida padrão (id de um destino). */
  defaultOrigin: string;
};

/** Locais disponíveis no seletor. O primeiro é o padrão. */
export const sites: Site[] = [
  { id: "oxygeni", name: "Oxygeni Hub", spec: oxygeniHubSpec, defaultOrigin: "oxy-entrada-principal" },
  { id: "demo", name: "Campus demo", spec: campusSpec, defaultOrigin: "entrada-principal-a" },
];

export function getSite(id: string) {
  return sites.find((site) => site.id === id) ?? sites[0];
}
