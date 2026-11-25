import { Construction } from "lucide-react"
import { notFound } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { findMenuItem } from "@/lib/menu"

/**
 * หน้า "กำลังพัฒนา" — ผู้รับผิดชอบหน้านั้นให้ลบการเรียก <ComingSoon /> ออก
 * แล้วเขียนหน้าจริงแทน (ดูตัวอย่างที่ src/app/(app)/companies)
 */
export function ComingSoon({ href }: { href: string }) {
  const found = findMenuItem(href)
  if (!found) notFound()
  const { group, item } = found

  return (
    <>
      <PageHeader icon={item.icon} title={item.title} description={group.title} />
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <Construction className="size-12 text-brand-orange" />
          <p className="text-lg font-semibold">หน้านี้กำลังพัฒนา</p>
          <p className="text-muted-foreground">
            หน้าจอ {item.screen} · ผู้รับผิดชอบ: {item.owner}
          </p>
        </CardContent>
      </Card>
    </>
  )
}
