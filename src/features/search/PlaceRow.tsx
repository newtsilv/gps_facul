import { getBuildingName } from "@/features/campus/api";
import { floorName, roomTypeLabels } from "@/features/campus/labels";
import { roomIcons } from "@/features/campus/roomIcons";
import type { Place } from "@/features/campus/types";
import { formatDistance } from "@/lib/format";

type PlaceRowProps = {
  place: Place;
  distance?: number;
  active?: boolean;
  onSelect: () => void;
  id?: string;
};

/** Linha de resultado: ícone do tipo, nome, bloco · andar · tipo e distância. */
export function PlaceRow({ place, distance, active = false, onSelect, id }: PlaceRowProps) {
  const Icon = roomIcons[place.type];
  return (
    <button
      id={id}
      type="button"
      role="option"
      aria-selected={active}
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${active ? "bg-primary-400" : "hover:bg-primary-100"}`}
    >
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
          place.type === "entrada" ? "bg-secondary-lightgreen text-secondary-green" : "bg-primary-400 text-primary-500"
        }`}
      >
        <Icon className="size-4.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.9375rem] font-medium text-primary-600">{place.name}</span>
        <span className="block truncate text-xs text-primary-300">
          {getBuildingName(place.buildingId)} · {floorName(place.level)} · {roomTypeLabels[place.type]}
        </span>
      </span>
      {distance !== undefined && <span className="shrink-0 text-xs text-primary-300 tabular-nums">{formatDistance(distance)}</span>}
    </button>
  );
}
