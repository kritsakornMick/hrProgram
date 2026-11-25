import Link from "next/link"
import type { MenuGroup } from "@/lib/menu"
import { cn } from "@/lib/utils"

const HEADER_TONES = {
  orange: "bg-brand-orange",
  green: "bg-primary",
} as const

const ICON_TONES = {
  orange: "text-brand-orange",
  green: "text-primary",
} as const

/** กล่องเมนูบนหน้าหลัก (หัวสี + รายการลิงก์) */
export function MenuGroupCard({ group }: { group: MenuGroup }) {
  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <header className={cn("flex items-center gap-3 px-4 py-3 text-white", HEADER_TONES[group.tone])}>
        <group.icon className="size-7" />
        <div>
          <h2 className="font-semibold leading-tight">{group.title}</h2>
          <p className="text-sm opacity-90">({group.subtitle})</p>
        </div>
      </header>
      <ul className="space-y-2 p-3">
        {group.items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 text-sm font-medium shadow-xs transition-colors hover:border-primary hover:bg-secondary"
            >
              <item.icon className={cn("size-5 shrink-0", ICON_TONES[group.tone])} />
              <span className="flex-1">{item.title}</span>
              {!item.ready && (
                <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                  กำลังพัฒนา
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
