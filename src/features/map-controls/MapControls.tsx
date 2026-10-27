"use client";

import { LayersIcon, LocateFixedIcon, MinusIcon, PlusIcon, RotateCcwIcon, RotateCwIcon } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { Surface } from "@/components/ui/Surface";
import { useNavigationStore, type ViewMode } from "@/store/navigation";

const modes: { id: ViewMode; label: string; hint: string }[] = [
  { id: "2d", label: "2D", hint: "Planta baixa (vista de cima)" },
  { id: "2.5d", label: "2.5D", hint: "Câmera inclinada, ideal para navegar" },
  { id: "3d", label: "3D", hint: "Andares empilhados em camadas" },
];

/** Coluna de controles: modo de visualização, zoom, rotação, centralizar e separar andares. */
export function MapControls() {
  const viewMode = useNavigationStore((state) => state.viewMode);
  const separated = useNavigationStore((state) => state.separated);
  const setViewMode = useNavigationStore((state) => state.setViewMode);
  const toggleSeparated = useNavigationStore((state) => state.toggleSeparated);
  const commandCamera = useNavigationStore((state) => state.commandCamera);
  const navigating = useNavigationStore((state) => state.status !== "idle");

  return (
    <div className="flex flex-col items-end gap-2">
      <Surface role="radiogroup" aria-label="Modo de visualização" className="flex flex-col gap-0.5 p-1">
        {modes.map((mode) => (
          <button
            key={mode.id}
            type="button"
            role="radio"
            aria-checked={viewMode === mode.id}
            title={mode.hint}
            onClick={() => setViewMode(mode.id)}
            className={`h-9 w-11 rounded-xl text-xs font-semibold transition-all lg:w-10 ${
              viewMode === mode.id ? "bg-primary-500 text-primary-50 shadow-md shadow-primary-500/30" : "text-primary-600 hover:bg-primary-100"
            }`}
          >
            {mode.label}
          </button>
        ))}
      </Surface>

      <Surface className="flex flex-col p-1">
        <IconButton label="Aproximar" onClick={() => commandCamera({ type: "zoom", factor: 0.7 })}>
          <PlusIcon className="size-5" />
        </IconButton>
        <IconButton label="Afastar" onClick={() => commandCamera({ type: "zoom", factor: 1.4 })}>
          <MinusIcon className="size-5" />
        </IconButton>
      </Surface>

      <Surface className="flex flex-col p-1">
        <IconButton label="Girar para a esquerda" disabled={navigating} onClick={() => commandCamera({ type: "rotate", delta: Math.PI / 4 })}>
          <RotateCcwIcon className="size-5" />
        </IconButton>
        <IconButton label="Girar para a direita" disabled={navigating} onClick={() => commandCamera({ type: "rotate", delta: -Math.PI / 4 })}>
          <RotateCwIcon className="size-5" />
        </IconButton>
        <IconButton label="Separar andares" active={separated} disabled={viewMode !== "3d" || navigating} onClick={toggleSeparated}>
          <LayersIcon className="size-5" />
        </IconButton>
      </Surface>

      <Surface className="p-1">
        <IconButton label="Centralizar na minha localização" disabled={navigating} onClick={() => commandCamera({ type: "recenter" })}>
          <LocateFixedIcon className="size-5" />
        </IconButton>
      </Surface>
    </div>
  );
}
