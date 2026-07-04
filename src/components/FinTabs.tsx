"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Skull, TrendingDown } from "lucide-react";

// Pestañas de la sección de gastos: Gastos | Deudas.
// El botón de Deudas siempre va en rojo con calavera blanca.
export default function FinTabs() {
  const pathname = usePathname();
  const onGastos = pathname === "/finanzas/gastos";

  return (
    <div className="grid grid-cols-2 gap-3" role="tablist" aria-label="Sección">
      <Link
        href="/finanzas/gastos"
        aria-current={onGastos ? "page" : undefined}
        className={`brut-btn px-3 flex items-center justify-center gap-2 ${
          onGastos ? "bg-expense text-white" : "bg-bg text-muted"
        }`}
      >
        <TrendingDown size={18} aria-hidden /> Gastos
      </Link>
      <Link
        href="/finanzas/deudas"
        aria-current={!onGastos ? "page" : undefined}
        className="brut-btn px-3 flex items-center justify-center gap-2 bg-debt text-white"
      >
        <Skull size={18} aria-hidden /> Deudas
      </Link>
    </div>
  );
}
