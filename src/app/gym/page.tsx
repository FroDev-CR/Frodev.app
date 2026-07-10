"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Moon, Dumbbell, X, ArrowLeft } from "lucide-react";
import { getWorkouts, addWorkout, deleteWorkout } from "@/lib/store";
import { longDate, today } from "@/lib/format";
import {
  REST_FOCUS,
  muscleLabel,
  type Exercise,
  type MuscleId,
  type Workout,
} from "@/lib/types";
import GymCalendar from "@/components/GymCalendar";
import BodyMap from "@/components/BodyMap";
import MuscleStats from "@/components/MuscleStats";

const emptyExercise: Exercise = { name: "", sets: 3, reps: 10, weight: 0 };

export default function GymPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedDate, setSelectedDate] = useState(today());

  // form state: paso 1 = músculos, paso 2 = ejercicios
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [muscles, setMuscles] = useState<MuscleId[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([{ ...emptyExercise }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getWorkouts().then((w) => {
      setWorkouts(w);
      setLoaded(true);
    });
  }, []);

  const dayWorkouts = workouts.filter((w) => w.date === selectedDate);
  const trainedDay = dayWorkouts.filter((w) => w.focus !== REST_FOCUS);
  const restDay = dayWorkouts.find((w) => w.focus === REST_FOCUS);
  const isFuture = selectedDate > today();

  function openForm() {
    setMuscles([]);
    setExercises([{ ...emptyExercise }]);
    setStep(1);
    setError("");
    setShowForm(true);
  }

  function selectDate(date: string) {
    setSelectedDate(date);
    setShowForm(false);
    setError("");
  }

  function toggleMuscle(id: MuscleId) {
    setMuscles((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  }

  function updateExercise(i: number, patch: Partial<Exercise>) {
    setExercises((prev) =>
      prev.map((ex, idx) => (idx === i ? { ...ex, ...patch } : ex))
    );
  }

  async function markRest() {
    setSaving(true);
    setError("");
    try {
      const row = await addWorkout({
        date: selectedDate,
        focus: REST_FOCUS,
        muscles: [],
        exercises: [],
      });
      setWorkouts((prev) => [row, ...prev]);
    } catch {
      setError("No se pudo guardar. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
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
      const row = await addWorkout({
        date: selectedDate,
        focus: muscles.map(muscleLabel).join(" + "),
        muscles,
        exercises: valid,
      });
      setWorkouts((prev) => [row, ...prev]);
      setShowForm(false);
    } catch {
      setError("No se pudo guardar. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, rest = false) {
    if (!confirm(rest ? "¿Quitar el descanso?" : "¿Borrar este entrenamiento?"))
      return;
    await deleteWorkout(id);
    setWorkouts((prev) => prev.filter((w) => w.id !== id));
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold uppercase rot-l">Gym</h1>
      </header>

      {/* Calendario */}
      <GymCalendar
        workouts={workouts}
        selected={selectedDate}
        onSelect={selectDate}
      />

      {/* Resumen del día seleccionado */}
      <section className="brut-card p-4 flex flex-col gap-3">
        <h2 className="text-sm font-bold uppercase text-gym">
          {longDate(selectedDate)}
        </h2>

        {trainedDay.map((w) => (
          <div key={w.id} className="border-2 border-white/20 p-3">
            <div className="flex justify-between items-start gap-2">
              <div className="flex flex-wrap gap-1.5">
                {(w.muscles?.length ? w.muscles.map(muscleLabel) : [w.focus]).map(
                  (m, i) => (
                    <span key={i} className="brut-tag bg-gym text-black">
                      {m}
                    </span>
                  )
                )}
              </div>
              <button
                onClick={() => handleDelete(w.id)}
                aria-label="Borrar entrenamiento"
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
          </div>
        ))}

        {restDay && trainedDay.length === 0 && (
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted flex items-center gap-2">
              <Moon size={16} className="text-gym" aria-hidden /> Día de
              descanso.
            </p>
            <button
              onClick={() => handleDelete(restDay.id, true)}
              aria-label="Quitar descanso"
              className="text-muted hover:text-expense cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <Trash2 size={18} aria-hidden />
            </button>
          </div>
        )}

        {loaded && dayWorkouts.length === 0 && !showForm && (
          <p className="text-sm text-muted">
            {isFuture
              ? "Este día aún no llega."
              : "Sin registro este día. ¿Entrenaste o fue descanso?"}
          </p>
        )}

        {/* Acciones del día */}
        {!showForm && !isFuture && (
          <div className="flex gap-2">
            <button
              onClick={openForm}
              className="brut-btn bg-gym text-black px-3 flex-1 flex items-center justify-center gap-2 text-sm"
            >
              <Dumbbell size={16} aria-hidden />
              {trainedDay.length > 0 ? "Agregar otro" : "Registrar ejercicio"}
            </button>
            {!restDay && trainedDay.length === 0 && (
              <button
                onClick={markRest}
                disabled={saving}
                className="brut-btn bg-bg text-fg px-3 flex-1 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                <Moon size={16} aria-hidden /> Día de descanso
              </button>
            )}
          </div>
        )}

        {error && !showForm && (
          <p role="alert" className="text-expense text-sm font-bold">
            {error}
          </p>
        )}
      </section>

      {/* Distribución de músculos del mes del día seleccionado */}
      {!showForm && (
        <MuscleStats workouts={workouts} month={selectedDate.slice(0, 7)} />
      )}

      {/* Formulario en 2 pasos */}
      {showForm && (
        <div className="brut-card brut-card--gym p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase">
              {step === 1 ? "¿Qué trabajaste?" : "Ejercicios"}
            </h2>
            <button
              onClick={() => setShowForm(false)}
              aria-label="Cerrar formulario"
              className="text-muted hover:text-expense cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X size={18} aria-hidden />
            </button>
          </div>

          {step === 1 && (
            <>
              <p className="text-xs text-muted">
                Toca las partes del cuerpo que trabajaste (las que quieras).
              </p>
              <BodyMap selected={muscles} onToggle={toggleMuscle} />
              <button
                onClick={() => setStep(2)}
                disabled={muscles.length === 0}
                className="brut-btn bg-gym text-black px-4 disabled:opacity-50"
              >
                Continuar
                {muscles.length > 0 ? ` (${muscles.length})` : ""}
              </button>
            </>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-1.5">
                {muscles.map((m) => (
                  <span key={m} className="brut-tag bg-gym text-black">
                    {muscleLabel(m)}
                  </span>
                ))}
              </div>

              <fieldset className="flex flex-col gap-4">
                <legend className="sr-only">Ejercicios</legend>
                {exercises.map((ex, i) => (
                  <div
                    key={i}
                    className="border-2 border-dashed border-white/30 p-3 flex flex-col gap-2"
                  >
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={ex.name}
                        onChange={(e) =>
                          updateExercise(i, { name: e.target.value })
                        }
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
                            updateExercise(i, {
                              weight: Number(e.target.value),
                            })
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

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="brut-btn bg-bg text-fg px-4 flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={16} aria-hidden /> Atrás
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="brut-btn bg-gym text-black px-4 flex-1 disabled:opacity-50"
                >
                  {saving ? "Guardando…" : "Guardar entrenamiento"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
