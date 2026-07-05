import { supabase } from "./supabase";
import type {
  Category,
  Debt,
  RecurringIncome,
  ShoppingItem,
  ShoppingKind,
  Transaction,
  TransactionType,
  Workout,
} from "./types";
import { today } from "./format";

// Capa de datos: Supabase si hay env vars, localStorage si no.
// Misma API async en ambos casos — el swap es transparente para la UI.

const LS_TX = "frodev.transactions";
const LS_WO = "frodev.workouts";
const LS_DEBT = "frodev.debts";
const LS_CAT = "frodev.categories";
const LS_REC = "frodev.recurring_incomes";
const LS_WALLET = "frodev.wallet";
const LS_SHOP = "frodev.shopping";

const WALLET_ID = "main";

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

// ── Shopping list (lista de compras) ────────────────────

export async function getShoppingItems(): Promise<ShoppingItem[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from("shopping_items")
      .select("*")
      .order("created_at");
    if (error) throw error;
    return data as ShoppingItem[];
  }
  return lsRead<ShoppingItem>(LS_SHOP).sort((a, b) =>
    a.created_at.localeCompare(b.created_at)
  );
}

export async function addShoppingItem(
  name: string,
  kind: ShoppingKind
): Promise<ShoppingItem> {
  const row: ShoppingItem = {
    id: uid(),
    name,
    kind,
    done: false,
    created_at: new Date().toISOString(),
  };
  if (supabase) {
    const { data, error } = await supabase
      .from("shopping_items")
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return data as ShoppingItem;
  }
  lsWrite(LS_SHOP, [...lsRead<ShoppingItem>(LS_SHOP), row]);
  return row;
}

export async function toggleShoppingItem(
  id: string,
  done: boolean
): Promise<void> {
  if (supabase) {
    const { error } = await supabase
      .from("shopping_items")
      .update({ done })
      .eq("id", id);
    if (error) throw error;
    return;
  }
  lsWrite(
    LS_SHOP,
    lsRead<ShoppingItem>(LS_SHOP).map((i) =>
      i.id === id ? { ...i, done } : i
    )
  );
}

export async function deleteShoppingItem(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase
      .from("shopping_items")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return;
  }
  lsWrite(
    LS_SHOP,
    lsRead<ShoppingItem>(LS_SHOP).filter((i) => i.id !== id)
  );
}

// ── Wallet (billetera) ──────────────────────────────────

export async function getWallet(): Promise<number> {
  if (supabase) {
    const { data, error } = await supabase
      .from("wallet")
      .select("balance")
      .eq("id", WALLET_ID)
      .maybeSingle();
    if (error) throw error;
    return data ? Number(data.balance) : 0;
  }
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(LS_WALLET) ?? "0");
}

export async function setWallet(balance: number): Promise<number> {
  const value = Math.round(balance * 100) / 100;
  if (supabase) {
    const { error } = await supabase
      .from("wallet")
      .upsert({ id: WALLET_ID, balance: value });
    if (error) throw error;
    return value;
  }
  localStorage.setItem(LS_WALLET, String(value));
  return value;
}

export async function adjustWallet(delta: number): Promise<number> {
  const current = await getWallet();
  return setWallet(current + delta);
}

// ── Recurring incomes (entradas automáticas) ────────────

export async function getRecurringIncomes(): Promise<RecurringIncome[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from("recurring_incomes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as RecurringIncome[];
  }
  return lsRead<RecurringIncome>(LS_REC).sort((a, b) =>
    b.created_at.localeCompare(a.created_at)
  );
}

export async function addRecurringIncome(
  rec: Omit<RecurringIncome, "id" | "created_at">
): Promise<RecurringIncome> {
  const row: RecurringIncome = {
    ...rec,
    id: uid(),
    created_at: new Date().toISOString(),
  };
  if (supabase) {
    const { data, error } = await supabase
      .from("recurring_incomes")
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return data as RecurringIncome;
  }
  lsWrite(LS_REC, [row, ...lsRead<RecurringIncome>(LS_REC)]);
  return row;
}

export async function updateRecurringIncome(
  id: string,
  patch: Partial<Omit<RecurringIncome, "id" | "created_at">>
): Promise<RecurringIncome> {
  if (supabase) {
    const { data, error } = await supabase
      .from("recurring_incomes")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as RecurringIncome;
  }
  const rows = lsRead<RecurringIncome>(LS_REC);
  const next = rows.map((r) => (r.id === id ? { ...r, ...patch } : r));
  lsWrite(LS_REC, next);
  return next.find((r) => r.id === id)!;
}

export async function deleteRecurringIncome(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase
      .from("recurring_incomes")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return;
  }
  lsWrite(
    LS_REC,
    lsRead<RecurringIncome>(LS_REC).filter((r) => r.id !== id)
  );
}

// Clampa un día al último día válido del mes (ej: día 31 en febrero → 28/29).
function dateForMonth(year: number, month: number, day: number): string {
  const lastDay = new Date(year, month + 1, 0).getDate();
  const d = Math.min(day, lastDay);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${year}-${pad(month + 1)}-${pad(d)}`;
}

// Evita que dos componentes sincronicen a la vez y dupliquen entradas.
let syncInFlight: Promise<Transaction[]> | null = null;

/**
 * Materializa las entradas automáticas: crea las transacciones de cada fecha
 * programada que ya llegó y que aún no existe, desde que se creó la regla.
 * Devuelve las transacciones nuevas y ajusta la billetera por el total.
 */
export function syncRecurringIncomes(): Promise<Transaction[]> {
  if (!syncInFlight) {
    syncInFlight = doSyncRecurringIncomes().finally(() => {
      syncInFlight = null;
    });
  }
  return syncInFlight;
}

async function doSyncRecurringIncomes(): Promise<Transaction[]> {
  const rules = await getRecurringIncomes();
  if (rules.length === 0) return [];

  const txs = await getTransactions();
  const existing = new Set(
    txs
      .filter((t) => t.recurring_id)
      .map((t) => `${t.recurring_id}|${t.date}`)
  );

  const todayStr = today();
  const created: Transaction[] = [];

  for (const rule of rules) {
    const start = rule.created_at.slice(0, 10); // yyyy-mm-dd de creación
    const days = [rule.day1, ...(rule.day2 ? [rule.day2] : [])];

    // Itera mes a mes desde la creación hasta hoy.
    const startDate = new Date(start + "T00:00:00");
    let y = startDate.getFullYear();
    let m = startDate.getMonth();
    const end = new Date(todayStr + "T00:00:00");

    while (y < end.getFullYear() || (y === end.getFullYear() && m <= end.getMonth())) {
      for (const day of days) {
        const dateStr = dateForMonth(y, m, day);
        // Solo fechas que ya pasaron, desde que existe la regla, sin duplicar.
        if (
          dateStr >= start &&
          dateStr <= todayStr &&
          !existing.has(`${rule.id}|${dateStr}`)
        ) {
          const row = await addTransaction({
            type: "entrada",
            amount: rule.amount,
            category: rule.name,
            note: "Automático",
            date: dateStr,
            recurring_id: rule.id,
          });
          created.push(row);
          existing.add(`${rule.id}|${dateStr}`);
        }
      }
      m++;
      if (m > 11) {
        m = 0;
        y++;
      }
    }
  }

  if (created.length > 0) {
    const total = created.reduce((s, t) => s + t.amount, 0);
    await adjustWallet(total);
  }
  return created;
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
