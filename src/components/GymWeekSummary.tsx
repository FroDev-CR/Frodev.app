"use client";

import Link from "next/link";
import { Dumbbell, ArrowRight, Flame, BatteryLow } from "lucide-react";
import {
  MUSCLE_GROUPS,
  REST_FOCUS,
  muscleLabel,
  type Workout,
} from "@/lib/types";
import { today } from "@/lib/format";

// Resumen gimnástico de la semana (lunes a domingo) para el inicio:
// cobertura del cuerpo, qué se trabajó, qué falta, más/menos trabajado.

// El % de cobertura se mide sobre los músculos del cuerpo (cardio aparte).
const BODY_GROUPS = MUSCLE_GROUPS.filter((m) => m.id !== "cardio");

function mondayOf(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const offset = (d.getDay() + 6) % 7; // lunes = 0
  d.setDate(d.getDate() - offset);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function GymWeekSummary({ workouts }: { workouts: Workout[] }) {
  const monday = mondayOf(today());
  const week = workouts.filter(
    (w) => w.date >= monday && w.date <= today() && w.focus !== REST_FOCUS
  );

  const counts = new Map<string, number>();
  for (const w of week) {
    for (const m of w.muscles ?? []) {
      counts.set(m, (counts.get(m) ?? 0) + 1);
    }
  }

  const daysTrained = new Set(week.map((w) => w.date)).size;
  const worked = BODY_GROUPS.filter((m) => counts.has(m.id));
  const missing = BODY_GROUPS.filter((m) => !counts.has(m.id));
  const coverage = Math.round((worked.length / BODY_GROUPS.length) * 100);
  const didCardio = counts.has("cardio");

  const ranked = [...counts.entries()]
    .filter(([id]) => id !== "cardio")
    .sort((a, b) => b[1] - a[1]);
  const most = ranked[0];
  const least = ranked.length > 1 ? ranked[ranked.length - 1] : undefined;

  return (
    <section className="brut-card brut-card--gym p-5 rot-r">
      <div className="flex items-center justify-between">
        <span className="brut-tag bg-gym text-black">Gym — esta semana</span>
        <span className="text-xs text-muted font-bold uppercase">
          {daysTrained} {daysTrained === 1 ? "día" : "días"}
        </span>
      </div>

      {/* Cobertura del cuerpo */}
      <div className="mt-4 flex items-baseline gap-2">
        <p className="text-4xl font-bold tabular-nums">{coverage}%</p>
        <p className="text-xs text-muted uppercase font-bold">
          del cuerpo trabajado
        </p>
      </div>
      <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gym rounded-full transition-[width]"
          style={{ width: `${coverage}%` }}
        />
      </div>

      {week.length === 0 ? (
        <p className="text-sm text-muted mt-4">
          Aún no entrenas esta semana. El cuerpo entero te espera 💪
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {/* Más / menos trabajado */}
          <div className="flex flex-col gap-1 text-sm">
            {most && (
              <p className="flex items-center gap-2">
                <Flame size={15} className="text-gym shrink-0" aria-hidden />
                <span>
                  Más trabajado: <b>{muscleLabel(most[0])}</b>{" "}
                  <span className="text-muted tabular-nums">
                    ({most[1]}×)
                  </span>
                </span>
              </p>
            )}
            {least && (
              <p className="flex items-center gap-2">
                <BatteryLow
                  size={15}
                  className="text-muted shrink-0"
                  aria-hidden
                />
                <span>
                  Menos trabajado: <b>{muscleLabel(least[0])}</b>{" "}
                  <span className="text-muted tabular-nums">
                    ({least[1]}×)
                  </span>
                </span>
              </p>
            )}
            {didCardio && (
              <p className="text-xs text-muted">
                + cardio {counts.get("cardio")}{" "}
                {counts.get("cardio") === 1 ? "vez" : "veces"} esta semana
              </p>
            )}
          </div>

          {/* Trabajado esta semana */}
          <div>
            <h3 className="text-[10px] font-bold uppercase text-muted mb-1.5">
              Trabajado
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {worked.map((m) => (
                <span key={m.id} className="brut-tag bg-gym text-black">
                  {m.label}
                </span>
              ))}
            </div>
          </div>

          {/* Lo que falta */}
          <div>
            <h3 className="text-[10px] font-bold uppercase text-muted mb-1.5">
              Te falta
            </h3>
            {missing.length === 0 ? (
              <p className="text-sm font-bold text-gym">
                ¡Cuerpo completo! Trabajaste todo esta semana 🏆
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {missing.map((m) => (
                  <span
                    key={m.id}
                    className="brut-tag bg-bg text-muted border-dashed"
                  >
                    {m.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <Link
        href="/gym"
        className="brut-btn bg-gym text-black flex items-center justify-center gap-2 mt-5 px-4"
      >
        <Dumbbell size={18} aria-hidden /> Ir al gym{" "}
        <ArrowRight size={18} aria-hidden />
      </Link>
    </section>
  );
}
