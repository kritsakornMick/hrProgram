import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const TONES = {
  green: "bg-tint-green text-primary",
  orange: "bg-tint-orange text-brand-orange",
  blue: "bg-tint-blue text-chart-3",
  purple: "bg-tint-purple text-chart-4",
  pink: "bg-tint-pink text-chart-5",
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
  return (
    <div className={cn("flex items-center gap-3 rounded-xl p-4", TONES[tone])}>
      <Icon className="size-9 shrink-0" />
      <div className="min-w-0">
        <p className="line-clamp-2 text-sm leading-tight font-semibold text-foreground">{label}</p>
        <p className="text-foreground">
          <span className="text-2xl font-bold">{value.toLocaleString("th-TH")}</span>{" "}
          <span className="text-sm">{unit}</span>
        </p>
      </div>
    </div>
  )
}
