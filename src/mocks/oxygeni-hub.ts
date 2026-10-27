import type { CampusSpec, CorridorSpec, RoomSpec, RoomType } from "@/features/campus/types";

/*
 * Oxygeni Hub, térreo. Medido sobre a planta baixa (escala pela cota de 11,05 m),
 * desvirada para o texto ficar legível: recepção em cima, INCODE à direita.
 *
 * - Faixa principal: x 0–54,6, z 8,35–19,5, com a circulação no eixo z = 9,85.
 * - Apple Training sobe até z = 0; a recepção avança até z = 6 (porta de entrada).
 * - As áreas com "X" na planta (vãos) e a escada não entram no mapa.
 */

const circulacao: CorridorSpec = { id: "oxy-circulacao", name: "corredor de circulação", from: { x: 4.5, z: 9.85 }, to: { x: 35, z: 9.85 }, width: 3 };

function room(x0: number, z0: number, x1: number, z1: number, name: string, type: RoomType, extra: Partial<RoomSpec> = {}): RoomSpec {
  return { name, type, rect: { x0, z0, x1, z1 }, corridor: circulacao.id, ...extra };
}

export const oxygeniHubSpec: CampusSpec = {
  name: "Oxygeni Hub",
  buildings: [
    {
      id: "OXY",
      name: "Oxygeni Hub",
      footprint: [
        { x0: 0, z0: 8.35, x1: 54.6, z1: 19.5 },
        { x0: 0, z0: 0, x1: 6.5, z1: 8.35 },
        { x0: 30.2, z0: 6, x1: 36.5, z1: 8.35 },
      ],
      floors: [
        {
          level: 0,
          corridors: [circulacao],
          exits: [{ id: "oxy-entrada", point: { x: 33.4, z: 6 }, corridor: circulacao.id, name: "porta da recepção" }],
          rooms: [
            room(0, 0, 6.5, 8.35, "Apple Training", "laboratorio", {
              doorAt: 5.7,
              description: "Sala de treinamento Apple (28 alunos).",
              keywords: ["apple", "mac", "treinamento", "developer academy"],
            }),
            room(0, 8.35, 3, 11.35, "Cápsula", "sala", { keywords: ["reunião", "call", "cabine"] }),
            room(0, 11.35, 6, 19.5, "Sala de Aula 1", "sala", { doorAt: 5.4, description: "Capacidade para 42 alunos." }),
            room(6, 11.35, 12.1, 19.5, "Sala de Aula 2", "sala", { doorAt: 11.5, description: "Capacidade para 42 alunos." }),
            room(12.1, 11.35, 18.2, 19.5, "Sala de Aula 3", "sala", { doorAt: 17.6, description: "Capacidade para 29 alunos." }),
            room(18.2, 11.35, 30.2, 19.5, "Área de Trabalho", "convivencia", { open: true, keywords: ["coworking", "mesas", "estações"] }),
            room(30.2, 11.35, 36.5, 19.5, "Reset", "convivencia", { open: true, keywords: ["descanso", "café", "lounge", "copa"] }),
            room(30.2, 6, 36.5, 8.35, "Recepção", "servico", { open: true, doorAt: 33.4, keywords: ["atendimento", "portaria"] }),
            room(36.5, 8.35, 54.6, 19.5, "INCODE / Projetos", "laboratorio", {
              description: "Área de projetos e desenvolvimento.",
              keywords: ["incode", "projetos", "desenvolvimento", "dev"],
            }),
          ],
        },
      ],
    },
  ],
  connections: [],
  entrances: [
    {
      id: "oxy-entrada-principal",
      name: "Entrada principal",
      exit: { buildingId: "OXY", level: 0, exitId: "oxy-entrada" },
      outside: { x: 33.4, z: 2 },
      description: "Porta da recepção.",
    },
  ],
};
