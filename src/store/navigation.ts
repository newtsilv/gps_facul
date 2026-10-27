"use client";

import { create } from "zustand";
import { getPlace } from "@/features/campus/api";
import type { AreaId, BuildingId } from "@/features/campus/types";
import { getSite, sites } from "@/features/campus/sites";
import { RouteProgressProvider } from "@/features/location/RouteProgressProvider";
import { StepDetector } from "@/features/location/StepDetector";
import { sceneState } from "@/features/map/sceneState";
import { computeRoute, switchSite } from "@/features/navigation/route";
import type { Route } from "@/features/navigation/types";

export type ViewMode = "2d" | "2.5d" | "3d";

/** Pedidos de movimento de câmera, executados pelo `CameraRig` dentro da cena. */
export type CameraCommand =
  | { type: "overview"; buildingId?: BuildingId | null }
  | { type: "focus-place"; placeId: string }
  | { type: "focus-floor"; buildingId: BuildingId | null; level: number }
  | { type: "route" }
  | { type: "view" }
  | { type: "rotate"; delta: number }
  | { type: "zoom"; factor: number }
  | { type: "recenter" };

export type NavigationStatus = "idle" | "active" | "arrived";

/** Como a posição avança durante a navegação. */
export type TrackingMode = "pedometer" | "simulated";

/**
 * Situação do sensor de passos: "waiting" até chegar o primeiro dado;
 * "no-data" quando nada chega (computador sem acelerômetro).
 */
export type SensorStatus = "off" | "waiting" | "active" | "no-data" | "denied" | "insecure" | "unsupported";

const STEP_LENGTH_KEY = "campusnav:passo";
const DEFAULT_STEP_LENGTH = 0.7;

function savedStepLength() {
  try {
    const value = Number(localStorage.getItem(STEP_LENGTH_KEY));
    return value >= 0.4 && value <= 1.1 ? value : DEFAULT_STEP_LENGTH;
  } catch {
    return DEFAULT_STEP_LENGTH;
  }
}

/** Celular com acelerômetro: navega por passos; no computador, por simulação. */
function defaultTracking(): TrackingMode {
  if (typeof window === "undefined") return "simulated";
  return StepDetector.isSupported() && navigator.maxTouchPoints > 0 ? "pedometer" : "simulated";
}

/** Detector ativo (fora do estado: não é serializável e não precisa re-renderizar). */
let detector: StepDetector | null = null;
let noDataTimer: ReturnType<typeof setTimeout> | undefined;

function stopDetector() {
  detector?.stop();
  detector = null;
  clearTimeout(noDataTimer);
}

type NavigationState = {
  /** Local ativo (ver `features/campus/sites.ts`). */
  siteId: string;
  viewMode: ViewMode;
  activeBuilding: BuildingId | null;
  /** Andar em foco; `null` mostra todos empilhados. */
  activeLevel: number | null;
  /** Separação manual dos andares no modo 3D. */
  separated: boolean;

  originId: string;
  destinationId: string | null;
  avoidStairs: boolean;
  route: Route | null;
  routeError: string | null;
  /** Próximo clique no mapa define a origem em vez do destino. */
  pickingOrigin: boolean;
  hoveredRoomId: string | null;

  status: NavigationStatus;
  provider: RouteProgressProvider | null;
  tracking: TrackingMode;
  /** Comprimento do passo em metros (ajustável; fica salvo no navegador). */
  stepLength: number;
  steps: number;
  sensorStatus: SensorStatus;
  stepIndex: number;
  awaitingConfirmation: boolean;
  playing: boolean;
  remainingDistance: number;
  /** Andar e área onde o marcador está (arredondado). */
  currentLevel: number;
  currentArea: AreaId;
  followZoom: number;

  camera: { command: CameraCommand; id: number };

  setSite: (siteId: string) => void;
  setViewMode: (mode: ViewMode) => void;
  selectBuilding: (id: BuildingId | null) => void;
  selectLevel: (level: number | null) => void;
  toggleSeparated: () => void;
  setOrigin: (placeId: string) => void;
  selectDestination: (placeId: string | null) => void;
  setAvoidStairs: (value: boolean) => void;
  setPickingOrigin: (value: boolean) => void;
  setHoveredRoom: (id: string | null) => void;
  /** Clique numa sala do mapa: vira destino (ou origem, se estiver escolhendo). */
  pickRoom: (roomId: string) => void;

  /** Lê preferências do aparelho (só no navegador, depois da hidratação). */
  initDevice: () => void;
  setTracking: (mode: TrackingMode) => void;
  setStepLength: (meters: number) => void;
  /** Chame direto do toque no botão: no iPhone a permissão do sensor exige isso. */
  startNavigation: () => Promise<void>;
  stopNavigation: () => void;
  /** Correção manual no modo passos: volta alguns metros na rota. */
  stepBack: () => void;
  togglePlaying: () => void;
  cycleSpeed: () => void;
  skipStep: () => void;
  confirmFloorChange: () => void;
  /** Chamado pela cena a cada quadro, só com o que mudou. */
  syncFromProvider: () => void;

  commandCamera: (command: CameraCommand) => void;
};

export const useNavigationStore = create<NavigationState>((set, get) => {
  function command(cameraCommand: CameraCommand) {
    return { camera: { command: cameraCommand, id: get().camera.id + 1 } };
  }

  /** Recalcula a rota e enquadra a câmera conforme o resultado. */
  function updateRoute(originId: string, destinationId: string | null, avoidStairs: boolean) {
    if (!destinationId) {
      set({ originId, destinationId, avoidStairs, route: null, routeError: null });
      return;
    }
    const route = computeRoute(originId, destinationId, { avoidStairs });
    const multiLevel = route ? new Set(route.floors.map((floor) => floor.level)).size > 1 : false;
    const { viewMode } = get();
    set({
      originId,
      destinationId,
      avoidStairs,
      route,
      routeError: route || originId === destinationId ? null : "Não há rota disponível com essas opções.",
      // Rotas entre andares ficam mais claras com os andares separados em 3D.
      viewMode: multiLevel ? "3d" : viewMode,
      activeLevel: route && !multiLevel ? route.floors[0]?.level ?? null : multiLevel ? null : get().activeLevel,
      activeBuilding: null,
      ...command(route ? { type: "route" } : { type: "focus-place", placeId: destinationId }),
    });
  }

  return {
    siteId: sites[0].id,
    viewMode: "3d",
    activeBuilding: null,
    activeLevel: null,
    separated: false,

    originId: sites[0].defaultOrigin,
    destinationId: null,
    avoidStairs: false,
    route: null,
    routeError: null,
    pickingOrigin: false,
    hoveredRoomId: null,

    status: "idle",
    provider: null,
    tracking: "simulated",
    stepLength: DEFAULT_STEP_LENGTH,
    steps: 0,
    sensorStatus: "off",
    stepIndex: 0,
    awaitingConfirmation: false,
    playing: false,
    remainingDistance: 0,
    currentLevel: 0,
    currentArea: "EXT",
    followZoom: 1,

    camera: { command: { type: "overview" }, id: 0 },

    setSite: (siteId) => {
      if (siteId === get().siteId) return;
      stopDetector();
      switchSite(siteId);
      // Os andares do local anterior saem das animações.
      sceneState.opacity = new Map();
      sceneState.opacityTarget = new Map();
      set({
        siteId,
        originId: getSite(siteId).defaultOrigin,
        destinationId: null,
        route: null,
        routeError: null,
        activeBuilding: null,
        activeLevel: null,
        separated: false,
        pickingOrigin: false,
        hoveredRoomId: null,
        status: "idle",
        provider: null,
        playing: false,
        awaitingConfirmation: false,
        sensorStatus: "off",
        ...command({ type: "overview" }),
      });
    },

    setViewMode: (viewMode) => {
      const { activeLevel, route, status } = get();
      // Em 2D/2.5D só um andar aparece: escolhe um se nenhum estiver em foco.
      const level = viewMode !== "3d" && activeLevel === null && status === "idle" ? route?.floors[0]?.level ?? 0 : activeLevel;
      set({ viewMode, activeLevel: level, ...command({ type: "view" }) });
    },

    selectBuilding: (activeBuilding) => {
      set({ activeBuilding, ...command({ type: "overview", buildingId: activeBuilding }) });
    },

    selectLevel: (activeLevel) => {
      const { activeBuilding } = get();
      set({
        activeLevel,
        ...command(activeLevel === null ? { type: "overview", buildingId: activeBuilding } : { type: "focus-floor", buildingId: activeBuilding, level: activeLevel }),
      });
    },

    toggleSeparated: () => set((state) => ({ separated: !state.separated, ...command({ type: "view" }) })),

    setOrigin: (placeId) => {
      const { destinationId, avoidStairs } = get();
      set({ pickingOrigin: false });
      if (destinationId) updateRoute(placeId, destinationId, avoidStairs);
      else set({ originId: placeId, ...command({ type: "focus-place", placeId }) });
    },

    selectDestination: (placeId) => {
      const { originId, avoidStairs, status } = get();
      if (status !== "idle") return;
      updateRoute(originId, placeId, avoidStairs);
    },

    setAvoidStairs: (value) => {
      const { originId, destinationId } = get();
      updateRoute(originId, destinationId, value);
    },

    setPickingOrigin: (pickingOrigin) => set({ pickingOrigin }),

    setHoveredRoom: (hoveredRoomId) => {
      if (get().hoveredRoomId !== hoveredRoomId) set({ hoveredRoomId });
    },

    pickRoom: (roomId) => {
      const { pickingOrigin, status, setOrigin, selectDestination } = get();
      if (status !== "idle" || !getPlace(roomId)) return;
      if (pickingOrigin) setOrigin(roomId);
      else selectDestination(roomId);
    },

    initDevice: () => set({ stepLength: savedStepLength(), tracking: defaultTracking() }),

    setTracking: (tracking) => set({ tracking, sensorStatus: "off" }),

    setStepLength: (meters) => {
      const stepLength = Math.round(Math.min(1.1, Math.max(0.4, meters)) * 100) / 100;
      try {
        localStorage.setItem(STEP_LENGTH_KEY, String(stepLength));
      } catch {
        // Sem armazenamento (aba anônima): vale só nesta sessão.
      }
      set({ stepLength });
    },

    startNavigation: async () => {
      const { route, tracking } = get();
      if (!route) return;

      if (tracking === "pedometer") {
        const permission = await StepDetector.requestPermission();
        if (permission !== "granted") {
          set({ sensorStatus: permission });
          return;
        }
      }

      stopDetector();
      const provider = new RouteProgressProvider(route, tracking);
      if (tracking === "pedometer") {
        detector = new StepDetector(() => {
          provider.advance(get().stepLength);
          set((state) => ({ steps: state.steps + 1, sensorStatus: "active" }));
        });
        detector.start();
        const current = detector;
        noDataTimer = setTimeout(() => {
          if (current.samples === 0 && get().provider === provider) set({ sensorStatus: "no-data" });
        }, 3000);
      }

      set({
        status: "active",
        provider,
        steps: 0,
        sensorStatus: tracking === "pedometer" ? "waiting" : "off",
        stepIndex: 0,
        awaitingConfirmation: false,
        playing: false,
        remainingDistance: provider.remainingDistance,
        currentLevel: Math.round(provider.position.level),
        currentArea: provider.position.area,
        followZoom: 1,
        // Navegação ativa usa a câmera inclinada, como em apps de trânsito.
        viewMode: get().viewMode === "2d" ? "2d" : "2.5d",
      });
    },

    stopNavigation: () => {
      stopDetector();
      set({ status: "idle", provider: null, playing: false, awaitingConfirmation: false, ...command({ type: "route" }) });
      if (get().viewMode === "3d" || !get().route) return;
      // Volta para a visão geral da rota.
      const multiLevel = new Set(get().route!.floors.map((floor) => floor.level)).size > 1;
      if (multiLevel) set({ viewMode: "3d", activeLevel: null });
    },

    togglePlaying: () => {
      const { provider } = get();
      if (!provider) return;
      if (provider.playing) provider.pause();
      else provider.play();
      set({ playing: provider.playing });
    },

    cycleSpeed: () => {
      const { provider } = get();
      if (!provider) return;
      const speeds = [1, 2, 4];
      provider.speed = speeds[(speeds.indexOf(provider.speed) + 1) % speeds.length];
      set({});
    },

    stepBack: () => {
      get().provider?.retreat(2);
      set({ playing: false });
    },

    skipStep: () => {
      const { provider } = get();
      provider?.skipToNextStep();
      set({ playing: false });
    },

    confirmFloorChange: () => {
      get().provider?.confirmFloorChange();
      set({ awaitingConfirmation: false });
    },

    syncFromProvider: () => {
      const state = get();
      const { provider } = state;
      if (!provider) return;
      const next = {
        stepIndex: provider.stepIndex,
        awaitingConfirmation: provider.awaitingConfirmation,
        playing: provider.playing,
        remainingDistance: Math.round(provider.remainingDistance),
        currentLevel: Math.round(provider.position.level),
        currentArea: provider.position.area,
        status: (provider.arrived ? "arrived" : "active") as NavigationStatus,
      };
      const changed = (Object.keys(next) as (keyof typeof next)[]).some((key) => state[key] !== next[key]);
      if (changed) set(next);
    },

    commandCamera: (cameraCommand) => {
      const { status } = get();
      if (cameraCommand.type === "zoom" && status !== "idle") {
        set((state) => ({ followZoom: Math.min(3, Math.max(0.4, state.followZoom * cameraCommand.factor)) }));
        return;
      }
      set(command(cameraCommand));
    },
  };
});
