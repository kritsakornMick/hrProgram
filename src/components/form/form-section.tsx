import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const HEADER_STYLES = {
  soft: {
    green: "bg-linear-to-r from-tint-green via-tint-green/70 to-transparent text-brand-green-dark [&_svg]:text-primary",
    orange: "bg-linear-to-r from-tint-orange via-tint-orange/70 to-transparent text-brand-orange-dark [&_svg]:text-brand-orange",
  },
  solid: {
    green: "bg-primary text-primary-foreground",
    orange: "bg-brand-orange text-primary-foreground",
  },
} as const

export type FormSectionTone = "green" | "orange"

/**
 * กล่องแบ่งหมวดในฟอร์มยาว (แถบหัว + ไอคอน)
 * - variant="soft"  (ค่าเริ่มต้น) แถบหัวพื้นอ่อน ตัวอักษรเขียวเข้ม ตามดีไซน์ใบสมัครงาน
 * - variant="solid" แถบหัวพื้นเขียว/ส้มเต็ม ตัวอักษรขาว
 * ใส่ id เพื่อให้ปุ่ม/แท็บด้านบนกดกระโดดมาที่หมวดนี้ได้ (href="#id")
 *
 * ตัวอย่าง:
 *   <FormSection id="personal" icon={User} title="ข้อมูลส่วนตัว">...</FormSection>
 */
export function FormSection({
  id,
  icon: Icon,
  title,
  description,
  tone = "green",
  variant = "soft",
  className,
  contentClassName,
  children,
}: {
  id?: string
  icon?: LucideIcon
  title: string
  description?: string
  tone?: FormSectionTone
  variant?: keyof typeof HEADER_STYLES
  className?: string
  contentClassName?: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-title` : undefined}
      className={cn("min-w-0 scroll-mt-[calc(var(--header-height)+5rem)]", className)}
    >
      <Card className="h-full gap-3 pt-0 shadow-xs">
        <header className={cn("flex items-center gap-2.5 px-4 py-2.5", HEADER_STYLES[variant][tone])}>
          {Icon && <Icon className="size-5 shrink-0" />}
          <div className="min-w-0">
            <h2 id={id ? `${id}-title` : undefined} className="text-base leading-tight font-bold">
              {title}
            </h2>
            {description && <p className="text-xs opacity-90">{description}</p>}
          </div>
        </header>
        <CardContent className={cn("@container", contentClassName)}>{children}</CardContent>
      </Card>
    </section>
  )
}
