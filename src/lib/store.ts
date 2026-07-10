import { supabase } from "./supabase";
import { persist } from "./offline";
import type {
  Category,
  Debt,
  ExerciseDef,
  RecurringIncome,
  ShoppingItem,
  ShoppingKind,
  Transaction,
  TransactionType,
  Workout,
} from "./types";
import { today } from "./format";

// Capa de datos offline-first: localStorage es el espejo local siempre.
// Con Supabase configurado, las lecturas refrescan el espejo y las
// escrituras se aplican local primero y se sincronizan por detrás
// (si no hay internet quedan en cola — ver offline.ts).

const LS_TX = "frodev.transactions";
const LS_WO = "frodev.workouts";
const LS_DEBT = "frodev.debts";
const LS_CAT = "frodev.categories";
const LS_REC = "frodev.recurring_incomes";
const LS_WALLET = "frodev.wallet";
const LS_SHOP = "frodev.shopping";
const LS_EXDEF = "frodev.exercise_defs";

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
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(rows));
}

function uid() {
  return crypto.randomUUID();
}

function nowIso() {
  return new Date().toISOString();
}

// Lee de Supabase y refresca el espejo local; si falla (sin internet),
// devuelve lo que haya en el espejo.
async function fetchList<T>(
  lsKey: string,
  remote: () => PromiseLike<{ data: unknown; error: unknown }>,
  localSort: (rows: T[]) => T[]
): Promise<T[]> {
  if (supabase) {
    try {
      const { data, error } = await remote();
      if (error) throw error;
      lsWrite(lsKey, data as T[]);
      return data as T[];
    } catch {
      // sin conexión: usar el espejo local
    }
  }
  return localSort(lsRead<T>(lsKey));
}

// ── Transactions ────────────────────────────────────────

export async function getTransactions(): Promise<Transaction[]> {
  return fetchList<Transaction>(
    LS_TX,
    () =>
      supabase!
        .from("transactions")
        .select("*")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false }),
    (rows) =>
      rows.sort(
        (a, b) =>
          b.date.localeCompare(a.date) ||
          b.created_at.localeCompare(a.created_at)
      )
  );
}

export async function addTransaction(
  tx: Omit<Transaction, "id" | "created_at">
): Promise<Transaction> {
  const row: Transaction = { ...tx, id: uid(), created_at: nowIso() };
  lsWrite(LS_TX, [row, ...lsRead<Transaction>(LS_TX)]);
  await persist({ kind: "insert", table: "transactions", row });
  return row;
}

export async function deleteTransaction(id: string): Promise<void> {
  lsWrite(
    LS_TX,
    lsRead<Transaction>(LS_TX).filter((t) => t.id !== id)
  );
  await persist({ kind: "delete", table: "transactions", id });
}

// ── Debts ───────────────────────────────────────────────

export async function getDebts(): Promise<Debt[]> {
  return fetchList<Debt>(
    LS_DEBT,
    () =>
      supabase!
        .from("debts")
        .select("*")
        .order("created_at", { ascending: false }),
    (rows) => rows.sort((a, b) => b.created_at.localeCompare(a.created_at))
  );
}

export async function addDebt(
  debt: Omit<Debt, "id" | "created_at">
): Promise<Debt> {
  const row: Debt = { ...debt, id: uid(), created_at: nowIso() };
  lsWrite(LS_DEBT, [row, ...lsRead<Debt>(LS_DEBT)]);
  await persist({ kind: "insert", table: "debts", row });
  return row;
}

export async function deleteDebt(id: string): Promise<void> {
  lsWrite(
    LS_DEBT,
    lsRead<Debt>(LS_DEBT).filter((d) => d.id !== id)
  );
  await persist({ kind: "delete", table: "debts", id });
}

// ── Categories ──────────────────────────────────────────

export async function getCategories(
  type: TransactionType
): Promise<Category[]> {
  const all = await fetchList<Category>(
    LS_CAT,
    () => supabase!.from("categories").select("*").order("name"),
    (rows) => rows.sort((a, b) => a.name.localeCompare(b.name))
  );
  return all.filter((c) => c.type === type);
}

export async function addCategory(
  name: string,
  type: TransactionType
): Promise<Category> {
  const row: Category = { id: uid(), name, type, created_at: nowIso() };
  lsWrite(LS_CAT, [row, ...lsRead<Category>(LS_CAT)]);
  await persist({ kind: "insert", table: "categories", row });
  return row;
}

export async function deleteCategory(id: string): Promise<void> {
  lsWrite(
    LS_CAT,
    lsRead<Category>(LS_CAT).filter((c) => c.id !== id)
  );
  await persist({ kind: "delete", table: "categories", id });
}

// ── Shopping list (lista de compras) ────────────────────

export async function getShoppingItems(): Promise<ShoppingItem[]> {
  return fetchList<ShoppingItem>(
    LS_SHOP,
    () => supabase!.from("shopping_items").select("*").order("created_at"),
    (rows) => rows.sort((a, b) => a.created_at.localeCompare(b.created_at))
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
    created_at: nowIso(),
  };
  lsWrite(LS_SHOP, [...lsRead<ShoppingItem>(LS_SHOP), row]);
  await persist({ kind: "insert", table: "shopping_items", row });
  return row;
}

export async function toggleShoppingItem(
  id: string,
  done: boolean
): Promise<void> {
  lsWrite(
    LS_SHOP,
    lsRead<ShoppingItem>(LS_SHOP).map((i) => (i.id === id ? { ...i, done } : i))
  );
  await persist({ kind: "update", table: "shopping_items", id, patch: { done } });
}

export async function deleteShoppingItem(id: string): Promise<void> {
  lsWrite(
    LS_SHOP,
    lsRead<ShoppingItem>(LS_SHOP).filter((i) => i.id !== id)
  );
  await persist({ kind: "delete", table: "shopping_items", id });
}

// ── Wallet (billetera) ──────────────────────────────────

function lsWalletRead(): number {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(LS_WALLET) ?? "0");
}

export async function getWallet(): Promise<number> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("wallet")
        .select("balance")
        .eq("id", WALLET_ID)
        .maybeSingle();
      if (error) throw error;
      const value = data ? Number(data.balance) : 0;
      if (typeof window !== "undefined")
        localStorage.setItem(LS_WALLET, String(value));
      return value;
    } catch {
      // sin conexión: usar el espejo local
    }
  }
  return lsWalletRead();
}

export async function setWallet(balance: number): Promise<number> {
  const value = Math.round(balance * 100) / 100;
  if (typeof window !== "undefined")
    localStorage.setItem(LS_WALLET, String(value));
  await persist({
    kind: "upsert",
    table: "wallet",
    row: { id: WALLET_ID, balance: value },
  });
  return value;
}

export async function adjustWallet(delta: number): Promise<number> {
  const current = await getWallet();
  return setWallet(current + delta);
}

// ── Recurring incomes (entradas automáticas) ────────────

export async function getRecurringIncomes(): Promise<RecurringIncome[]> {
  return fetchList<RecurringIncome>(
    LS_REC,
    () =>
      supabase!
        .from("recurring_incomes")
        .select("*")
        .order("created_at", { ascending: false }),
    (rows) => rows.sort((a, b) => b.created_at.localeCompare(a.created_at))
  );
}

export async function addRecurringIncome(
  rec: Omit<RecurringIncome, "id" | "created_at">
): Promise<RecurringIncome> {
  const row: RecurringIncome = { ...rec, id: uid(), created_at: nowIso() };
  lsWrite(LS_REC, [row, ...lsRead<RecurringIncome>(LS_REC)]);
  await persist({ kind: "insert", table: "recurring_incomes", row });
  return row;
}

export async function updateRecurringIncome(
  id: string,
  patch: Partial<Omit<RecurringIncome, "id" | "created_at">>
): Promise<RecurringIncome> {
  const next = lsRead<RecurringIncome>(LS_REC).map((r) =>
    r.id === id ? { ...r, ...patch } : r
  );
  lsWrite(LS_REC, next);
  await persist({ kind: "update", table: "recurring_incomes", id, patch });
  return next.find((r) => r.id === id)!;
}

export async function deleteRecurringIncome(id: string): Promise<void> {
  lsWrite(
    LS_REC,
    lsRead<RecurringIncome>(LS_REC).filter((r) => r.id !== id)
  );
  await persist({ kind: "delete", table: "recurring_incomes", id });
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
  return fetchList<Workout>(
    LS_WO,
    () =>
      supabase!.from("workouts").select("*").order("date", { ascending: false }),
    (rows) => rows.sort((a, b) => b.date.localeCompare(a.date))
  );
}

export async function addWorkout(
  wo: Omit<Workout, "id" | "created_at">
): Promise<Workout> {
  const row: Workout = { ...wo, id: uid(), created_at: nowIso() };
  lsWrite(LS_WO, [row, ...lsRead<Workout>(LS_WO)]);
  await persist({ kind: "insert", table: "workouts", row });
  return row;
}

export async function deleteWorkout(id: string): Promise<void> {
  lsWrite(
    LS_WO,
    lsRead<Workout>(LS_WO).filter((w) => w.id !== id)
  );
  await persist({ kind: "delete", table: "workouts", id });
}

// ── Exercise defs (catálogo de ejercicios por músculo) ──

export async function getExerciseDefs(): Promise<ExerciseDef[]> {
  return fetchList<ExerciseDef>(
    LS_EXDEF,
    () => supabase!.from("exercise_defs").select("*").order("name"),
    (rows) => rows.sort((a, b) => a.name.localeCompare(b.name))
  );
}

export async function addExerciseDef(
  muscle: string,
  name: string
): Promise<ExerciseDef> {
  const row: ExerciseDef = { id: uid(), muscle, name, created_at: nowIso() };
  lsWrite(
    LS_EXDEF,
    [...lsRead<ExerciseDef>(LS_EXDEF), row].sort((a, b) =>
      a.name.localeCompare(b.name)
    )
  );
  await persist({ kind: "insert", table: "exercise_defs", row });
  return row;
}

export async function deleteExerciseDef(id: string): Promise<void> {
  lsWrite(
    LS_EXDEF,
    lsRead<ExerciseDef>(LS_EXDEF).filter((d) => d.id !== id)
  );
  await persist({ kind: "delete", table: "exercise_defs", id });
}
