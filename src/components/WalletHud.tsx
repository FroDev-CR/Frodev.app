"use client";

import { useEffect, useRef, useState } from "react";
import { Coins, Check, X } from "lucide-react";
import { getWallet, setWallet, syncRecurringIncomes } from "@/lib/store";
import { money } from "@/lib/format";

// HUD tipo "plata de videojuego": fijo en la esquina superior, siempre visible.
// Otras métricas se irán sumando aquí con el tiempo.
export default function WalletHud() {
  const [balance, setBalance] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    const b = await getWallet();
    setBalance(b);
  }

  useEffect(() => {
    // Materializa entradas automáticas pendientes en cualquier página.
    syncRecurringIncomes().then(refresh);
    // Las páginas disparan este evento tras un gasto/entrada.
    const onChange = () => refresh();
    window.addEventListener("wallet-changed", onChange);
    return () => window.removeEventListener("wallet-changed", onChange);
  }, []);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function startEdit() {
    setDraft(balance != null ? String(balance) : "");
    setEditing(true);
  }

  async function save() {
    const value = parseFloat(draft);
    if (isNaN(value)) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const next = await setWallet(value);
      setBalance(next);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed top-3 right-3 z-50">
      <button
        onClick={startEdit}
        aria-label="Editar billetera"
        className="brut-card px-3 py-2 flex items-center gap-2 shadow-none border-2"
        style={{ boxShadow: "3px 3px 0 0 var(--gym)" }}
      >
        <Coins size={18} className="text-gym" aria-hidden />
        <span className="font-bold tabular-nums text-sm">
          {balance == null ? "—" : money(balance)}
        </span>
      </button>

      {editing && (
        <div className="brut-card p-3 mt-2 flex items-center gap-2 bg-surface-2 w-56">
          <input
            ref={inputRef}
            type="number"
            inputMode="decimal"
            step="0.01"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") setEditing(false);
            }}
            className="brut-input flex-1 !min-h-[40px]"
            placeholder="0.00"
            aria-label="Nuevo saldo de la billetera"
          />
          <button
            onClick={save}
            disabled={saving}
            aria-label="Guardar saldo"
            className="text-income hover:opacity-70 p-2 disabled:opacity-40"
          >
            <Check size={20} aria-hidden />
          </button>
          <button
            onClick={() => setEditing(false)}
            aria-label="Cancelar"
            className="text-muted hover:text-expense p-2"
          >
            <X size={20} aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
