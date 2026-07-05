"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  NotebookPen,
  Plus,
  Skull,
  Trash2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { getTransactions, getDebts, deleteTransaction } from "@/lib/store";
import { money, shortDate, today } from "@/lib/format";
import type { Debt, Transaction } from "@/lib/types";
import TxForm from "@/components/TxForm";

export default function FinanzasPage() {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    Promise.all([getTransactions(), getDebts()]).then(([t, d]) => {
      setTxs(t);
      setDebts(d);
      setLoaded(true);
    });
  }, []);

  const month = new Date().toISOString().slice(0, 7);
  const monthTxs = txs.filter((t) => t.date.startsWith(month));
  const income = monthTxs
    .filter((t) => t.type === "entrada")
    .reduce((s, t) => s + t.amount, 0);
  const expense = monthTxs
    .filter((t) => t.type === "gasto")
    .reduce((s, t) => s + t.amount, 0);

  // Pagos únicos ordenados por cercanía (las recurrentes no tienen día fijo).
  const todayStr = today();
  const upcomingDebts = debts
    .filter((d) => d.frequency === "unico" && d.due_date && !d.low_priority)
    .sort((a, b) => a.due_date!.localeCompare(b.due_date!))
    .slice(0, 3);

  async function handleDelete(id: string) {
    if (!confirm("¿Borrar este movimiento?")) return;
    await deleteTransaction(id);
    setTxs((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold uppercase rot-l">Finanzas</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="brut-btn bg-primary text-white px-4 flex items-center gap-2"
          aria-expanded={showForm}
        >
          <Plus size={18} aria-hidden /> {showForm ? "Cerrar" : "Nuevo"}
        </button>
      </header>

      {/* Resumen del mes — cada tarjeta lleva a su detalle */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/finanzas/entradas"
          className="brut-card brut-card--income p-4 block"
        >
          <div className="flex items-center gap-2 text-income">
            <TrendingUp size={18} aria-hidden />
            <span className="brut-tag bg-income text-black">Entradas</span>
          </div>
          <p className="text-xl font-bold mt-2 tabular-nums">{money(income)}</p>
          <span className="flex items-center gap-1 text-xs text-muted mt-2 uppercase font-bold">
            Ver detalle <ArrowRight size={14} aria-hidden />
          </span>
        </Link>
        <Link
          href="/finanzas/gastos"
          className="brut-card brut-card--expense p-4 block"
        >
          <div className="flex items-center gap-2 text-expense">
            <TrendingDown size={18} aria-hidden />
            <span className="brut-tag bg-expense text-white">Gastos</span>
          </div>
          <p className="text-xl font-bold mt-2 tabular-nums">
            {money(expense)}
          </p>
          <span className="flex items-center gap-1 text-xs text-muted mt-2 uppercase font-bold">
            Ver detalle <ArrowRight size={14} aria-hidden />
          </span>
        </Link>
      </div>

      {/* Estadísticas y lista de compras */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/finanzas/estadisticas"
          className="brut-btn bg-primary text-white px-3 flex items-center justify-center gap-2 text-sm"
        >
          <BarChart3 size={18} aria-hidden /> Stats
        </Link>
        <Link
          href="/finanzas/lista"
          className="brut-btn bg-gym text-black px-3 flex items-center justify-center gap-2 text-sm"
        >
          <NotebookPen size={18} aria-hidden /> Compras
        </Link>
      </div>

      {/* Deudas cercanas */}
      {upcomingDebts.length > 0 && (
        <section className="brut-card brut-card--debt p-5">
          <span className="brut-tag bg-debt text-white flex items-center gap-1 w-fit">
            <Skull size={13} aria-hidden /> Deudas cercanas
          </span>
          <ul className="mt-3 flex flex-col gap-2">
            {upcomingDebts.map((d) => {
              const overdue = d.due_date! < todayStr;
              return (
                <li
                  key={d.id}
                  className="flex justify-between items-center gap-2 text-sm border-b border-white/10 pb-2"
                >
                  <div className="min-w-0">
                    <p className="font-bold truncate">{d.name}</p>
                    <p
                      className={`text-xs ${
                        overdue ? "text-debt font-bold" : "text-muted"
                      }`}
                    >
                      {overdue ? "¡Vencida! " : ""}
                      {shortDate(d.due_date!)}
                    </p>
                  </div>
                  <span className="font-bold tabular-nums text-debt shrink-0">
                    {money(d.amount)}
                  </span>
                </li>
              );
            })}
          </ul>
          <Link
            href="/finanzas/deudas"
            className="brut-btn bg-debt text-white flex items-center justify-center gap-2 mt-4 px-4"
          >
            <Skull size={18} aria-hidden /> Ver deudas
          </Link>
        </section>
      )}

      {/* Formulario rápido */}
      {showForm && (
        <TxForm
          onSaved={(row) => {
            setTxs((prev) =>
              [row, ...prev].sort((a, b) => b.date.localeCompare(a.date))
            );
            setShowForm(false);
          }}
        />
      )}

      {/* Lista */}
      <section>
        <h2 className="text-lg font-bold uppercase mb-3">Movimientos</h2>
        {loaded && txs.length === 0 && (
          <p className="text-muted text-sm">
            Nada por aquí. Toca NUEVO para registrar tu primer movimiento.
          </p>
        )}
        <ul className="flex flex-col gap-3">
          {txs.map((t) => (
            <li
              key={t.id}
              className={`brut-card p-3 flex justify-between items-center gap-2 ${
                t.type === "entrada"
                  ? "brut-card--income"
                  : "brut-card--expense"
              }`}
            >
              <div className="min-w-0">
                <p className="font-bold text-sm">
                  {t.category || "Sin categoría"}
                </p>
                <p className="text-xs text-muted truncate">
                  {shortDate(t.date)}
                  {t.note ? ` · ${t.note}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <p
                  className={`font-bold tabular-nums ${
                    t.type === "entrada" ? "text-income" : "text-expense"
                  }`}
                >
                  {t.type === "entrada" ? "+" : "−"}
                  {money(t.amount)}
                </p>
                <button
                  onClick={() => handleDelete(t.id)}
                  aria-label={`Borrar ${t.category || "sin categoría"} ${money(t.amount)}`}
                  className="text-muted hover:text-expense cursor-pointer p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <Trash2 size={18} aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
