"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, CalendarClock, TrendingDown } from "lucide-react";
import { getTransactions, getDebts } from "@/lib/store";
import { money, shortDate, today } from "@/lib/format";
import type { Debt, Transaction } from "@/lib/types";

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) =>
  `${y}-${pad(m + 1)}-${pad(d)}`;

interface Payday {
  date: string; // ISO
  label: string;
  isEndOfMonth: boolean;
}

// Las dos próximas fechas de pago: el 15 y el fin de mes, en orden.
function nextPaydays(todayStr: string): [Payday, Payday] {
  const [y, m, day] = todayStr.split("-").map(Number);
  const month = m - 1;
  const lastDay = new Date(y, month + 1, 0).getDate();
  const q15: Payday = {
    date: iso(y, month, 15),
    label: "Este 15",
    isEndOfMonth: false,
  };
  const eom: Payday = {
    date: iso(y, month, lastDay),
    label: "Fin de mes",
    isEndOfMonth: true,
  };
  if (day <= 15) return [q15, eom];
  const nextY = month === 11 ? y + 1 : y;
  const nextM = (month + 1) % 12;
  return [
    eom,
    { date: iso(nextY, nextM, 15), label: "El próximo 15", isEndOfMonth: false },
  ];
}

export default function EstadisticasPage() {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([getTransactions(), getDebts()]).then(([t, d]) => {
      setTxs(t);
      setDebts(d);
      setLoaded(true);
    });
  }, []);

  const todayStr = today();
  const month = todayStr.slice(0, 7);
  const dayOfMonth = Number(todayStr.slice(8, 10));
  const [y, m] = todayStr.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();

  // ── Próximos pagos (deudas; las "sin prisa" no cuentan) ──
  const activeDebts = debts.filter((d) => !d.low_priority);
  const [pay1, pay2] = nextPaydays(todayStr);
  const quincenalTotal = activeDebts
    .filter((d) => d.frequency === "quincenal")
    .reduce((s, d) => s + d.amount, 0);
  const mensualTotal = activeDebts
    .filter((d) => d.frequency === "mensual")
    .reduce((s, d) => s + d.amount, 0);
  const unicos = activeDebts.filter(
    (d) => d.frequency === "unico" && d.due_date
  );
  const unicosOverdue = unicos
    .filter((d) => d.due_date! < todayStr)
    .reduce((s, d) => s + d.amount, 0);
  // Cada pago único cae en la primera fecha de corte que lo cubre.
  const unicosPay1 = unicos
    .filter((d) => d.due_date! >= todayStr && d.due_date! <= pay1.date)
    .reduce((s, d) => s + d.amount, 0);
  const unicosPay2 = unicos
    .filter((d) => d.due_date! > pay1.date && d.due_date! <= pay2.date)
    .reduce((s, d) => s + d.amount, 0);
  const pay1Total =
    quincenalTotal + (pay1.isEndOfMonth ? mensualTotal : 0) + unicosPay1;
  const pay2Total =
    quincenalTotal + (pay2.isEndOfMonth ? mensualTotal : 0) + unicosPay2;

  // ── Gastos del mes ──
  const monthExpenses = txs.filter(
    (t) => t.type === "gasto" && t.date.startsWith(month)
  );
  const monthTotal = monthExpenses.reduce((s, t) => s + t.amount, 0);
  const dailyAvg = monthTotal / dayOfMonth;
  const projection = dailyAvg * daysInMonth;

  // ── Top categorías del mes ──
  const byCategory = new Map<string, number>();
  for (const t of monthExpenses) {
    const key = t.category || "Sin categoría";
    byCategory.set(key, (byCategory.get(key) ?? 0) + t.amount);
  }
  const topCats = [...byCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxCat = topCats[0]?.[1] ?? 0;

  // ── Promedio mensual histórico ──
  const allExpenses = txs.filter((t) => t.type === "gasto");
  const monthsWithData = new Set(allExpenses.map((t) => t.date.slice(0, 7)));
  const monthlyAvg =
    monthsWithData.size > 1
      ? allExpenses.reduce((s, t) => s + t.amount, 0) / monthsWithData.size
      : null;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/finanzas"
        className="flex items-center gap-2 text-muted text-sm font-bold uppercase w-fit"
      >
        <ArrowLeft size={16} aria-hidden /> Finanzas
      </Link>

      <header>
        <h1 className="text-2xl font-bold uppercase rot-l flex items-center gap-2">
          <BarChart3 size={26} className="text-primary" aria-hidden />
          Estadísticas
        </h1>
      </header>

      {/* Próximos pagos */}
      <section className="brut-card brut-card--debt p-5">
        <span className="brut-tag bg-debt text-white flex items-center gap-1 w-fit">
          <CalendarClock size={13} aria-hidden /> Tenés que pagar
        </span>
        <div className="grid grid-cols-2 gap-4 mt-3">
          <div>
            <p className="text-xs text-muted uppercase font-bold">
              {pay1.label} · {shortDate(pay1.date)}
            </p>
            <p className="text-2xl font-bold tabular-nums mt-1">
              {money(pay1Total)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted uppercase font-bold">
              {pay2.label} · {shortDate(pay2.date)}
            </p>
            <p className="text-2xl font-bold tabular-nums mt-1">
              {money(pay2Total)}
            </p>
          </div>
        </div>
        {unicosOverdue > 0 && (
          <p className="text-debt text-sm font-bold mt-3">
            ¡Tenés {money(unicosOverdue)} en pagos vencidos!
          </p>
        )}
        <p className="text-xs text-muted mt-3">
          quincenales en ambas fechas · mensuales a fin de mes · pagos únicos en
          su fecha
        </p>
      </section>

      {/* Gastos del mes */}
      <section className="brut-card brut-card--expense p-5">
        <span className="brut-tag bg-expense text-white flex items-center gap-1 w-fit">
          <TrendingDown size={13} aria-hidden /> Gastos del mes
        </span>
        <p className="text-4xl font-bold tabular-nums mt-3">
          {loaded ? money(monthTotal) : "—"}
        </p>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-xs text-muted uppercase font-bold">
              Promedio diario
            </p>
            <p className="text-lg font-bold tabular-nums mt-1">
              {money(dailyAvg)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted uppercase font-bold">
              Así llegás a fin de mes
            </p>
            <p className="text-lg font-bold tabular-nums mt-1">
              {money(projection)}
            </p>
          </div>
        </div>
        {monthlyAvg != null && (
          <p className="text-xs text-muted mt-4">
            Tu promedio histórico es {money(monthlyAvg)} al mes.
          </p>
        )}
      </section>

      {/* En qué gasto más */}
      <section className="brut-card p-5">
        <span className="brut-tag bg-primary text-white w-fit">
          En qué gastás más
        </span>
        {loaded && topCats.length === 0 && (
          <p className="text-muted text-sm mt-3">
            Sin gastos este mes todavía. Cuando registres algunos, aquí verás el
            desglose.
          </p>
        )}
        <ul className="mt-4 flex flex-col gap-3">
          {topCats.map(([name, amt]) => (
            <li key={name}>
              <div className="flex justify-between items-baseline gap-2 text-sm">
                <span className="font-bold truncate">{name}</span>
                <span className="tabular-nums shrink-0">
                  {money(amt)}{" "}
                  <span className="text-muted text-xs">
                    ({Math.round((amt / monthTotal) * 100)}%)
                  </span>
                </span>
              </div>
              <div
                className="h-3 mt-1 border-2 border-white/25 bg-bg"
                role="img"
                aria-label={`${name}: ${money(amt)}`}
              >
                <div
                  className="h-full bg-expense"
                  style={{ width: `${(amt / maxCat) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
