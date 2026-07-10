"use client";

import { MUSCLE_GROUPS, muscleLabel, type MuscleId } from "@/lib/types";

// Muñequito frente/espalda con zonas clickeables por grupo muscular.
// Multi-selección: tocar una zona la agrega/quita. Cardio va como chip aparte.

interface BodyMapProps {
  selected: string[];
  onToggle: (id: MuscleId) => void;
}

type Zone =
  | { id: MuscleId; kind: "rect"; x: number; y: number; w: number; h: number }
  | { id: MuscleId; kind: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  | { id: MuscleId; kind: "polygon"; points: string };

// Coordenadas en viewBox 0 0 120 170, centro x=60.
const FRONT_ZONES: Zone[] = [
  { id: "hombro", kind: "ellipse", cx: 35, cy: 37, rx: 9, ry: 6 },
  { id: "hombro", kind: "ellipse", cx: 85, cy: 37, rx: 9, ry: 6 },
  { id: "pecho", kind: "rect", x: 45, y: 31, w: 30, h: 24 },
  { id: "abdomen", kind: "rect", x: 47, y: 57, w: 26, h: 25 },
  { id: "biceps", kind: "rect", x: 25, y: 45, w: 10, h: 21 },
  { id: "biceps", kind: "rect", x: 85, y: 45, w: 10, h: 21 },
  { id: "antebrazo", kind: "rect", x: 24, y: 68, w: 10, h: 21 },
  { id: "antebrazo", kind: "rect", x: 86, y: 68, w: 10, h: 21 },
  { id: "cuadriceps", kind: "rect", x: 48, y: 94, w: 9, h: 31 },
  { id: "cuadriceps", kind: "rect", x: 63, y: 94, w: 9, h: 31 },
  { id: "pantorrilla", kind: "rect", x: 48, y: 128, w: 9, h: 29 },
  { id: "pantorrilla", kind: "rect", x: 63, y: 128, w: 9, h: 29 },
];

const BACK_ZONES: Zone[] = [
  { id: "trapecio", kind: "polygon", points: "43,31 77,31 72,44 48,44" },
  { id: "hombro", kind: "ellipse", cx: 35, cy: 37, rx: 9, ry: 6 },
  { id: "hombro", kind: "ellipse", cx: 85, cy: 37, rx: 9, ry: 6 },
  { id: "espalda", kind: "rect", x: 46, y: 46, w: 28, h: 24 },
  { id: "triceps", kind: "rect", x: 25, y: 45, w: 10, h: 21 },
  { id: "triceps", kind: "rect", x: 85, y: 45, w: 10, h: 21 },
  { id: "antebrazo", kind: "rect", x: 24, y: 68, w: 10, h: 21 },
  { id: "antebrazo", kind: "rect", x: 86, y: 68, w: 10, h: 21 },
  { id: "gluteo", kind: "rect", x: 47, y: 72, w: 26, h: 19 },
  { id: "femoral", kind: "rect", x: 48, y: 94, w: 9, h: 31 },
  { id: "femoral", kind: "rect", x: 63, y: 94, w: 9, h: 31 },
  { id: "pantorrilla", kind: "rect", x: 48, y: 128, w: 9, h: 29 },
  { id: "pantorrilla", kind: "rect", x: 63, y: 128, w: 9, h: 29 },
];

// Silueta base (no clickeable) sobre la que se pintan las zonas.
function Silhouette() {
  const s = {
    fill: "var(--surface-2)",
    stroke: "var(--muted)",
    strokeWidth: 1.5,
  };
  return (
    <g aria-hidden>
      <circle cx="60" cy="13" r="9" {...s} />
      <rect x="55" y="20" width="10" height="9" {...s} />
      <rect x="43" y="29" width="34" height="56" rx="7" {...s} />
      <rect x="23" y="32" width="14" height="59" rx="7" {...s} />
      <rect x="83" y="32" width="14" height="59" rx="7" {...s} />
      <circle cx="30" cy="95" r="4" {...s} />
      <circle cx="90" cy="95" r="4" {...s} />
      <rect x="45" y="83" width="30" height="11" rx="3" {...s} />
      <rect x="46" y="92" width="13" height="68" rx="6" {...s} />
      <rect x="61" y="92" width="13" height="68" rx="6" {...s} />
      <rect x="44" y="158" width="15" height="6" rx="2" {...s} />
      <rect x="61" y="158" width="15" height="6" rx="2" {...s} />
    </g>
  );
}

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
        <Silhouette />

        {/* Zonas musculares */}
        {zones.map((z, i) => {
          const active = selected.includes(z.id);
          const common = {
            fill: active ? "var(--gym)" : "var(--surface-2)",
            stroke: active ? "var(--fg)" : "var(--muted)",
            strokeWidth: 1.5,
            className: "cursor-pointer",
            onClick: () => onToggle(z.id),
          };
          const title = <title>{muscleLabel(z.id)}</title>;
          const key = `${z.id}-${i}`;
          if (z.kind === "rect") {
            return (
              <rect key={key} x={z.x} y={z.y} width={z.w} height={z.h} rx={3} {...common}>
                {title}
              </rect>
            );
          }
          if (z.kind === "ellipse") {
            return (
              <ellipse key={key} cx={z.cx} cy={z.cy} rx={z.rx} ry={z.ry} {...common}>
                {title}
              </ellipse>
            );
          }
          return (
            <polygon key={key} points={z.points} strokeLinejoin="round" {...common}>
              {title}
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
