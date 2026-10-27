import type { ButtonHTMLAttributes } from "react";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Nome acessível (o botão mostra só o ícone). */
  label: string;
  active?: boolean;
};

/** Botão quadrado só com ícone, usado nos controles do mapa. */
export function IconButton({ label, active = false, className = "", type = "button", children, ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      aria-pressed={active || undefined}
      className={`flex size-11 shrink-0 items-center justify-center rounded-xl transition-all duration-200 active:scale-95 disabled:pointer-events-none disabled:opacity-40 lg:size-10 ${
        active ? "bg-primary-500 text-primary-50 shadow-md shadow-primary-500/30" : "text-primary-600 hover:bg-primary-100"
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
