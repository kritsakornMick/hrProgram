import { ArrowLeft, ShieldCheck } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { buttonVariants } from "@/components/ui/button"
import { auditView } from "@/lib/audit"
import { toDateInput } from "@/lib/dates"
import { db } from "@/lib/db"
import { requirePageRole } from "@/lib/session"
import { getGuaranteeContractParties, getInterviewSelectOptions } from "../../data"
import { GuaranteeContractForm } from "../../guarantee-contract-form"
import { GUARANTEE_CONTRACT_EDITORS } from "../../permissions"

export const metadata: Metadata = { title: "แก้ไขสัญญาค้ำประกันบุคคลเข้าทำงาน" }

const MAX_PG_INT = 2_147_483_647

export default async function EditGuaranteeContractPage({ params }: PageProps<"/guarantee-contracts/[id]/edit">) {
  const user = await requirePageRole(GUARANTEE_CONTRACT_EDITORS)
  const { id } = await params
  const contractId = Number(id)
  if (!Number.isInteger(contractId) || contractId <= 0 || contractId > MAX_PG_INT) notFound()

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
        defaultValues={{
          interviewId: String(record.interviewId),
          contractDate: toDateInput(record.contractDate) || toDateInput(new Date()),
          guarantorName: record.guarantorName ?? "",
          guarantorAge: record.guarantorAge !== null ? String(record.guarantorAge) : "",
          guarantorNationalId: record.guarantorNationalId ?? "",
          addressNo: record.addressNo ?? "",
          moo: record.moo ?? "",
          road: record.road ?? "",
          subdistrict: record.subdistrict ?? "",
          district: record.district ?? "",
          province: record.province ?? "",
          guarantorPhone: record.guarantorPhone ?? "",
        }}
        interviewOptions={interviewOptions}
        initialParties={initialParties}
      />
    </>
  )
}