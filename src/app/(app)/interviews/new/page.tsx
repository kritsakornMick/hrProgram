import { Handshake } from "lucide-react"
import type { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { formatThaiDate } from "@/lib/dates"
import { db } from "@/lib/db"
import { requirePageRole } from "@/lib/session"
import { InterviewForm } from "../interview-form"
import { emptyInterview } from "../schema"

export const metadata: Metadata = { title: "บันทึกผลการสัมภาษณ์" }

export default async function NewInterviewPage() {
  await requirePageRole(["admin", "hr"])

  const [documentChecksRaw, companies, customers, staffList] = await Promise.all([
    db.documentCheck.findMany({
      include: {
        applicant: {
          select: {
            fullNameTh: true,
            appliedAt: true,
            position: true,
            expectedSalary: true,
          },
        },
      },
      orderBy: { id: "desc" },
    }),
    db.company.findMany({
      select: { id: true, nameTh: true },
      orderBy: { id: "asc" },
    }),
    db.customer.findMany({
      select: { id: true, name: true, jobName: true, companyId: true },
      orderBy: { name: "asc" },
    }),
    db.staff.findMany({
      select: { id: true, name: true, position: true },
      orderBy: { name: "asc" },
    }),
  ])

  const documentChecks = documentChecksRaw.map((doc) => ({
    id: doc.id,
    applicantName: doc.applicant.fullNameTh,
    appliedAt: doc.applicant.appliedAt ? formatThaiDate(doc.applicant.appliedAt) : "-",
    appliedPosition: doc.applicant.position ?? "",
    expectedSalary: doc.applicant.expectedSalary ? Number(doc.applicant.expectedSalary).toLocaleString("th-TH") : "-",
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Handshake}
        title="บันทึกผลการสัมภาษณ์"
        description="กรอกรายละเอียดการสัมภาษณ์งาน สังกัดหน่วยงาน และการประเมินผู้สมัครงาน"
      />
      <InterviewForm
        documentChecks={documentChecks}
        companies={companies}
        customers={customers}
        staffList={staffList}
        defaultValues={emptyInterview}
      />
    </div>
  )
}