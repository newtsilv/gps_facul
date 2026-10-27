"use client";

import { useMemo, useRef, type ComponentRef } from "react";
import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { MeshBasicMaterial, type Group, type Mesh } from "three";
import type { Route, RouteLeg } from "@/features/navigation/types";
import { useNavigationStore } from "@/store/navigation";
import { areaOpacity, floorY, ROUTE_LIFT } from "./layout";
import { sceneColors } from "./palette";
import { sceneState } from "./sceneState";

type LineRef = ComponentRef<typeof Line>;
type LineMaterialLike = { opacity: number; dashOffset: number };

function legPositions(route: Route, leg: RouteLeg, explode: number) {
  return route.nodes.slice(leg.start, leg.end + 1).flatMap((node) => [node.x, floorY(node.level, explode) + ROUTE_LIFT, node.z]);
}

function legOpacity(leg: RouteLeg) {
  if (leg.kind === "walk") return areaOpacity(sceneState.opacity, leg.area, leg.level);
  return Math.max(areaOpacity(sceneState.opacity, leg.area, leg.level), areaOpacity(sceneState.opacity, leg.area, leg.toLevel));
}

/** Trecho da rota: linha azul com um tracejado branco "correndo" no sentido do trajeto. */
function LegLine({ route, leg }: { route: Route; leg: RouteLeg }) {
  const base = useRef<LineRef>(null);
  const flow = useRef<LineRef>(null);
  const lastExplode = useRef(sceneState.explode);
  const vertical = leg.kind === "vertical";
  const initial = useMemo(() => {
    const flat = legPositions(route, leg, sceneState.explode);
    const points: [number, number, number][] = [];
    for (let i = 0; i < flat.length; i += 3) points.push([flat[i], flat[i + 1], flat[i + 2]]);
    return points;
  }, [route, leg]);

  useFrame((_, dt) => {
    if (!base.current || !flow.current) return;
    if (Math.abs(sceneState.explode - lastExplode.current) > 1e-4) {
      lastExplode.current = sceneState.explode;
      const flat = legPositions(route, leg, sceneState.explode);
      base.current.geometry.setPositions(flat);
      flow.current.geometry.setPositions(flat);
      flow.current.computeLineDistances();
    }
    const opacity = legOpacity(leg);
    const baseMaterial = base.current.material as unknown as LineMaterialLike;
    const flowMaterial = flow.current.material as unknown as LineMaterialLike;
    baseMaterial.opacity = Math.max(opacity, 0.12);
    flowMaterial.opacity = opacity * 0.95;
    flowMaterial.dashOffset -= dt * (vertical ? 3 : 2.2);
    base.current.visible = opacity > 0.01;
    flow.current.visible = opacity > 0.01;
  });

  return (
    <>
      <Line
        ref={base}
        points={initial}
        color={vertical ? sceneColors.vertical : sceneColors.route}
        lineWidth={vertical ? 6 : 7}
        transparent
        depthTest={false}
        renderOrder={10}
      />
      <Line
        ref={flow}
        points={initial}
        color={sceneColors.routeFlow}
        lineWidth={2.2}
        dashed
        dashSize={0.7}
        gapSize={1.6}
        transparent
        depthTest={false}
        renderOrder={11}
      />
    </>
  );
}

/** Coluna onde a rota troca de andar (a etiqueta fica em `labels/MapLabels`). */
function FloorChangeMarker({ route, leg }: { route: Route; leg: RouteLeg }) {
  const group = useRef<Group>(null);
  const column = useRef<Mesh>(null);
  const node = route.nodes[leg.start];
  const material = useMemo(() => new MeshBasicMaterial({ color: sceneColors.vertical, transparent: true, depthWrite: false }), []);

  useFrame(({ clock }) => {
    if (!group.current || !column.current) return;
    const y0 = floorY(leg.level, sceneState.explode);
    const y1 = floorY(leg.toLevel, sceneState.explode);
    const opacity = legOpacity(leg);
    group.current.position.set(node.x, y0, node.z);
    column.current.position.y = (y1 - y0) / 2 + ROUTE_LIFT;
    column.current.scale.set(1, Math.max(Math.abs(y1 - y0), 0.01), 1);
    material.opacity = (0.16 + Math.sin(clock.elapsedTime * 2.5) * 0.06) * opacity;
  });

  return (
    <group ref={group}>
      <mesh ref={column} material={material} raycast={() => null} renderOrder={9}>
        <cylinderGeometry args={[1.6, 1.6, 1, 24, 1, true]} />
      </mesh>
    </group>
  );
}

export function RouteLayer() {
  const route = useNavigationStore((state) => state.route);
  if (!route) return null;
  return (
    <group key={`${route.originId}-${route.destinationId}-${route.avoidStairs}`}>
      {route.legs.map((leg, index) => (
        <LegLine key={index} route={route} leg={leg} />
      ))}
      {route.legs
        .filter((leg) => leg.kind === "vertical")
        .map((leg, index) => (
          <FloorChangeMarker key={index} route={route} leg={leg} />
        ))}
    </group>
  );
}
