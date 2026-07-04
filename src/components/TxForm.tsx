"use client";

import { useEffect, useState } from "react";
import { addCategory, addTransaction, getCategories } from "@/lib/store";
import { today } from "@/lib/format";
import {
  INCOME_CATEGORIES,
  type Category,
  type Transaction,
  type TransactionType,
} from "@/lib/types";

const NEW_CAT = "__nueva__";

interface Props {
  /** Si se pasa, el formulario queda fijo en ese tipo (sin toggle gasto/entrada). */
  fixedType?: TransactionType;
  onSaved: (tx: Transaction) => void;
}

export default function TxForm({ fixedType, onSaved }: Props) {
  const [type, setType] = useState<TransactionType>(fixedType ?? "gasto");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(
    fixedType === "entrada" ? INCOME_CATEGORIES[0] : ""
  );
  const [newCatName, setNewCatName] = useState("");
  const [cats, setCats] = useState<Category[]>([]);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(today());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getCategories("gasto").then(setCats);
  }, []);

  function switchType(t: TransactionType) {
    setType(t);
    setCategory(t === "gasto" ? "" : INCOME_CATEGORIES[0]);
    setNewCatName("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      setError("Monto inválido. Debe ser mayor a 0.");
      return;
    }
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
  );
}
