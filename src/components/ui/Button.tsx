import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "outline" | "secondary";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary-500 text-primary-50 hover:bg-primary-500/90 hover:shadow-lg hover:shadow-primary-500/25",
  outline: "border border-primary-500 text-primary-500 hover:bg-primary-400",
  secondary: "border border-primary-200 bg-primary-50 text-primary-600 hover:border-primary-300 hover:bg-primary-100",
};

/** Classes do botão, para aplicar o mesmo visual em um <Link>. */
export function buttonClasses(variant: ButtonVariant = "primary", className = "") {
  return `inline-flex h-12 items-center justify-center gap-2 rounded-md px-6 text-base transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 ${variantClasses[variant]} ${className}`;
}

export function Button({ variant = "primary", className = "", type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, className)} {...props} />;
}
