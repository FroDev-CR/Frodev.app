import { supabase } from "./supabase";

// Cola de operaciones pendientes: cuando no hay internet, las escrituras
// se guardan aquí y se reenvían a Supabase al volver la conexión.

export type PendingOp =
  | { kind: "insert"; table: string; row: object }
  | { kind: "update"; table: string; id: string; patch: object }
  | { kind: "delete"; table: string; id: string }
  | { kind: "upsert"; table: string; row: object };

const LS_PENDING = "frodev.pending";

function readQueue(): PendingOp[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LS_PENDING) ?? "[]") as PendingOp[];
  } catch {
    return [];
  }
}

function writeQueue(q: PendingOp[]) {
  localStorage.setItem(LS_PENDING, JSON.stringify(q));
}

function enqueue(op: PendingOp) {
  writeQueue([...readQueue(), op]);
}

async function exec(op: PendingOp): Promise<void> {
  if (!supabase) return;
  switch (op.kind) {
    case "insert": {
      const { error } = await supabase.from(op.table).insert(op.row);
      // 23505 = ya existe (reintento de un insert que sí llegó): ignorar.
      if (error && error.code !== "23505") throw error;
      return;
    }
    case "update": {
      const { error } = await supabase
        .from(op.table)
        .update(op.patch)
        .eq("id", op.id);
      if (error) throw error;
      return;
    }
    case "delete": {
      const { error } = await supabase.from(op.table).delete().eq("id", op.id);
      if (error) throw error;
      return;
    }
    case "upsert": {
      const { error } = await supabase.from(op.table).upsert(op.row);
      if (error) throw error;
      return;
    }
  }
}

/** Intenta la operación ya; si falla (sin internet), la deja en cola. */
export async function persist(op: PendingOp): Promise<void> {
  if (!supabase) return;
  // Si hay cola pendiente, encolar detrás para respetar el orden.
  if (readQueue().length > 0) {
    enqueue(op);
    void flushPending();
    return;
  }
  try {
    await exec(op);
  } catch {
    enqueue(op);
  }
}

function isPermanent(e: unknown): boolean {
  // Errores de red de supabase-js no traen código Postgres; los que sí
  // (ej: 42P01 tabla no existe) nunca van a funcionar por reintentar.
  const code = (e as { code?: string })?.code;
  return typeof code === "string" && /^[0-9A-Z]{5}$/.test(code);
}

let flushing = false;

/** Reenvía la cola pendiente en orden. Se detiene si sigue sin internet. */
export async function flushPending(): Promise<void> {
  if (!supabase || flushing) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) return;
  flushing = true;
  try {
    let q = readQueue();
    while (q.length > 0) {
      try {
        await exec(q[0]);
      } catch (e) {
        if (!isPermanent(e)) return; // sin internet: reintentar después
        // permanente: descartar para no bloquear el resto
      }
      q = q.slice(1);
      writeQueue(q);
    }
  } finally {
    flushing = false;
  }
}

/** Cantidad de escrituras esperando conexión. */
export function pendingCount(): number {
  return readQueue().length;
}
