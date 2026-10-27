import { formatDistance } from "@/lib/format";
import { ManeuverIcon } from "./ManeuverIcon";
import type { Route } from "./types";

/** Lista de instruções da rota; destaca o passo atual durante a navegação. */
export function StepList({ route, currentIndex }: { route: Route; currentIndex?: number }) {
  const { steps, track } = route;
  return (
    <ol className="flex flex-col">
      {steps.map((step, index) => {
        const next = steps[index + 1];
        const meters = next ? track.walked[next.nodeIndex] - track.walked[step.nodeIndex] : 0;
        const current = index === currentIndex;
        const done = currentIndex !== undefined && index < currentIndex;
        const vertical = step.requiresConfirmation;
        return (
          <li key={step.id} className={`flex gap-3 rounded-xl px-2 py-2 transition-colors ${current ? "bg-primary-400" : ""} ${done ? "opacity-45" : ""}`}>
            <span
              className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${
                step.kind === "arrive"
                  ? "bg-secondary-lightred text-secondary-red"
                  : vertical
                    ? "bg-secondary-lightyellow text-secondary-yellow"
                    : "bg-primary-100 text-primary-500"
              }`}
            >
              <ManeuverIcon kind={step.kind} className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block text-sm leading-snug ${current ? "font-semibold text-primary-550" : ""}`}>{step.text}</span>
              {meters > 1 && <span className="text-xs text-primary-300 tabular-nums">{formatDistance(meters)}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
