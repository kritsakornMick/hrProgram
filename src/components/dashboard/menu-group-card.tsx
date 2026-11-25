import { Clock } from "lucide-react"
import Link from "next/link"
import type { MenuGroup } from "@/lib/menu"
import { cn } from "@/lib/utils"

const HEADER_TONES = {
  orange: "from-brand-orange to-brand-orange-dark",
  green: "from-primary to-brand-green-dark",
} as const

const ICON_TONES = {
  orange: "text-brand-orange",
  green: "text-primary",
} as const

/** กล่องเมนูบนหน้าหลัก (หัวสี + รายการลิงก์) */
export function MenuGroupCard({ group }: { group: MenuGroup }) {
  return (
    <section className="flex flex-col overflow-hidden rounded-2xl border bg-muted/60 shadow-sm">
      <header
        className={cn("flex items-center gap-3 bg-linear-to-r px-4 py-3.5 text-primary-foreground", HEADER_TONES[group.tone])}
      >
        <group.icon className="size-9 shrink-0" strokeWidth={1.75} />
        <div className="min-w-0">
          <h2 className="font-heading text-lg leading-tight font-medium">{group.title}</h2>
          <p className="text-sm opacity-90">({group.subtitle})</p>
        </div>
      </header>
      <ul className="flex-1 space-y-2 p-3">
        {group.items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="group flex items-center gap-3 rounded-xl bg-card px-3 py-2.5 shadow-xs ring-1 ring-border transition hover:-translate-y-px hover:shadow-md hover:ring-primary"
            >
              <item.icon className={cn("size-5 shrink-0", ICON_TONES[group.tone])} />
              <span className="flex-1 font-heading text-sm leading-snug">{item.title}</span>
              {!item.ready && (
                <span title="กำลังพัฒนา" className="shrink-0 text-muted-foreground/70">
                  <Clock className="size-3.5" />
                  <span className="sr-only">กำลังพัฒนา</span>
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
