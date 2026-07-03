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

export const EXPENSE_CATEGORIES = [
  "Comida",
  "Transporte",
  "Casa",
  "Salud",
  "Ocio",
  "Suscripciones",
  "Otro",
] as const;

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
