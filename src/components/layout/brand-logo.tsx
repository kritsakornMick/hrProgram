import Image from "next/image"
import { cn } from "@/lib/utils"

/** โลโก้บริษัท (ไฟล์ public/logo-speedy.png ขนาด 700×240) กำหนดความสูงผ่าน className เช่น "h-12" */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <Image
      src="/logo-speedy.png"
      alt="Speedy"
      width={700}
      height={240}
      loading="eager"
      className={cn("h-10 w-auto select-none", className)}
    />
  )
}
