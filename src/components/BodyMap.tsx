"use client";

import { MUSCLE_GROUPS, muscleLabel, type MuscleId } from "@/lib/types";

// Muñequito frente/espalda con zonas clickeables por grupo muscular.
// Multi-selección: tocar una zona la agrega/quita. Cardio va como chip aparte.

interface BodyMapProps {
  selected: string[];
  onToggle: (id: MuscleId) => void;
}

interface Zone {
  id: MuscleId;
  points: string;
}

// Coordenadas en viewBox 0 0 120 170, centro x=60.
const FRONT_ZONES: Zone[] = [
  { id: "hombro", points: "32,36 46,30 47,42 34,46" },
  { id: "hombro", points: "88,36 74,30 73,42 86,46" },
  { id: "pecho", points: "46,32 74,32 72,56 48,56" },
  { id: "abdomen", points: "48,58 72,58 70,82 50,82" },
  { id: "biceps", points: "27,46 37,48 35,68 25,66" },
  { id: "biceps", points: "93,46 83,48 85,68 95,66" },
  { id: "antebrazo", points: "24,68 34,70 31,92 21,90" },
  { id: "antebrazo", points: "96,68 86,70 89,92 99,90" },
  { id: "cuadriceps", points: "48,94 59,94 58,126 48,124" },
  { id: "cuadriceps", points: "61,94 72,94 72,124 62,126" },
  { id: "pantorrilla", points: "49,130 58,130 56,158 50,158" },
  { id: "pantorrilla", points: "62,130 71,130 70,158 64,158" },
];

const BACK_ZONES: Zone[] = [
  { id: "trapecio", points: "34,38 46,28 74,28 86,38 70,42 50,42" },
  { id: "espalda", points: "46,44 74,44 71,70 49,70" },
  { id: "triceps", points: "27,46 37,48 35,68 25,66" },
  { id: "triceps", points: "93,46 83,48 85,68 95,66" },
  { id: "antebrazo", points: "24,68 34,70 31,92 21,90" },
  { id: "antebrazo", points: "96,68 86,70 89,92 99,90" },
  { id: "gluteo", points: "48,72 72,72 71,92 49,92" },
  { id: "femoral", points: "48,94 59,94 58,126 48,124" },
  { id: "femoral", points: "61,94 72,94 72,124 62,126" },
  { id: "pantorrilla", points: "49,130 58,130 56,158 50,158" },
  { id: "pantorrilla", points: "62,130 71,130 70,158 64,158" },
];

function Figure({
  zones,
  label,
  selected,
  onToggle,
}: {
  zones: Zone[];
  label: string;
  selected: string[];
  onToggle: (id: MuscleId) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <svg
        viewBox="0 0 120 170"
        className="w-full max-w-[160px]"
        role="group"
        aria-label={`Cuerpo, vista ${label}`}
      >
        {/* Partes decorativas (no clickeables) */}
        <circle cx="60" cy="14" r="10" fill="var(--surface-2)" stroke="var(--muted)" strokeWidth="1.5" />
        <rect x="54" y="24" width="12" height="7" fill="var(--surface-2)" stroke="var(--muted)" strokeWidth="1.5" />
        <polygon points="50,84 70,84 70,92 50,92" fill="var(--surface-2)" stroke="var(--muted)" strokeWidth="1.5" />
        <circle cx="26" cy="97" r="4" fill="var(--surface-2)" stroke="var(--muted)" strokeWidth="1.5" />
        <circle cx="94" cy="97" r="4" fill="var(--surface-2)" stroke="var(--muted)" strokeWidth="1.5" />
        <rect x="47" y="160" width="12" height="6" fill="var(--surface-2)" stroke="var(--muted)" strokeWidth="1.5" />
        <rect x="61" y="160" width="12" height="6" fill="var(--surface-2)" stroke="var(--muted)" strokeWidth="1.5" />

        {/* Zonas musculares */}
        {zones.map((z, i) => {
          const active = selected.includes(z.id);
          return (
            <polygon
              key={`${z.id}-${i}`}
              points={z.points}
              fill={active ? "var(--gym)" : "var(--surface-2)"}
              stroke={active ? "var(--fg)" : "var(--muted)"}
              strokeWidth="1.5"
              className="cursor-pointer"
              onClick={() => onToggle(z.id)}
            >
              <title>{muscleLabel(z.id)}</title>
            </polygon>
          );
        })}
      </svg>
      <span className="brut-tag bg-bg text-muted">{label}</span>
    </div>
  );
}

export default function BodyMap({ selected, onToggle }: BodyMapProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Figure
          zones={FRONT_ZONES}
          label="Frente"
          selected={selected}
          onToggle={onToggle}
        />
        <Figure
          zones={BACK_ZONES}
          label="Espalda"
          selected={selected}
          onToggle={onToggle}
        />
      </div>

      {/* Chips: alternativa accesible + cardio (que no tiene zona) */}
      <div className="flex flex-wrap gap-2">
        {MUSCLE_GROUPS.map((m) => {
          const active = selected.includes(m.id);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onToggle(m.id)}
              aria-pressed={active}
              className={`brut-tag cursor-pointer min-h-[32px] ${
                active ? "bg-gym text-black" : "bg-bg text-muted"
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
