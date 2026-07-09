"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { REST_FOCUS, type Workout } from "@/lib/types";
import { today } from "@/lib/format";

// Calendario mensual en cuadritos: entrenado = cian sólido,
// descanso = borde punteado, seleccionado = outline blanco.

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

interface Props {
  workouts: Workout[];
  selected: string; // yyyy-mm-dd
  onSelect: (date: string) => void;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function GymCalendar({ workouts, selected, onSelect }: Props) {
  const init = selected || today();
  const [year, setYear] = useState(Number(init.slice(0, 4)));
  const [month, setMonth] = useState(Number(init.slice(5, 7)) - 1); // 0-11

  const byDate = new Map<string, Workout[]>();
  for (const w of workouts) {
    byDate.set(w.date, [...(byDate.get(w.date) ?? []), w]);
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Lunes como primer día de la semana.
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const todayStr = today();

  function move(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  const monthLabel = new Date(year, month, 1).toLocaleDateString("es-CR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="brut-card brut-card--gym p-4">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => move(-1)}
          aria-label="Mes anterior"
          className="cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center hover:text-gym"
        >
          <ChevronLeft size={20} aria-hidden />
        </button>
        <span className="font-bold uppercase text-sm">{monthLabel}</span>
        <button
          onClick={() => move(1)}
          aria-label="Mes siguiente"
          className="cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center hover:text-gym"
        >
          <ChevronRight size={20} aria-hidden />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center">
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="text-[10px] font-bold text-muted uppercase">
            {d}
          </span>
        ))}
        {Array.from({ length: offset }).map((_, i) => (
          <span key={`b${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const date = `${year}-${pad(month + 1)}-${pad(day)}`;
          const dayWs = byDate.get(date) ?? [];
          const trained = dayWs.some((w) => w.focus !== REST_FOCUS);
          const rest = !trained && dayWs.some((w) => w.focus === REST_FOCUS);
          const isSelected = date === selected;
          const isToday = date === todayStr;
          const isFuture = date > todayStr;

          let cls =
            "aspect-square flex items-center justify-center text-sm font-bold border-2 rounded-[2px] cursor-pointer transition-colors ";
          if (trained) cls += "bg-gym text-black border-white ";
          else if (rest) cls += "border-dashed border-gym text-gym ";
          else cls += "border-white/25 text-fg hover:border-white/60 ";
          if (isFuture && !isSelected) cls += "opacity-40 ";

          return (
            <button
              key={date}
              onClick={() => onSelect(date)}
              aria-label={`Día ${day}`}
              aria-pressed={isSelected}
              className={cls}
              style={
                isSelected
                  ? { outline: "3px dashed var(--fg)", outlineOffset: "1px" }
                  : isToday
                    ? { outline: "2px solid var(--primary)", outlineOffset: "1px" }
                    : undefined
              }
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="flex gap-4 mt-3 text-[10px] uppercase font-bold text-muted">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 bg-gym border border-white" /> Entreno
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 border border-dashed border-gym" /> Descanso
        </span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block w-3 h-3"
            style={{ outline: "2px solid var(--primary)", outlineOffset: "-2px" }}
          />{" "}
          Hoy
        </span>
      </div>
    </div>
  );
}
