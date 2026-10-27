"use client";

import { campus } from "@/features/campus/api";
import { useEmphasis } from "./emphasis";
import { FloorLayer } from "./FloorLayer";
import { DestinationMarker, UserMarker } from "./Markers";
import { sceneColors } from "./palette";
import { RouteLayer } from "./RouteLayer";
import { SceneAnimator } from "./SceneAnimator";
import { Walkways } from "./Walkways";

/** Conteúdo 3D do campus: chão, blocos (andar por andar), passagens, rota e marcadores. */
export function CampusScene() {
  const emphasis = useEmphasis();

  return (
    <>
      <SceneAnimator emphasis={emphasis} />

      <mesh rotation-x={-Math.PI / 2} position={[60, -0.6, 22]} raycast={() => null}>
        <planeGeometry args={[400, 300]} />
        <meshLambertMaterial color={sceneColors.ground} />
      </mesh>
      <gridHelper args={[400, 80, "#d6dce5", "#dde2ea"]} position={[60, -0.58, 22]} raycast={() => null} />

      {campus.buildings.map((building) =>
        building.floors.map((floor) => (
          <FloorLayer key={floor.id} building={building} floor={floor} />
        )),
      )}

      <Walkways />
      <RouteLayer />
      <DestinationMarker />
      <UserMarker />
    </>
  );
}
