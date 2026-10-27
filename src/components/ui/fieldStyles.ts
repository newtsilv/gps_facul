export type FieldAppearance = "filled" | "outline";

const appearanceClasses: Record<FieldAppearance, string> = {
  // Fundo cinza: para formulários sobre fundo branco (modais, login).
  filled: "bg-primary-100 ring-transparent hover:ring-primary-200",
  // Fundo branco com borda: para campos sobre o fundo cinza das páginas (ex.: filtros).
  outline: "bg-primary-50 ring-primary-200 hover:ring-primary-300",
};

/** Visual compartilhado pelos campos de formulário (mesmo estilo do login). */
export function fieldClasses(hasError: boolean, appearance: FieldAppearance = "filled") {
  return `h-12 w-full rounded-md px-4 text-base text-primary-600 outline-none ring-1 transition-all duration-200 placeholder:text-primary-300 focus:bg-primary-50 focus:ring-2 disabled:opacity-60 lg:h-10.5 lg:text-sm ${
    hasError ? "ring-secondary-red focus:ring-secondary-red/40" : `${appearanceClasses[appearance]} focus:ring-primary-500/40`
  }`;
}
