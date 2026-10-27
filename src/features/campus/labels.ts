import type { RoomType } from "./types";

/** 0 → "Térreo", 2 → "2º andar". */
export function floorName(level: number) {
  return level === 0 ? "Térreo" : `${level}º andar`;
}

/** Rótulo curto para o seletor de andares: "T", "1", "2". */
export function floorShortName(level: number) {
  return level === 0 ? "T" : String(level);
}

/** Usado no meio de frases: "Suba até o 3º andar" / "Desça até o térreo". */
export function floorInSentence(level: number) {
  return level === 0 ? "o térreo" : `o ${level}º andar`;
}

/** "no térreo" / "no 3º andar". */
export function onFloor(level: number) {
  return level === 0 ? "no térreo" : `no ${level}º andar`;
}

const feminine = new Set(["sala", "biblioteca", "cantina", "coordenação", "secretaria", "tesouraria", "reprografia", "entrada", "escada", "saída", "passagem", "passarela", "cápsula", "área", "recepção"]);

type Preposition = "a" | "de" | "em" | "por";

const contractions: Record<Preposition, Record<"o" | "a" | "os" | "as", string>> = {
  a: { o: "ao", a: "à", os: "aos", as: "às" },
  de: { o: "do", a: "da", os: "dos", as: "das" },
  em: { o: "no", a: "na", os: "nos", as: "nas" },
  por: { o: "pelo", a: "pela", os: "pelos", as: "pelas" },
};

/**
 * Junta preposição e artigo ao nome do lugar, pelo gênero da primeira palavra:
 * ("a", "Biblioteca Central") → "à Biblioteca Central"; ("de", "Banheiros") → "dos Banheiros".
 */
export function withArticle(preposition: Preposition, name: string) {
  const first = name.split(/[\s—-]/)[0].toLowerCase();
  const plural = first.endsWith("s") && first.length > 3;
  const singular = plural ? first.slice(0, -1) : first;
  const article = feminine.has(singular) ? (plural ? "as" : "a") : plural ? "os" : "o";
  return `${contractions[preposition][article]} ${name}`;
}

export const roomTypeLabels: Record<RoomType, string> = {
  sala: "Sala de aula",
  laboratorio: "Laboratório",
  auditorio: "Auditório",
  biblioteca: "Biblioteca",
  banheiro: "Banheiro",
  cantina: "Cantina",
  coordenacao: "Coordenação",
  secretaria: "Secretaria",
  administrativo: "Administrativo",
  servico: "Serviço",
  convivencia: "Convivência",
  escada: "Escada",
  elevador: "Elevador",
  entrada: "Entrada",
};
