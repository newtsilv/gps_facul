"use client";

import { useState } from "react";
import {
  AccessibilityIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  ClockIcon,
  FootprintsIcon,
  LayersIcon,
  MinusIcon,
  NavigationIcon,
  PlayIcon,
  PlusIcon,
  XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Surface } from "@/components/ui/Surface";
import { campus, getBuildingName, getPlace } from "@/features/campus/api";
import { floorName, roomTypeLabels } from "@/features/campus/labels";
import { roomIcons } from "@/features/campus/roomIcons";
import { formatDistance, formatWalkTime } from "@/lib/format";
import { useNavigationStore, type SensorStatus, type TrackingMode } from "@/store/navigation";
import { StepList } from "./StepList";

const trackingOptions: { id: TrackingMode; label: string; hint: string; icon: typeof FootprintsIcon }[] = [
  { id: "pedometer", label: "Andando", hint: "Conta seus passos pelo celular", icon: FootprintsIcon },
  { id: "simulated", label: "Simulação", hint: "O marcador anda sozinho", icon: PlayIcon },
];

const sensorMessages: Partial<Record<SensorStatus, string>> = {
  insecure: "Os sensores do celular só funcionam em página segura. Abra o app pelo endereço https:// (veja o README).",
  denied: "Acesso ao sensor de movimento negado. Libere nas configurações do navegador e tente de novo.",
  unsupported: "Este navegador não tem sensor de movimento. Use a simulação.",
};

/** Painel do destino escolhido: resumo da rota e botão "Iniciar navegação". */
export function RoutePanel() {
  const destinationId = useNavigationStore((state) => state.destinationId);
  const originId = useNavigationStore((state) => state.originId);
  const route = useNavigationStore((state) => state.route);
  const routeError = useNavigationStore((state) => state.routeError);
  const avoidStairs = useNavigationStore((state) => state.avoidStairs);
  const setAvoidStairs = useNavigationStore((state) => state.setAvoidStairs);
  const selectDestination = useNavigationStore((state) => state.selectDestination);
  const startNavigation = useNavigationStore((state) => state.startNavigation);
  const commandCamera = useNavigationStore((state) => state.commandCamera);
  const tracking = useNavigationStore((state) => state.tracking);
  const setTracking = useNavigationStore((state) => state.setTracking);
  const stepLength = useNavigationStore((state) => state.stepLength);
  const setStepLength = useNavigationStore((state) => state.setStepLength);
  const sensorStatus = useNavigationStore((state) => state.sensorStatus);
  const [showSteps, setShowSteps] = useState(false);

  const destination = destinationId ? getPlace(destinationId) : undefined;
  if (!destination) return null;
  const Icon = roomIcons[destination.type];
  const sameAsOrigin = destinationId === originId;
  const verticals = route?.legs.filter((leg) => leg.kind === "vertical") ?? [];
  // Local de um andar só (ex.: Oxygeni Hub): sem escadas, andares nem rota acessível.
  const multiFloor = campus.buildings.some((building) => building.floors.length > 1);

  return (
    <Surface key={destination.id} className="flex max-h-[min(70dvh,40rem)] animate-fade-up flex-col overflow-hidden">
      <div className="flex items-start gap-3 p-4 pb-3 sm:p-5 sm:pb-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary-lightred text-secondary-red">
          <Icon className="size-5.5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg leading-tight font-semibold text-primary-550">{destination.name}</h2>
          <p className="mt-0.5 text-sm text-primary-300">
            {getBuildingName(destination.buildingId)} · {floorName(destination.level)} · {roomTypeLabels[destination.type]}
          </p>
          {destination.description && <p className="mt-1 text-sm">{destination.description}</p>}
        </div>
        <button
          type="button"
          onClick={() => selectDestination(null)}
          aria-label="Fechar destino"
          className="-mt-1 -mr-2 rounded-lg p-2 text-primary-300 transition-colors hover:bg-primary-100 hover:text-primary-600"
        >
          <XIcon className="size-5" />
        </button>
      </div>

      <div className="min-h-0 overflow-y-auto px-4 scrollbar-thin sm:px-5">
        {sameAsOrigin && <p className="rounded-xl bg-primary-100 p-3 text-sm">Você já está neste local.</p>}
        {routeError && <p className="rounded-xl bg-secondary-lightred p-3 text-sm text-secondary-red">{routeError}</p>}

        {route && (
          <>
            <dl className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-primary-100 px-3 py-2">
                <dt className="flex items-center gap-1 text-xs text-primary-300">
                  <FootprintsIcon className="size-3.5" /> Distância
                </dt>
                <dd className="text-base font-semibold tabular-nums">{formatDistance(route.distance)}</dd>
              </div>
              <div className="rounded-xl bg-primary-100 px-3 py-2">
                <dt className="flex items-center gap-1 text-xs text-primary-300">
                  <ClockIcon className="size-3.5" /> A pé
                </dt>
                <dd className="text-base font-semibold tabular-nums">{formatWalkTime(route.seconds)}</dd>
              </div>
              <div className="rounded-xl bg-primary-100 px-3 py-2">
                <dt className="flex items-center gap-1 text-xs text-primary-300">
                  <LayersIcon className="size-3.5" /> Andares
                </dt>
                <dd className="text-base font-semibold tabular-nums">{new Set(route.floors.map((floor) => `${floor.buildingId}${floor.level}`)).size}</dd>
              </div>
            </dl>

            {multiFloor && (
              <p className="mt-3 flex flex-wrap items-center gap-1.5 text-sm">
                {route.floors.map((floor, index) => (
                  <span key={`${floor.buildingId}${floor.level}`} className="flex items-center gap-1.5">
                    {index > 0 && <ArrowRightIcon className="size-3.5 text-primary-300" />}
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${index === route.floors.length - 1 ? "bg-secondary-lightred text-secondary-red" : "bg-primary-400 text-primary-500"}`}>
                      {getBuildingName(floor.buildingId)} · {floorName(floor.level)}
                    </span>
                  </span>
                ))}
              </p>
            )}
            {verticals.length > 0 && (
              <p className="mt-2 text-xs text-primary-300">
                Troca de andar por {[...new Set(verticals.map((leg) => leg.via))].join(" e ")}.
              </p>
            )}
          </>
        )}

        {multiFloor && (
          <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-primary-200 px-3 py-2.5 text-sm">
            <span className="flex items-center gap-2">
              <AccessibilityIcon className="size-4.5 text-primary-500" />
              Rota acessível (evitar escadas)
            </span>
            <input
              type="checkbox"
              role="switch"
              checked={avoidStairs}
              onChange={(event) => setAvoidStairs(event.target.checked)}
              className="peer sr-only"
            />
            <span
              aria-hidden
              className="relative h-6 w-11 shrink-0 rounded-full bg-primary-200 transition-colors duration-200 peer-checked:bg-primary-500 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500/40 after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-primary-50 after:shadow after:transition-transform after:duration-200 peer-checked:after:translate-x-5"
            />
          </label>
        )}

        {route && (
          <div className="mt-3">
            <p className="mb-1.5 text-xs font-medium text-primary-300">Como acompanhar sua posição</p>
            <div role="radiogroup" aria-label="Modo de acompanhamento" className="grid grid-cols-2 gap-1 rounded-xl bg-primary-100 p-1">
              {trackingOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={tracking === option.id}
                  title={option.hint}
                  onClick={() => setTracking(option.id)}
                  className={`flex h-9 items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-all ${
                    tracking === option.id ? "bg-primary-50 text-primary-500 shadow-sm" : "text-primary-300 hover:text-primary-600"
                  }`}
                >
                  <option.icon className="size-4" />
                  {option.label}
                </button>
              ))}
            </div>

            {tracking === "pedometer" && (
              <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-primary-200 px-3 py-2 text-sm">
                <span>
                  Tamanho do passo
                  <span className="block text-xs text-primary-300">Ajuste se o marcador adiantar ou atrasar</span>
                </span>
                <span className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Diminuir passo"
                    onClick={() => setStepLength(stepLength - 0.05)}
                    className="rounded-lg p-1.5 text-primary-600 hover:bg-primary-100"
                  >
                    <MinusIcon className="size-4" />
                  </button>
                  <span className="w-12 text-center font-semibold tabular-nums">{Math.round(stepLength * 100)} cm</span>
                  <button
                    type="button"
                    aria-label="Aumentar passo"
                    onClick={() => setStepLength(stepLength + 0.05)}
                    className="rounded-lg p-1.5 text-primary-600 hover:bg-primary-100"
                  >
                    <PlusIcon className="size-4" />
                  </button>
                </span>
              </div>
            )}

            {sensorMessages[sensorStatus] && (
              <p role="alert" className="mt-2 rounded-xl bg-secondary-lightred p-3 text-sm text-secondary-red">
                {sensorMessages[sensorStatus]}
              </p>
            )}
          </div>
        )}

        {route && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setShowSteps((value) => !value)}
              aria-expanded={showSteps}
              className="flex w-full items-center justify-between rounded-lg px-1 py-2 text-sm font-medium text-primary-500"
            >
              {showSteps ? "Ocultar instruções" : `Ver ${route.steps.length} instruções`}
              <ChevronDownIcon className={`size-4 transition-transform duration-300 ${showSteps ? "rotate-180" : ""}`} />
            </button>
            {showSteps && (
              <div className="animate-fade-in pb-2">
                <StepList route={route} />
              </div>
            )}
          </div>
        )}
      </div>

      {route && (
        <div className="flex gap-2 border-t border-primary-200 p-4 sm:px-5">
          <Button variant="secondary" className="px-4" onClick={() => commandCamera({ type: "route" })} aria-label="Ver rota inteira">
            <LayersIcon className="size-5" />
          </Button>
          <Button className="flex-1" onClick={startNavigation}>
            <NavigationIcon className="size-5" />
            Iniciar navegação
          </Button>
        </div>
      )}
    </Surface>
  );
}
