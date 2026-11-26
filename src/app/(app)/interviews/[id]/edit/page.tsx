import { Handshake } from "lucide-react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { auditView } from "@/lib/audit"
import { formatThaiDate } from "@/lib/dates"
import { db } from "@/lib/db"
import { requirePageRole } from "@/lib/session"
import { InterviewForm } from "../../interview-form"

export const metadata: Metadata = { title: "แก้ไขข้อมูลการสัมภาษณ์" }

function formatDateInput(date: Date | null) {
  if (!date) return ""
  return date.toISOString().slice(0, 10)
}

export default async function EditInterviewPage({ params }: PageProps<"/interviews/[id]/edit">) {
  const user = await requirePageRole(["admin", "hr"])
  const { id } = await params
  const interviewId = Number(id)
  if (!Number.isInteger(interviewId) || interviewId <= 0) notFound()

  const [interview, documentChecksRaw, companies, customers, staffList] = await Promise.all([
    db.interview.findUnique({
      where: { id: interviewId },
      include: {
        documentCheck: {
          include: {
            applicant: { select: { fullNameTh: true } },
          },
        },
        customer: { select: { companyId: true } },
      },
    }),
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

  if (!interview) notFound()

  // หน้าแก้ไขแสดงเลขบัญชีธนาคาร ต้องบันทึกประวัติการเข้าถึงข้อมูลส่วนบุคคล (PDPA)
  await auditView(user, "interview", interview.id)

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
        title="แก้ไขข้อมูลการสัมภาษณ์"
        description={interview.documentCheck.applicant.fullNameTh}
      />
      <InterviewForm
        interviewId={interview.id}
        documentChecks={documentChecks}
        companies={companies}
        customers={customers}
        staffList={staffList}
        defaultValues={{
          documentCheckId: String(interview.documentCheckId),
          companyFilterId: interview.customer?.companyId ? String(interview.customer.companyId) : "",
          customerId: interview.customerId ? String(interview.customerId) : "",
          staffId: interview.staffId ? String(interview.staffId) : "",
          interviewedAt: formatDateInput(interview.interviewedAt),
          result: interview.result ?? "",
          resultReason: interview.resultReason ?? "",
          employmentStatus: interview.employmentStatus ?? "",
          wageRate: interview.wageRate ? String(interview.wageRate) : "",
          position: interview.position ?? "",
          startDate: formatDateInput(interview.startDate),
          probationDays: interview.probationDays ? String(interview.probationDays) : "",
          probationStartDate: formatDateInput(interview.probationStartDate),
          probationEndDate: formatDateInput(interview.probationEndDate),
          evaluatedAt: formatDateInput(interview.evaluatedAt),
          evaluationResult: interview.evaluationResult ?? "",
          comment: interview.comment ?? "",
          bankName: interview.bankName ?? "",
          bankAccountNo: interview.bankAccountNo ?? "",
        }}
      />
    </div>
  )
}