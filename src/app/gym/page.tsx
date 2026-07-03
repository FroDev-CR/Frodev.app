"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Dumbbell, X } from "lucide-react";
import { getWorkouts, addWorkout, deleteWorkout } from "@/lib/store";
import { shortDate, today } from "@/lib/format";
import { GYM_FOCUS, type Exercise, type Workout } from "@/lib/types";

const emptyExercise: Exercise = { name: "", sets: 3, reps: 10, weight: 0 };

export default function GymPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // form state
  const [date, setDate] = useState(today());
  const [focus, setFocus] = useState<string>(GYM_FOCUS[0]);
  const [exercises, setExercises] = useState<Exercise[]>([
    { ...emptyExercise },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getWorkouts().then((w) => {
      setWorkouts(w);
      setLoaded(true);
    });
  }, []);

  const month = new Date().toISOString().slice(0, 7);
  const monthCount = workouts.filter((w) => w.date.startsWith(month)).length;

  function updateExercise(i: number, patch: Partial<Exercise>) {
    setExercises((prev) =>
      prev.map((ex, idx) => (idx === i ? { ...ex, ...patch } : ex))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const valid = exercises.filter((ex) => ex.name.trim() !== "");
    if (valid.length === 0) {
      setError("Agrega al menos un ejercicio con nombre.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const row = await addWorkout({ date, focus, exercises: valid });
      setWorkouts((prev) =>
        [row, ...prev].sort((a, b) => b.date.localeCompare(a.date))
      );
      setExercises([{ ...emptyExercise }]);
      setShowForm(false);
    } catch {
      setError("No se pudo guardar. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Borrar este entrenamiento?")) return;
    await deleteWorkout(id);
    setWorkouts((prev) => prev.filter((w) => w.id !== id));
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold uppercase rot-l">Gym</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="brut-btn bg-gym text-black px-4 flex items-center gap-2"
          aria-expanded={showForm}
        >
          <Plus size={18} aria-hidden /> {showForm ? "Cerrar" : "Nuevo"}
        </button>
      </header>

      {/* Contador del mes */}
      <div className="brut-card brut-card--gym p-5 rot-r">
        <div className="flex items-center gap-2">
          <Dumbbell size={20} className="text-gym" aria-hidden />
          <span className="brut-tag bg-gym text-black">Este mes</span>
        </div>
        <p className="text-4xl font-bold mt-2">
          {monthCount}
          <span className="text-base text-muted font-normal"> días</span>
        </p>
      </div>

      {/* Formulario */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="brut-card p-5 flex flex-col gap-4"
        >
          <div className="grid grid-cols-2 gap-3">
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
              Enfoque
              <select
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                className="brut-input"
              >
                {GYM_FOCUS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <fieldset className="flex flex-col gap-4">
            <legend className="text-sm font-bold uppercase mb-1">
              Ejercicios
            </legend>
            {exercises.map((ex, i) => (
              <div
                key={i}
                className="border-2 border-dashed border-white/30 p-3 flex flex-col gap-2"
              >
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={ex.name}
                    onChange={(e) => updateExercise(i, { name: e.target.value })}
                    className="brut-input flex-1"
                    placeholder="ej: Press banca"
                    aria-label={`Nombre del ejercicio ${i + 1}`}
                  />
                  {exercises.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setExercises((prev) =>
                          prev.filter((_, idx) => idx !== i)
                        )
                      }
                      aria-label={`Quitar ejercicio ${i + 1}`}
                      className="text-muted hover:text-expense cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <X size={18} aria-hidden />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <label className="flex flex-col gap-1 text-xs font-bold uppercase text-muted">
                    Series
                    <input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      value={ex.sets}
                      onChange={(e) =>
                        updateExercise(i, { sets: Number(e.target.value) })
                      }
                      className="brut-input"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-bold uppercase text-muted">
                    Reps
                    <input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      value={ex.reps}
                      onChange={(e) =>
                        updateExercise(i, { reps: Number(e.target.value) })
                      }
                      className="brut-input"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-bold uppercase text-muted">
                    Kg
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.5"
                      value={ex.weight}
                      onChange={(e) =>
                        updateExercise(i, { weight: Number(e.target.value) })
                      }
                      className="brut-input"
                    />
                  </label>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setExercises((prev) => [...prev, { ...emptyExercise }])
              }
              className="brut-btn bg-bg text-fg px-4 flex items-center justify-center gap-2"
            >
              <Plus size={16} aria-hidden /> Otro ejercicio
            </button>
          </fieldset>

          {error && (
            <p role="alert" className="text-expense text-sm font-bold">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="brut-btn bg-gym text-black px-4 disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar entrenamiento"}
          </button>
        </form>
      )}

      {/* Historial */}
      <section>
        <h2 className="text-lg font-bold uppercase mb-3">Historial</h2>
        {loaded && workouts.length === 0 && (
          <p className="text-muted text-sm">
            Sin entrenamientos aún. Toca NUEVO después de tu próxima sesión.
          </p>
        )}
        <ul className="flex flex-col gap-3">
          {workouts.map((w) => (
            <li key={w.id} className="brut-card brut-card--gym p-4">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <span className="brut-tag bg-gym text-black">{w.focus}</span>
                  <p className="text-xs text-muted mt-2">{shortDate(w.date)}</p>
                </div>
                <button
                  onClick={() => handleDelete(w.id)}
                  aria-label={`Borrar entrenamiento del ${shortDate(w.date)}`}
                  className="text-muted hover:text-expense cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <Trash2 size={18} aria-hidden />
                </button>
              </div>
              <ul className="mt-2 flex flex-col gap-1">
                {w.exercises.map((ex, i) => (
                  <li
                    key={i}
                    className="text-sm flex justify-between gap-2 border-b border-white/10 pb-1"
                  >
                    <span className="font-bold">{ex.name}</span>
                    <span className="text-muted tabular-nums shrink-0">
                      {ex.sets}×{ex.reps}
                      {ex.weight > 0 ? ` @ ${ex.weight}kg` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
