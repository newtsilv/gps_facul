"use client";

import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, DoorOpenIcon, FootprintsIcon } from "lucide-react";
import { campus } from "@/features/campus/api";
import { floorName } from "@/features/campus/labels";
import { iconOnlyTypes, roomIcons } from "@/features/campus/roomIcons";
import type { Floor, Point2 } from "@/features/campus/types";
import { useNavigationStore } from "@/store/navigation";
import { useEmphasis } from "../emphasis";
import { areaOpacity, floorKey, floorY, ROUTE_LIFT } from "../layout";
import { getUserPosition } from "../Markers";
import { sceneState } from "../sceneState";
import { MapLabel } from "./MapLabel";

/** Ponto acima do piso de um andar, enquanto aquele andar/área estiver visível. */
function anchored(area: string, level: number, point: Point2, lift: number, minOpacity = 0.5) {
  return () => (areaOpacity(sceneState.opacity, area, level) > minOpacity ? ([point.x, floorY(level, sceneState.explode) + lift, point.z] as const) : null);
}

/** Nomes das salas de um andar (salas comuns somem com a câmera longe: ver globals.css). */
function RoomLabels({ floor }: { floor: Floor }) {
  const pickRoom = useNavigationStore((state) => state.pickRoom);
  const destinationId = useNavigationStore((state) => state.destinationId);

  return floor.rooms.map((room) => {
    const Icon = roomIcons[room.type];
    const iconOnly = iconOnlyTypes.has(room.type);
    const selected = room.id === destinationId;
    return (
      <MapLabel key={room.id} id={`room:${room.id}`} position={anchored(floor.buildingId, floor.level, room.center, 1.6)}>
        {iconOnly ? (
          <span
            title={room.name}
            className={`map-label flex size-6 items-center justify-center rounded-full shadow-md ${
              room.type === "banheiro" ? "bg-primary-50 text-primary-500" : "bg-primary-550 text-primary-50"
            }`}
          >
            <Icon className="size-3.5" strokeWidth={2} />
          </span>
        ) : (
          <button
            type="button"
            onClick={() => room.searchable && pickRoom(room.id)}
            data-minor={room.type === "sala" ? "" : undefined}
            className={`map-label pointer-events-auto flex max-w-36 items-center gap-1 rounded-full px-2 py-0.5 text-[0.6875rem] leading-tight font-medium whitespace-nowrap shadow-md transition-colors ${
              selected ? "bg-secondary-red text-primary-50" : "bg-primary-50/95 text-primary-600 hover:bg-primary-400 hover:text-primary-500"
            }`}
          >
            <Icon className="size-3 shrink-0" strokeWidth={2} />
            <span className="truncate">{room.name}</span>
          </button>
        )}
      </MapLabel>
    );
  });
}

function exitPoint(buildingId: string, level: number, exitId: string) {
  const floor = campus.buildings.find((building) => building.id === buildingId)?.floors.find((item) => item.level === level);
  return floor?.exits.find((exit) => exit.id === exitId)?.point;
}

/** Nomes das passagens entre blocos e das entradas. */
function ConnectionLabels() {
  return (
    <>
      {campus.connections.map((connection) => {
        const middle = connection.path[Math.floor(connection.path.length / 2)] ?? exitPoint(connection.from.buildingId, connection.level, connection.from.exitId)!;
        return (
          <MapLabel key={connection.id} id={`connection:${connection.id}`} position={anchored("EXT", connection.level, middle, 1.4)}>
            <span data-minor="" className="map-label block rounded-full bg-primary-600/80 px-2 py-0.5 text-[0.625rem] whitespace-nowrap text-primary-50 first-letter:uppercase">
              {connection.name}
            </span>
          </MapLabel>
        );
      })}
      {campus.entrances.map((entrance) => (
        <MapLabel key={entrance.id} id={`entrance:${entrance.id}`} position={anchored("EXT", entrance.exit.level, entrance.outside, 1.2)}>
          <span className="map-label flex items-center gap-1 rounded-full bg-secondary-green px-2 py-0.5 text-[0.625rem] font-medium whitespace-nowrap text-primary-50 shadow-md">
            <DoorOpenIcon className="size-3" strokeWidth={2} />
            {entrance.name}
          </span>
        </MapLabel>
      ))}
    </>
  );
}

/** Etiquetas "Elevador ↑ 3º andar" onde a rota troca de andar. */
function FloorChangeLabels() {
  const route = useNavigationStore((state) => state.route);
  if (!route) return null;
  return route.legs
    .filter((leg) => leg.kind === "vertical")
    .map((leg) => {
      const node = route.nodes[leg.start];
      const Icon = leg.via === "elevador" ? ArrowUpDownIcon : FootprintsIcon;
      const Arrow = leg.toLevel > leg.level ? ArrowUpIcon : ArrowDownIcon;
      const visible = () =>
        Math.max(areaOpacity(sceneState.opacity, leg.area, leg.level), areaOpacity(sceneState.opacity, leg.area, leg.toLevel)) > 0.3;
      return (
        <MapLabel
          key={`${route.originId}-${route.destinationId}-${leg.start}`}
          id={`floor-change:${leg.start}`}
          position={() => (visible() ? [node.x, floorY(leg.level, sceneState.explode) + 2.6, node.z] : null)}
        >
          <div className="flex items-center gap-1.5 rounded-full bg-secondary-yellow py-1 pr-2.5 pl-1.5 text-xs font-semibold whitespace-nowrap text-primary-50 shadow-lg">
            <span className="flex size-5 items-center justify-center rounded-full bg-primary-50/25">
              <Icon className="size-3.5" strokeWidth={2} />
            </span>
            {leg.via === "elevador" ? "Elevador" : "Escada"}
            <Arrow className="size-3.5" strokeWidth={2.25} />
            {floorName(leg.toLevel)}
          </div>
        </MapLabel>
      );
    });
}

function UserLabel() {
  const navigating = useNavigationStore((state) => state.status !== "idle");
  if (navigating) return null;
  return (
    <MapLabel
      id="user"
      position={() => {
        const position = getUserPosition();
        return position ? [position.x, floorY(position.level, sceneState.explode) + ROUTE_LIFT + 3.6, position.z] : null;
      }}
    >
      <span className="block rounded-full bg-primary-500 px-2 py-0.5 text-[0.625rem] font-semibold whitespace-nowrap text-primary-50 shadow-lg">Você está aqui</span>
    </MapLabel>
  );
}

/** Camada de rótulos HTML sobre o canvas (uma árvore React só, leve no celular). */
export function MapLabels() {
  const emphasis = useEmphasis();
  const floors = campus.buildings.flatMap((building) => building.floors);

  return (
    <div aria-hidden={false} className="pointer-events-none absolute inset-0 overflow-hidden">
      {floors
        .filter((floor) => emphasis.labeled.has(floorKey(floor.buildingId, floor.level)))
        .map((floor) => (
          <RoomLabels key={floor.id} floor={floor} />
        ))}
      <ConnectionLabels />
      <FloorChangeLabels />
      <UserLabel />
    </div>
  );
}
