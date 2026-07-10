"use client";

import { MUSCLE_GROUPS, muscleLabel, type MuscleId } from "@/lib/types";

// Muñequito frente/espalda con zonas clickeables por grupo muscular.
// Multi-selección: tocar un músculo lo agrega/quita (rojo = trabajado).
// Cardio va como chip aparte porque no tiene zona en el cuerpo.

interface BodyMapProps {
  selected: string[];
  onToggle: (id: MuscleId) => void;
}

interface Zone {
  id: MuscleId;
  d: string;
}

// Coordenadas en viewBox 0 0 200 340, centro x=100.
// Partes no clickeables (cabeza, cuello, manos, rodillas, pies…).
const DECO_COMMON = [
  "M100,8 C111,8 116,16 116,27 C116,38 110,45 100,45 C90,45 84,38 84,27 C84,16 89,8 100,8 Z",
  "M92,44 C92,50 91,53 87,56 L113,56 C109,53 108,50 108,44 Z",
  "M52,166 C57,166 60,170 60,175 C60,180 56,183 52,183 C48,183 45,180 45,175 C45,170 48,166 52,166 Z",
  "M148,166 C143,166 140,170 140,175 C140,180 144,183 148,183 C152,183 155,180 155,175 C155,170 152,166 148,166 Z",
  "M82,246 C88,244 94,244 97,246 L96,256 C91,258 86,258 83,256 Z",
  "M118,246 C112,244 106,244 103,246 L104,256 C109,258 114,258 117,256 Z",
  "M81,312 C86,310 92,310 94,312 L95,320 C90,323 80,323 77,320 Z",
  "M119,312 C114,310 108,310 106,312 L105,320 C110,323 120,323 123,320 Z",
];

const FRONT_DECO = [
  ...DECO_COMMON,
  "M85,158 C95,163 105,163 115,158 L118,176 C106,183 94,183 82,176 Z", // pelvis
];

const BACK_DECO = [
  ...DECO_COMMON,
  "M88,146 C96,150 104,150 112,146 L112,154 C104,158 96,158 88,154 Z", // lumbar
];

const FRONT_ZONES: Zone[] = [
  { id: "hombro", d: "M83,60 C72,55 59,57 55,67 C52,75 53,83 56,89 C63,85 71,79 75,73 C78,68 81,64 83,60 Z" },
  { id: "hombro", d: "M117,60 C128,55 141,57 145,67 C148,75 147,83 144,89 C137,85 129,79 125,73 C122,68 119,64 117,60 Z" },
  { id: "pecho", d: "M86,61 C92,59 98,59 99,62 L99,97 C90,101 80,97 76,89 C73,80 74,70 78,66 C80,63 83,62 86,61 Z" },
  { id: "pecho", d: "M114,61 C108,59 102,59 101,62 L101,97 C110,101 120,97 124,89 C127,80 126,70 122,66 C120,63 117,62 114,61 Z" },
  { id: "abdomen", d: "M84,102 C94,107 106,107 116,102 L113,150 C107,156 93,156 87,150 Z" },
  { id: "biceps", d: "M55,93 C61,88 69,90 71,96 L69,124 C65,130 57,130 54,123 C52,113 53,101 55,93 Z" },
  { id: "biceps", d: "M145,93 C139,88 131,90 129,96 L131,124 C135,130 143,130 146,123 C148,113 147,101 145,93 Z" },
  { id: "antebrazo", d: "M53,128 C58,132 66,132 68,127 L62,160 C60,164 55,164 53,160 C50,149 51,137 53,128 Z" },
  { id: "antebrazo", d: "M147,128 C142,132 134,132 132,127 L138,160 C140,164 145,164 147,160 C150,149 149,137 147,128 Z" },
  { id: "cuadriceps", d: "M82,181 C88,185 94,185 97,183 L96,238 C92,245 84,245 80,238 C76,217 78,196 82,181 Z" },
  { id: "cuadriceps", d: "M118,181 C112,185 106,185 103,183 L104,238 C108,245 116,245 120,238 C124,217 122,196 118,181 Z" },
  { id: "pantorrilla", d: "M83,260 C87,256 93,256 95,260 L92,304 C90,308 85,308 83,304 C79,290 80,272 83,260 Z" },
  { id: "pantorrilla", d: "M117,260 C113,256 107,256 105,260 L108,304 C110,308 115,308 117,304 C121,290 120,272 117,260 Z" },
];

const BACK_ZONES: Zone[] = [
  // la espalda va primero para que el trapecio quede dibujado encima
  { id: "espalda", d: "M77,66 C92,77 108,77 123,66 L120,146 C107,157 93,157 80,146 Z" },
  { id: "trapecio", d: "M100,50 C91,52 81,58 74,62 L86,67 C93,71 97,78 100,97 C103,78 107,71 114,67 L126,62 C119,58 109,52 100,50 Z" },
  { id: "hombro", d: "M83,60 C72,55 59,57 55,67 C52,75 53,83 56,89 C63,85 71,79 75,73 C78,68 81,64 83,60 Z" },
  { id: "hombro", d: "M117,60 C128,55 141,57 145,67 C148,75 147,83 144,89 C137,85 129,79 125,73 C122,68 119,64 117,60 Z" },
  { id: "triceps", d: "M55,93 C61,88 69,90 71,96 L69,124 C65,130 57,130 54,123 C52,113 53,101 55,93 Z" },
  { id: "triceps", d: "M145,93 C139,88 131,90 129,96 L131,124 C135,130 143,130 146,123 C148,113 147,101 145,93 Z" },
  { id: "antebrazo", d: "M53,128 C58,132 66,132 68,127 L62,160 C60,164 55,164 53,160 C50,149 51,137 53,128 Z" },
  { id: "antebrazo", d: "M147,128 C142,132 134,132 132,127 L138,160 C140,164 145,164 147,160 C150,149 149,137 147,128 Z" },
  { id: "gluteo", d: "M82,158 C93,163 107,163 118,158 C124,166 124,175 118,180 C112,185 103,185 100,181 C97,185 88,185 82,180 C76,175 76,166 82,158 Z" },
  { id: "femoral", d: "M82,186 C88,190 94,190 97,188 L96,238 C92,245 84,245 80,238 C76,219 78,200 82,186 Z" },
  { id: "femoral", d: "M118,186 C112,190 106,190 103,188 L104,238 C108,245 116,245 120,238 C124,219 122,200 118,186 Z" },
  { id: "pantorrilla", d: "M81,258 C87,253 94,253 96,259 C97,275 93,292 91,304 C89,308 84,308 82,304 C78,290 78,271 81,258 Z" },
  { id: "pantorrilla", d: "M119,258 C113,253 106,253 104,259 C103,275 107,292 109,304 C111,308 116,308 118,304 C122,290 122,271 119,258 Z" },
];

// Gradientes que dan el volumen "3D": luz arriba-izquierda, sombra abajo.
function Defs({ prefix }: { prefix: string }) {
  return (
    <defs>
      <linearGradient id={`${prefix}-idle`} x1="0" y1="0" x2="0.7" y2="1">
        <stop offset="0" stopColor="#4b5b78" />
        <stop offset="1" stopColor="#243049" />
      </linearGradient>
      <linearGradient id={`${prefix}-sel`} x1="0" y1="0" x2="0.7" y2="1">
        <stop offset="0" stopColor="#fb7185" />
        <stop offset="0.5" stopColor="#ef4444" />
        <stop offset="1" stopColor="#8f1d1d" />
      </linearGradient>
      <linearGradient id={`${prefix}-deco`} x1="0" y1="0" x2="0.7" y2="1">
        <stop offset="0" stopColor="#33405c" />
        <stop offset="1" stopColor="#1c2740" />
      </linearGradient>
      <filter id={`${prefix}-glow`} x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow
          dx="0"
          dy="2"
          stdDeviation="2.5"
          floodColor="#ef4444"
          floodOpacity="0.55"
        />
      </filter>
    </defs>
  );
}

function Figure({
  zones,
  deco,
  prefix,
  label,
  selected,
  onToggle,
}: {
  zones: Zone[];
  deco: string[];
  prefix: string;
  label: string;
  selected: string[];
  onToggle: (id: MuscleId) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <svg
        viewBox="0 0 200 340"
        className="w-full max-w-[190px]"
        role="group"
        aria-label={`Cuerpo, vista ${label}`}
      >
        <Defs prefix={prefix} />
        {deco.map((d, i) => (
          <path
            key={i}
            d={d}
            fill={`url(#${prefix}-deco)`}
            stroke="#0b1222"
            strokeWidth="1.4"
            aria-hidden
          />
        ))}
        {zones.map((z, i) => {
          const active = selected.includes(z.id);
          return (
            <path
              key={`${z.id}-${i}`}
              d={z.d}
              fill={`url(#${prefix}-${active ? "sel" : "idle"})`}
              stroke={active ? "#7f1d1d" : "#0b1222"}
              strokeWidth="1.4"
              filter={active ? `url(#${prefix}-glow)` : undefined}
              className="cursor-pointer transition-[fill]"
              onClick={() => onToggle(z.id)}
            >
              <title>{muscleLabel(z.id)}</title>
            </path>
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
      <div className="flex gap-3">
        <Figure
          zones={FRONT_ZONES}
          deco={FRONT_DECO}
          prefix="bmf"
          label="Frente"
          selected={selected}
          onToggle={onToggle}
        />
        <Figure
          zones={BACK_ZONES}
          deco={BACK_DECO}
          prefix="bmb"
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
                active ? "bg-expense text-white" : "bg-bg text-muted"
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
