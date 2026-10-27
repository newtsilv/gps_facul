import { MapView } from "@/features/map/MapView";
import { NavigationOverlay } from "@/features/navigation/NavigationOverlay";

export default function HomePage() {
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-primary-100">
      <h1 className="sr-only">Mapa 3D do campus</h1>
      <MapView />
      <NavigationOverlay />
    </main>
  );
}
