"use client";

import { useState, type ComponentProps } from "react";

type SwitchProps = Omit<ComponentProps<"input">, "type" | "role"> & {
  /** Rótulo à esquerda (ex.: "Status do cadastro"). */
  label: string;
  /** Texto ao lado do botão, conforme o estado. */
  onText?: string;
  offText?: string;
};

/** Liga/desliga. É um checkbox nativo: envia "on" no formulário quando ligado. */
export function Switch({ label, onText = "Ativado", offText = "Desativado", defaultChecked, onChange, className = "", ...props }: SwitchProps) {
  const [checked, setChecked] = useState(Boolean(defaultChecked));

  return (
    <label className={`flex min-h-11 cursor-pointer items-center justify-between gap-4 has-disabled:cursor-default has-disabled:opacity-60 ${className}`}>
      <span>{label}</span>
      <span className="flex items-center gap-3">
        <input
          type="checkbox"
          role="switch"
          defaultChecked={defaultChecked}
          onChange={(event) => {
            setChecked(event.target.checked);
            onChange?.(event);
          }}
          className="peer sr-only"
          {...props}
        />
        <span
          aria-hidden
          className="relative h-6 w-11 shrink-0 rounded-full bg-primary-200 transition-colors duration-200 peer-checked:bg-primary-500 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500/40 peer-focus-visible:ring-offset-2 after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-primary-50 after:shadow after:transition-transform after:duration-200 peer-checked:after:translate-x-5"
        />
        <span className="w-20 text-sm">{checked ? onText : offText}</span>
      </span>
    </label>
  );
}
