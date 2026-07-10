"use client";

import { useState } from "react";
import { Plus, Trash2, X, ChevronDown } from "lucide-react";
import { MUSCLE_GROUPS, type ExerciseDef, type MuscleId } from "@/lib/types";

// Configurar ejercicios: catálogo por músculo. Lo que se cree aquí
// aparece como opción al registrar un entrenamiento.

interface Props {
  defs: ExerciseDef[];
  onAdd: (muscle: MuscleId, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}

function MuscleSection({
  muscle,
  label,
  defs,
  onAdd,
  onDelete,
}: {
  muscle: MuscleId;
  label: string;
  defs: ExerciseDef[];
  onAdd: (muscle: MuscleId, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function add() {
    const clean = name.trim();
    if (!clean || saving) return;
    if (defs.some((d) => d.name.toLowerCase() === clean.toLowerCase())) {
      setName("");
      return;
    }
    setSaving(true);
    try {
      await onAdd(muscle, clean);
      setName("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border-2 border-white/20">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-3 py-2.5 cursor-pointer"
      >
        <span className="text-sm font-bold uppercase">{label}</span>
        <span className="flex items-center gap-2 text-muted">
          <span className="text-xs tabular-nums">{defs.length}</span>
          <ChevronDown
            size={16}
            aria-hidden
            className={`transition-transform ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {open && (
        <div className="px-3 pb-3 flex flex-col gap-2">
          {defs.length === 0 && (
            <p className="text-xs text-muted">
              Sin ejercicios aún. Agrega el primero:
            </p>
          )}
          <ul className="flex flex-col gap-1">
            {defs.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between gap-2 text-sm border-b border-white/10 pb-1"
              >
                <span>{d.name}</span>
                <button
                  type="button"
                  onClick={() => onDelete(d.id)}
                  aria-label={`Borrar ${d.name}`}
                  className="text-muted hover:text-expense cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                >
                  <Trash2 size={15} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void add();
                }
              }}
              placeholder={`ej: ejercicio de ${label.toLowerCase()}`}
              aria-label={`Nuevo ejercicio de ${label}`}
              className="brut-input flex-1 text-sm"
            />
            <button
              type="button"
              onClick={() => void add()}
              disabled={saving || name.trim() === ""}
              aria-label={`Agregar ejercicio de ${label}`}
              className="brut-btn bg-gym text-black px-3 disabled:opacity-50"
            >
              <Plus size={16} aria-hidden />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GymConfig({ defs, onAdd, onDelete, onClose }: Props) {
  return (
    <section className="brut-card brut-card--gym p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase">Configurar ejercicios</h2>
        <button
          onClick={onClose}
          aria-label="Cerrar configuración"
          className="text-muted hover:text-expense cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <X size={18} aria-hidden />
        </button>
      </div>
      <p className="text-xs text-muted">
        Crea tus ejercicios por músculo. Al registrar un entrenamiento vas a
        elegir entre estos.
      </p>
      <div className="flex flex-col gap-2">
        {MUSCLE_GROUPS.map((m) => (
          <MuscleSection
            key={m.id}
            muscle={m.id}
            label={m.label}
            defs={defs.filter((d) => d.muscle === m.id)}
            onAdd={onAdd}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  );
}
