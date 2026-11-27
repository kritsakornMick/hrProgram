import { ArrowLeft, ShieldCheck } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { buttonVariants } from "@/components/ui/button"
import { auditView } from "@/lib/audit"
import { db } from "@/lib/db"
import { requirePageRole } from "@/lib/session"
import { getGuaranteeContractParties, getInterviewSelectOptions, toGuaranteeContractInput } from "../../data"
import { GuaranteeContractForm } from "../../guarantee-contract-form"
import { GUARANTEE_CONTRACT_EDITORS } from "../../permissions"
import { parsePositiveInt } from "../../schema"

export const metadata: Metadata = { title: "แก้ไขสัญญาค้ำประกันบุคคลเข้าทำงาน" }

export default async function EditGuaranteeContractPage({ params }: PageProps<"/guarantee-contracts/[id]/edit">) {
  const user = await requirePageRole(GUARANTEE_CONTRACT_EDITORS)
  const { id } = await params
  const contractId = parsePositiveInt(id)
  if (!contractId) notFound()

  const record = await db.guaranteeContract.findUnique({ where: { id: contractId } })
  if (!record) notFound()

  const [interviewOptions, initialParties] = await Promise.all([
    getInterviewSelectOptions(record.interviewId),
    getGuaranteeContractParties(record.interviewId),
  ])

  await auditView(user, "guarantee_contract", record.id)

  return (
    <>
      <PageHeader
        icon={ShieldCheck}
        title={`แก้ไขสัญญาค้ำประกัน GC-${String(record.id).padStart(4, "0")}`}
        description="ปรับปรุงข้อมูลผู้ค้ำประกันบุคคลเข้าทำงาน"
        actions={
          <Link href="/guarantee-contracts" className={buttonVariants({ variant: "ghost" })}>
            <ArrowLeft />
            กลับ
          </Link>
        }
      />
      <GuaranteeContractForm
        recordId={record.id}
        defaultValues={toGuaranteeContractInput(record)}
        interviewOptions={interviewOptions}
        initialParties={initialParties}
      />
    </>
  )
}