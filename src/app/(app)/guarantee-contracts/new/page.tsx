import { ArrowLeft, ShieldCheck } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { buttonVariants } from "@/components/ui/button"
import { toDateInput } from "@/lib/dates"
import { requirePageRole } from "@/lib/session"
import { getInterviewSelectOptions } from "../data"
import { GuaranteeContractForm } from "../guarantee-contract-form"
import { GUARANTEE_CONTRACT_EDITORS } from "../permissions"
import { createEmptyGuaranteeContract } from "../schema"

export const metadata: Metadata = { title: "ทำสัญญาค้ำประกันบุคคลเข้าทำงาน" }

export default async function NewGuaranteeContractPage() {
  await requirePageRole(GUARANTEE_CONTRACT_EDITORS)
  const interviewOptions = await getInterviewSelectOptions()

  return (
    <>
      <PageHeader
        icon={ShieldCheck}
        title="ทำสัญญาค้ำประกันบุคคลเข้าทำงาน"
        description="บันทึกข้อมูลผู้ค้ำประกันบุคคลเข้าทำงาน"
        actions={
          <Link href="/guarantee-contracts" className={buttonVariants({ variant: "ghost" })}>
            <ArrowLeft />
            กลับ
          </Link>
        }
      />
      <GuaranteeContractForm
        defaultValues={createEmptyGuaranteeContract(toDateInput(new Date()))}
        interviewOptions={interviewOptions}
        initialParties={null}
      />
    </>
  )
}