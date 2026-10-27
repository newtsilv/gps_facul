"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshBasicMaterial, type Mesh } from "three";
import type { Floor } from "@/features/campus/types";
import { useNavigationStore } from "@/store/navigation";
import { sceneColors } from "./palette";
import { sceneState } from "./sceneState";
import { unitBox } from "./shared";

type Variant = "destination" | "origin" | "hover";

const variants: Record<Variant, { color: string; opacity: number; pulse: boolean }> = {
  destination: { color: sceneColors.destination, opacity: 0.32, pulse: true },
  origin: { color: sceneColors.user, opacity: 0.22, pulse: false },
  hover: { color: sceneColors.hover, opacity: 0.14, pulse: false },
};

function Tile({ floor, floorKey, roomId, variant }: { floor: Floor; floorKey: string; roomId: string; variant: Variant }) {
  const room = floor.rooms.find((item) => item.id === roomId);
  const mesh = useRef<Mesh>(null);
  const config = variants[variant];
  const material = useMemo(() => new MeshBasicMaterial({ color: config.color, transparent: true, depthWrite: false }), [config.color]);

  useFrame(({ clock }) => {
    const floorOpacity = sceneState.opacity.get(floorKey) ?? 1;
    const pulse = config.pulse ? 0.75 + Math.sin(clock.elapsedTime * 3) * 0.25 : 1;
    material.opacity = config.opacity * pulse * floorOpacity;
  });

  if (!room) return null;
  const { rect } = room;
  return (
    <mesh
      ref={mesh}
      geometry={unitBox}
      material={material}
      raycast={() => null}
      renderOrder={2}
      position={[(rect.x0 + rect.x1) / 2, 0.1, (rect.z0 + rect.z1) / 2]}
      scale={[rect.x1 - rect.x0 - 0.2, 0.04, rect.z1 - rect.z0 - 0.2]}
    />
  );
}

/** Realce das salas de destino, de origem e sob o cursor. */
export function RoomHighlight({ floor, floorKey }: { floor: Floor; floorKey: string }) {
  const destinationId = useNavigationStore((state) => state.destinationId);
  const originId = useNavigationStore((state) => state.originId);
  const hoveredRoomId = useNavigationStore((state) => state.hoveredRoomId);
  const has = (id: string | null) => id !== null && floor.rooms.some((room) => room.id === id);

  return (
    <>
      {has(destinationId) && <Tile floor={floor} floorKey={floorKey} roomId={destinationId!} variant="destination" />}
      {has(originId) && <Tile floor={floor} floorKey={floorKey} roomId={originId} variant="origin" />}
      {has(hoveredRoomId) && hoveredRoomId !== destinationId && <Tile floor={floor} floorKey={floorKey} roomId={hoveredRoomId!} variant="hover" />}
    </>
  );
}
