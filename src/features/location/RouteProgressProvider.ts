import { WALK_SPEED } from "@/features/navigation/constants";
import type { Route } from "@/features/navigation/types";
import type { IndoorPosition, LocationProvider, LocationSource } from "./types";

/** Velocidade ao pular para a próxima instrução (m/s). */
const SKIP_SPEED = 14;
/** Velocidade com que o marcador alcança os passos detectados (m/s): suaviza os "pulos". */
const STEP_CATCH_UP_SPEED = 2.5;
/** Duração da animação de troca de andar (s). */
const FLOOR_CHANGE_SECONDS = 1.8;
const EPSILON = 1e-4;

/**
 * Posição ao longo da rota calculada. Duas fontes usam esta classe:
 * - "simulated": `play()` faz o ponto andar sozinho (demonstração);
 * - "pedometer": cada passo detectado no celular chama `advance(passo)`.
 *
 * Em ambos os casos a posição fica presa à rota: se a pessoa sair do caminho,
 * o app não percebe. Avança por `tick(dt)`, chamado a cada quadro pela cena 3D,
 * e para em cada troca de andar até `confirmFloorChange()`.
 */
export class RouteProgressProvider implements LocationProvider {
  progress = 0;
  playing = false;
  /** Multiplicador da velocidade de caminhada. */
  speed = 2;
  position: IndoorPosition;

  private target = 0;
  private stops: number[];
  private unlockedThrough = -1;
  /** Início do andar atual no trajeto (fim da última troca de andar). */
  private floorBase = 0;
  private transition: { from: number; to: number; elapsed: number } | null = null;
  private listeners = new Set<(position: IndoorPosition) => void>();

  constructor(
    readonly route: Route,
    readonly source: LocationSource = "simulated",
  ) {
    this.stops = route.steps.filter((step) => step.requiresConfirmation).map((step) => step.progress);
    this.position = this.positionAt(0);
  }

  subscribe(listener: (position: IndoorPosition) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  get length() {
    return this.route.track.length;
  }

  get arrived() {
    return this.progress >= this.length - EPSILON;
  }

  /** Parado na escada/elevador esperando a confirmação. */
  get awaitingConfirmation() {
    const stop = this.nextStop();
    return !this.transition && stop !== undefined && this.progress >= stop - EPSILON;
  }

  get stepIndex() {
    const { steps } = this.route;
    let index = 0;
    for (let i = 0; i < steps.length; i++) if (steps[i].progress <= this.progress + 0.01) index = i;
    return index;
  }

  /** Metros a pé que faltam até o destino. */
  get remainingDistance() {
    return Math.max(0, this.route.track.walked.at(-1)! - this.walkedAt(this.progress));
  }

  play() {
    if (!this.arrived) this.playing = true;
  }

  pause() {
    this.playing = false;
  }

  /** Anda `meters` para a frente (um passo detectado). Ignorado na escada/elevador. */
  advance(meters: number) {
    if (this.transition || this.awaitingConfirmation || this.arrived) return;
    this.target = Math.min(this.length, Math.max(this.target, this.progress) + meters);
  }

  /** Volta `meters` (correção manual), sem desfazer uma troca de andar já confirmada. */
  retreat(meters: number) {
    if (this.transition) return;
    this.playing = false;
    this.target = Math.max(this.floorBase, Math.min(this.target, this.progress) - meters);
  }

  skipToNextStep() {
    const next = this.route.steps.find((step) => step.progress > this.progress + 0.5);
    this.playing = false;
    if (next) this.target = next.progress;
  }

  confirmFloorChange() {
    if (!this.awaitingConfirmation) return;
    const stop = this.nextStop()!;
    const leg = this.route.legs.find((item) => item.kind === "vertical" && Math.abs(this.route.track.at[item.start] - stop) < EPSILON);
    this.unlockedThrough = stop;
    const to = leg ? this.route.track.at[leg.end] : stop;
    this.transition = { from: this.progress, to, elapsed: 0 };
    this.floorBase = to;
    this.target = to;
  }

  tick(dt: number) {
    const before = this.progress;

    if (this.transition) {
      const transition = this.transition;
      transition.elapsed += dt;
      const t = Math.min(1, transition.elapsed / FLOOR_CHANGE_SECONDS);
      // Suaviza início e fim da subida/descida.
      const eased = t * t * (3 - 2 * t);
      this.progress = transition.from + (transition.to - transition.from) * eased;
      if (t >= 1) this.transition = null;
    } else {
      const goal = Math.min(this.playing ? this.length : this.target, this.nextStop() ?? Infinity);
      const speed = this.playing ? WALK_SPEED * this.speed : this.source === "pedometer" ? STEP_CATCH_UP_SPEED : SKIP_SPEED;
      if (this.progress < goal) this.progress = Math.min(goal, this.progress + speed * dt);
      else if (this.progress > goal) this.progress = Math.max(goal, this.progress - speed * dt);
      if (this.arrived) this.playing = false;
    }

    if (this.progress !== before) {
      this.position = this.positionAt(this.progress);
      for (const listener of this.listeners) listener(this.position);
    }
  }

  private nextStop() {
    return this.stops.find((stop) => stop > this.unlockedThrough + EPSILON);
  }

  private segmentAt(progress: number) {
    const { at } = this.route.track;
    let low = 0;
    let high = at.length - 2;
    while (low < high) {
      const mid = (low + high + 1) >> 1;
      if (at[mid] <= progress) low = mid;
      else high = mid - 1;
    }
    const span = at[low + 1] - at[low];
    return { index: low, t: span > 0 ? Math.min(1, Math.max(0, (progress - at[low]) / span)) : 1 };
  }

  private walkedAt(progress: number) {
    const { index, t } = this.segmentAt(progress);
    const { walked } = this.route.track;
    return walked[index] + (walked[index + 1] - walked[index]) * t;
  }

  positionAt(progress: number): IndoorPosition {
    const { nodes } = this.route;
    if (nodes.length < 2) {
      const only = nodes[0];
      return { area: only.area, level: only.level, x: only.x, z: only.z, heading: 0, source: this.source, timestamp: Date.now() };
    }
    const { index, t } = this.segmentAt(progress);
    const a = nodes[index];
    const b = nodes[index + 1];

    // Direção do último trecho horizontal (na troca de andar mantém a anterior).
    let heading = 0;
    for (let i = index; i >= 0; i--) {
      const from = nodes[i];
      const to = nodes[i + 1];
      if (from.x !== to.x || from.z !== to.z) {
        heading = Math.atan2(to.x - from.x, to.z - from.z);
        break;
      }
    }
    if (index === 0 && a.x === b.x && a.z === b.z) heading = 0;

    return {
      area: t < 0.5 ? a.area : b.area,
      level: a.level + (b.level - a.level) * t,
      x: a.x + (b.x - a.x) * t,
      z: a.z + (b.z - a.z) * t,
      heading,
      source: this.source,
      timestamp: Date.now(),
    };
  }
}
