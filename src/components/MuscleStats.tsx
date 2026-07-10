"use client";

import { REST_FOCUS, muscleLabel, type Workout } from "@/lib/types";

// Mini estadística: % de veces que se trabajó cada músculo en el mes.
// Compacta a propósito: barras finas, sin leyenda, top 5.

interface Props {
  workouts: Workout[];
  month: string; // yyyy-mm
}

export default function MuscleStats({ workouts, month }: Props) {
  const counts = new Map<string, number>();
  let total = 0;
  for (const w of workouts) {
    if (w.focus === REST_FOCUS || !w.date.startsWith(month)) continue;
    for (const m of w.muscles ?? []) {
      counts.set(m, (counts.get(m) ?? 0) + 1);
      total++;
    }
  }
  if (total === 0) return null;

  const top = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, n]) => ({ id, pct: Math.round((n / total) * 100) }));
  const max = top[0].pct;

  return (
    <section className="brut-card p-4">
      <h2 className="text-[10px] font-bold uppercase text-muted mb-2">
        Músculos del mes
      </h2>
      <ul className="flex flex-col gap-1.5">
        {top.map((m) => (
          <li key={m.id} className="flex items-center gap-2 text-xs">
            <span className="w-24 shrink-0 truncate">{muscleLabel(m.id)}</span>
            <span className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <span
                className="block h-full bg-gym rounded-full"
                style={{ width: `${(m.pct / max) * 100}%` }}
              />
            </span>
            <span className="w-9 text-right tabular-nums text-muted">
              {m.pct}%
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
