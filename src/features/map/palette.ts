import type { RoomType } from "@/features/campus/types";

/**
 * Cores da cena 3D. O WebGL não lê as classes do Tailwind, então os valores
 * ficam aqui, derivados da paleta Oxygeni de `globals.css`.
 */
export const sceneColors = {
  background: "#eef2f7",
  ground: "#e4e9f0",
  slab: "#fdfdfd",
  slabSide: "#d5dbe4",
  corridor: "#e6e6e6",
  wall: "#ffffff",
  outerWall: "#c4cad4",
  door: "#919192",
  route: "#0747de",
  routeFlow: "#ffffff",
  vertical: "#d68b00",
  user: "#0747de",
  destination: "#ba2f2a",
  hover: "#0747de",
  walkway: "#d9dee6",
  glass: "#9fbaf0",
  stairs: "#c9cfd8",
  elevator: "#7d9be0",
};

/** Piso de cada tipo de ambiente: tons claros da paleta, para o mapa ficar legível. */
export const roomColors: Record<RoomType, string> = {
  sala: "#ffffff",
  laboratorio: "#ebf3ff",
  auditorio: "#fff3e7",
  biblioteca: "#ebfbee",
  banheiro: "#e7eef7",
  cantina: "#ffeeea",
  coordenacao: "#f1eefb",
  secretaria: "#f1eefb",
  administrativo: "#f3f3f3",
  servico: "#fff8e0",
  convivencia: "#ebfbee",
  escada: "#f0f2f5",
  elevador: "#e3e8f2",
  entrada: "#ffffff",
};
