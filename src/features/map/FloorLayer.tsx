"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Color, MeshBasicMaterial, MeshLambertMaterial, Object3D, type Group, type InstancedMesh, type Material } from "three";
import type { Building, Floor } from "@/features/campus/types";
import { useNavigationStore } from "@/store/navigation";
import { corridorRect, floorWalls } from "./geometry";
import { floorKey, floorY, SLAB_THICKNESS, WALL_HEIGHT, WALL_THICKNESS } from "./layout";
import { roomColors, sceneColors } from "./palette";
import { RoomHighlight } from "./RoomHighlight";
import { isFloorInteractive, sceneState } from "./sceneState";
import { unitBox } from "./shared";

const dummy = new Object3D();
const ROOM_TILE = 0.06;

function setBox(mesh: InstancedMesh, index: number, x: number, y: number, z: number, sx: number, sy: number, sz: number) {
  dummy.position.set(x, y, z);
  dummy.scale.set(sx, sy, sz);
  dummy.updateMatrix();
  mesh.setMatrixAt(index, dummy.matrix);
}

type FloorLayerProps = {
  building: Building;
  floor: Floor;
};

/** Um pavimento: piso, corredores, salas, paredes baixas, portas, escadas e elevador. */
export function FloorLayer({ building, floor }: FloorLayerProps) {
  const key = floorKey(building.id, floor.level);
  const group = useRef<Group>(null);
  const rooms = useRef<InstancedMesh>(null);
  const walls = useRef<InstancedMesh>(null);
  const doors = useRef<InstancedMesh>(null);
  const steps = useRef<InstancedMesh>(null);
  const pickRoom = useNavigationStore((state) => state.pickRoom);
  const setHoveredRoom = useNavigationStore((state) => state.setHoveredRoom);

  const wallSegments = useMemo(() => floorWalls(building, floor), [building, floor]);
  const stairs = useMemo(() => floor.rooms.filter((room) => room.type === "escada"), [floor]);
  const elevators = useMemo(() => floor.rooms.filter((room) => room.type === "elevador"), [floor]);
  const STEP_COUNT = 7;

  const materials = useMemo(
    () => ({
      slab: new MeshLambertMaterial({ color: sceneColors.slab }),
      corridor: new MeshLambertMaterial({ color: sceneColors.corridor }),
      rooms: new MeshLambertMaterial({ color: "#ffffff" }),
      wall: new MeshLambertMaterial({ color: sceneColors.wall }),
      door: new MeshBasicMaterial({ color: sceneColors.door }),
      stairs: new MeshLambertMaterial({ color: sceneColors.stairs }),
      elevator: new MeshLambertMaterial({ color: sceneColors.elevator }),
    }),
    [],
  );
  const allMaterials = useMemo<Material[]>(() => Object.values(materials), [materials]);

  useLayoutEffect(() => {
    const color = new Color();
    if (rooms.current) {
      floor.rooms.forEach((room, index) => {
        const { rect } = room;
        setBox(rooms.current!, index, (rect.x0 + rect.x1) / 2, ROOM_TILE / 2, (rect.z0 + rect.z1) / 2, rect.x1 - rect.x0, ROOM_TILE, rect.z1 - rect.z0);
        rooms.current!.setColorAt(index, color.set(roomColors[room.type]));
      });
      rooms.current.instanceMatrix.needsUpdate = true;
      if (rooms.current.instanceColor) rooms.current.instanceColor.needsUpdate = true;
      rooms.current.computeBoundingSphere();
    }

    if (walls.current) {
      const color2 = new Color();
      wallSegments.forEach((wall, index) => {
        const length = Math.hypot(wall.x1 - wall.x0, wall.z1 - wall.z0) + WALL_THICKNESS;
        const alongX = wall.z0 === wall.z1;
        const height = wall.outer ? WALL_HEIGHT * 1.15 : WALL_HEIGHT;
        setBox(
          walls.current!,
          index,
          (wall.x0 + wall.x1) / 2,
          height / 2,
          (wall.z0 + wall.z1) / 2,
          alongX ? length : WALL_THICKNESS,
          height,
          alongX ? WALL_THICKNESS : length,
        );
        walls.current!.setColorAt(index, color2.set(wall.outer ? sceneColors.outerWall : sceneColors.wall));
      });
      walls.current.instanceMatrix.needsUpdate = true;
      if (walls.current.instanceColor) walls.current.instanceColor.needsUpdate = true;
      walls.current.computeBoundingSphere();
    }

    if (doors.current) {
      floor.rooms.forEach((room, index) => {
        const alongX = room.doorWall === "z0" || room.doorWall === "z1";
        setBox(doors.current!, index, room.door.x, 0.05, room.door.z, alongX ? 1.5 : 0.5, 0.1, alongX ? 0.5 : 1.5);
      });
      doors.current.instanceMatrix.needsUpdate = true;
    }

    if (steps.current) {
      let index = 0;
      for (const room of stairs) {
        const { rect } = room;
        const width = rect.x1 - rect.x0;
        const depth = rect.z1 - rect.z0;
        // Degraus ao longo do lado mais comprido, subindo a partir da porta.
        const alongZ = depth >= width;
        for (let i = 0; i < STEP_COUNT; i++) {
          const t = (i + 0.5) / STEP_COUNT;
          const height = 0.12 + (i / STEP_COUNT) * 0.9;
          const fromDoor = room.doorWall === "z0" || room.doorWall === "x0" ? t : 1 - t;
          const x = alongZ ? (rect.x0 + rect.x1) / 2 : rect.x0 + width * fromDoor;
          const z = alongZ ? rect.z0 + depth * fromDoor : (rect.z0 + rect.z1) / 2;
          setBox(steps.current, index++, x, height / 2, z, alongZ ? width - 1 : width / STEP_COUNT - 0.08, height, alongZ ? depth / STEP_COUNT - 0.08 : depth - 1);
        }
      }
      steps.current.instanceMatrix.needsUpdate = true;
      steps.current.computeBoundingSphere();
    }
  }, [floor, wallSegments, stairs]);

  useFrame(() => {
    if (!group.current) return;
    const opacity = sceneState.opacity.get(key) ?? 1;
    group.current.position.y = floorY(floor.level, sceneState.explode);
    group.current.visible = opacity > 0.01;
    for (const material of allMaterials) {
      const base = material === materials.elevator ? 0.7 : 1;
      material.opacity = opacity * base;
      material.transparent = opacity * base < 0.999;
      material.depthWrite = opacity > 0.6;
    }
  });

  function handleClick(event: ThreeEvent<MouseEvent>) {
    if (!isFloorInteractive(key) || event.instanceId === undefined) return;
    const room = floor.rooms[event.instanceId];
    if (!room?.searchable) return;
    event.stopPropagation();
    pickRoom(room.id);
  }

  function handleMove(event: ThreeEvent<PointerEvent>) {
    if (!isFloorInteractive(key) || event.instanceId === undefined) return;
    event.stopPropagation();
    const room = floor.rooms[event.instanceId];
    setHoveredRoom(room?.searchable ? room.id : null);
    document.body.style.cursor = room?.searchable ? "pointer" : "";
  }

  function handleOut() {
    setHoveredRoom(null);
    document.body.style.cursor = "";
  }

  return (
    <group ref={group}>
      {building.footprint.map((rect, index) => (
        <mesh
          key={index}
          geometry={unitBox}
          material={materials.slab}
          position={[(rect.x0 + rect.x1) / 2, -SLAB_THICKNESS / 2, (rect.z0 + rect.z1) / 2]}
          scale={[rect.x1 - rect.x0 + 0.6, SLAB_THICKNESS, rect.z1 - rect.z0 + 0.6]}
        />
      ))}

      {floor.corridors.map((corridor) => {
        const rect = corridorRect(corridor);
        return (
          <mesh
            key={corridor.id}
            geometry={unitBox}
            material={materials.corridor}
            position={[(rect.x0 + rect.x1) / 2, 0.015, (rect.z0 + rect.z1) / 2]}
            scale={[rect.x1 - rect.x0, 0.03, rect.z1 - rect.z0]}
          />
        );
      })}

      <instancedMesh
        ref={rooms}
        args={[unitBox, materials.rooms, floor.rooms.length]}
        onClick={handleClick}
        onPointerMove={handleMove}
        onPointerOut={handleOut}
      />
      <instancedMesh ref={walls} args={[unitBox, materials.wall, wallSegments.length]} raycast={() => null} />
      <instancedMesh ref={doors} args={[unitBox, materials.door, floor.rooms.length]} raycast={() => null} />
      {stairs.length > 0 && <instancedMesh ref={steps} args={[unitBox, materials.stairs, stairs.length * STEP_COUNT]} raycast={() => null} />}

      {elevators.map((room) => (
        <mesh
          key={room.id}
          geometry={unitBox}
          material={materials.elevator}
          raycast={() => null}
          position={[room.center.x, 0.9, room.center.z]}
          scale={[room.rect.x1 - room.rect.x0 - 1.2, 1.8, room.rect.z1 - room.rect.z0 - 1.6]}
        />
      ))}

      <RoomHighlight floor={floor} floorKey={key} />
    </group>
  );
}
