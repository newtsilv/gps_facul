import type { ComponentProps } from "react";
import { SearchIcon } from "lucide-react";
import { fieldClasses } from "./fieldStyles";

type SearchFieldProps = Omit<ComponentProps<"input">, "type"> & {
  /** Rótulo para leitores de tela (o campo mostra só a lupa e o placeholder). */
  label: string;
  name: string;
};

/** Campo de busca com lupa, sobre o fundo cinza das páginas. Busca ao apertar Enter. */
export function SearchField({ label, className = "", ...props }: SearchFieldProps) {
  return (
    <label className={`relative block ${className}`}>
      <span className="sr-only">{label}</span>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-4.5 -translate-y-1/2 text-primary-300" />
      <input type="search" enterKeyHint="search" maxLength={100} className={`${fieldClasses(false, "outline")} pl-11`} {...props} />
    </label>
  );
}
