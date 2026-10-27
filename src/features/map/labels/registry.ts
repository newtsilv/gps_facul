export type LabelPosition = readonly [number, number, number];

export type LabelEntry = {
  el: HTMLElement;
  /** Posição no mundo 3D a cada quadro; `null` esconde o rótulo. */
  position: () => LabelPosition | null;
};

/**
 * Rótulos HTML sobre o mapa. Os componentes registram o elemento e de onde
 * tirar a posição; o `LabelProjector` (dentro do canvas) os move a cada quadro.
 */
export const labelRegistry = new Map<string, LabelEntry>();
