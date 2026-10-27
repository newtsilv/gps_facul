"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MathUtils, PerspectiveCamera, Spherical, Vector3 } from "three";
import { campus, getPlace } from "@/features/campus/api";
import type { BuildingId } from "@/features/campus/types";
import { useNavigationStore, type CameraCommand, type ViewMode } from "@/store/navigation";
import { buildingBounds, floorY, maxLevel, pointsBounds, type Bounds } from "./layout";
import { getUserPosition } from "./Markers";
import { sceneState } from "./sceneState";

type OrbitControlsLike = {
  target: Vector3;
  enabled: boolean;
  minPolarAngle: number;
  maxPolarAngle: number;
  update: () => void;
  addEventListener: (type: "start", listener: () => void) => void;
  removeEventListener: (type: "start", listener: () => void) => void;
};

type CameraPose = { target: Vector3; radius: number; phi: number; theta: number };

/** Inclinação (ângulo a partir da vertical) de cada modo. */
const POLAR: Record<ViewMode, number> = { "2d": 0.0001, "2.5d": 0.98, "3d": 0.82 };
/** Limites de inclinação liberados para o usuário em cada modo. */
const POLAR_LIMITS: Record<ViewMode, [number, number]> = { "2d": [0, 0], "2.5d": [0.7, 1.15], "3d": [0.15, 1.3] };
const FOLLOW_RADIUS: Record<ViewMode, number> = { "2d": 55, "2.5d": 34, "3d": 62 };
const FLY_SECONDS = 1.2;
const MIN_RADIUS = 12;
const MAX_RADIUS = 420;

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function lerpAngle(a: number, b: number, t: number) {
  const delta = Math.atan2(Math.sin(b - a), Math.cos(b - a));
  return a + delta * t;
}

/** Tela em pé: área comprida em x fica melhor com a câmera olhando ao longo de x. */
function isPortrait(camera: PerspectiveCamera) {
  return camera.aspect < 0.9;
}

/**
 * Distância para enquadrar uma área com `across` metros na horizontal da tela e
 * `along` metros na vertical, descontando a parte coberta pelos painéis (ver `ViewportInset`).
 */
function fitRadius(camera: PerspectiveCamera, across: number, along: number) {
  const { left, right, top, bottom } = sceneState.insets;
  const fullWidth = camera.view?.fullWidth ?? 1;
  const fullHeight = camera.view?.fullHeight ?? 1;
  const freeWidth = camera.view?.enabled ? Math.max(0.3, 1 - (left + right) / fullWidth) : 1;
  const freeHeight = camera.view?.enabled ? Math.max(0.3, 1 - (top + bottom) / fullHeight) : 1;
  const tan = Math.tan(MathUtils.degToRad(camera.fov) / 2);
  const radius = Math.max(along / (2 * tan * freeHeight), across / (2 * tan * camera.aspect * freeWidth));
  return MathUtils.clamp(radius * 1.12, MIN_RADIUS, MAX_RADIUS);
}

function boundsCenter(bounds: Bounds, y: number) {
  return new Vector3((bounds.minX + bounds.maxX) / 2, y, (bounds.minZ + bounds.maxZ) / 2);
}

/** Enquadra a área (mais `height` metros de andares empilhados) conforme a orientação da tela. */
function fitBounds(bounds: Bounds, camera: PerspectiveCamera, height = 0) {
  const width = bounds.maxX - bounds.minX;
  const depth = bounds.maxZ - bounds.minZ;
  // Em pé, o eixo comprido vai para a vertical da tela (ver `preferredTheta`); a inclinação encurta essa direção.
  if (isPortrait(camera) && width > depth) return fitRadius(camera, depth, width * 1.05 + height);
  return fitRadius(camera, width, depth * 0.9 + height);
}

function preferredTheta(bounds: Bounds, camera: PerspectiveCamera, current: number) {
  const wide = bounds.maxX - bounds.minX > bounds.maxZ - bounds.minZ;
  return isPortrait(camera) && wide ? -Math.PI / 2 + 0.2 : current;
}

/** Pose final de cada comando, calculada com a separação de andares já no valor final. */
function resolvePose(command: CameraCommand, current: CameraPose, camera: PerspectiveCamera): CameraPose {
  const { viewMode, route } = useNavigationStore.getState();
  const explode = sceneState.explodeTarget;
  const phi = POLAR[viewMode];

  switch (command.type) {
    case "overview": {
      const id = command.buildingId ?? null;
      const buildings = id ? campus.buildings.filter((building) => building.id === id) : campus.buildings;
      const top = Math.max(...buildings.map(maxLevel));
      const bounds = buildingBounds(id);
      const height = viewMode === "3d" ? floorY(top, explode) : 0;
      return {
        target: boundsCenter(bounds, height / 2),
        radius: fitBounds(bounds, camera, height * 0.8),
        // Em pé, uma vista mais de cima mostra o campus inteiro sem cortar o bloco mais próximo.
        phi: isPortrait(camera) && viewMode === "3d" ? 0.5 : phi,
        theta: preferredTheta(bounds, camera, current.theta),
      };
    }
    case "focus-floor": {
      const bounds = buildingBounds(command.buildingId as BuildingId | null);
      return {
        target: boundsCenter(bounds, floorY(command.level, explode)),
        radius: fitBounds(bounds, camera) * 0.9,
        phi,
        theta: preferredTheta(bounds, camera, current.theta),
      };
    }
    case "focus-place": {
      const place = getPlace(command.placeId);
      if (!place) return current;
      return { target: new Vector3(place.position.x, floorY(place.level, explode), place.position.z), radius: 48, phi, theta: current.theta };
    }
    case "route": {
      if (!route) return current;
      const bounds = pointsBounds(route.nodes);
      const levels = route.nodes.map((node) => node.level);
      const low = floorY(Math.min(...levels), explode);
      const high = viewMode === "3d" ? floorY(Math.max(...levels), explode) : low;
      return {
        target: boundsCenter(bounds, (low + high) / 2),
        radius: Math.max(fitBounds(bounds, camera, (high - low) * 1.1), 40),
        phi,
        theta: preferredTheta(bounds, camera, current.theta),
      };
    }
    case "view": {
      const target = current.target.clone();
      const { activeLevel } = useNavigationStore.getState();
      if (activeLevel !== null) target.y = floorY(activeLevel, explode);
      return { target, radius: current.radius, phi, theta: current.theta };
    }
    case "rotate":
      return { ...current, target: current.target.clone(), theta: current.theta + command.delta };
    case "zoom":
      return { ...current, target: current.target.clone(), radius: MathUtils.clamp(current.radius * command.factor, MIN_RADIUS, MAX_RADIUS) };
    case "recenter": {
      const position = getUserPosition();
      if (!position) return current;
      return { target: new Vector3(position.x, floorY(position.level, explode), position.z), radius: 40, phi, theta: current.theta };
    }
  }
}

/**
 * Controla a câmera: transições animadas entre poses (comandos da interface)
 * e, durante a navegação, segue o marcador por trás, como em apps de trânsito.
 */
export function CameraRig() {
  const camera = useThree((state) => state.camera) as PerspectiveCamera;
  const controls = useThree((state) => state.controls) as unknown as OrbitControlsLike | null;
  const size = useThree((state) => state.size);
  const cameraCommand = useNavigationStore((state) => state.camera);
  const fly = useRef<{ from: CameraPose; to: CameraPose; t: number } | null>(null);
  const spherical = useRef(new Spherical());
  const offset = useRef(new Vector3());

  function currentPose(): CameraPose {
    const target = controls ? controls.target.clone() : new Vector3();
    offset.current.copy(camera.position).sub(target);
    spherical.current.setFromVector3(offset.current);
    return { target, radius: spherical.current.radius, phi: spherical.current.phi, theta: spherical.current.theta };
  }

  function applyPose(pose: CameraPose) {
    spherical.current.set(pose.radius, Math.max(pose.phi, 0.0001), pose.theta);
    offset.current.setFromSpherical(spherical.current);
    camera.position.copy(pose.target).add(offset.current);
    camera.lookAt(pose.target);
    controls?.target.copy(pose.target);
  }

  function applyLimits() {
    if (!controls) return;
    const [min, max] = POLAR_LIMITS[useNavigationStore.getState().viewMode];
    controls.minPolarAngle = min;
    controls.maxPolarAngle = max;
  }

  // Cada comando novo inicia uma transição a partir da pose atual. Ao mudar o
  // tamanho da tela, comandos de enquadramento são refeitos (girar/zoom não).
  const lastCommandId = useRef(-1);
  useEffect(() => {
    if (!controls) return;
    const repeated = lastCommandId.current === cameraCommand.id;
    lastCommandId.current = cameraCommand.id;
    if (repeated && ["rotate", "zoom", "recenter"].includes(cameraCommand.command.type)) return;
    const from = currentPose();
    const to = resolvePose(cameraCommand.command, from, camera);
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI / 2;
    fly.current = { from, to, t: 0 };
    // Ao arrastar o mapa, a transição em andamento é cancelada.
    const cancel = () => {
      if (!fly.current) return;
      fly.current = null;
      applyLimits();
    };
    controls.addEventListener("start", cancel);
    return () => controls.removeEventListener("start", cancel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraCommand.id, controls, size.width, size.height]);

  useFrame((_, rawDt) => {
    if (!controls) return;
    const dt = Math.min(rawDt, 0.1);
    const { status, viewMode, followZoom, awaitingConfirmation } = useNavigationStore.getState();

    if (status !== "idle") {
      controls.enabled = false;
      fly.current = null;
      const position = getUserPosition();
      if (!position) return;
      const pose = currentPose();
      const target = new Vector3(position.x, floorY(position.level, sceneState.explode), position.z);
      // Na escada/elevador a câmera se afasta para mostrar a troca de andar.
      const radius = FOLLOW_RADIUS[viewMode] * followZoom * (awaitingConfirmation ? 1.45 : 1);
      const k = 1 - Math.exp(-4 * dt);
      applyPose({
        target: pose.target.lerp(target, 1 - Math.exp(-6 * dt)),
        radius: MathUtils.lerp(pose.radius, radius, k),
        phi: MathUtils.lerp(pose.phi, POLAR[viewMode] + (awaitingConfirmation ? 0.08 : 0), k),
        // Câmera atrás do usuário: oposta à direção do deslocamento.
        theta: lerpAngle(pose.theta, position.heading + Math.PI, 1 - Math.exp(-2.5 * dt)),
      });
      return;
    }

    controls.enabled = true;
    if (!fly.current) return;
    const current = fly.current;
    current.t = Math.min(1, current.t + dt / FLY_SECONDS);
    const e = easeInOut(current.t);
    applyPose({
      target: current.from.target.clone().lerp(current.to.target, e),
      radius: MathUtils.lerp(current.from.radius, current.to.radius, e),
      phi: MathUtils.lerp(current.from.phi, current.to.phi, e),
      theta: lerpAngle(current.from.theta, current.to.theta, e),
    });
    if (current.t >= 1) {
      fly.current = null;
      applyLimits();
    }
    controls.update();
    // Rótulos de salas comuns somem de longe (ver globals.css).
    document.documentElement.dataset.zoom = current.to.radius > 150 ? "far" : "near";
  });

  // Mantém o atributo de zoom atualizado também quando o usuário usa a roda do mouse.
  useFrame(() => {
    if (fly.current) return;
    const far = camera.position.distanceTo(controls?.target ?? new Vector3()) > 150;
    const value = far ? "far" : "near";
    if (document.documentElement.dataset.zoom !== value) document.documentElement.dataset.zoom = value;
  });

  return null;
}
