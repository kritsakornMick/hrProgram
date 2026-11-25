import dayjs from "dayjs"
import type { Metadata } from "next"
import { requirePageRole } from "@/lib/session"
import { ApplicantForm } from "../applicant-form"
import { ApplicantFormHeader } from "../form-header"
import { APPLICANT_EDITORS } from "../permissions"
import { emptyApplicant } from "../schema"

export const metadata: Metadata = { title: "เพิ่มใบสมัครงาน" }

export default async function NewApplicantPage() {
  await requirePageRole(APPLICANT_EDITORS)
  return (
    <>
      <ApplicantFormHeader
        crumb="เพิ่มใบสมัครงาน"
        title="ใบสมัครงาน : Application Form"
        description="โปรดกรอกข้อมูลให้ครบถ้วนและถูกต้อง เพื่อใช้ในการพิจารณาการรับเข้าทำงาน"
      />
      <ApplicantForm defaultValues={{ ...emptyApplicant, appliedAt: dayjs().format("YYYY-MM-DD") }} />
    </>
  )
}
