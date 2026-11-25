import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { auditView } from "@/lib/audit"
import { db } from "@/lib/db"
import { requirePageRole } from "@/lib/session"
import { BackgroundCheckForm } from "../../background-check-form"
import { getDocumentParties, getInterviewOptions, toBackgroundCheckInput } from "../../data"
import { BackgroundCheckFormHeader } from "../../form-header"
import { BACKGROUND_CHECK_EDITORS } from "../../permissions"

export const metadata: Metadata = { title: "แก้ไขหนังสือมอบอำนาจ" }

export default async function EditBackgroundCheckPage({ params }: PageProps<"/background-checks/[id]/edit">) {
  const user = await requirePageRole(BACKGROUND_CHECK_EDITORS)
  const { id } = await params
  const recordId = Number(id)
  if (!Number.isInteger(recordId) || recordId <= 0) notFound()

  const record = await db.backgroundCheckAuthorization.findUnique({ where: { id: recordId } })
  if (!record) notFound()

  const [parties, interviewOptions] = await Promise.all([getDocumentParties(record.interviewId), getInterviewOptions()])

  // หนังสือมีเลขบัตรและที่อยู่ของผู้สมัคร ต้องบันทึกประวัติการเปิดดู (PDPA)
  await auditView(user, "background_check", record.id)

  return (
    <>
      <BackgroundCheckFormHeader
        crumb={`เลขที่ ${record.id}`}
        title={`หนังสือมอบอำนาจ เลขที่ ${record.id}`}
        description={parties?.grantor.fullName}
      />
      <BackgroundCheckForm
        key={record.id}
        recordId={record.id}
        defaultValues={toBackgroundCheckInput(record)}
        interviewOptions={interviewOptions}
        initialParties={parties}
      />
    </>
  )
}
