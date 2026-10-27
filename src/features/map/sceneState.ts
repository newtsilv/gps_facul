/**
 * Valores animados da cena, lidos e escritos a cada quadro (fora do React para
 * não re-renderizar 60× por segundo). O `SceneAnimator` aproxima os valores
 * atuais dos alvos; os componentes 3D só leem.
 */
export const sceneState = {
  /** 0 = andares empilhados, 1 = totalmente separados. */
  explode: 0,
  explodeTarget: 0,
  /** Opacidade atual de cada andar ("A-0", "B-2"...). */
  opacity: new Map<string, number>(),
  opacityTarget: new Map<string, number>(),
  /** Pixels do mapa cobertos por painéis em cada borda (ver `ViewportInset`). */
  insets: { left: 0, right: 0, top: 0, bottom: 0 },
};

/** Andar clicável: só os que estão em destaque. */
export function isFloorInteractive(key: string) {
  return (sceneState.opacityTarget.get(key) ?? 0) > 0.9;
}
