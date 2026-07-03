"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wallet, Dumbbell } from "lucide-react";

const items = [
  { href: "/", label: "Inicio", icon: LayoutDashboard },
  { href: "/finanzas", label: "Finanzas", icon: Wallet },
  { href: "/gym", label: "Gym", icon: Dumbbell },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed bottom-0 left-0 right-0 z-50 border-t-[3px] border-white bg-surface-2"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="max-w-lg mx-auto grid grid-cols-3">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center gap-1 py-3 min-h-[56px] font-bold uppercase text-[11px] tracking-wider transition-colors ${
                active
                  ? "bg-gym text-black"
                  : "text-muted hover:text-fg"
              }`}
            >
              <Icon size={22} strokeWidth={2.5} aria-hidden />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
