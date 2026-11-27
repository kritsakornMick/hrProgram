import { FolderOpen } from "lucide-react"
import type { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { auditView } from "@/lib/audit"
import { DOCUMENT_TYPES } from "@/lib/menu"
import { requirePageRole } from "@/lib/session"
import {
  getApplicantDocumentData,
  isValidDocType,
  parseValidId,
  searchApplicantOptions,
} from "./data"
import type { DocumentTypeName } from "./document-templates"
import { DocumentsWorkspace } from "./documents-workspace"

export const metadata: Metadata = { title: "พิมพ์เอกสาร (12 แบบ)" }

export default async function DocumentsPage({ searchParams }: PageProps<"/documents">) {
  // เอกสารแนบท้ายแสดงเลขบัตรเต็มและเลขบัญชีธนาคาร จำกัดเฉพาะ admin และ hr (PDPA)
  const user = await requirePageRole(["admin", "hr"])
  const resolvedSearch = await searchParams

  const rawApplicantId = typeof resolvedSearch.applicantId === "string" ? resolvedSearch.applicantId : undefined
  const rawDoc = typeof resolvedSearch.doc === "string" ? resolvedSearch.doc : undefined
  const q = typeof resolvedSearch.q === "string" ? resolvedSearch.q : ""
  const appliedDate = typeof resolvedSearch.appliedDate === "string" ? resolvedSearch.appliedDate : ""
  const interviewDate = typeof resolvedSearch.interviewDate === "string" ? resolvedSearch.interviewDate : ""

  const initialDocType: DocumentTypeName = isValidDocType(rawDoc) ? rawDoc : DOCUMENT_TYPES[0]
  const parsedApplicantId = parseValidId(rawApplicantId)

  const [selectorOptions, selectedApplicantData] = await Promise.all([
    searchApplicantOptions({
      q,
      appliedDate,
      interviewDate,
      selectedId: parsedApplicantId,
    }),
    parsedApplicantId ? getApplicantDocumentData(parsedApplicantId) : Promise.resolve(null),
  ])

  if (selectedApplicantData) {
    await auditView(user, "applicant", selectedApplicantData.id)
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={FolderOpen} title="พิมพ์เอกสาร (12 แบบ)" description="เอกสารแนบท้ายใบสมัคร" />
      <DocumentsWorkspace
        applicants={selectorOptions}
        selectedApplicant={selectedApplicantData}
        initialDocType={initialDocType}
        initialQuery={q}
        initialAppliedDate={appliedDate}
        initialInterviewDate={interviewDate}
      />
    </div>
  )
}