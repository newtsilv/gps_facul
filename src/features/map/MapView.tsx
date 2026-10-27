"use client";

import dynamic from "next/dynamic";
import { Spinner } from "@/components/ui/Spinner";
import { useNavigationStore } from "@/store/navigation";
import { MapLabels } from "./labels/MapLabels";

/** O WebGL só existe no navegador: o canvas não passa pela renderização do servidor. */
const MapCanvas = dynamic(() => import("./MapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center gap-3 text-primary-300">
      <Spinner className="size-5" />
      Carregando mapa…
    </div>
  ),
});

export function MapView() {
  const siteId = useNavigationStore((state) => state.siteId);
  return (
    // `isolate`: os rótulos HTML da cena ficam sempre abaixo dos painéis da interface.
    <div className="absolute inset-0 isolate">
      <MapCanvas />
      <MapLabels key={siteId} />
    </div>
  );
}
