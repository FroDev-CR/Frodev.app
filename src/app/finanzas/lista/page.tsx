"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, NotebookPen, X } from "lucide-react";
import {
  getShoppingItems,
  addShoppingItem,
  toggleShoppingItem,
  deleteShoppingItem,
} from "@/lib/store";
import type { ShoppingItem, ShoppingKind } from "@/lib/types";

const SECTIONS: { kind: ShoppingKind; title: string; tag: string }[] = [
  { kind: "necesito", title: "Debo comprar", tag: "bg-debt text-white" },
  { kind: "quiero", title: "Quiero comprar", tag: "bg-primary text-white" },
];

export default function ListaPage() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getShoppingItems().then((i) => {
      setItems(i);
      setLoaded(true);
    });
  }, []);

  async function handleToggle(item: ShoppingItem) {
    const done = !item.done;
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, done } : i))
    );
    await toggleShoppingItem(item.id, done);
  }

  async function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await deleteShoppingItem(id);
  }

  async function handleAdd(name: string, kind: ShoppingKind) {
    const row = await addShoppingItem(name, kind);
    setItems((prev) => [...prev, row]);
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/finanzas"
        className="flex items-center gap-2 text-muted text-sm font-bold uppercase w-fit"
      >
        <ArrowLeft size={16} aria-hidden /> Finanzas
      </Link>

      <header>
        <h1 className="text-2xl font-bold uppercase rot-l flex items-center gap-2">
          <NotebookPen size={26} className="text-gym" aria-hidden />
          Lista de compras
        </h1>
      </header>

      <div className="notebook py-4">
        {SECTIONS.map(({ kind, title, tag }, si) => {
          const sectionItems = items.filter((i) => i.kind === kind);
          return (
            <section key={kind} className={si > 0 ? "mt-8" : ""}>
              <div className="notebook-line !border-b-0">
                <span className={`brut-tag ${tag}`}>{title}</span>
              </div>
              <ul>
                {sectionItems.map((item) => (
                  <li key={item.id} className="notebook-line">
                    <button
                      onClick={() => handleToggle(item)}
                      role="checkbox"
                      aria-checked={item.done}
                      aria-label={`${item.done ? "Desmarcar" : "Marcar"} ${item.name}`}
                      className="w-6 h-6 border-2 border-gray-800 shrink-0 flex items-center justify-center cursor-pointer bg-white/40"
                    >
                      {item.done && (
                        <Check size={18} strokeWidth={3} aria-hidden />
                      )}
                    </button>
                    <span
                      className={`font-hand text-2xl leading-none flex-1 min-w-0 truncate ${
                        item.done ? "line-through opacity-50" : ""
                      }`}
                    >
                      {item.name}
                    </span>
                    <button
                      onClick={() => handleDelete(item.id)}
                      aria-label={`Borrar ${item.name}`}
                      className="text-gray-400 hover:text-debt cursor-pointer p-2 shrink-0"
                    >
                      <X size={16} aria-hidden />
                    </button>
                  </li>
                ))}
                {loaded && sectionItems.length === 0 && (
                  <li className="notebook-line">
                    <span className="font-hand text-xl opacity-40">
                      (nada por aquí…)
                    </span>
                  </li>
                )}
                <AddLine
                  onAdd={(name) => handleAdd(name, kind)}
                  label={`Agregar a ${title.toLowerCase()}`}
                />
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

// Renglón de escritura: escribís y das Enter, como en un cuaderno.
function AddLine({
  onAdd,
  label,
}: {
  onAdd: (name: string) => void;
  label: string;
}) {
  const [value, setValue] = useState("");

  function submit() {
    const name = value.trim();
    if (!name) return;
    onAdd(name);
    setValue("");
  }

  return (
    <li className="notebook-line">
      <span className="text-gray-400 font-bold shrink-0" aria-hidden>
        +
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        onBlur={submit}
        placeholder="escribí aquí…"
        aria-label={label}
        className="font-hand text-2xl leading-none flex-1 min-w-0 bg-transparent outline-none placeholder:text-gray-400 text-gray-800"
      />
    </li>
  );
}
