import type { LucideIcon } from "lucide-react"
import { Star } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export type QuickAction = { label: string; href: string; icon: LucideIcon }

/** กล่อง "ทางลัด" ปุ่มแรกกว้างเต็มแถว */
export function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <header className="flex items-center gap-2 bg-linear-to-r from-tint-green to-card px-4 py-3.5 text-primary">
        <Star className="size-6 fill-current" />
        <h2 className="font-heading text-lg font-medium">ทางลัด (Quick Access)</h2>
      </header>
      <div className="grid grid-cols-2 gap-3 p-3">
        {actions.map((a, i) => (
          <Link
            key={a.label}
            href={a.href}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl bg-muted/60 px-2 py-4 text-center font-heading text-sm shadow-xs ring-1 ring-border transition hover:-translate-y-px hover:bg-card hover:shadow-md hover:ring-primary",
              i === 0 && "col-span-2",
            )}
          >
            <a.icon className="size-8 text-primary" strokeWidth={1.75} />
            {a.label}
          </Link>
        ))}
      </div>
    </section>
  )
}
