export type TransactionType = "gasto" | "entrada";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  note: string;
  date: string; // ISO yyyy-mm-dd
  created_at: string;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weight: number; // kg
}

export interface Workout {
  id: string;
  date: string; // ISO yyyy-mm-dd
  focus: string; // ej: "Pecho", "Pierna", "Full body"
  exercises: Exercise[];
  created_at: string;
}

export type DebtFrequency = "quincenal" | "mensual" | "unico";

export interface Debt {
  id: string;
  name: string;
  amount: number;
  frequency: DebtFrequency;
  created_at: string;
}

export const DEBT_FREQUENCY_LABELS: Record<DebtFrequency, string> = {
  quincenal: "Quincenal",
  mensual: "Mensual",
  unico: "Pago único",
};

// Categorías de gastos: las crea el usuario desde el formulario.
export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  created_at: string;
}

export const INCOME_CATEGORIES = [
  "Salario",
  "Freelance",
  "Regalo",
  "Otro",
] as const;

export const GYM_FOCUS = [
  "Pecho",
  "Espalda",
  "Pierna",
  "Hombro",
  "Brazo",
  "Full body",
  "Cardio",
] as const;
