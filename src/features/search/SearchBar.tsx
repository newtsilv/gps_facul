"use client";

import { useId, useMemo, useRef, useState } from "react";
import { SearchIcon, XIcon } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Surface } from "@/components/ui/Surface";
import { campus, getPlace } from "@/features/campus/api";
import { roomIcons } from "@/features/campus/roomIcons";
import { useNavigationStore } from "@/store/navigation";
import { PlaceRow } from "./PlaceRow";
import { quickCategories, searchPlaces } from "./search";
import { usePlaceDistances } from "./usePlaceDistances";

/** Barra "Para onde você quer ir?" com sugestões e atalhos por categoria. */
export function SearchBar() {
  const destinationId = useNavigationStore((state) => state.destinationId);
  const selectDestination = useNavigationStore((state) => state.selectDestination);
  const distances = usePlaceDistances();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const destination = destinationId ? getPlace(destinationId) : undefined;
  const results = useMemo(() => searchPlaces(query, campus.places, distances), [query, distances]);

  function choose(placeId: string) {
    selectDestination(placeId);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }

  function clear() {
    setQuery("");
    selectDestination(null);
    inputRef.current?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && results[active]) {
      choose(results[active].place.id);
    } else if (event.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  const showPanel = open && (query.length > 0 || !destination);

  return (
    <div className="relative w-full">
      <Surface className="flex h-14 items-center gap-2 pr-2 pl-2.5">
        <span className="max-sm:hidden">
          <Logo compact />
        </span>
        <SearchIcon className="ml-1 size-5 shrink-0 text-primary-300 sm:hidden" />
        <label className="min-w-0 flex-1">
          <span className="sr-only">Buscar destino</span>
          <input
            ref={inputRef}
            type="search"
            role="combobox"
            aria-expanded={showPanel}
            aria-controls={listId}
            aria-autocomplete="list"
            enterKeyHint="search"
            autoComplete="off"
            placeholder={destination ? destination.name : "Para onde você quer ir?"}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={handleKeyDown}
            className={`h-12 w-full bg-transparent px-2 text-base outline-none [&::-webkit-search-cancel-button]:hidden ${
              destination && !query ? "placeholder:font-medium placeholder:text-primary-600" : "placeholder:text-primary-300"
            }`}
          />
        </label>
        {(query || destination) && (
          <button
            type="button"
            onClick={clear}
            aria-label="Limpar busca"
            className="rounded-lg p-2 text-primary-300 transition-colors hover:bg-primary-100 hover:text-primary-600"
          >
            <XIcon className="size-5" />
          </button>
        )}
      </Surface>

      {showPanel && (
        <Surface
          // Mantém o foco no campo ao clicar num resultado.
          onMouseDown={(event) => event.preventDefault()}
          className="absolute inset-x-0 top-full z-30 mt-2 max-h-[min(60vh,28rem)] animate-pop-in overflow-y-auto p-2 scrollbar-thin">
          {query ? (
            results.length > 0 ? (
              <div id={listId} role="listbox" aria-label="Destinos encontrados">
                {results.map((result, index) => (
                  <PlaceRow
                    key={result.place.id}
                    place={result.place}
                    distance={result.distance}
                    active={index === active}
                    onSelect={() => choose(result.place.id)}
                  />
                ))}
              </div>
            ) : (
              <p className="px-3 py-6 text-center text-sm text-primary-300">Nenhum ambiente encontrado para “{query}”.</p>
            )
          ) : (
            <div id={listId} className="p-2">
              <p className="mb-3 text-xs font-medium tracking-wide text-primary-300 uppercase">Buscar por categoria</p>
              <div className="flex flex-wrap gap-2">
                {quickCategories.map((category) => {
                  const Icon = roomIcons[category.type];
                  return (
                    <button
                      key={category.query}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => setQuery(category.query)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 px-3 py-1.5 text-sm transition-colors hover:border-primary-500 hover:bg-primary-400 hover:text-primary-500"
                    >
                      <Icon className="size-4" />
                      {category.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-4 text-xs text-primary-300">Dica: toque em uma sala no mapa para defini-la como destino.</p>
            </div>
          )}
        </Surface>
      )}
    </div>
  );
}
