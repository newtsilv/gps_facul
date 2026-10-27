/**
 * Modelo do campus. As coordenadas são em metros, no plano do chão (x, z), as
 * mesmas usadas para desenhar o mapa 3D e para calcular as rotas.
 * O eixo y (altura) vem só do andar: ver `features/map/layout.ts`.
 */

/** Identificador do prédio/bloco ("A", "B", "OXY"...). */
export type BuildingId = string;

/** Área do campus: um bloco ou "EXT" (entradas e passagens entre blocos). */
export type AreaId = BuildingId | "EXT";

export type Point2 = { x: number; z: number };

export type Rect = { x0: number; z0: number; x1: number; z1: number };

export type RoomType =
  | "sala"
  | "laboratorio"
  | "auditorio"
  | "biblioteca"
  | "banheiro"
  | "cantina"
  | "coordenacao"
  | "secretaria"
  | "administrativo"
  | "servico"
  | "convivencia"
  | "escada"
  | "elevador"
  | "entrada";

/* ---------- Formato dos dados de entrada (mocks hoje, API amanhã) ---------- */

export type CorridorSpec = {
  id: string;
  /** Usado nas instruções: "Siga pelo corredor principal". */
  name: string;
  /** Eixo central do corredor. Sempre horizontal ou vertical. */
  from: Point2;
  to: Point2;
  width: number;
};

export type RoomSpec = {
  /** Gerado a partir do andar e do nome quando omitido. */
  id?: string;
  name: string;
  type: RoomType;
  rect: Rect;
  /** Corredor onde fica a porta. A sala precisa encostar nele. */
  corridor: string;
  /** Posição da porta ao longo do corredor (padrão: meio da parede). */
  doorAt?: number;
  description?: string;
  /** Sinônimos para a busca ("xerox", "lanche"...). */
  keywords?: string[];
  /** Liga escadas/elevadores do mesmo poço entre andares. */
  shaftId?: string;
  /** Ambiente aberto (recepção, área de trabalho): desenhado sem paredes. */
  open?: boolean;
};

export type ExitSpec = {
  id: string;
  /** Ponto na parede externa. */
  point: Point2;
  corridor: string;
  name: string;
};

export type FloorSpec = {
  level: number;
  corridors: CorridorSpec[];
  rooms: RoomSpec[];
  exits?: ExitSpec[];
};

export type BuildingSpec = {
  id: BuildingId;
  name: string;
  footprint: Rect[];
  floors: FloorSpec[];
};

export type ExitRef = { buildingId: BuildingId; level: number; exitId: string };

/** Ligação externa entre dois blocos, num mesmo nível. */
export type ConnectionSpec = {
  id: string;
  name: string;
  kind: "passagem" | "passarela";
  level: number;
  from: ExitRef;
  to: ExitRef;
  /** Pontos intermediários (as saídas dos blocos são as pontas). */
  path: Point2[];
  width: number;
};

export type EntranceSpec = {
  id: string;
  name: string;
  exit: ExitRef;
  /** Ponto do lado de fora, onde a pessoa chega ao campus. */
  outside: Point2;
  description?: string;
};

export type CampusSpec = {
  name: string;
  buildings: BuildingSpec[];
  connections: ConnectionSpec[];
  entrances: EntranceSpec[];
};

/* ---------- Campus montado (com portas e centros calculados) ---------- */

export type Room = Omit<RoomSpec, "id"> & {
  id: string;
  buildingId: BuildingId;
  level: number;
  floorId: string;
  /** Ponto de entrada, na parede voltada para o corredor. */
  door: Point2;
  center: Point2;
  /** Lado da sala em que fica a porta. */
  doorWall: "x0" | "x1" | "z0" | "z1";
  searchable: boolean;
};

export type Exit = ExitSpec & { buildingId: BuildingId; level: number; floorId: string };

export type Floor = {
  id: string;
  buildingId: BuildingId;
  level: number;
  name: string;
  corridors: CorridorSpec[];
  rooms: Room[];
  exits: Exit[];
};

export type Building = {
  id: BuildingId;
  name: string;
  footprint: Rect[];
  floors: Floor[];
};

/** Qualquer destino pesquisável: salas e entradas. */
export type Place = {
  id: string;
  name: string;
  type: RoomType;
  area: AreaId;
  /** Prédio usado para exibição ("Bloco A"); entradas usam o prédio a que dão acesso. */
  buildingId: BuildingId;
  level: number;
  position: Point2;
  entrance: Point2;
  /** Nó do grafo onde a rota começa/termina. */
  nodeId: string;
  description?: string;
  keywords: string[];
};

export type Campus = {
  name: string;
  buildings: Building[];
  connections: ConnectionSpec[];
  entrances: EntranceSpec[];
  places: Place[];
};

export type FloorRef = { buildingId: BuildingId; level: number };
