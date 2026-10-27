"use client";

import { LayersIcon } from "lucide-react";
import { Surface } from "@/components/ui/Surface";
import { campus, getPlace } from "@/features/campus/api";
import { floorName, floorShortName } from "@/features/campus/labels";
import type { BuildingId } from "@/features/campus/types";
import { useNavigationStore } from "@/store/navigation";

/** Seletor de bloco e de andar, com marcas de origem e destino da rota. */
export function FloorSelector() {
  const activeBuilding = useNavigationStore((state) => state.activeBuilding);
  const activeLevel = useNavigationStore((state) => state.activeLevel);
  const viewMode = useNavigationStore((state) => state.viewMode);
  const status = useNavigationStore((state) => state.status);
  const currentLevel = useNavigationStore((state) => state.currentLevel);
  const route = useNavigationStore((state) => state.route);
  const originId = useNavigationStore((state) => state.originId);
  const destinationId = useNavigationStore((state) => state.destinationId);
  const selectBuilding = useNavigationStore((state) => state.selectBuilding);
  const selectLevel = useNavigationStore((state) => state.selectLevel);
  // Re-renderiza ao trocar de local (os dados de `campus` mudam junto).
  useNavigationStore((state) => state.siteId);

  const blocks: { id: BuildingId | null; label: string }[] = [
    { id: null, label: "Todos" },
    ...campus.buildings.map((building) => ({ id: building.id, label: building.id })),
  ];

  const navigating = status !== "idle";
  const buildings = activeBuilding ? campus.buildings.filter((building) => building.id === activeBuilding) : campus.buildings;
  const levels = [...new Set(buildings.flatMap((building) => building.floors.map((floor) => floor.level)))].sort((a, b) => b - a);
  const originLevel = getPlace(originId)?.level;
  const destinationLevel = destinationId ? getPlace(destinationId)?.level : undefined;
  const selected = navigating ? currentLevel : viewMode === "3d" ? activeLevel : (activeLevel ?? 0);

  return (
    <Surface className="flex w-14 flex-col items-stretch gap-1 p-1 lg:w-13">
      <div role="radiogroup" aria-label="Bloco" className={`flex flex-col gap-0.5 border-b border-primary-200 pb-1 ${campus.buildings.length < 2 ? "hidden" : ""}`}>
        {blocks.map((block) => (
          <button
            key={block.label}
            type="button"
            role="radio"
            aria-checked={activeBuilding === block.id}
            disabled={navigating}
            onClick={() => selectBuilding(block.id)}
            title={block.id ? `Bloco ${block.id}` : "Todos os blocos"}
            className={`h-8 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 ${
              activeBuilding === block.id ? "bg-primary-400 text-primary-500" : "text-primary-300 hover:bg-primary-100 hover:text-primary-600"
            }`}
          >
            {block.id ? `Bl. ${block.label}` : block.label}
          </button>
        ))}
      </div>

      <div role="radiogroup" aria-label="Andar" className="flex flex-col gap-0.5">
        {levels.map((level) => {
          const inRoute = route?.floors.some((floor) => floor.level === level);
          return (
            <button
              key={level}
              type="button"
              role="radio"
              aria-checked={selected === level}
              aria-label={floorName(level)}
              title={floorName(level)}
              disabled={navigating}
              onClick={() => selectLevel(selected === level && viewMode === "3d" ? null : level)}
              className={`relative h-10 rounded-xl text-base font-semibold transition-all disabled:cursor-default ${
                selected === level
                  ? "bg-primary-500 text-primary-50 shadow-md shadow-primary-500/30"
                  : inRoute
                    ? "text-primary-500 hover:bg-primary-100"
                    : "text-primary-600 hover:bg-primary-100"
              }`}
            >
              {floorShortName(level)}
              {/* Marcas: azul = você, vermelho = destino. */}
              <span className="absolute top-1 right-1 flex gap-0.5">
                {originLevel === level && !navigating && <span className="size-1.5 rounded-full bg-primary-500 ring-1 ring-primary-50" />}
                {destinationLevel === level && <span className="size-1.5 rounded-full bg-secondary-red ring-1 ring-primary-50" />}
              </span>
            </button>
          );
        })}
      </div>

      {viewMode === "3d" && (
        <button
          type="button"
          aria-pressed={activeLevel === null}
          disabled={navigating}
          onClick={() => selectLevel(null)}
          title="Mostrar todos os andares"
          className={`flex h-9 items-center justify-center rounded-lg border-t border-primary-200 transition-colors disabled:opacity-40 ${
            activeLevel === null && !navigating ? "text-primary-500" : "text-primary-300 hover:text-primary-600"
          }`}
        >
          <LayersIcon className="size-5" />
        </button>
      )}
    </Surface>
  );
}
