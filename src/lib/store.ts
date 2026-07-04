import { supabase } from "./supabase";
import type { Category, Debt, Transaction, TransactionType, Workout } from "./types";

// Capa de datos: Supabase si hay env vars, localStorage si no.
// Misma API async en ambos casos — el swap es transparente para la UI.

const LS_TX = "frodev.transactions";
const LS_WO = "frodev.workouts";
const LS_DEBT = "frodev.debts";
const LS_CAT = "frodev.categories";

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

// ── Debts ───────────────────────────────────────────────

export async function getDebts(): Promise<Debt[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from("debts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as Debt[];
  }
  return lsRead<Debt>(LS_DEBT).sort((a, b) =>
    b.created_at.localeCompare(a.created_at)
  );
}

export async function addDebt(
  debt: Omit<Debt, "id" | "created_at">
): Promise<Debt> {
  const row: Debt = {
    ...debt,
    id: uid(),
    created_at: new Date().toISOString(),
  };
  if (supabase) {
    const { data, error } = await supabase
      .from("debts")
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return data as Debt;
  }
  lsWrite(LS_DEBT, [row, ...lsRead<Debt>(LS_DEBT)]);
  return row;
}

export async function deleteDebt(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from("debts").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  lsWrite(
    LS_DEBT,
    lsRead<Debt>(LS_DEBT).filter((d) => d.id !== id)
  );
}

// ── Categories ──────────────────────────────────────────

export async function getCategories(type: TransactionType): Promise<Category[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("type", type)
      .order("name");
    if (error) throw error;
    return data as Category[];
  }
  return lsRead<Category>(LS_CAT)
    .filter((c) => c.type === type)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function addCategory(
  name: string,
  type: TransactionType
): Promise<Category> {
  const row: Category = {
    id: uid(),
    name,
    type,
    created_at: new Date().toISOString(),
  };
  if (supabase) {
    const { data, error } = await supabase
      .from("categories")
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return data as Category;
  }
  lsWrite(LS_CAT, [row, ...lsRead<Category>(LS_CAT)]);
  return row;
}

export async function deleteCategory(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  lsWrite(
    LS_CAT,
    lsRead<Category>(LS_CAT).filter((c) => c.id !== id)
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
