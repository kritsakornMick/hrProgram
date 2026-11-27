import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getGuaranteeContractParties, toGuaranteeContractInput } from "@/app/(app)/guarantee-contracts/data"
import { GuaranteeContractDocument } from "@/app/(app)/guarantee-contracts/guarantee-contract-document"
import { GUARANTEE_CONTRACT_EDITORS } from "@/app/(app)/guarantee-contracts/permissions"
import { parsePositiveInt } from "@/app/(app)/guarantee-contracts/schema"
import { A4Frame } from "@/components/document/a4-sheet"
import { PrintToolbar } from "@/components/document/print-toolbar"
import { audit } from "@/lib/audit"
import { db } from "@/lib/db"
import { requirePageRole } from "@/lib/session"

export const metadata: Metadata = { title: "พิมพ์สัญญาค้ำประกันบุคคลเข้าทำงาน" }

/**
 * หน้าพิมพ์สัญญาค้ำประกันบุคคลเข้าทำงาน (กระดาษ A4 ขนาดจริง)
 * ใช้ข้อมูลที่บันทึกแล้วเท่านั้น และบันทึก audit "export" ทุกครั้งที่เปิด (มีเลขบัตรเต็ม = PDPA)
 * ?auto=1 เปิดหน้าต่างพิมพ์ให้เอง
 */
export default async function PrintGuaranteeContractPage({
  params,
  searchParams,
}: PageProps<"/guarantee-contracts/[id]/print">) {
  const user = await requirePageRole(GUARANTEE_CONTRACT_EDITORS)
  const { id } = await params
  const { auto } = await searchParams
  const recordId = parsePositiveInt(id)
  if (!recordId) notFound()

  const record = await db.guaranteeContract.findUnique({ where: { id: recordId } })
  if (!record) notFound()
  const parties = await getGuaranteeContractParties(record.interviewId)

  await audit(user, "export", "guarantee_contract", record.id, { document: "guarantee_contract" })

  return (
    <>
      <PrintToolbar
        title={`สัญญาค้ำประกันบุคคลเข้าทำงาน GC-${String(record.id).padStart(4, "0")}`}
        autoPrint={auto === "1"}
      />
      {/* กว้าง 210 มม. (ขนาดจริง) จอแคบย่อให้พอดี ตอนพิมพ์เป็นขนาดจริงเสมอ */}
      <A4Frame className="mx-auto w-[210mm] max-w-[calc(100vw-2rem)] print:w-auto print:max-w-none">
        <GuaranteeContractDocument no={record.id} values={toGuaranteeContractInput(record)} parties={parties} />
      </A4Frame>
    </>
  )
}