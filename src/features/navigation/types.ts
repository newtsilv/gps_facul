import type { AreaId, BuildingId, FloorRef } from "@/features/campus/types";

export type NodeKind =
  /** Ponto no eixo de um corredor (frente de porta, cruzamento ou ponta). */
  | "corridor"
  /** Porta de uma sala, na parede. */
  | "door"
  /** Centro de uma sala (início/fim de rota). */
  | "room"
  /** Centro de escada ou elevador; liga os andares. */
  | "shaft"
  /** Saída de um bloco para uma passagem externa. */
  | "exit"
  /** Ponto de passagem/passarela entre blocos. */
  | "outdoor"
  /** Lado de fora de uma entrada do campus. */
  | "entrance";

export type GraphNode = {
  id: string;
  kind: NodeKind;
  area: AreaId;
  /** Bloco do andar; nós externos usam o bloco mais próximo (para exibição). */
  buildingId?: BuildingId;
  level: number;
  x: number;
  z: number;
  roomId?: string;
  shaftType?: "escada" | "elevador";
  /** Nome da saída/passagem, usado nas instruções. */
  label?: string;
};

export type EdgeKind = "walk" | "stairs" | "elevator";

export type GraphEdge = {
  from: string;
  to: string;
  kind: EdgeKind;
  /** Custo do A*: tempo estimado em segundos. */
  seconds: number;
  /** Metros percorridos a pé (elevador conta zero). */
  distance: number;
};

export type NavGraph = {
  nodes: Map<string, GraphNode>;
  /** Arestas de saída de cada nó (o grafo guarda as duas direções). */
  edges: Map<string, GraphEdge[]>;
};

export type RouteOptions = {
  /** Rota acessível: só usa elevadores para trocar de andar. */
  avoidStairs?: boolean;
};

export type PathResult = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  seconds: number;
  distance: number;
};

export type ManeuverKind =
  | "depart"
  | "straight"
  | "turn-left"
  | "turn-right"
  | "slight-left"
  | "slight-right"
  | "stairs-up"
  | "stairs-down"
  | "elevator-up"
  | "elevator-down"
  | "exit-building"
  | "enter-building"
  | "arrive";

export type NavStep = {
  id: string;
  kind: ManeuverKind;
  text: string;
  /** Índice do nó da rota onde a manobra acontece. */
  nodeIndex: number;
  /** Posição da manobra no trajeto (ver `Track.at`). */
  progress: number;
  /** Andar de destino em trocas de andar. */
  targetLevel?: number;
  /** Trocas de andar só avançam com a confirmação da pessoa. */
  requiresConfirmation: boolean;
};

/** Trecho contínuo da rota: caminhada num mesmo andar/área ou troca de andar. */
export type RouteLeg = {
  kind: "walk" | "vertical";
  area: AreaId;
  level: number;
  toLevel: number;
  /** Índices dos nós da rota (inclusive). */
  start: number;
  end: number;
  via?: "escada" | "elevador";
};

/**
 * Trajeto parametrizado para animar o marcador. Trechos horizontais medem a
 * distância real; trocas de andar recebem um comprimento fixo só para a animação.
 */
export type Track = {
  /** Progresso acumulado em cada nó. */
  at: number[];
  /** Metros a pé acumulados em cada nó (para "faltam X m"). */
  walked: number[];
  length: number;
};

export type Route = {
  originId: string;
  destinationId: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  legs: RouteLeg[];
  steps: NavStep[];
  track: Track;
  distance: number;
  seconds: number;
  /** Andares percorridos a pé, na ordem do trajeto. */
  floors: FloorRef[];
  avoidStairs: boolean;
};
