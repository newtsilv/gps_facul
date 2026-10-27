"use client";

import { useMemo } from "react";
import { distancesToPlaces } from "@/features/navigation/route";
import { useNavigationStore } from "@/store/navigation";

/** Distância a pé da origem atual até cada destino (recalcula ao trocar a origem). */
export function usePlaceDistances() {
  const originId = useNavigationStore((state) => state.originId);
  const avoidStairs = useNavigationStore((state) => state.avoidStairs);
  return useMemo(() => distancesToPlaces(originId, { avoidStairs }), [originId, avoidStairs]);
}
