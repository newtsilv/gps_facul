import type { ComponentProps } from "react";

/** Painel flutuante sobre o mapa (fundo translúcido com desfoque). */
export function Surface({ className = "", ...props }: ComponentProps<"div">) {
  return (
    <div
      className={`rounded-2xl border border-primary-200 bg-primary-50/95 shadow-[0_10px_34px_-12px_rgb(0_44_87/0.28)] backdrop-blur-md ${className}`}
      {...props}
    />
  );
}
