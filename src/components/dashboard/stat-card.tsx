import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const TONES = {
  green: { card: "from-tint-green border-tint-green", icon: "text-primary" },
  orange: { card: "from-tint-orange border-tint-orange", icon: "text-brand-orange" },
  blue: { card: "from-tint-blue border-tint-blue", icon: "text-chart-3" },
  purple: { card: "from-tint-purple border-tint-purple", icon: "text-chart-4" },
  pink: { card: "from-tint-pink border-tint-pink", icon: "text-chart-5" },
} as const

export function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  tone,
}: {
  icon: LucideIcon
  label: string
  value: number
  unit: string
  tone: keyof typeof TONES
}) {
  const t = TONES[tone]
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border bg-linear-to-br to-card p-4 shadow-sm transition-shadow hover:shadow-md",
        t.card,
      )}
    >
      <Icon className={cn("size-10 shrink-0", t.icon)} strokeWidth={1.75} />
      <div className="min-w-0">
        <p className="line-clamp-2 font-heading text-sm leading-tight font-medium text-foreground">{label}</p>
        <p className="mt-1 text-foreground">
          <span className="font-heading text-3xl font-semibold">{value.toLocaleString("th-TH")}</span>{" "}
          <span className="text-sm font-medium">{unit}</span>
        </p>
      </div>
    </div>
  )
}
