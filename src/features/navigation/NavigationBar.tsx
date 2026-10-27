"use client";

import { useState } from "react";
import { ChevronUpIcon, FootprintsIcon, PauseIcon, PlayIcon, SkipForwardIcon, Undo2Icon, XIcon } from "lucide-react";
import { Surface } from "@/components/ui/Surface";
import { formatArrival, formatDistance, formatWalkTime } from "@/lib/format";
import { useNavigationStore } from "@/store/navigation";
import { WALK_SPEED } from "./constants";
import { StepList } from "./StepList";

/** Barra inferior da navegação: tempo/distância restantes e controles da simulação. */
export function NavigationBar() {
  const provider = useNavigationStore((state) => state.provider);
  const playing = useNavigationStore((state) => state.playing);
  const remaining = useNavigationStore((state) => state.remainingDistance);
  const stepIndex = useNavigationStore((state) => state.stepIndex);
  const status = useNavigationStore((state) => state.status);
  const awaiting = useNavigationStore((state) => state.awaitingConfirmation);
  const speed = useNavigationStore((state) => state.provider?.speed ?? 1);
  const togglePlaying = useNavigationStore((state) => state.togglePlaying);
  const skipStep = useNavigationStore((state) => state.skipStep);
  const cycleSpeed = useNavigationStore((state) => state.cycleSpeed);
  const stopNavigation = useNavigationStore((state) => state.stopNavigation);
  const stepBack = useNavigationStore((state) => state.stepBack);
  const steps = useNavigationStore((state) => state.steps);
  const sensorStatus = useNavigationStore((state) => state.sensorStatus);
  const [showSteps, setShowSteps] = useState(false);
  if (!provider) return null;

  const { route } = provider;
  // Tempo restante proporcional à distância que falta (inclui esperas de elevador).
  const totalWalk = route.track.walked.at(-1)!;
  const seconds = totalWalk > 0 ? (route.seconds * remaining) / totalWalk : remaining / WALK_SPEED;
  const arrived = status === "arrived";
  const pedometer = provider.source === "pedometer";

  return (
    <Surface className="animate-fade-up overflow-hidden">
      {showSteps && (
        <div className="max-h-[40dvh] animate-fade-in overflow-y-auto border-b border-primary-200 p-2 scrollbar-thin">
          <StepList route={route} currentIndex={stepIndex} />
        </div>
      )}
      {pedometer && sensorStatus === "no-data" && (
        <p role="alert" className="border-b border-primary-200 bg-secondary-lightred px-4 py-2 text-sm text-secondary-red">
          Nenhum dado do acelerômetro. Abra no celular (por https://) ou use os botões para avançar.
        </p>
      )}
      {pedometer && sensorStatus === "waiting" && !arrived && (
        <p className="border-b border-primary-200 bg-primary-400 px-4 py-2 text-sm text-primary-500">
          Segure o celular e comece a andar: cada passo avança o marcador.
        </p>
      )}
      <div className="flex items-center gap-2 p-3 sm:gap-3 sm:p-4">
        <button type="button" onClick={() => setShowSteps((value) => !value)} aria-expanded={showSteps} className="min-w-0 flex-1 rounded-xl px-1 text-left">
          <span className="flex items-baseline gap-2">
            <span className="text-xl font-semibold text-secondary-green tabular-nums">{arrived ? "Chegou" : formatWalkTime(seconds)}</span>
            <span className="text-sm text-primary-300 tabular-nums">
              {formatDistance(remaining)} · chegada {formatArrival(seconds)}
            </span>
          </span>
          <span className="mt-0.5 flex items-center gap-1 text-xs text-primary-300">
            {pedometer ? (
              <span className="flex items-center gap-1 rounded bg-primary-400 px-1.5 py-0.5 font-medium text-primary-500 tabular-nums">
                <FootprintsIcon className="size-3.5" />
                {steps} passos · estimado
              </span>
            ) : (
              <span className="rounded bg-secondary-lightyellow px-1.5 py-0.5 font-medium text-secondary-yellow">Localização simulada</span>
            )}
            <ChevronUpIcon className={`size-3.5 transition-transform ${showSteps ? "" : "rotate-180"}`} />
            Passos
          </span>
        </button>

        <div className="flex items-center gap-1">
          {pedometer ? (
            <button
              type="button"
              onClick={stepBack}
              disabled={arrived || awaiting}
              aria-label="Voltar 2 metros"
              title="O marcador passou de onde você está? Volte 2 m"
              className="flex size-11 items-center justify-center rounded-xl text-primary-600 transition-colors hover:bg-primary-100 disabled:opacity-40"
            >
              <Undo2Icon className="size-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={cycleSpeed}
              disabled={arrived}
              title="Velocidade da simulação"
              className="h-11 w-12 rounded-xl text-sm font-semibold text-primary-600 tabular-nums transition-colors hover:bg-primary-100 disabled:opacity-40"
            >
              {speed}×
            </button>
          )}
          <button
            type="button"
            onClick={skipStep}
            disabled={arrived || awaiting}
            aria-label="Avançar para a próxima instrução"
            title="Avançar para a próxima instrução"
            className="flex size-11 items-center justify-center rounded-xl text-primary-600 transition-colors hover:bg-primary-100 disabled:opacity-40"
          >
            <SkipForwardIcon className="size-5" />
          </button>
          {!pedometer && (
            <button
              type="button"
              onClick={togglePlaying}
              disabled={arrived}
              aria-label={playing ? "Pausar simulação" : "Simular deslocamento"}
              title={playing ? "Pausar simulação" : "Simular deslocamento automático"}
              className="flex size-12 items-center justify-center rounded-full bg-primary-500 text-primary-50 shadow-md shadow-primary-500/30 transition-all hover:bg-primary-500/90 active:scale-95 disabled:opacity-40"
            >
              {playing ? <PauseIcon className="size-5 fill-current" /> : <PlayIcon className="ml-0.5 size-5 fill-current" />}
            </button>
          )}
          <button
            type="button"
            onClick={stopNavigation}
            aria-label="Encerrar navegação"
            title="Encerrar navegação"
            className="ml-1 flex h-11 items-center gap-1.5 rounded-xl border border-secondary-red/30 px-3 text-sm font-medium text-secondary-red transition-colors hover:bg-secondary-lightred"
          >
            <XIcon className="size-4.5" />
            <span className="max-sm:hidden">Encerrar</span>
          </button>
        </div>
      </div>
    </Surface>
  );
}
