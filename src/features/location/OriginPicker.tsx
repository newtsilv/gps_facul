"use client";

import { useMemo, useState } from "react";
import { ChevronDownIcon, LocateFixedIcon, MousePointerClickIcon, XIcon } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { SearchField } from "@/components/ui/SearchField";
import { campus, getPlace } from "@/features/campus/api";
import { PlaceRow } from "@/features/search/PlaceRow";
import { searchPlaces } from "@/features/search/search";
import { useNavigationStore } from "@/store/navigation";

/**
 * Escolha da localização atual. É SIMULADA: a pessoa informa onde está.
 * Ao integrar QR Codes ou beacons, este é o ponto onde a origem passa a vir
 * de um `LocationProvider` real.
 */
export function OriginPicker() {
  const originId = useNavigationStore((state) => state.originId);
  const pickingOrigin = useNavigationStore((state) => state.pickingOrigin);
  const setOrigin = useNavigationStore((state) => state.setOrigin);
  const setPickingOrigin = useNavigationStore((state) => state.setPickingOrigin);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const origin = getPlace(originId);

  const options = useMemo(() => {
    if (query) return searchPlaces(query, campus.places, undefined, 30).map((result) => result.place);
    return campus.places;
  }, [query]);

  if (pickingOrigin) {
    return (
      <div className="flex animate-pop-in items-center gap-2 rounded-full bg-primary-550 py-1.5 pr-1.5 pl-3 text-sm text-primary-50 shadow-lg">
        <MousePointerClickIcon className="size-4 shrink-0" />
        <span className="truncate">Toque na sala onde você está</span>
        <button type="button" onClick={() => setPickingOrigin(false)} aria-label="Cancelar" className="rounded-full p-1 hover:bg-primary-50/15">
          <XIcon className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex max-w-full items-center gap-2 rounded-full border border-primary-200 bg-primary-50/95 py-1.5 pr-2.5 pl-2 text-sm shadow-md backdrop-blur-md transition-colors hover:border-primary-300"
      >
        <span className="relative flex size-5 items-center justify-center">
          <span className="absolute size-5 animate-ping rounded-full bg-primary-500/25" />
          <span className="size-2.5 rounded-full bg-primary-500 ring-2 ring-primary-50" />
        </span>
        <span className="truncate">
          <span className="text-primary-300">Você está em </span>
          <span className="font-medium">{origin?.name ?? "—"}</span>
        </span>
        <span className="shrink-0 rounded-md bg-secondary-lightyellow px-1.5 py-0.5 text-[0.6875rem] font-medium text-secondary-yellow">manual</span>
        <ChevronDownIcon className="size-4 shrink-0 text-primary-300" />
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Onde você está?"
        description="Escolha o ponto de partida. Durante a navegação, o app acompanha seus passos a partir daqui."
      >
        <div className="flex flex-col gap-3">
          <SearchField label="Buscar local de partida" name="origem" placeholder="Sala, laboratório, entrada…" value={query} onChange={(event) => setQuery(event.target.value)} />
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setPickingOrigin(true);
            }}
            className="flex items-center gap-3 rounded-xl border border-dashed border-primary-300 px-3 py-2.5 text-left text-sm transition-colors hover:border-primary-500 hover:bg-primary-400 hover:text-primary-500"
          >
            <LocateFixedIcon className="size-5" />
            Escolher no mapa
          </button>
          <div role="listbox" aria-label="Locais de partida" className="-mx-2 max-h-[45vh] overflow-y-auto scrollbar-thin">
            {options.map((place) => (
              <PlaceRow
                key={place.id}
                place={place}
                active={place.id === originId}
                onSelect={() => {
                  setOrigin(place.id);
                  setOpen(false);
                  setQuery("");
                }}
              />
            ))}
          </div>
        </div>
      </Modal>
    </>
  );
}
