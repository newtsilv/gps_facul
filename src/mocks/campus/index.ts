import type { CampusSpec } from "@/features/campus/types";
import { blockA } from "./block-a";
import { blockB } from "./block-b";

/** Universidade fictícia do protótipo. Substituir pela resposta da API ao integrar. */
export const campusSpec: CampusSpec = {
  name: "Campus Central",
  buildings: [blockA, blockB],
  connections: [
    {
      id: "passagem-coberta",
      name: "passagem coberta",
      kind: "passagem",
      level: 0,
      from: { buildingId: "A", level: 0, exitId: "a-0-leste" },
      to: { buildingId: "B", level: 0, exitId: "b-0-oeste" },
      path: [
        { x: 72, z: 10 },
        { x: 72, z: 16 },
      ],
      width: 3,
    },
    {
      id: "passarela",
      name: "passarela do 1º andar",
      kind: "passarela",
      level: 1,
      from: { buildingId: "A", level: 1, exitId: "a-1-leste" },
      to: { buildingId: "B", level: 1, exitId: "b-1-oeste" },
      path: [
        { x: 72, z: 10 },
        { x: 72, z: 16 },
      ],
      width: 3,
    },
  ],
  entrances: [
    {
      id: "entrada-principal-a",
      name: "Entrada Principal",
      exit: { buildingId: "A", level: 0, exitId: "a-0-oeste" },
      outside: { x: -6, z: 10 },
      description: "Portaria e acesso pela praça central.",
    },
    {
      id: "entrada-sul-b",
      name: "Entrada Sul",
      exit: { buildingId: "B", level: 0, exitId: "b-0-sul" },
      outside: { x: 114, z: 46 },
      description: "Acesso pelo estacionamento.",
    },
  ],
};
