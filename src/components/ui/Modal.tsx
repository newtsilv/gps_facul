"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { XIcon } from "lucide-react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** "lg" para formulários com muitos campos. */
  size?: "md" | "lg";
};

/**
 * Janela sobre a página, usando o <dialog> nativo (foco preso dentro, Esc fecha).
 * Fecha também ao clicar fora. No celular abre como uma folha vinda de baixo.
 */
export function Modal({ open, onClose, title, description, children, size = "md" }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      document.body.style.overflow = "hidden";
    } else if (!open && dialog.open) {
      dialog.close();
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      // O clique só tem o próprio <dialog> como alvo quando acontece no fundo escurecido.
      onClick={(event) => event.target === event.currentTarget && onClose()}
      className={`m-auto w-[calc(100%-2rem)] ${size === "lg" ? "max-w-2xl" : "max-w-lg"} rounded-2xl bg-primary-50 p-0 text-primary-600 shadow-2xl backdrop:bg-primary-600/40 backdrop:backdrop-blur-[2px] open:animate-pop-in max-sm:mb-0 max-sm:w-full max-sm:max-w-none max-sm:rounded-b-none`}
    >
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-xl font-semibold">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm text-primary-300">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="-mt-1 -mr-2 rounded-lg p-2 text-primary-300 transition-colors hover:bg-primary-100 hover:text-primary-600"
          >
            <XIcon strokeWidth={1.75} className="size-5" />
          </button>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </dialog>
  );
}
