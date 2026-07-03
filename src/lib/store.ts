import { supabase } from "./supabase";
import type { Transaction, Workout } from "./types";

// Capa de datos: Supabase si hay env vars, localStorage si no.
// Misma API async en ambos casos — el swap es transparente para la UI.

const LS_TX = "frodev.transactions";
const LS_WO = "frodev.workouts";

function lsRead<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(key) ?? "[]") as T[];
  } catch {
    return [];
  }
}

function lsWrite<T>(key: string, rows: T[]) {
  localStorage.setItem(key, JSON.stringify(rows));
}

function uid() {
  return crypto.randomUUID();
}

// ── Transactions ────────────────────────────────────────

export async function getTransactions(): Promise<Transaction[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as Transaction[];
  }
  return lsRead<Transaction>(LS_TX).sort((a, b) =>
    b.date.localeCompare(a.date)
  );
}

export async function addTransaction(
  tx: Omit<Transaction, "id" | "created_at">
): Promise<Transaction> {
  const row: Transaction = {
    ...tx,
    id: uid(),
    created_at: new Date().toISOString(),
  };
  if (supabase) {
    const { data, error } = await supabase
      .from("transactions")
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return data as Transaction;
  }
  lsWrite(LS_TX, [row, ...lsRead<Transaction>(LS_TX)]);
  return row;
}

export async function deleteTransaction(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  lsWrite(
    LS_TX,
    lsRead<Transaction>(LS_TX).filter((t) => t.id !== id)
  );
}

// ── Workouts ────────────────────────────────────────────

export async function getWorkouts(): Promise<Workout[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from("workouts")
      .select("*")
      .order("date", { ascending: false });
    if (error) throw error;
    return data as Workout[];
  }
  return lsRead<Workout>(LS_WO).sort((a, b) => b.date.localeCompare(a.date));
}

export async function addWorkout(
  wo: Omit<Workout, "id" | "created_at">
): Promise<Workout> {
  const row: Workout = {
    ...wo,
    id: uid(),
    created_at: new Date().toISOString(),
  };
  if (supabase) {
    const { data, error } = await supabase
      .from("workouts")
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return data as Workout;
  }
  lsWrite(LS_WO, [row, ...lsRead<Workout>(LS_WO)]);
  return row;
}

export async function deleteWorkout(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from("workouts").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  lsWrite(
    LS_WO,
    lsRead<Workout>(LS_WO).filter((w) => w.id !== id)
  );
}
