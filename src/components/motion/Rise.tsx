import type { CSSProperties, ReactNode } from "react";

/** Bloco que entra subindo; `i` escalona a entrada (60ms por passo). Funciona em server components. */
export function Rise({ i = 0, className = "", children }: { i?: number; className?: string; children: ReactNode }) {
  return (
    <div className={`animate-rise ${className}`} style={{ "--i": i } as CSSProperties}>
      {children}
    </div>
  );
}
