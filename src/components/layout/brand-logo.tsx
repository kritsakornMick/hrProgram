import { cn } from "@/lib/utils"

/**
 * โลโก้ชั่วคราว (ตัวอักษร) — TODO: เปลี่ยนเป็นไฟล์โลโก้จริงของบริษัทใน public/logo.svg
 */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-heading text-3xl font-bold italic tracking-tight text-brand-orange select-none",
        className,
      )}
    >
      SPEEDY
    </span>
  )
}
