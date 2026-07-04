"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, TrendingUp } from "lucide-react";
import { getTransactions, deleteTransaction } from "@/lib/store";
import { money, shortDate } from "@/lib/format";
import type { Transaction } from "@/lib/types";
import TxForm from "@/components/TxForm";

export default function EntradasPage() {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    getTransactions().then((t) => {
      setTxs(t.filter((x) => x.type === "entrada"));
      setLoaded(true);
    });
  }, []);

  const month = new Date().toISOString().slice(0, 7);
  const monthTotal = txs
    .filter((t) => t.date.startsWith(month))
    .reduce((s, t) => s + t.amount, 0);

  async function handleDelete(id: string) {
    if (!confirm("¿Borrar esta entrada?")) return;
    await deleteTransaction(id);
    setTxs((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/finanzas"
        className="flex items-center gap-2 text-muted text-sm font-bold uppercase w-fit"
      >
        <ArrowLeft size={16} aria-hidden /> Finanzas
      </Link>

      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold uppercase rot-l">Entradas</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="brut-btn bg-income text-black px-4 flex items-center gap-2"
          aria-expanded={showForm}
        >
          <Plus size={18} aria-hidden /> {showForm ? "Cerrar" : "Nueva"}
        </button>
      </header>

      <div className="brut-card brut-card--income p-4">
        <div className="flex items-center gap-2 text-income">
          <TrendingUp size={18} aria-hidden />
          <span className="brut-tag bg-income text-black">
            Recibido este mes
          </span>
        </div>
        <p className="text-2xl font-bold mt-2 tabular-nums">
          {money(monthTotal)}
        </p>
      </div>

      {showForm && (
        <TxForm
          fixedType="entrada"
          onSaved={(row) => {
            setTxs((prev) =>
              [row, ...prev].sort((a, b) => b.date.localeCompare(a.date))
            );
            setShowForm(false);
          }}
        />
      )}

      <section>
        <h2 className="text-lg font-bold uppercase mb-3">Detalle</h2>
        {loaded && txs.length === 0 && (
          <p className="text-muted text-sm">
            Sin entradas aún. Toca NUEVA para registrar la primera.
          </p>
        )}
        <ul className="flex flex-col gap-3">
          {txs.map((t) => (
            <li
              key={t.id}
              className="brut-card brut-card--income p-3 flex justify-between items-center gap-2"
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
                <p className="font-bold tabular-nums text-income">
                  +{money(t.amount)}
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
