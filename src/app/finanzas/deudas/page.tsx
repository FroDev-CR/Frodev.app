"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Skull, Trash2 } from "lucide-react";
import { getDebts, addDebt, deleteDebt } from "@/lib/store";
import { money, shortDate, today } from "@/lib/format";
import {
  DEBT_FREQUENCY_LABELS,
  type Debt,
  type DebtFrequency,
} from "@/lib/types";
import FinTabs from "@/components/FinTabs";

const FREQUENCIES: DebtFrequency[] = ["quincenal", "mensual", "unico"];

export default function DeudasPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // form state
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<DebtFrequency>("mensual");
  const [dueDate, setDueDate] = useState(today());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getDebts().then((d) => {
      setDebts(d);
      setLoaded(true);
    });
  }, []);

  // Lo que las deudas recurrentes se comen del mes (quincenal paga 2 veces).
  const monthlyCommitment = debts.reduce((s, d) => {
    if (d.frequency === "mensual") return s + d.amount;
    if (d.frequency === "quincenal") return s + d.amount * 2;
    return s;
  }, 0);
  const oneTimeTotal = debts
    .filter((d) => d.frequency === "unico")
    .reduce((s, d) => s + d.amount, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      setError("Monto inválido. Debe ser mayor a 0.");
      return;
    }
    if (!name.trim()) {
      setError("Ponle nombre a la deuda para identificarla.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const row = await addDebt({
        name: name.trim(),
        amount: value,
        frequency,
        due_date: frequency === "unico" ? dueDate : null,
      });
      setDebts((prev) => [row, ...prev]);
      setName("");
      setAmount("");
      setShowForm(false);
    } catch {
      setError("No se pudo guardar. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Borrar esta deuda?")) return;
    await deleteDebt(id);
    setDebts((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/finanzas/gastos"
        className="flex items-center gap-2 text-muted text-sm font-bold uppercase w-fit"
      >
        <ArrowLeft size={16} aria-hidden /> Gastos
      </Link>

      <FinTabs />

      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold uppercase rot-l flex items-center gap-2">
          <Skull size={26} className="text-debt" aria-hidden /> Deudas
        </h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="brut-btn bg-debt text-white px-4 flex items-center gap-2"
          aria-expanded={showForm}
        >
          <Plus size={18} aria-hidden /> {showForm ? "Cerrar" : "Nueva"}
        </button>
      </header>

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-4">
        <div className="brut-card brut-card--debt p-4">
          <span className="brut-tag bg-debt text-white">Al mes</span>
          <p className="text-xl font-bold mt-2 tabular-nums">
            {money(monthlyCommitment)}
          </p>
          <p className="text-xs text-muted mt-1">
            mensuales + quincenales ×2
          </p>
        </div>
        <div className="brut-card brut-card--debt p-4">
          <span className="brut-tag bg-debt text-white">Pagos únicos</span>
          <p className="text-xl font-bold mt-2 tabular-nums">
            {money(oneTimeTotal)}
          </p>
          <p className="text-xs text-muted mt-1">pendientes de un pago</p>
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="brut-card brut-card--debt p-5 flex flex-col gap-4"
        >
          <label className="flex flex-col gap-1 text-sm font-bold uppercase">
            ¿Qué debes?
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="brut-input"
              placeholder="ej: tarjeta, préstamo, celular"
              required
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-bold uppercase">
            ¿Cuánto?
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

          <fieldset className="flex flex-col gap-1">
            <legend className="text-sm font-bold uppercase mb-1">
              ¿Cada cuándo?
            </legend>
            <div
              className="grid grid-cols-3 gap-2"
              role="radiogroup"
              aria-label="Frecuencia de la deuda"
            >
              {FREQUENCIES.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFrequency(f)}
                  className={`brut-btn px-2 text-xs ${
                    frequency === f ? "bg-debt text-white" : "bg-bg text-muted"
                  }`}
                  aria-pressed={frequency === f}
                >
                  {DEBT_FREQUENCY_LABELS[f]}
                </button>
              ))}
            </div>
          </fieldset>

          {frequency === "unico" && (
            <label className="flex flex-col gap-1 text-sm font-bold uppercase">
              ¿Cuándo hay que pagarlo?
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="brut-input"
                required
              />
            </label>
          )}

          {error && (
            <p role="alert" className="text-expense text-sm font-bold">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="brut-btn bg-debt text-white px-4 disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </form>
      )}

      {/* Lista */}
      <section>
        <h2 className="text-lg font-bold uppercase mb-3">Mis deudas</h2>
        {loaded && debts.length === 0 && (
          <p className="text-muted text-sm">
            Sin deudas registradas. Ojalá siga así — pero si no, toca NUEVA.
          </p>
        )}
        <ul className="flex flex-col gap-3">
          {debts.map((d) => (
            <li
              key={d.id}
              className="brut-card brut-card--debt p-3 flex justify-between items-center gap-2"
            >
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">{d.name}</p>
                <span className="brut-tag bg-debt text-white mt-1">
                  {DEBT_FREQUENCY_LABELS[d.frequency]}
                  {d.frequency === "unico" && d.due_date
                    ? ` · ${shortDate(d.due_date)}`
                    : ""}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <p className="font-bold tabular-nums text-debt">
                  {money(d.amount)}
                </p>
                <button
                  onClick={() => handleDelete(d.id)}
                  aria-label={`Borrar deuda ${d.name} ${money(d.amount)}`}
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
