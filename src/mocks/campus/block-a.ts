import type { BuildingSpec, CorridorSpec, RoomSpec, RoomType } from "@/features/campus/types";

/*
 * Bloco A: 64 × 20 m, corredor principal no eixo z = 10.
 * Salas do lado norte ocupam z 0–8; do lado sul, z 12–20.
 * Elevador, banheiros e escada ficam na mesma posição em todos os andares.
 */

const corridor: CorridorSpec = { id: "a-principal", name: "corredor principal", from: { x: 2, z: 10 }, to: { x: 62, z: 10 }, width: 4 };

function north(x0: number, x1: number, name: string, type: RoomType, extra: Partial<RoomSpec> = {}): RoomSpec {
  return { name, type, rect: { x0, z0: 0, x1, z1: 8 }, corridor: corridor.id, ...extra };
}

function south(x0: number, x1: number, name: string, type: RoomType, extra: Partial<RoomSpec> = {}): RoomSpec {
  return { name, type, rect: { x0, z0: 12, x1, z1: 20 }, corridor: corridor.id, ...extra };
}

/** Núcleo de circulação repetido em todos os andares. */
const core: RoomSpec[] = [
  north(28, 32, "Elevador", "elevador", { shaftId: "a-elevador" }),
  north(32, 36, "Banheiros", "banheiro", { keywords: ["wc", "sanitário", "toalete"] }),
  south(28, 34, "Escada", "escada", { shaftId: "a-escada" }),
];

export const blockA: BuildingSpec = {
  id: "A",
  name: "Bloco A",
  footprint: [{ x0: 0, z0: 0, x1: 64, z1: 20 }],
  floors: [
    {
      level: 0,
      corridors: [corridor],
      exits: [
        { id: "a-0-oeste", point: { x: 0, z: 10 }, corridor: corridor.id, name: "entrada principal" },
        { id: "a-0-leste", point: { x: 64, z: 10 }, corridor: corridor.id, name: "saída leste" },
      ],
      rooms: [
        north(0, 12, "Secretaria Acadêmica", "secretaria", { keywords: ["matrícula", "documentos", "declaração"] }),
        north(12, 20, "Tesouraria", "administrativo", { keywords: ["financeiro", "boleto", "pagamento"] }),
        north(20, 28, "Coordenação Geral", "coordenacao"),
        ...core,
        north(36, 50, "Cantina", "cantina", { keywords: ["lanche", "café", "restaurante", "comida"] }),
        north(50, 64, "Sala de Convivência", "convivencia", { keywords: ["descanso", "estudo"] }),
        south(0, 14, "Auditório Principal", "auditorio", { doorAt: 10, description: "Capacidade para 220 pessoas." }),
        south(14, 22, "Sala 001", "sala"),
        south(22, 28, "Sala 002", "sala"),
        south(34, 44, "Sala 003", "sala"),
        south(44, 54, "Atendimento ao Aluno", "servico", { keywords: ["protocolo", "ouvidoria"] }),
        south(54, 64, "Reprografia", "servico", { keywords: ["xerox", "impressão", "cópia"] }),
      ],
    },
    {
      level: 1,
      corridors: [corridor],
      exits: [{ id: "a-1-leste", point: { x: 64, z: 10 }, corridor: corridor.id, name: "acesso à passarela" }],
      rooms: [
        north(0, 9, "Sala 101", "sala"),
        north(9, 18, "Sala 102", "sala"),
        north(18, 28, "Coordenação de Computação", "coordenacao", { keywords: ["ciência da computação", "sistemas"] }),
        ...core,
        north(36, 46, "Sala 103", "sala"),
        north(46, 56, "Sala 104", "sala"),
        north(56, 64, "Sala dos Professores A", "administrativo", { keywords: ["docentes"] }),
        south(0, 10, "Laboratório de Informática 1", "laboratorio", { keywords: ["computadores", "lab info"] }),
        south(10, 20, "Laboratório de Informática 2", "laboratorio", { keywords: ["computadores", "lab info"] }),
        south(20, 28, "Sala 105", "sala"),
        south(34, 44, "Sala 106", "sala"),
        south(44, 54, "Sala 107", "sala"),
        south(54, 64, "Sala de Estudos", "convivencia", { keywords: ["silêncio", "leitura"] }),
      ],
    },
    {
      level: 2,
      corridors: [corridor],
      rooms: [
        north(0, 9, "Sala 201", "sala"),
        north(9, 18, "Sala 202", "sala"),
        north(18, 28, "Coordenação de Engenharia", "coordenacao", { keywords: ["engenharia civil", "engenharia elétrica"] }),
        ...core,
        north(36, 46, "Sala 203", "sala"),
        north(46, 64, "Laboratório de Eletrônica", "laboratorio", { keywords: ["circuitos"] }),
        south(0, 14, "Laboratório de Química", "laboratorio", { keywords: ["química geral", "reagentes"] }),
        south(14, 28, "Laboratório de Física", "laboratorio"),
        south(34, 44, "Sala 204", "sala"),
        south(44, 54, "Sala 205", "sala"),
        south(54, 64, "Sala 206", "sala"),
      ],
    },
    {
      level: 3,
      corridors: [corridor],
      rooms: [
        north(0, 9, "Sala 301", "sala"),
        north(9, 18, "Sala 302", "sala"),
        north(18, 28, "Laboratório 303", "laboratorio", { description: "Laboratório de Redes de Computadores.", keywords: ["redes"] }),
        ...core,
        north(36, 46, "Sala de Reuniões", "administrativo"),
        north(46, 64, "Núcleo de Pesquisa", "administrativo", { keywords: ["iniciação científica", "pesquisa"] }),
        south(0, 14, "Miniauditório", "auditorio", { doorAt: 10 }),
        south(14, 28, "Sala 305", "sala"),
        south(34, 44, "Sala 306", "sala"),
        south(44, 56, "Laboratório 304", "laboratorio", {
          description: "Laboratório de Inteligência Artificial.",
          keywords: ["inteligência artificial", "ia", "machine learning"],
        }),
        south(56, 64, "Sala 307", "sala"),
      ],
    },
  ],
};
