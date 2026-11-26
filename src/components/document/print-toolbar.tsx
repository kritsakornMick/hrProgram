"use client"

import { Printer, X } from "lucide-react"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"

/**
 * แถบปุ่มด้านบนหน้าพิมพ์ (ไม่ถูกพิมพ์)
 * autoPrint = เปิดหน้าต่างพิมพ์ให้เองหลังโหลดฟอนต์เสร็จ (ใช้ตอนกดปุ่ม "พิมพ์" จากฟอร์ม)
 */
export function PrintToolbar({ title, autoPrint }: { title: string; autoPrint?: boolean }) {
  useEffect(() => {
    if (!autoPrint) return
    let cancelled = false
    void document.fonts.ready.then(() => {
      if (!cancelled) window.print()
    })
    return () => {
      cancelled = true
    }
  }, [autoPrint])

  return (
    <div className="mx-auto mb-4 flex w-[210mm] max-w-[calc(100vw-2rem)] items-center gap-2 print:hidden">
      <p className="min-w-0 flex-1 truncate font-medium">{title}</p>
      <Button variant="outline" onClick={() => window.close()}>
        <X />
        ปิด
      </Button>
      <Button onClick={() => window.print()}>
        <Printer />
        พิมพ์
      </Button>
    </div>
  )
}
