import { FileCheck2 } from "lucide-react"
import type { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { formatThaiDate, toDateInput } from "@/lib/dates"
import { db } from "@/lib/db"
import { requirePageRole } from "@/lib/session"
import { DocumentCheckForm } from "../document-check-form"
import { createEmptyDocumentCheck } from "../schema"

export const metadata: Metadata = { title: "เพิ่มแบบตรวจเอกสารสมัครงาน" }

export default async function NewDocumentCheckPage() {
  const user = await requirePageRole(["admin", "hr"])

  const [applicants, staffList, currentStaff] = await Promise.all([
    db.applicant.findMany({
      orderBy: { id: "desc" },
      select: { id: true, fullNameTh: true, position: true, appliedAt: true },
    }),
    db.staff.findMany({
      orderBy: [{ code: "asc" }, { name: "asc" }],
      select: { id: true, code: true, name: true, position: true },
    }),
    db.staff.findUnique({
      where: { userId: user.id },
      select: { id: true },
    }),
  ])

  const defaultValues = createEmptyDocumentCheck(toDateInput(new Date()))
  if (currentStaff) {
    defaultValues.checkedById = String(currentStaff.id)
  }

  return (
    <>
      <PageHeader
        icon={FileCheck2}
        title="เพิ่มแบบตรวจเอกสารสมัครงาน"
        description="บันทึกผลการตรวจสอบเอกสารประกอบการสมัครงานของผู้สมัคร"
      />
      <DocumentCheckForm
        defaultValues={defaultValues}
        applicants={applicants.map((a) => ({
          id: a.id,
          fullNameTh: a.fullNameTh,
          position: a.position,
          appliedAtLabel: formatThaiDate(a.appliedAt),
        }))}
        staffList={staffList}
      />
    </>
  )
}