"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { SimulationDriver } from "@/features/location/SimulationDriver";
import { useNavigationStore } from "@/store/navigation";
import { CameraRig } from "./CameraRig";
import { LabelProjector } from "./labels/LabelProjector";
import { CampusScene } from "./CampusScene";
import { sceneColors } from "./palette";
import { ViewportInset } from "./ViewportInset";

/** Canvas WebGL do mapa. Carregado só no navegador (ver `MapView`). */
export default function MapCanvas() {
  const setHoveredRoom = useNavigationStore((state) => state.setHoveredRoom);
  const siteId = useNavigationStore((state) => state.siteId);

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ fov: 38, near: 1, far: 2000, position: [20, 130, 170] }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onPointerMissed={() => setHoveredRoom(null)}
      className="touch-none"
    >
      <color attach="background" args={[sceneColors.background]} />
      <fog attach="fog" args={[sceneColors.background, 320, 700]} />
      <hemisphereLight args={["#ffffff", "#c9d2df", 1.6]} />
      <directionalLight position={[60, 140, 80]} intensity={1.4} />
      <directionalLight position={[-80, 60, -60]} intensity={0.35} />

      <ViewportInset />
      <CampusScene key={siteId} />
      <SimulationDriver />
      <CameraRig />
      <LabelProjector />
      <OrbitControls makeDefault enableDamping dampingFactor={0.09} minDistance={12} maxDistance={420} maxPolarAngle={1.35} />
    </Canvas>
  );
}
