"use client";

import { useFrame } from "@react-three/fiber";
import { useNavigationStore } from "@/store/navigation";

/** Avança a localização simulada a cada quadro e repassa ao estado só o que mudou. */
export function SimulationDriver() {
  useFrame((_, dt) => {
    const { provider, syncFromProvider } = useNavigationStore.getState();
    if (!provider) return;
    provider.tick(Math.min(dt, 0.1));
    syncFromProvider();
  }, -2);
  return null;
}
