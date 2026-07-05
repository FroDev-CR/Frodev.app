"use client";

import { useEffect, useState } from "react";
import { Coins, Repeat } from "lucide-react";
import {
  addCategory,
  addTransaction,
  addRecurringIncome,
  adjustWallet,
  getCategories,
} from "@/lib/store";
import { today } from "@/lib/format";
import {
  INCOME_CATEGORIES,
  INCOME_FREQUENCY_LABELS,
  type Category,
  type IncomeFrequency,
  type RecurringIncome,
  type Transaction,
  type TransactionType,
} from "@/lib/types";

const NEW_CAT = "__nueva__";
const FREQUENCIES: IncomeFrequency[] = ["quincenal", "mensual"];

function notifyWallet() {
  window.dispatchEvent(new CustomEvent("wallet-changed"));
}

interface Props {
  /** Si se pasa, el formulario queda fijo en ese tipo (sin toggle gasto/entrada). */
  fixedType?: TransactionType;
  onSaved: (tx: Transaction) => void;
  /** Si se pasa, habilita el check de "entrada automática" (solo para entradas). */
  onRecurringSaved?: (rule: RecurringIncome) => void;
}

export default function TxForm({ fixedType, onSaved, onRecurringSaved }: Props) {
  const [type, setType] = useState<TransactionType>(fixedType ?? "gasto");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(
    fixedType === "entrada" ? INCOME_CATEGORIES[0] : ""
  );
  const [newCatName, setNewCatName] = useState("");
  const [cats, setCats] = useState<Category[]>([]);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(today());
  const [affectWallet, setAffectWallet] = useState(true);
  const [recurring, setRecurring] = useState(false);
  const [freq, setFreq] = useState<IncomeFrequency>("quincenal");
  const [day1, setDay1] = useState("15");
  const [day2, setDay2] = useState("30");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getCategories("gasto").then(setCats);
  }, []);

  function switchType(t: TransactionType) {
    setType(t);
    setCategory(t === "gasto" ? "" : INCOME_CATEGORIES[0]);
    setNewCatName("");
    setRecurring(false);
  }

  const isRecurring = type === "entrada" && recurring && !!onRecurringSaved;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      setError("Monto inválido. Debe ser mayor a 0.");
      return;
    }

    // ── Entrada automática (recurrente) ──
    if (isRecurring) {
      const d1 = parseInt(day1, 10);
      const d2 = freq === "quincenal" ? parseInt(day2, 10) : null;
      if (!d1 || d1 < 1 || d1 > 31) {
        setError("Día inválido (1 a 31).");
        return;
      }
      if (freq === "quincenal" && (!d2 || d2 < 1 || d2 > 31)) {
        setError("Segundo día inválido (1 a 31).");
        return;
      }
      setError("");
      setSaving(true);
      try {
        const rule = await addRecurringIncome({
          name: category,
          amount: value,
          frequency: freq,
          day1: d1,
          day2: d2,
        });
        onRecurringSaved!(rule);
        setAmount("");
      } catch {
        setError("No se pudo guardar. Intenta de nuevo.");
      } finally {
        setSaving(false);
      }
      return;
    }

    // ── Movimiento normal ──
    let cat = category;
    if (type === "gasto" && category === NEW_CAT) {
      const name = newCatName.trim();
      if (!name) {
        setError("Escribe el nombre de la nueva categoría.");
        return;
      }
      cat = name;
    }
    setError("");
    setSaving(true);
    try {
      const exists = cats.some(
        (c) => c.name.toLowerCase() === cat.toLowerCase()
      );
      if (cat !== category && !exists) {
        // Crea la categoría nueva antes de guardar el movimiento.
        const row = await addCategory(cat, "gasto");
        setCats((prev) =>
          [...prev, row].sort((a, b) => a.name.localeCompare(b.name))
        );
      }
      const row = await addTransaction({
        type,
        amount: value,
        category: cat,
        note,
        date,
      });
      // Billetera: rebaja en gastos / suma en entradas, si el check está activo.
      if (affectWallet) {
        await adjustWallet(type === "entrada" ? value : -value);
        notifyWallet();
      }
      onSaved(row);
      setAmount("");
      setNote("");
      setCategory(type === "gasto" ? cat : category);
      setNewCatName("");
    } catch {
      setError("No se pudo guardar. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="brut-card p-5 flex flex-col gap-4">
      {!fixedType && (
        <div
          className="grid grid-cols-2 gap-3"
          role="radiogroup"
          aria-label="Tipo de movimiento"
        >
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
      )}

      {/* Check de entrada automática (salario, etc.) */}
      {type === "entrada" && onRecurringSaved && (
        <label className="flex items-center gap-3 text-sm font-bold uppercase cursor-pointer">
          <input
            type="checkbox"
            checked={recurring}
            onChange={(e) => setRecurring(e.target.checked)}
            className="w-5 h-5 accent-income"
          />
          <span className="flex items-center gap-2">
            <Repeat size={16} aria-hidden /> Entrada automática
          </span>
        </label>
      )}

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
        {isRecurring ? "Concepto" : "Categoría"}
        {type === "gasto" ? (
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="brut-input"
          >
            <option value="">Sin categoría</option>
            {cats.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
            <option value={NEW_CAT}>+ Nueva categoría…</option>
          </select>
        ) : (
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="brut-input"
          >
            {INCOME_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
      </label>

      {type === "gasto" && category === NEW_CAT && (
        <label className="flex flex-col gap-1 text-sm font-bold uppercase">
          Nombre de la categoría
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="brut-input"
            placeholder="ej: gastos hormiga"
            autoFocus
          />
        </label>
      )}

      {/* Entrada automática: frecuencia + días. Reemplaza la fecha única. */}
      {isRecurring ? (
        <>
          <fieldset className="flex flex-col gap-1">
            <legend className="text-sm font-bold uppercase mb-1">
              ¿Cada cuándo?
            </legend>
            <div
              className="grid grid-cols-2 gap-2"
              role="radiogroup"
              aria-label="Frecuencia"
            >
              {FREQUENCIES.map((f) => (
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
          </fieldset>

          <div
            className={`grid gap-3 ${
              freq === "quincenal" ? "grid-cols-2" : "grid-cols-1"
            }`}
          >
            <label className="flex flex-col gap-1 text-sm font-bold uppercase">
              {freq === "quincenal" ? "Día 1" : "Día del mes"}
              <input
                type="number"
                inputMode="numeric"
                min="1"
                max="31"
                value={day1}
                onChange={(e) => setDay1(e.target.value)}
                className="brut-input"
              />
            </label>
            {freq === "quincenal" && (
              <label className="flex flex-col gap-1 text-sm font-bold uppercase">
                Día 2
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="31"
                  value={day2}
                  onChange={(e) => setDay2(e.target.value)}
                  className="brut-input"
                />
              </label>
            )}
          </div>
          <p className="text-xs text-muted">
            Se registrará sola cada periodo y sumará a tu billetera.
          </p>
        </>
      ) : (
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
      )}

      {!isRecurring && (
        <label className="flex flex-col gap-1 text-sm font-bold uppercase">
          Nota{" "}
          <span className="text-muted font-normal normal-case">(opcional)</span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="brut-input"
            placeholder="ej: tacos con amigos"
          />
        </label>
      )}

      {/* Billetera: solo en movimientos normales (los automáticos suman solos). */}
      {!isRecurring && (
        <label className="flex items-center gap-3 text-sm font-bold uppercase cursor-pointer">
          <input
            type="checkbox"
            checked={affectWallet}
            onChange={(e) => setAffectWallet(e.target.checked)}
            className="w-5 h-5 accent-primary"
          />
          <span className="flex items-center gap-2">
            <Coins size={16} className="text-gym" aria-hidden />
            {type === "entrada" ? "Sumar a billetera" : "Rebajar de billetera"}
          </span>
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
        className="brut-btn bg-primary text-white px-4 disabled:opacity-50"
      >
        {saving ? "Guardando…" : isRecurring ? "Crear automática" : "Guardar"}
      </button>
    </form>
  );
}
