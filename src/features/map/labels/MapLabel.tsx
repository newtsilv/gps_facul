"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { labelRegistry, type LabelPosition } from "./registry";

type MapLabelProps = {
  id: string;
  position: () => LabelPosition | null;
  children: ReactNode;
  className?: string;
};

/** Elemento HTML preso a um ponto da cena 3D (posicionado pelo `LabelProjector`). */
export function MapLabel({ id, position, children, className = "" }: MapLabelProps) {
  const element = useRef<HTMLDivElement>(null);
  const getter = useRef(position);

  useLayoutEffect(() => {
    getter.current = position;
  });

  useLayoutEffect(() => {
    labelRegistry.set(id, { el: element.current!, position: () => getter.current() });
    return () => {
      labelRegistry.delete(id);
    };
  }, [id]);

  return (
    <div ref={element} style={{ display: "none" }} className={`absolute top-0 left-0 will-change-transform ${className}`}>
      {children}
    </div>
  );
}
