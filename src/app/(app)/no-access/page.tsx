import { ShieldX } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export const metadata: Metadata = { title: "ไม่มีสิทธิ์เข้าถึง" }

export default function NoAccessPage() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <ShieldX className="size-12 text-destructive" />
        <p className="text-lg font-semibold">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
        <p className="text-muted-foreground">ถ้าต้องใช้งาน กรุณาติดต่อผู้ดูแลระบบ</p>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          กลับหน้าหลัก
        </Link>
      </CardContent>
    </Card>
  )
}
