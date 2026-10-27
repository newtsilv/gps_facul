"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshLambertMaterial, type Group } from "three";
import { campus } from "@/features/campus/api";
import type { Point2 } from "@/features/campus/types";
import { areaOpacity, floorY } from "./layout";
import { sceneColors } from "./palette";
import { sceneState } from "./sceneState";
import { unitBox } from "./shared";

type Box = { position: [number, number, number]; scale: [number, number, number] };

/** Caixas que formam uma faixa de largura `width` passando por `points`. */
function stripBoxes(points: Point2[], width: number, y: number, height: number): Box[] {
  return points.slice(1).map((point, index) => {
    const previous = points[index];
    const alongX = Math.abs(point.x - previous.x) >= Math.abs(point.z - previous.z);
    const length = Math.hypot(point.x - previous.x, point.z - previous.z) + width;
    return {
      position: [(point.x + previous.x) / 2, y, (point.z + previous.z) / 2],
      scale: alongX ? [length, height, width] : [width, height, length],
    };
  });
}

/** Faixas paralelas à rota, deslocadas para os lados (guarda-corpos). */
function railBoxes(points: Point2[], width: number): Box[] {
  return points.slice(1).flatMap((point, index) => {
    const previous = points[index];
    const alongX = Math.abs(point.x - previous.x) >= Math.abs(point.z - previous.z);
    const length = Math.hypot(point.x - previous.x, point.z - previous.z);
    const cx = (point.x + previous.x) / 2;
    const cz = (point.z + previous.z) / 2;
    return [-1, 1].map((side): Box => ({
      position: alongX ? [cx, 0.55, cz + (side * width) / 2] : [cx + (side * width) / 2, 0.55, cz],
      scale: alongX ? [length, 1.1, 0.08] : [0.08, 1.1, length],
    }));
  });
}

function Strip({ level, points, width, elevated }: { level: number; points: Point2[]; width: number; elevated: boolean }) {
  const group = useRef<Group>(null);
  const deck = useMemo(() => new MeshLambertMaterial({ color: sceneColors.walkway }), []);
  const glass = useMemo(() => new MeshLambertMaterial({ color: sceneColors.glass, transparent: true, opacity: 0.35, depthWrite: false }), []);
  const boxes = useMemo(() => stripBoxes(points, width, elevated ? -0.15 : -0.05, elevated ? 0.3 : 0.1), [points, width, elevated]);
  const rails = useMemo(() => (elevated ? railBoxes(points, width) : []), [points, width, elevated]);

  useFrame(() => {
    if (!group.current) return;
    const opacity = areaOpacity(sceneState.opacity, "EXT", level);
    group.current.position.y = floorY(level, sceneState.explode);
    group.current.visible = opacity > 0.01;
    deck.opacity = opacity;
    deck.transparent = opacity < 0.999;
    deck.depthWrite = opacity > 0.6;
    glass.opacity = 0.35 * opacity;
  });

  return (
    <group ref={group}>
      {boxes.map((box, index) => (
        <mesh key={index} geometry={unitBox} material={deck} position={box.position} scale={box.scale} raycast={() => null} />
      ))}
      {rails.map((box, index) => (
        <mesh key={`r${index}`} geometry={unitBox} material={glass} position={box.position} scale={box.scale} raycast={() => null} />
      ))}
    </group>
  );
}

function exitPoint(buildingId: string, level: number, exitId: string) {
  const floor = campus.buildings.find((building) => building.id === buildingId)!.floors.find((item) => item.level === level)!;
  return floor.exits.find((exit) => exit.id === exitId)!.point;
}

/** Passagem coberta, passarela e os caminhos das entradas. */
export function Walkways() {
  const connections = useMemo(
    () =>
      campus.connections.map((connection) => ({
        ...connection,
        points: [
          exitPoint(connection.from.buildingId, connection.from.level, connection.from.exitId),
          ...connection.path,
          exitPoint(connection.to.buildingId, connection.to.level, connection.to.exitId),
        ],
      })),
    [],
  );

  return (
    <>
      {connections.map((connection) => (
        <Strip
          key={connection.id}
          level={connection.level}
          points={connection.points}
          width={connection.width}
          elevated={connection.kind === "passarela"}
        />
      ))}
      {campus.entrances.map((entrance) => (
        <Strip
          key={entrance.id}
          level={entrance.exit.level}
          points={[entrance.outside, exitPoint(entrance.exit.buildingId, entrance.exit.level, entrance.exit.exitId)]}
          width={3.2}
          elevated={false}
        />
      ))}
    </>
  );
}
