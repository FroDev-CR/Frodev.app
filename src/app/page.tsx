"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, Dumbbell, ArrowRight } from "lucide-react";
import { getTransactions, getWorkouts } from "@/lib/store";
import { money, shortDate } from "@/lib/format";
import type { Transaction, Workout } from "@/lib/types";

export default function Home() {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([getTransactions(), getWorkouts()]).then(([t, w]) => {
      setTxs(t);
      setWorkouts(w);
      setLoaded(true);
    });
  }, []);

  const month = new Date().toISOString().slice(0, 7);
  const monthTxs = txs.filter((t) => t.date.startsWith(month));
  const income = monthTxs
    .filter((t) => t.type === "entrada")
    .reduce((s, t) => s + t.amount, 0);
  const expense = monthTxs
    .filter((t) => t.type === "gasto")
    .reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  const monthWorkouts = workouts.filter((w) => w.date.startsWith(month));
  const lastWorkout = workouts[0];

  return (
    <div className="flex flex-col gap-6">
      <header className="rot-l">
        <h1 className="text-3xl font-bold uppercase tracking-tight">
          Frodev<span className="text-primary">.app</span>
        </h1>
        <p className="text-muted text-sm mt-1">Tu vida, bajo control.</p>
      </header>

      {/* Balance del mes */}
      <section className="brut-card p-5">
        <span className="brut-tag bg-primary text-white">Balance del mes</span>
        <p
          className={`text-4xl font-bold mt-3 tabular-nums ${
            balance >= 0 ? "text-income" : "text-expense"
          }`}
        >
          {loaded ? money(balance) : "—"}
        </p>
        <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-income" aria-hidden />
            <span className="tabular-nums">{money(income)}</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown size={18} className="text-expense" aria-hidden />
            <span className="tabular-nums">{money(expense)}</span>
          </div>
        </div>
        <Link
          href="/finanzas"
          className="brut-btn bg-primary text-white flex items-center justify-center gap-2 mt-5 px-4"
        >
          Ir a finanzas <ArrowRight size={18} aria-hidden />
        </Link>
      </section>

      {/* Gym del mes */}
      <section className="brut-card brut-card--gym p-5 rot-r">
        <span className="brut-tag bg-gym text-black">Gym</span>
        <p className="text-4xl font-bold mt-3">
          {monthWorkouts.length}
          <span className="text-base text-muted font-normal">
            {" "}
            días este mes
          </span>
        </p>
        {lastWorkout && (
          <p className="text-sm text-muted mt-2">
            Último: {shortDate(lastWorkout.date)} — {lastWorkout.focus} (
            {lastWorkout.exercises.length} ejercicios)
          </p>
        )}
        <Link
          href="/gym"
          className="brut-btn bg-gym text-black flex items-center justify-center gap-2 mt-5 px-4"
        >
          <Dumbbell size={18} aria-hidden /> Ir al gym
        </Link>
      </section>

      {/* Últimos movimientos */}
      <section>
        <h2 className="text-lg font-bold uppercase mb-3">Últimos movimientos</h2>
        {loaded && txs.length === 0 && (
          <p className="text-muted text-sm">
            Sin movimientos aún. Registra tu primer gasto o entrada.
          </p>
        )}
        <ul className="flex flex-col gap-3">
          {txs.slice(0, 5).map((t) => (
            <li
              key={t.id}
              className={`brut-card p-3 flex justify-between items-center ${
                t.type === "entrada"
                  ? "brut-card--income"
                  : "brut-card--expense"
              }`}
            >
              <div>
                <p className="font-bold text-sm">{t.category}</p>
                <p className="text-xs text-muted">{shortDate(t.date)}</p>
              </div>
              <p
                className={`font-bold tabular-nums ${
                  t.type === "entrada" ? "text-income" : "text-expense"
                }`}
              >
                {t.type === "entrada" ? "+" : "−"}
                {money(t.amount)}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
