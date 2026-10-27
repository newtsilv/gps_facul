const numberFormatter = new Intl.NumberFormat("pt-BR");

export function formatNumber(value: number) {
  return numberFormatter.format(value);
}

/** Metros → "74 m" / "1,2 km". */
export function formatDistance(meters: number) {
  if (meters >= 1000) return `${(meters / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km`;
  return `${formatNumber(Math.max(0, Math.round(meters)))} m`;
}

/** Segundos → "3 min" (ou "< 1 min"). */
export function formatWalkTime(seconds: number) {
  const minutes = Math.round(seconds / 60);
  return minutes < 1 ? "< 1 min" : `${formatNumber(minutes)} min`;
}

/** Horário previsto de chegada: "14:32". */
export function formatArrival(seconds: number, now = new Date()) {
  const arrival = new Date(now.getTime() + seconds * 1000);
  return arrival.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
