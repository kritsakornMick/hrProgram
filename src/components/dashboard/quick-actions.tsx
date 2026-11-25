import type { LucideIcon } from "lucide-react"
import { Star } from "lucide-react"
import Link from "next/link"

export type QuickAction = { label: string; href: string; icon: LucideIcon }

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <header className="flex items-center gap-2 bg-tint-green px-4 py-3 text-primary">
        <Star className="size-6 fill-current" />
        <h2 className="text-lg font-semibold">ทางลัด (Quick Access)</h2>
      </header>
      <div className="grid grid-cols-2 gap-3 p-3">
        {actions.map((a, i) => (
          <Link
            key={a.label}
            href={a.href}
            className={`flex flex-col items-center gap-2 rounded-lg border px-2 py-4 text-center text-sm font-medium shadow-xs hover:border-primary hover:bg-secondary ${i === 0 ? "col-span-2" : ""}`}
          >
            <a.icon className="size-7 text-primary" />
            {a.label}
          </Link>
        ))}
      </div>
    </section>
  )
}
