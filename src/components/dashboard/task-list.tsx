import { Bell, Play } from "lucide-react"
import Link from "next/link"

export type Task = { label: string; count: number; href: string }

/** กล่อง "งานที่ต้องดำเนินการ" ตัวเลขแดงคืองานค้าง */
export function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <header className="flex items-center gap-2 bg-linear-to-r from-tint-orange to-card px-4 py-3.5 text-brand-orange">
        <Bell className="size-6 fill-current" />
        <h2 className="font-heading text-lg font-medium">งานที่ต้องดำเนินการ</h2>
      </header>
      <ul className="space-y-1 p-2">
        {tasks.map((t) => (
          <li key={t.label}>
            <Link href={t.href} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm hover:bg-muted">
              <Play className="size-3 shrink-0 fill-current text-brand-orange" />
              <span className="flex-1 font-heading">{t.label}</span>
              <span className="flex size-7 items-center justify-center rounded-lg bg-destructive text-sm font-semibold text-primary-foreground shadow-sm">
                {t.count}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
