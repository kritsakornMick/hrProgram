import { FileCheck2 } from "lucide-react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { auditView } from "@/lib/audit"
import { formatThaiDate, toDateInput } from "@/lib/dates"
import { db } from "@/lib/db"
import { requirePageRole } from "@/lib/session"
import { DocumentCheckForm } from "../../document-check-form"

export const metadata: Metadata = { title: "แก้ไขแบบตรวจเอกสารสมัครงาน" }

export default async function EditDocumentCheckPage({ params }: PageProps<"/document-checks/[id]/edit">) {
  const user = await requirePageRole(["admin", "hr"])
  const { id } = await params
  const documentCheckId = Number(id)
  if (!Number.isInteger(documentCheckId) || documentCheckId <= 0) notFound()

  const [record, applicants, staffList] = await Promise.all([
    db.documentCheck.findUnique({ where: { id: documentCheckId } }),
    db.applicant.findMany({
      orderBy: { id: "desc" },
      select: { id: true, fullNameTh: true, position: true, appliedAt: true },
    }),
    db.staff.findMany({
      orderBy: [{ code: "asc" }, { name: "asc" }],
      select: { id: true, code: true, name: true, position: true },
    }),
  ])

  if (!record) notFound()

  await auditView(user, "document_check", record.id)

  return (
    <>
      <PageHeader
        icon={FileCheck2}
        title={`แก้ไขแบบตรวจเอกสาร DC-${String(record.id).padStart(4, "0")}`}
        description="ปรับปรุงรายการเอกสารที่ตรวจหรือสถานะความครบถ้วน"
      />
      <DocumentCheckForm
        documentCheckId={record.id}
        defaultValues={{
          applicantId: String(record.applicantId),
          checkedById: record.checkedById ? String(record.checkedById) : "",
          checkedAt: toDateInput(record.checkedAt) || toDateInput(new Date()),
          hasPhoto: record.hasPhoto,
          hasIdCard: record.hasIdCard,
          hasHouseRegistration: record.hasHouseRegistration,
          hasEducationCert: record.hasEducationCert,
          hasCarLicense: record.hasCarLicense,
          carLicenseType: record.carLicenseType ?? "",
          hasMotorcycleLicense: record.hasMotorcycleLicense,
          hasDisabilityCard: record.hasDisabilityCard,
          hasMilitaryDoc: record.hasMilitaryDoc,
          hasOther: record.hasOther,
          isComplete: record.isComplete,
          comment: record.comment ?? "",
        }}
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