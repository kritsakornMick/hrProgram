import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { audit } from "@/lib/audit"
import { db } from "@/lib/db"
import { requirePageRole } from "@/lib/session"
import { ApplicantForm } from "../../applicant-form"
import { ApplicantFormHeader } from "../../form-header"
import { toApplicantInput } from "../../mapping"
import { APPLICANT_EDITORS } from "../../permissions"

export const metadata: Metadata = { title: "แก้ไขใบสมัครงาน" }

export default async function EditApplicantPage({ params }: PageProps<"/applicants/[id]/edit">) {
  const user = await requirePageRole(APPLICANT_EDITORS)
  const { id } = await params
  const applicantId = Number(id)
  if (!Number.isInteger(applicantId) || applicantId <= 0) notFound()

  const applicant = await db.applicant.findUnique({ where: { id: applicantId } })
  if (!applicant) notFound()

  // เปิดดูข้อมูลส่วนบุคคล (เลขบัตร ประวัติคดี) ต้องบันทึกประวัติการเข้าถึง (PDPA)
  await audit(user, "view", "applicant", applicant.id)

  return (
    <>
      <ApplicantFormHeader
        crumb={`แก้ไขเลขที่ ${applicant.id}`}
        title={`ใบสมัครงาน เลขที่ ${applicant.id}`}
        description={applicant.fullNameTh}
      />
      {/* key: บันทึกร่างใบใหม่แล้วย้ายมาหน้านี้ ให้ฟอร์มเริ่มใหม่ด้วยค่าจากฐานข้อมูล */}
      <ApplicantForm key={applicant.id} applicantId={applicant.id} defaultValues={toApplicantInput(applicant)} />
    </>
  )
}
