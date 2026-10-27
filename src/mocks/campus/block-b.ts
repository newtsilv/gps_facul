import type { BuildingSpec, CorridorSpec, RoomSpec, RoomType } from "@/features/campus/types";

/*
 * Bloco B: formato em L.
 * - Ala principal: x 80–124, z 6–26, corredor principal no eixo z = 16.
 * - Ala lateral: x 104–124, até z = 40, corredor lateral no eixo x = 114.
 */

const main: CorridorSpec = { id: "b-principal", name: "corredor principal", from: { x: 82, z: 16 }, to: { x: 122, z: 16 }, width: 4 };
const wing: CorridorSpec = { id: "b-lateral", name: "corredor lateral", from: { x: 114, z: 16 }, to: { x: 114, z: 38 }, width: 4 };

function north(x0: number, x1: number, name: string, type: RoomType, extra: Partial<RoomSpec> = {}): RoomSpec {
  return { name, type, rect: { x0, z0: 6, x1, z1: 14 }, corridor: main.id, ...extra };
}

function south(x0: number, x1: number, name: string, type: RoomType, extra: Partial<RoomSpec> = {}): RoomSpec {
  return { name, type, rect: { x0, z0: 18, x1, z1: 26 }, corridor: main.id, ...extra };
}

/** Salas da ala lateral, a oeste (x 104–112) ou a leste (x 116–124) do corredor. */
function wingRoom(side: "oeste" | "leste", z0: number, z1: number, name: string, type: RoomType, extra: Partial<RoomSpec> = {}): RoomSpec {
  const rect = side === "oeste" ? { x0: 104, z0, x1: 112, z1 } : { x0: 116, z0, x1: 124, z1 };
  return { name, type, rect, corridor: wing.id, ...extra };
}

const core: RoomSpec[] = [
  north(96, 100, "Elevador", "elevador", { shaftId: "b-elevador" }),
  north(100, 106, "Escada", "escada", { shaftId: "b-escada" }),
  north(116, 124, "Banheiros", "banheiro", { keywords: ["wc", "sanitário", "toalete"] }),
];

export const blockB: BuildingSpec = {
  id: "B",
  name: "Bloco B",
  footprint: [
    { x0: 80, z0: 6, x1: 124, z1: 26 },
    { x0: 104, z0: 26, x1: 124, z1: 40 },
  ],
  floors: [
    {
      level: 0,
      corridors: [main, wing],
      exits: [
        { id: "b-0-oeste", point: { x: 80, z: 16 }, corridor: main.id, name: "acesso oeste" },
        { id: "b-0-sul", point: { x: 114, z: 40 }, corridor: wing.id, name: "entrada sul" },
      ],
      rooms: [
        north(80, 96, "Biblioteca Central", "biblioteca", {
          doorAt: 92,
          description: "Acervo geral, cabines de estudo e empréstimo de livros.",
          keywords: ["livros", "acervo", "empréstimo", "estudo"],
        }),
        ...core,
        north(106, 116, "Centro Acadêmico", "convivencia", { keywords: ["ca", "diretório"] }),
        south(80, 92, "Sala de Estudos em Grupo", "sala", { keywords: ["estudo", "grupo"] }),
        south(92, 104, "Sala B-001", "sala"),
        wingRoom("oeste", 18, 29, "Ambulatório", "servico", { keywords: ["enfermaria", "saúde", "primeiros socorros"] }),
        wingRoom("oeste", 29, 40, "Sala B-002", "sala"),
        wingRoom("leste", 18, 29, "Laboratório de Anatomia", "laboratorio"),
        wingRoom("leste", 29, 40, "Laboratório de Biologia", "laboratorio", { keywords: ["microscópio"] }),
      ],
    },
    {
      level: 1,
      corridors: [main, wing],
      exits: [{ id: "b-1-oeste", point: { x: 80, z: 16 }, corridor: main.id, name: "acesso à passarela" }],
      rooms: [
        north(80, 88, "Sala B-101", "sala"),
        north(88, 96, "Sala B-102", "sala"),
        ...core,
        north(106, 116, "Coordenação de Saúde", "coordenacao", { keywords: ["enfermagem", "medicina", "farmácia"] }),
        south(80, 92, "Laboratório de Microbiologia", "laboratorio"),
        south(92, 104, "Sala B-103", "sala"),
        wingRoom("oeste", 18, 29, "Sala B-104", "sala"),
        wingRoom("oeste", 29, 40, "Sala B-105", "sala"),
        wingRoom("leste", 18, 29, "Laboratório de Enfermagem", "laboratorio", { keywords: ["simulação"] }),
        wingRoom("leste", 29, 40, "Sala B-106", "sala"),
      ],
    },
    {
      level: 2,
      corridors: [main, wing],
      rooms: [
        north(80, 88, "Sala B-201", "sala"),
        north(88, 96, "Sala B-202", "sala"),
        ...core,
        north(106, 116, "Sala dos Professores B", "administrativo", { keywords: ["docentes"] }),
        south(80, 104, "Auditório Bloco B", "auditorio", { doorAt: 98, description: "Capacidade para 150 pessoas." }),
        wingRoom("oeste", 18, 29, "Sala B-203", "sala"),
        wingRoom("oeste", 29, 40, "Sala B-204", "sala"),
        wingRoom("leste", 18, 29, "Laboratório de Farmácia", "laboratorio"),
        wingRoom("leste", 29, 40, "Sala B-205", "sala"),
      ],
    },
  ],
};
