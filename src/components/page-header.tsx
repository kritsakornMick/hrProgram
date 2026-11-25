import type { LucideIcon } from "lucide-react"

/** หัวหน้าของทุกหน้า: ไอคอน + ชื่อหน้า + คำอธิบาย + ปุ่มด้านขวา */
export function PageHeader({
  icon: Icon,
  title,
  description,
  actions,
}: {
  icon?: LucideIcon
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-4">
      {Icon && (
        <div className="flex size-12 items-center justify-center rounded-xl bg-tint-green text-primary">
          <Icon className="size-7" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold text-brand-green-dark">{title}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  )
}
