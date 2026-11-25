import { requireUser } from "@/lib/session"

/**
 * กรอบของหน้าพิมพ์เอกสาร (ไม่มี header / เมนูซ้าย)
 * บนจอแสดงกระดาษกลางหน้าบนพื้นเทา ตอนพิมพ์เหลือแค่กระดาษ
 */
export default async function PrintLayout({ children }: LayoutProps<"/">) {
  await requireUser()
  return <main className="min-h-svh bg-muted py-6 print:bg-transparent print:py-0">{children}</main>
}
