"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Moon, Dumbbell, X, ArrowLeft, Settings } from "lucide-react";
import {
  getWorkouts,
  addWorkout,
  deleteWorkout,
  getExerciseDefs,
  addExerciseDef,
  deleteExerciseDef,
} from "@/lib/store";
import { longDate, today } from "@/lib/format";
import {
  REST_FOCUS,
  muscleLabel,
  type Exercise,
  type ExerciseDef,
  type MuscleId,
  type Workout,
} from "@/lib/types";
import GymCalendar from "@/components/GymCalendar";
import BodyMap from "@/components/BodyMap";
import MuscleStats from "@/components/MuscleStats";
import GymConfig from "@/components/GymConfig";

export default function GymPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [defs, setDefs] = useState<ExerciseDef[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedDate, setSelectedDate] = useState(today());
  const [showConfig, setShowConfig] = useState(false);

  // form state: paso 1 = músculos, paso 2 = ejercicios
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [muscles, setMuscles] = useState<MuscleId[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getWorkouts(), getExerciseDefs()]).then(([w, d]) => {
      setWorkouts(w);
      setDefs(d);
      setLoaded(true);
    });
  }, []);

  const dayWorkouts = workouts.filter((w) => w.date === selectedDate);
  const trainedDay = dayWorkouts.filter((w) => w.focus !== REST_FOCUS);
  const restDay = dayWorkouts.find((w) => w.focus === REST_FOCUS);
  const isFuture = selectedDate > today();

  // Nombres del catálogo para los músculos seleccionados: esos se muestran
  // como etiqueta fija; el resto (personalizados) con nombre editable.
  const catalogNames = new Set(
    defs.filter((d) => muscles.includes(d.muscle as MuscleId)).map((d) => d.name)
  );

  function openForm() {
    setMuscles([]);
    setExercises([]);
    setStep(1);
    setError("");
    setShowConfig(false);
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

  function toggleCatalogExercise(name: string) {
    setExercises((prev) =>
      prev.some((e) => e.name === name)
        ? prev.filter((e) => e.name !== name)
        : [...prev, { name, sets: 3, reps: 10, weight: 0 }]
    );
  }

  function updateExercise(i: number, patch: Partial<Exercise>) {
    setExercises((prev) =>
      prev.map((ex, idx) => (idx === i ? { ...ex, ...patch } : ex))
    );
  }

  async function addDef(muscle: MuscleId, name: string) {
    const row = await addExerciseDef(muscle, name);
    setDefs((prev) =>
      [...prev, row].sort((a, b) => a.name.localeCompare(b.name))
    );
  }

  async function removeDef(id: string) {
    await deleteExerciseDef(id);
    setDefs((prev) => prev.filter((d) => d.id !== id));
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
      setError("Elige o agrega al menos un ejercicio.");
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
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold uppercase rot-l">Gym</h1>
        <button
          onClick={() => {
            setShowForm(false);
            setShowConfig((c) => !c);
          }}
          aria-label="Configurar ejercicios"
          aria-pressed={showConfig}
          className={`cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center hover:text-gym ${
            showConfig ? "text-gym" : "text-muted"
          }`}
        >
          <Settings size={22} aria-hidden />
        </button>
      </header>

      {showConfig ? (
        <GymConfig
          defs={defs}
          onAdd={addDef}
          onDelete={removeDef}
          onClose={() => setShowConfig(false)}
        />
      ) : (
        <>
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
                    {(w.muscles?.length
                      ? w.muscles.map(muscleLabel)
                      : [w.focus]
                    ).map((m, i) => (
                      <span key={i} className="brut-tag bg-gym text-black">
                        {m}
                      </span>
                    ))}
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
                  {step === 1 ? "¿Qué trabajaste?" : "¿Cuáles ejercicios?"}
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
                  {/* Catálogo por músculo seleccionado */}
                  {muscles.map((m) => {
                    const options = defs.filter((d) => d.muscle === m);
                    return (
                      <div key={m} className="flex flex-col gap-1.5">
                        <h3 className="text-[10px] font-bold uppercase text-muted">
                          Ejercicios de {muscleLabel(m)}
                        </h3>
                        {options.length === 0 ? (
                          <p className="text-xs text-muted">
                            No tienes ejercicios de {muscleLabel(m)}. Créalos
                            con la tuerquita ⚙ o agrega uno abajo.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {options.map((d) => {
                              const active = exercises.some(
                                (e) => e.name === d.name
                              );
                              return (
                                <button
                                  key={d.id}
                                  type="button"
                                  onClick={() => toggleCatalogExercise(d.name)}
                                  aria-pressed={active}
                                  className={`brut-tag cursor-pointer min-h-[36px] ${
                                    active
                                      ? "bg-gym text-black"
                                      : "bg-bg text-muted"
                                  }`}
                                >
                                  {d.name}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Elegidos: reps y peso de cada uno */}
                  {exercises.length > 0 && (
                    <fieldset className="flex flex-col gap-3">
                      <legend className="text-[10px] font-bold uppercase text-muted mb-1.5">
                        Reps y peso
                      </legend>
                      {exercises.map((ex, i) => {
                        const fromCatalog = catalogNames.has(ex.name);
                        return (
                          <div
                            key={i}
                            className="border-2 border-dashed border-white/30 p-3 flex flex-col gap-2"
                          >
                            <div className="flex gap-2 items-center">
                              {fromCatalog ? (
                                <span className="flex-1 font-bold text-sm">
                                  {ex.name}
                                </span>
                              ) : (
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
                              )}
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
                                    updateExercise(i, {
                                      sets: Number(e.target.value),
                                    })
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
                                    updateExercise(i, {
                                      reps: Number(e.target.value),
                                    })
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
                        );
                      })}
                    </fieldset>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setExercises((prev) => [
                        ...prev,
                        { name: "", sets: 3, reps: 10, weight: 0 },
                      ])
                    }
                    className="brut-btn bg-bg text-fg px-4 flex items-center justify-center gap-2"
                  >
                    <Plus size={16} aria-hidden /> Otro ejercicio
                  </button>

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
        </>
      )}
    </div>
  );
}
