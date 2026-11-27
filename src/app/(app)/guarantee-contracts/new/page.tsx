import { ArrowLeft, ShieldCheck } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { buttonVariants } from "@/components/ui/button"
import { toDateInput } from "@/lib/dates"
import { requirePageRole } from "@/lib/session"
import { getGuaranteeContractParties, getInterviewSelectOptions } from "../data"
import { GuaranteeContractForm } from "../guarantee-contract-form"
import { GUARANTEE_CONTRACT_EDITORS } from "../permissions"
import { createEmptyGuaranteeContract, parsePositiveInt } from "../schema"

export const metadata: Metadata = { title: "ทำสัญญาค้ำประกันบุคคลเข้าทำงาน" }

export default async function NewGuaranteeContractPage({
  searchParams,
}: PageProps<"/guarantee-contracts/new">) {
  await requirePageRole(GUARANTEE_CONTRACT_EDITORS)
  const { interviewId: interviewIdParam } = await searchParams
  const preselectedId = parsePositiveInt(interviewIdParam)

  const [interviewOptions, initialParties] = await Promise.all([
    getInterviewSelectOptions(preselectedId ?? undefined),
    preselectedId ? getGuaranteeContractParties(preselectedId) : Promise.resolve(null),
  ])

  const defaultValues = {
    ...createEmptyGuaranteeContract(toDateInput(new Date())),
    interviewId: initialParties ? String(initialParties.interviewId) : "",
  }

  return (
    <>
      <PageHeader
        icon={ShieldCheck}
        title="ทำสัญญาค้ำประกันบุคคลเข้าทำงาน"
        description="บันทึกข้อมูลผู้ค้ำประกันและผู้ถูกค้ำประกัน"
        actions={
          <Link href="/guarantee-contracts" className={buttonVariants({ variant: "ghost" })}>
            <ArrowLeft />
            กลับ
          </Link>
        }
      />
      <GuaranteeContractForm
        defaultValues={defaultValues}
        interviewOptions={interviewOptions}
        initialParties={initialParties}
      />
    </>
  )
}