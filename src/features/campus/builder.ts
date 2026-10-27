import type { Building, BuildingId, Campus, CampusSpec, CorridorSpec, Exit, Floor, Place, Room, RoomSpec } from "./types";
import { floorName } from "./labels";

export function floorId(buildingId: BuildingId, level: number) {
  return `${buildingId}-${level}`;
}

export function roomNodeId(roomId: string) {
  return `room:${roomId}`;
}

export function entranceNodeId(entranceId: string) {
  return `entrance:${entranceId}`;
}

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Calcula a porta da sala na parede que encosta no corredor. */
function buildRoom(spec: RoomSpec, buildingId: BuildingId, level: number, corridors: CorridorSpec[]): Room {
  const corridor = corridors.find((item) => item.id === spec.corridor);
  if (!corridor) throw new Error(`Sala "${spec.name}": corredor "${spec.corridor}" não existe.`);

  const { rect } = spec;
  const center = { x: (rect.x0 + rect.x1) / 2, z: (rect.z0 + rect.z1) / 2 };
  const half = corridor.width / 2;
  const horizontal = corridor.from.z === corridor.to.z;

  let door: Room["door"];
  let doorWall: Room["doorWall"];
  const start = horizontal ? Math.min(corridor.from.x, corridor.to.x) - half : Math.min(corridor.from.z, corridor.to.z) - half;
  const end = horizontal ? Math.max(corridor.from.x, corridor.to.x) + half : Math.max(corridor.from.z, corridor.to.z) + half;
  const axisValue = horizontal ? corridor.from.z : corridor.from.x;
  const [low, high] = horizontal ? [rect.z0, rect.z1] : [rect.x0, rect.x1];
  const coversAxis = low <= axisValue && high >= axisValue;

  // Sala na ponta do corredor: a porta fica na parede que fecha o corredor.
  if (coversAxis && (horizontal ? rect.x1 : rect.z1) === start) {
    doorWall = horizontal ? "x1" : "z1";
    door = horizontal ? { x: start, z: spec.doorAt ?? axisValue } : { x: spec.doorAt ?? axisValue, z: start };
  } else if (coversAxis && (horizontal ? rect.x0 : rect.z0) === end) {
    doorWall = horizontal ? "x0" : "z0";
    door = horizontal ? { x: end, z: spec.doorAt ?? axisValue } : { x: spec.doorAt ?? axisValue, z: end };
  } else if (horizontal) {
    const axis = corridor.from.z;
    doorWall = center.z < axis ? "z1" : "z0";
    const wallZ = doorWall === "z1" ? axis - half : axis + half;
    if (rect[doorWall] !== wallZ) throw new Error(`Sala "${spec.name}" não encosta no ${corridor.name}.`);
    door = { x: spec.doorAt ?? center.x, z: wallZ };
  } else {
    const axis = corridor.from.x;
    doorWall = center.x < axis ? "x1" : "x0";
    const wallX = doorWall === "x1" ? axis - half : axis + half;
    if (rect[doorWall] !== wallX) throw new Error(`Sala "${spec.name}" não encosta no ${corridor.name}.`);
    door = { x: wallX, z: spec.doorAt ?? center.z };
  }

  const id = spec.id ?? `${floorId(buildingId, level).toLowerCase()}-${slugify(spec.name)}`;
  return {
    ...spec,
    id,
    buildingId,
    level,
    floorId: floorId(buildingId, level),
    door,
    center,
    doorWall,
    searchable: spec.type !== "escada" && spec.type !== "elevador",
  };
}

/** Transforma os dados brutos no campus usado pelo app (portas, ids e lista de destinos). */
export function buildCampus(spec: CampusSpec): Campus {
  const buildings: Building[] = spec.buildings.map((building) => ({
    id: building.id,
    name: building.name,
    footprint: building.footprint,
    floors: building.floors.map((floor): Floor => {
      const id = floorId(building.id, floor.level);
      return {
        id,
        buildingId: building.id,
        level: floor.level,
        name: floorName(floor.level),
        corridors: floor.corridors,
        rooms: floor.rooms.map((room) => buildRoom(room, building.id, floor.level, floor.corridors)),
        exits: (floor.exits ?? []).map((exit): Exit => ({ ...exit, buildingId: building.id, level: floor.level, floorId: id })),
      };
    }),
  }));

  const roomPlaces: Place[] = buildings.flatMap((building) =>
    building.floors.flatMap((floor) =>
      floor.rooms
        .filter((room) => room.searchable)
        .map((room) => ({
          id: room.id,
          name: room.name,
          type: room.type,
          area: room.buildingId,
          buildingId: room.buildingId,
          level: room.level,
          position: room.center,
          entrance: room.door,
          nodeId: roomNodeId(room.id),
          description: room.description,
          keywords: room.keywords ?? [],
        })),
    ),
  );

  const entrancePlaces: Place[] = spec.entrances.map((entrance) => {
    const building = buildings.find((item) => item.id === entrance.exit.buildingId)!;
    return {
      id: entrance.id,
      name: `${entrance.name} — ${building.name}`,
      type: "entrada",
      area: "EXT",
      buildingId: building.id,
      level: entrance.exit.level,
      position: entrance.outside,
      entrance: entrance.outside,
      nodeId: entranceNodeId(entrance.id),
      description: entrance.description,
      keywords: ["portaria", "acesso", "chegada"],
    };
  });

  return { name: spec.name, buildings, connections: spec.connections, entrances: spec.entrances, places: [...entrancePlaces, ...roomPlaces] };
}
