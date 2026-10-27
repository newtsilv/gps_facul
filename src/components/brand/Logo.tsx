import { NavigationIcon } from "lucide-react";
import { siteConfig } from "@/config/site";

/** Marca do app: ícone de navegação + nome. `compact` mostra só o ícone. */
export function Logo({ compact = false, className = "" }: { compact?: boolean; className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary-500 text-primary-50 shadow-md shadow-primary-500/30">
        <NavigationIcon className="size-4.5 fill-current" strokeWidth={2} />
      </span>
      {!compact && <span className="text-[1.0625rem] font-semibold tracking-tight text-primary-550">{siteConfig.name}</span>}
    </span>
  );
}
