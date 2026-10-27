"use client";

import { useEffect } from "react";
import { SiteSwitcher } from "@/features/campus/SiteSwitcher";
import { OriginPicker } from "@/features/location/OriginPicker";
import { FloorSelector } from "@/features/map-controls/FloorSelector";
import { MapControls } from "@/features/map-controls/MapControls";
import { SearchBar } from "@/features/search/SearchBar";
import { useNavigationStore } from "@/store/navigation";
import { InstructionBanner } from "./InstructionBanner";
import { NavigationBar } from "./NavigationBar";
import { RoutePanel } from "./RoutePanel";

/**
 * Interface sobre o mapa. Explorando: busca, origem e painel do destino.
 * Navegando: instrução no topo e controles da simulação embaixo.
 * Celular: painéis em cima e embaixo. Desktop: coluna à esquerda, controles à direita.
 */
export function NavigationOverlay() {
  const navigating = useNavigationStore((state) => state.status !== "idle");
  const siteId = useNavigationStore((state) => state.siteId);
  const initDevice = useNavigationStore((state) => state.initDevice);

  useEffect(() => initDevice(), [initDevice]);

  return (
    // `key`: ao trocar de local, os painéis recomeçam do zero.
    <div key={siteId} className="pointer-events-none absolute inset-0 z-10 [&>*]:pointer-events-auto">
      <div className="absolute inset-x-3 top-3 flex flex-col items-start gap-2 sm:inset-x-4 sm:top-4 lg:right-auto lg:w-[26rem]">
        {navigating ? (
          <div className="w-full">
            <InstructionBanner />
          </div>
        ) : (
          <>
            <SearchBar />
            <div className="flex w-full min-w-0 items-center gap-2">
              <SiteSwitcher />
              <div className="min-w-0">
                <OriginPicker />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="absolute top-[8.5rem] left-3 sm:left-4 lg:top-1/2 lg:right-[4.75rem] lg:left-auto lg:-translate-y-1/2">
        <FloorSelector />
      </div>
      <div className="absolute top-[8.5rem] right-3 sm:right-4 lg:top-1/2 lg:-translate-y-1/2">
        <MapControls />
      </div>

      {navigating ? (
        <div className="absolute inset-x-3 bottom-3 sm:inset-x-4 sm:bottom-4 lg:right-auto lg:left-1/2 lg:w-[34rem] lg:-translate-x-1/2">
          <NavigationBar />
        </div>
      ) : (
        <div className="absolute inset-x-3 bottom-3 empty:hidden sm:inset-x-4 sm:bottom-4 lg:top-[8.5rem] lg:right-auto lg:bottom-auto lg:w-[26rem]">
          <RoutePanel />
        </div>
      )}
    </div>
  );
}
