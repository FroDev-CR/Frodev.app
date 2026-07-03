"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import {
  getTransactions,
  addTransaction,
  deleteTransaction,
} from "@/lib/store";
import { money, shortDate, today } from "@/lib/format";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  type Transaction,
  type TransactionType,
} from "@/lib/types";

export default function FinanzasPage() {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // form state
  const [type, setType] = useState<TransactionType>("gasto");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(today());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getTransactions().then((t) => {
      setTxs(t);
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

  function switchType(t: TransactionType) {
    setType(t);
    setCategory(t === "gasto" ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      setError("Monto inválido. Debe ser mayor a 0.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const row = await addTransaction({
        type,
        amount: value,
        category,
        note,
        date,
      });
      setTxs((prev) =>
        [row, ...prev].sort((a, b) => b.date.localeCompare(a.date))
      );
      setAmount("");
      setNote("");
      setShowForm(false);
    } catch {
      setError("No se pudo guardar. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Borrar este movimiento?")) return;
    await deleteTransaction(id);
    setTxs((prev) => prev.filter((t) => t.id !== id));
  }

  const categories = type === "gasto" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

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

      {/* Resumen del mes */}
      <div className="grid grid-cols-2 gap-4">
        <div className="brut-card brut-card--income p-4">
          <div className="flex items-center gap-2 text-income">
            <TrendingUp size={18} aria-hidden />
            <span className="brut-tag bg-income text-black">Entradas</span>
          </div>
          <p className="text-xl font-bold mt-2 tabular-nums">{money(income)}</p>
        </div>
        <div className="brut-card brut-card--expense p-4">
          <div className="flex items-center gap-2 text-expense">
            <TrendingDown size={18} aria-hidden />
            <span className="brut-tag bg-expense text-white">Gastos</span>
          </div>
          <p className="text-xl font-bold mt-2 tabular-nums">
            {money(expense)}
          </p>
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <form onSubmit={handleSubmit} className="brut-card p-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Tipo de movimiento">
            <button
              type="button"
              onClick={() => switchType("gasto")}
              className={`brut-btn px-3 ${
                type === "gasto" ? "bg-expense text-white" : "bg-bg text-muted"
              }`}
              aria-pressed={type === "gasto"}
            >
              Gasto
            </button>
            <button
              type="button"
              onClick={() => switchType("entrada")}
              className={`brut-btn px-3 ${
                type === "entrada" ? "bg-income text-black" : "bg-bg text-muted"
              }`}
              aria-pressed={type === "entrada"}
            >
              Entrada
            </button>
          </div>

          <label className="flex flex-col gap-1 text-sm font-bold uppercase">
            Monto
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="brut-input"
              placeholder="0.00"
              required
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-bold uppercase">
            Categoría
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="brut-input"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-bold uppercase">
            Fecha
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="brut-input"
              required
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-bold uppercase">
            Nota <span className="text-muted font-normal normal-case">(opcional)</span>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="brut-input"
              placeholder="ej: tacos con amigos"
            />
          </label>

          {error && (
            <p role="alert" className="text-expense text-sm font-bold">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="brut-btn bg-primary text-white px-4 disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </form>
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
                <p className="font-bold text-sm">{t.category}</p>
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
                  aria-label={`Borrar ${t.category} ${money(t.amount)}`}
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
