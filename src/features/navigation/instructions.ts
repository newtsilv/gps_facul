import { getBuildingName, getFloor } from "@/features/campus/api";
import { floorInSentence, onFloor, withArticle } from "@/features/campus/labels";
import type { Place } from "@/features/campus/types";
import type { GraphNode, ManeuverKind, NavStep, PathResult, Track } from "./types";

/** Manobras a menos de X metros da anterior viram uma só frase. */
const MERGE_DISTANCE = 7;

/** Nome do corredor que contém o trecho a → b (se houver). */
function corridorName(a: GraphNode, b: GraphNode) {
  if (a.area === "EXT" || b.area === "EXT" || a.level !== b.level) return undefined;
  const floor = getFloor(a.area, a.level);
  const corridor = floor?.corridors.find((item) => {
    const horizontal = item.from.z === item.to.z;
    return horizontal ? a.z === item.from.z && b.z === item.from.z : a.x === item.from.x && b.x === item.from.x;
  });
  return corridor?.name;
}

/** Ângulo (graus) entre a direção de chegada e a de saída. Positivo = esquerda. */
function turnAngle(previous: GraphNode, current: GraphNode, next: GraphNode) {
  const inX = current.x - previous.x;
  const inZ = current.z - previous.z;
  const outX = next.x - current.x;
  const outZ = next.z - current.z;
  if ((inX === 0 && inZ === 0) || (outX === 0 && outZ === 0)) return 0;
  // Com y para cima, o produto vetorial positivo é giro anti-horário visto de cima: esquerda.
  const cross = inZ * outX - inX * outZ;
  const dot = inX * outX + inZ * outZ;
  return (Math.atan2(cross, dot) * 180) / Math.PI;
}

function turnKind(angle: number): { kind: ManeuverKind; side: "esquerda" | "direita" } | null {
  const abs = Math.abs(angle);
  if (abs < 30) return null;
  const side = angle > 0 ? "esquerda" : "direita";
  if (abs < 60) return { kind: angle > 0 ? "slight-left" : "slight-right", side };
  return { kind: angle > 0 ? "turn-left" : "turn-right", side };
}

function lowerFirst(text: string) {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

type DraftStep = Omit<NavStep, "id" | "progress"> & { mergeable: boolean };

/**
 * Converte o caminho do A* em instruções no estilo de apps de navegação:
 * saída, curvas, trocas de andar, passagens entre blocos e chegada.
 */
export function buildSteps(path: PathResult, track: Track, origin: Place, destination: Place): NavStep[] {
  const { nodes, edges } = path;
  const last = nodes.length - 1;
  const drafts: DraftStep[] = [];

  const add = (step: Omit<DraftStep, "requiresConfirmation" | "mergeable"> & Partial<DraftStep>) =>
    drafts.push({ requiresConfirmation: false, mergeable: false, ...step });

  const departText = origin.type === "entrada" ? `Siga ${withArticle("a", origin.name.split(" — ")[0])}` : `Saia ${withArticle("de", origin.name)}`;
  add({ kind: "depart", text: departText, nodeIndex: 0, mergeable: true });

  for (let i = 1; i < last; i++) {
    const previous = nodes[i - 1];
    const current = nodes[i];
    const next = nodes[i + 1];
    const edgeIn = edges[i - 1];
    const edgeOut = edges[i];

    // Início de troca de andar: segue pelos arcos verticais até o andar final.
    if (edgeOut.kind !== "walk" && edgeIn.kind === "walk") {
      let j = i;
      while (j < last && edges[j].kind !== "walk") j++;
      const targetLevel = nodes[j].level;
      const up = targetLevel > current.level;
      const elevator = edgeOut.kind === "elevator";
      const verb = up ? "Suba" : "Desça";
      add({
        kind: elevator ? (up ? "elevator-up" : "elevator-down") : up ? "stairs-up" : "stairs-down",
        text: elevator ? `${verb} de elevador até ${floorInSentence(targetLevel)}` : `${verb} pela escada até ${floorInSentence(targetLevel)}`,
        nodeIndex: i,
        targetLevel,
        requiresConfirmation: true,
      });
      continue;
    }

    // Fim da troca de andar.
    if (edgeIn.kind !== "walk" && edgeOut.kind === "walk") {
      const via = edgeIn.kind === "elevator" ? "do elevador" : "da escada";
      add({ kind: "straight", text: `Saia ${via} ${onFloor(current.level)}`, nodeIndex: i, mergeable: true });
      continue;
    }
    if (edgeIn.kind !== "walk") continue;

    // Saída de um bloco para uma passagem externa.
    if (current.area !== "EXT" && next.area === "EXT") {
      const target = nodes.slice(i + 1).find((node) => node.area !== "EXT");
      const via = next.kind === "outdoor" && next.label ? ` e siga ${withArticle("por", next.label)}` : "";
      const until = target && target.area !== current.area ? ` até ${withArticle("a", getBuildingName(target.area))}` : "";
      add({ kind: "exit-building", text: `Saia ${withArticle("por", current.label ?? "saída")}${via}${until}`, nodeIndex: i, mergeable: true });
      continue;
    }

    // Entrada em um bloco.
    if (previous.area === "EXT" && current.area !== "EXT") {
      const corridor = corridorName(nodes[i + 1], nodes[i + 2] ?? nodes[i + 1]);
      const text = `Entre ${withArticle("em", getBuildingName(current.area))}${corridor ? ` e siga pelo ${corridor}` : ""}`;
      if (i === 1 && origin.type === "entrada") drafts[0].text = text;
      else add({ kind: "enter-building", text, nodeIndex: i, mergeable: true });
      continue;
    }

    // Dentro da sala (porta → centro) não há manobra a anunciar.
    if (current.kind === "door") continue;

    const turn = turnKind(turnAngle(previous, current, next));
    if (!turn) continue;

    let text: string;
    if (Math.abs(turnAngle(previous, current, next)) > 150) {
      text = "Faça o retorno";
    } else {
      const verb = turn.kind.startsWith("slight") ? "Mantenha-se" : "Vire";
      text = `${verb} à ${turn.side}`;
      const intoShaft = next.kind === "door" && nodes[i + 2]?.kind === "shaft" && i + 2 < last;
      if (next.kind === "door" && i + 2 === last) {
        text += ` e entre ${withArticle("em", destination.name)}`;
      } else if (intoShaft) {
        text += ` e dirija-se ${nodes[i + 2].shaftType === "elevador" ? "ao elevador" : "à escada"}`;
      } else {
        const before = corridorName(previous, current);
        const after = corridorName(current, next);
        if (after && after !== before) text += ` no ${after}`;
      }
    }
    add({ kind: turn.kind, text, nodeIndex: i });
  }

  add({ kind: "arrive", text: `Você chegou ${withArticle("a", destination.name)}`, nodeIndex: last });

  // Junta "Saia da sala" + "vire à direita" quando acontecem quase no mesmo ponto.
  const merged: DraftStep[] = [];
  for (const step of drafts) {
    const previous = merged.at(-1);
    const close = previous && track.walked[step.nodeIndex] - track.walked[previous.nodeIndex] < MERGE_DISTANCE;
    if (previous && close && previous.mergeable && !step.requiresConfirmation && step.kind !== "arrive") {
      previous.text = `${previous.text} e ${lowerFirst(step.text)}`;
      previous.kind = previous.kind === "depart" && step.kind === "straight" ? "depart" : step.kind;
      previous.mergeable = step.mergeable;
      continue;
    }
    merged.push({ ...step });
  }

  return merged.map((step, index) => ({
    id: `step-${index}`,
    kind: step.kind,
    text: `${step.text}.`,
    nodeIndex: step.nodeIndex,
    progress: track.at[step.nodeIndex],
    targetLevel: step.targetLevel,
    requiresConfirmation: step.requiresConfirmation,
  }));
}
