"use client";

import { CheckIcon, PartyPopperIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getBuildingName, getPlace } from "@/features/campus/api";
import { floorName } from "@/features/campus/labels";
import { formatDistance } from "@/lib/format";
import { useNavigationStore } from "@/store/navigation";
import { ManeuverIcon } from "./ManeuverIcon";

/** Instrução atual em destaque, no topo da tela (estilo apps de trânsito). */
export function InstructionBanner() {
  const provider = useNavigationStore((state) => state.provider);
  const stepIndex = useNavigationStore((state) => state.stepIndex);
  const status = useNavigationStore((state) => state.status);
  const awaiting = useNavigationStore((state) => state.awaitingConfirmation);
  const remaining = useNavigationStore((state) => state.remainingDistance);
  const currentLevel = useNavigationStore((state) => state.currentLevel);
  const currentArea = useNavigationStore((state) => state.currentArea);
  const confirmFloorChange = useNavigationStore((state) => state.confirmFloorChange);
  const stopNavigation = useNavigationStore((state) => state.stopNavigation);
  if (!provider) return null;

  const { route } = provider;
  const destination = getPlace(route.destinationId);

  if (status === "arrived") {
    return (
      <div role="status" className="animate-pop-in rounded-2xl bg-secondary-green p-4 text-primary-50 shadow-xl sm:p-5">
        <div className="flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-50/20">
            <PartyPopperIcon className="size-6" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-lg leading-tight font-semibold">Você chegou!</p>
            <p className="text-sm opacity-90">{destination?.name}</p>
          </div>
          <button type="button" onClick={stopNavigation} className="rounded-xl bg-primary-50 px-4 py-2.5 text-sm font-semibold text-secondary-green">
            Concluir
          </button>
        </div>
      </div>
    );
  }

  const step = route.steps[stepIndex];
  const next = route.steps[stepIndex + 1];
  const walkedNow = route.track.walked.at(-1)! - remaining;
  const toNext = next ? Math.max(0, route.track.walked[next.nodeIndex] - walkedNow) : 0;
  const where = currentArea === "EXT" ? "Área externa" : `${getBuildingName(currentArea)} · ${floorName(currentLevel)}`;

  if (awaiting && step?.requiresConfirmation) {
    return (
      <div role="alert" className="animate-pop-in rounded-2xl bg-secondary-yellow p-4 text-primary-50 shadow-xl sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-50/20">
            <ManeuverIcon kind={step.kind} className="size-7" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium tracking-wide uppercase opacity-90">Troca de andar</p>
            <p className="text-lg leading-snug font-semibold">{step.text}</p>
          </div>
        </div>
        <Button variant="secondary" className="mt-3 w-full border-0 font-semibold text-secondary-yellow" onClick={confirmFloorChange}>
          <CheckIcon className="size-5" strokeWidth={2} />
          Cheguei {step.targetLevel === 0 ? "ao térreo" : `ao ${floorName(step.targetLevel ?? 0)}`}
        </Button>
      </div>
    );
  }

  // Logo após uma manobra, mostra a instrução atual; depois, a próxima com a distância até ela.
  const sinceStep = walkedNow - route.track.walked[step.nodeIndex];
  const shown = next && sinceStep > 3 ? next : step;
  const after = shown === next ? route.steps[stepIndex + 2] : next;

  return (
    <div className="animate-pop-in overflow-hidden rounded-2xl bg-primary-500 text-primary-50 shadow-xl shadow-primary-500/30">
      <div className="flex items-center gap-3 p-4 sm:p-5">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-50/15">
          <ManeuverIcon kind={shown.kind} className="size-7" />
        </span>
        <div className="min-w-0 flex-1">
          {shown === next && toNext > 1 && <p className="text-sm font-semibold tabular-nums opacity-90">Em {formatDistance(toNext)}</p>}
          <p className="text-lg leading-snug font-semibold">{shown.text}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 bg-primary-550/35 px-4 py-2 text-sm sm:px-5">
        <span className="truncate">{after ? <>Depois: {after.text}</> : "Destino à frente"}</span>
        <span className="shrink-0 rounded-md bg-primary-50/15 px-2 py-0.5 text-xs font-medium">{where}</span>
      </div>
    </div>
  );
}
