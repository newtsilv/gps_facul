import type { AreaId } from "@/features/campus/types";

/**
 * Origem da posição. "simulated" anda sozinho pela rota; "pedometer" avança
 * pela rota a cada passo detectado no celular. As outras são integrações
 * previstas (QR Code na parede, beacons Bluetooth, Wi-Fi RTT).
 */
export type LocationSource = "simulated" | "pedometer" | "qr-code" | "ble-beacon" | "wifi-rtt";

export type IndoorPosition = {
  area: AreaId;
  /** Andar; fracionário durante a animação de troca de andar. */
  level: number;
  x: number;
  z: number;
  /** Direção de deslocamento, em radianos (0 = +z). */
  heading: number;
  /** Raio de incerteza em metros, quando a fonte informar. */
  accuracy?: number;
  source: LocationSource;
  timestamp: number;
};

/** Contrato comum a qualquer fonte de localização indoor. */
export interface LocationProvider {
  readonly source: LocationSource;
  readonly position: IndoorPosition;
  subscribe(listener: (position: IndoorPosition) => void): () => void;
}
