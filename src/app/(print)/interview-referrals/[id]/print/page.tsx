import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getReferralParties, toReferralInput } from "@/app/(app)/interview-referrals/data"
import { REFERRAL_EDITORS } from "@/app/(app)/interview-referrals/permissions"
import { ReferralDocument } from "@/app/(app)/interview-referrals/referral-document"
import { A4Frame } from "@/components/document/a4-sheet"
import { PrintToolbar } from "@/components/document/print-toolbar"
import { audit } from "@/lib/audit"
import { db } from "@/lib/db"
import { requirePageRole } from "@/lib/session"

export const metadata: Metadata = { title: "พิมพ์หนังสือส่งตัวเพื่อเข้าสัมภาษณ์" }

/**
 * หน้าพิมพ์หนังสือส่งตัวพนักงานเพื่อเข้าสัมภาษณ์ (กระดาษ A4 ขนาดจริง)
 * ใช้ข้อมูลที่บันทึกแล้วเท่านั้น และบันทึก audit "export" ทุกครั้งที่เปิด (มีเลขบัตรเต็ม = PDPA)
 * ?auto=1 เปิดหน้าต่างพิมพ์ให้เอง
 */
export default async function PrintReferralPage({ params, searchParams }: PageProps<"/interview-referrals/[id]/print">) {
  const user = await requirePageRole(REFERRAL_EDITORS)
  const { id } = await params
  const { auto } = await searchParams
  const recordId = Number(id)
  if (!Number.isInteger(recordId) || recordId <= 0 || recordId > 2_147_483_647) notFound()

  const record = await db.interviewReferralLetter.findUnique({
    where: { id: recordId },
    include: { issuedBy: { select: { name: true, position: true } } },
  })
  if (!record) notFound()
  const parties = await getReferralParties(record.interviewId)

  await audit(user, "export", "interview_referral", record.id, { document: "interview_referral_letter" })

  const issuer = record.issuedBy ? { name: record.issuedBy.name, position: record.issuedBy.position ?? "" } : null

  return (
    <>
      <PrintToolbar title={`หนังสือส่งตัวเพื่อเข้าสัมภาษณ์ ลำดับที่ ${record.id}`} autoPrint={auto === "1"} />
      {/* กว้าง 210 มม. (ขนาดจริง) จอแคบย่อให้พอดี ตอนพิมพ์เป็นขนาดจริงเสมอ */}
      <A4Frame className="mx-auto w-[210mm] max-w-[calc(100vw-2rem)] print:w-auto print:max-w-none">
        <ReferralDocument no={record.id} values={toReferralInput(record)} parties={parties} issuer={issuer} />
      </A4Frame>
    </>
  )
}
