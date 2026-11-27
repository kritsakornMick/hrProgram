import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { auditView } from "@/lib/audit"
import { db } from "@/lib/db"
import { requirePageRole } from "@/lib/session"
import { getInterviewOptions, getReferralParties, getStaffOptions, toReferralInput } from "../../data"
import { ReferralFormHeader } from "../../form-header"
import { REFERRAL_EDITORS } from "../../permissions"
import { ReferralForm } from "../../referral-form"

export const metadata: Metadata = { title: "แก้ไขหนังสือส่งตัวเพื่อเข้าสัมภาษณ์" }

export default async function EditReferralPage({ params }: PageProps<"/interview-referrals/[id]/edit">) {
  const user = await requirePageRole(REFERRAL_EDITORS)
  const { id } = await params
  const recordId = Number(id)
  if (!Number.isInteger(recordId) || recordId <= 0 || recordId > 2_147_483_647) notFound()

  const record = await db.interviewReferralLetter.findUnique({ where: { id: recordId } })
  if (!record) notFound()

  const [parties, interviewOptions, staffOptions] = await Promise.all([
    getReferralParties(record.interviewId),
    getInterviewOptions(),
    getStaffOptions(),
  ])

  // หนังสือมีเลขบัตรและที่อยู่ของผู้สมัคร ต้องบันทึกประวัติการเปิดดู (PDPA)
  await auditView(user, "interview_referral", record.id)

  return (
    <>
      <ReferralFormHeader
        crumb={`ลำดับที่ ${record.id}`}
        title={`หนังสือส่งตัว ลำดับที่ ${record.id}`}
        description={parties?.employee.fullName}
      />
      <ReferralForm
        key={record.id}
        recordId={record.id}
        defaultValues={toReferralInput(record)}
        interviewOptions={interviewOptions}
        staffOptions={staffOptions}
        initialParties={parties}
      />
    </>
  )
}
