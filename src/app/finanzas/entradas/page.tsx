"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, Plus, Repeat, Trash2, TrendingUp } from "lucide-react";
import {
  getTransactions,
  deleteTransaction,
  getRecurringIncomes,
  updateRecurringIncome,
  deleteRecurringIncome,
  syncRecurringIncomes,
} from "@/lib/store";
import { money, shortDate } from "@/lib/format";
import {
  INCOME_FREQUENCY_LABELS,
  type IncomeFrequency,
  type RecurringIncome,
  type Transaction,
} from "@/lib/types";
import TxForm from "@/components/TxForm";

function notifyWallet() {
  window.dispatchEvent(new CustomEvent("wallet-changed"));
}

export default function EntradasPage() {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [recs, setRecs] = useState<RecurringIncome[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);

  function load() {
    // Materializa las automáticas pendientes antes de leer.
    return syncRecurringIncomes()
      .then((created) => {
        if (created.length > 0) notifyWallet();
        return Promise.all([getTransactions(), getRecurringIncomes()]);
      })
      .then(([t, r]) => {
        setTxs(t.filter((x) => x.type === "entrada"));
        setRecs(r);
        setLoaded(true);
      });
  }

  useEffect(() => {
    load();
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

  async function handleDeleteRec(id: string) {
    if (!confirm("¿Borrar esta entrada automática? Se detiene a futuro.")) return;
    await deleteRecurringIncome(id);
    setRecs((prev) => prev.filter((r) => r.id !== id));
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
          onRecurringSaved={async () => {
            await load();
            setShowForm(false);
          }}
        />
      )}

      {/* Entradas automáticas */}
      {recs.length > 0 && (
        <section>
          <h2 className="text-lg font-bold uppercase mb-3 flex items-center gap-2">
            <Repeat size={18} aria-hidden /> Automáticas
          </h2>
          <ul className="flex flex-col gap-3">
            {recs.map((r) => (
              <RecurringItem
                key={r.id}
                rec={r}
                onSaved={(updated) =>
                  setRecs((prev) =>
                    prev.map((x) => (x.id === updated.id ? updated : x))
                  )
                }
                onDelete={() => handleDeleteRec(r.id)}
              />
            ))}
          </ul>
        </section>
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
                <p className="font-bold text-sm flex items-center gap-1">
                  {t.category || "Sin categoría"}
                  {t.recurring_id && (
                    <Repeat size={13} className="text-muted" aria-label="automática" />
                  )}
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

// ── Item de entrada automática, con edición inline ──────────
function RecurringItem({
  rec,
  onSaved,
  onDelete,
}: {
  rec: RecurringIncome;
  onSaved: (r: RecurringIncome) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(String(rec.amount));
  const [freq, setFreq] = useState<IncomeFrequency>(rec.frequency);
  const [day1, setDay1] = useState(String(rec.day1));
  const [day2, setDay2] = useState(String(rec.day2 ?? 30));
  const [saving, setSaving] = useState(false);

  async function save() {
    const value = parseFloat(amount);
    const d1 = parseInt(day1, 10);
    const d2 = freq === "quincenal" ? parseInt(day2, 10) : null;
    if (!value || value <= 0 || !d1 || d1 < 1 || d1 > 31) return;
    if (freq === "quincenal" && (!d2 || d2 < 1 || d2 > 31)) return;
    setSaving(true);
    try {
      const updated = await updateRecurringIncome(rec.id, {
        amount: value,
        frequency: freq,
        day1: d1,
        day2: d2,
      });
      onSaved(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  const daysLabel =
    rec.frequency === "quincenal"
      ? `días ${rec.day1} y ${rec.day2}`
      : `día ${rec.day1}`;

  if (!editing) {
    return (
      <li className="brut-card brut-card--income p-3 flex justify-between items-center gap-2">
        <div className="min-w-0">
          <p className="font-bold text-sm truncate">{rec.name}</p>
          <span className="brut-tag bg-income text-black mt-1">
            {INCOME_FREQUENCY_LABELS[rec.frequency]} · {daysLabel}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <p className="font-bold tabular-nums text-income">
            {money(rec.amount)}
          </p>
          <button
            onClick={() => setEditing(true)}
            aria-label={`Editar automática ${rec.name}`}
            className="text-muted hover:text-primary cursor-pointer p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Pencil size={17} aria-hidden />
          </button>
          <button
            onClick={onDelete}
            aria-label={`Borrar automática ${rec.name}`}
            className="text-muted hover:text-expense cursor-pointer p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Trash2 size={17} aria-hidden />
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="brut-card brut-card--income p-4 flex flex-col gap-3">
      <p className="font-bold text-sm">{rec.name}</p>
      <label className="flex flex-col gap-1 text-xs font-bold uppercase">
        Monto
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="brut-input"
        />
      </label>
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Frecuencia">
        {(["quincenal", "mensual"] as IncomeFrequency[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFreq(f)}
            className={`brut-btn px-2 text-xs ${
              freq === f ? "bg-income text-black" : "bg-bg text-muted"
            }`}
            aria-pressed={freq === f}
          >
            {INCOME_FREQUENCY_LABELS[f]}
          </button>
        ))}
      </div>
      <div
        className={`grid gap-2 ${
          freq === "quincenal" ? "grid-cols-2" : "grid-cols-1"
        }`}
      >
        <label className="flex flex-col gap-1 text-xs font-bold uppercase">
          {freq === "quincenal" ? "Día 1" : "Día del mes"}
          <input
            type="number"
            min="1"
            max="31"
            value={day1}
            onChange={(e) => setDay1(e.target.value)}
            className="brut-input"
          />
        </label>
        {freq === "quincenal" && (
          <label className="flex flex-col gap-1 text-xs font-bold uppercase">
            Día 2
            <input
              type="number"
              min="1"
              max="31"
              value={day2}
              onChange={(e) => setDay2(e.target.value)}
              className="brut-input"
            />
          </label>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setEditing(false)}
          className="brut-btn bg-bg text-muted px-3 text-sm"
        >
          Cancelar
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="brut-btn bg-income text-black px-3 text-sm disabled:opacity-50"
        >
          {saving ? "…" : "Guardar"}
        </button>
      </div>
    </li>
  );
}
