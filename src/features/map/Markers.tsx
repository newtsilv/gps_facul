"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { DoubleSide, MeshBasicMaterial, Shape, ShapeGeometry, type Group, type Mesh } from "three";
import { getPlace } from "@/features/campus/api";
import { useNavigationStore } from "@/store/navigation";
import { areaOpacity, floorY, ROUTE_LIFT } from "./layout";
import { sceneColors } from "./palette";
import { sceneState } from "./sceneState";

/** Seta do marcador de navegação, apontando para +z. */
function arrowGeometry() {
  const shape = new Shape();
  shape.moveTo(0, 1.5);
  shape.lineTo(1.1, -1.1);
  shape.lineTo(0, -0.45);
  shape.lineTo(-1.1, -1.1);
  shape.closePath();
  const geometry = new ShapeGeometry(shape);
  // Deita a seta no plano do piso.
  geometry.rotateX(Math.PI / 2);
  return geometry;
}

/** Posição atual onde o marcador do usuário deve ficar (simulada). */
export function getUserPosition() {
  const { provider, originId } = useNavigationStore.getState();
  if (provider) return provider.position;
  const origin = getPlace(originId);
  if (!origin) return null;
  return { area: origin.area, level: origin.level, x: origin.position.x, z: origin.position.z, heading: 0 };
}

/**
 * "Você está aqui": ponto azul na origem escolhida; durante a navegação vira
 * uma seta que segue o trajeto simulado.
 */
export function UserMarker() {
  const group = useRef<Group>(null);
  const halo = useRef<Mesh>(null);
  const arrow = useRef<Mesh>(null);
  const dot = useRef<Mesh>(null);
  const navigating = useNavigationStore((state) => state.status !== "idle");
  const arrowGeo = useMemo(() => arrowGeometry(), []);
  const haloMaterial = useMemo(() => new MeshBasicMaterial({ color: sceneColors.user, transparent: true, depthWrite: false, depthTest: false }), []);

  useFrame(({ clock }, dt) => {
    const position = getUserPosition();
    if (!group.current || !position) return;
    const y = floorY(position.level, sceneState.explode) + ROUTE_LIFT + 0.05;
    group.current.position.set(position.x, y, position.z);
    const visible = areaOpacity(sceneState.opacity, position.area, Math.round(position.level)) > 0.05 || navigating;
    group.current.visible = visible;

    const t = (clock.elapsedTime % 1.8) / 1.8;
    halo.current?.scale.setScalar(1 + t * 1.4);
    haloMaterial.opacity = 0.35 * (1 - t);

    if (arrow.current) {
      // Gira suavemente para a direção do trajeto (pelo caminho mais curto).
      const current = arrow.current.rotation.y;
      const delta = Math.atan2(Math.sin(position.heading - current), Math.cos(position.heading - current));
      arrow.current.rotation.y = current + delta * Math.min(1, dt * 8);
    }
  });

  return (
    <group ref={group}>
      <mesh ref={halo} material={haloMaterial} rotation-x={-Math.PI / 2} renderOrder={20} raycast={() => null}>
        <circleGeometry args={[1.4, 40]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} renderOrder={21} raycast={() => null}>
        <circleGeometry args={[1.25, 40]} />
        <meshBasicMaterial color="#ffffff" depthTest={false} transparent />
      </mesh>
      {navigating ? (
        <mesh ref={arrow} geometry={arrowGeo} position-y={0.02} renderOrder={22} raycast={() => null}>
          <meshBasicMaterial color={sceneColors.user} side={DoubleSide} depthTest={false} transparent />
        </mesh>
      ) : (
        <mesh ref={dot} rotation-x={-Math.PI / 2} position-y={0.02} renderOrder={22} raycast={() => null}>
          <circleGeometry args={[0.9, 40]} />
          <meshBasicMaterial color={sceneColors.user} depthTest={false} transparent />
        </mesh>
      )}
    </group>
  );
}

/** Pino vermelho no destino, flutuando sobre a sala. */
export function DestinationMarker() {
  const destinationId = useNavigationStore((state) => state.destinationId);
  const group = useRef<Group>(null);
  const pin = useRef<Group>(null);
  const place = destinationId ? getPlace(destinationId) : undefined;

  useFrame(({ clock }) => {
    if (!group.current || !pin.current || !place) return;
    group.current.position.set(place.position.x, floorY(place.level, sceneState.explode), place.position.z);
    pin.current.position.y = 3.2 + Math.sin(clock.elapsedTime * 2.4) * 0.35;
    group.current.visible = areaOpacity(sceneState.opacity, place.area, place.level) > 0.05;
  });

  if (!place) return null;
  return (
    <group ref={group}>
      <group ref={pin}>
        <mesh position-y={1.1} raycast={() => null}>
          <sphereGeometry args={[1.1, 24, 16]} />
          <meshLambertMaterial color={sceneColors.destination} />
        </mesh>
        <mesh position-y={1.1} raycast={() => null}>
          <sphereGeometry args={[0.42, 16, 12]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position-y={-0.1} rotation-x={Math.PI} raycast={() => null}>
          <coneGeometry args={[0.75, 1.6, 20]} />
          <meshLambertMaterial color={sceneColors.destination} />
        </mesh>
      </group>
      <mesh rotation-x={-Math.PI / 2} position-y={0.14} raycast={() => null}>
        <ringGeometry args={[0.7, 1.1, 32]} />
        <meshBasicMaterial color={sceneColors.destination} transparent opacity={0.6} depthWrite={false} />
      </mesh>
    </group>
  );
}
