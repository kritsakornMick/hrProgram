import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { AuthorizationDocument } from "@/app/(app)/background-checks/authorization-document"
import { getDocumentParties, toBackgroundCheckInput } from "@/app/(app)/background-checks/data"
import { BACKGROUND_CHECK_EDITORS } from "@/app/(app)/background-checks/permissions"
import { A4Frame } from "@/components/document/a4-sheet"
import { PrintToolbar } from "@/components/document/print-toolbar"
import { audit } from "@/lib/audit"
import { db } from "@/lib/db"
import { requirePageRole } from "@/lib/session"

export const metadata: Metadata = { title: "พิมพ์หนังสือมอบอำนาจ" }

/**
 * หน้าพิมพ์หนังสือมอบอำนาจและตรวจประวัติ (กระดาษ A4 ขนาดจริง)
 * ใช้ข้อมูลที่บันทึกแล้วเท่านั้น และบันทึก audit "export" ทุกครั้งที่เปิด (มีเลขบัตรเต็ม = PDPA)
 * ?auto=1 เปิดหน้าต่างพิมพ์ให้เอง
 */
export default async function PrintBackgroundCheckPage({
  params,
  searchParams,
}: PageProps<"/background-checks/[id]/print">) {
  const user = await requirePageRole(BACKGROUND_CHECK_EDITORS)
  const { id } = await params
  const { auto } = await searchParams
  const recordId = Number(id)
  if (!Number.isInteger(recordId) || recordId <= 0) notFound()

  const record = await db.backgroundCheckAuthorization.findUnique({ where: { id: recordId } })
  if (!record) notFound()
  const parties = await getDocumentParties(record.interviewId)

  await audit(user, "export", "background_check", record.id, { document: "authorization+consent" })

  return (
    <>
      <PrintToolbar title={`หนังสือมอบอำนาจและตรวจประวัติ เลขที่ ${record.id}`} autoPrint={auto === "1"} />
      {/* กว้าง 210 มม. (ขนาดจริง) จอแคบย่อให้พอดี ตอนพิมพ์เป็นขนาดจริงเสมอ */}
      <A4Frame className="mx-auto w-[210mm] max-w-[calc(100vw-2rem)] print:w-auto print:max-w-none">
        <AuthorizationDocument no={record.id} values={toBackgroundCheckInput(record)} parties={parties} />
      </A4Frame>
    </>
  )
}
