export type TransactionType = "gasto" | "entrada";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  note: string;
  date: string; // ISO yyyy-mm-dd
  created_at: string;
  recurring_id?: string | null; // si vino de una entrada automática
}

export type IncomeFrequency = "quincenal" | "mensual";

// Entrada automática (ej: salario): se materializa sola en transacciones.
export interface RecurringIncome {
  id: string;
  name: string; // categoría/etiqueta, ej: "Salario"
  amount: number;
  frequency: IncomeFrequency;
  day1: number; // día del mes (1-31), se ajusta al último día si el mes es corto
  day2: number | null; // segundo día, solo para quincenal
  created_at: string;
}

export const INCOME_FREQUENCY_LABELS: Record<IncomeFrequency, string> = {
  quincenal: "Quincenal",
  mensual: "Mensual",
};

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
  due_date: string | null; // solo para pago único: cuándo hay que pagarlo
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
