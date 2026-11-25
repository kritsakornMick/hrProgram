import { Bell, ChevronRight } from "lucide-react"
import Link from "next/link"

export type Task = { label: string; count: number; href: string }

/** กล่อง "งานที่ต้องดำเนินการ" ตัวเลขแดงคืองานค้าง */
export function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <header className="flex items-center gap-2 bg-tint-orange px-4 py-3 text-brand-orange">
        <Bell className="size-6" />
        <h2 className="text-lg font-semibold">งานที่ต้องดำเนินการ</h2>
      </header>
      <ul className="divide-y">
        {tasks.map((t) => (
          <li key={t.label}>
            <Link href={t.href} className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-muted">
              <ChevronRight className="size-4 text-brand-orange" />
              <span className="flex-1">{t.label}</span>
              <span className="min-w-7 rounded-md bg-destructive px-2 py-0.5 text-center font-semibold text-white">
                {t.count}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
