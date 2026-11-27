import type { Metadata } from "next"
import { notFound } from "next/navigation"
import {
  getApplicantDocumentData,
  isValidDocType,
  parseValidId,
} from "@/app/(app)/documents/data"
import { DocumentPreviewSheet } from "@/app/(app)/documents/document-templates"
import { PrintToolbar } from "@/components/document/print-toolbar"
import { audit } from "@/lib/audit"
import { requirePageRole } from "@/lib/session"

export const metadata: Metadata = { title: "พิมพ์เอกสารแนบท้ายใบสมัคร" }

/**
 * หน้าพิมพ์เอกสารแนบท้ายใบสมัคร (กระดาษ A4 ขนาดจริง)
 * จำกัดสิทธิ์เฉพาะ admin / hr และบันทึก audit "export" ทุกครั้งที่เปิด (PDPA)
 */
export default async function PrintApplicantDocumentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const user = await requirePageRole(["admin", "hr"])
  const resolvedSearch = await searchParams

  const rawApplicantId = typeof resolvedSearch.applicantId === "string" ? resolvedSearch.applicantId : undefined
  const rawDoc = typeof resolvedSearch.doc === "string" ? resolvedSearch.doc : undefined
  const auto = typeof resolvedSearch.auto === "string" ? resolvedSearch.auto : undefined

  const applicantId = parseValidId(rawApplicantId)
  if (!applicantId || !isValidDocType(rawDoc)) notFound()

  const applicant = await getApplicantDocumentData(applicantId)
  if (!applicant) notFound()

  await audit(user, "export", "applicant", applicant.id, { document: rawDoc })

  const appCode = `APP-${String(applicant.id).padStart(4, "0")}`

  return (
    <>
      <PrintToolbar title={`${rawDoc} — ${appCode} ${applicant.fullNameTh}`} autoPrint={auto === "1"} />
      <DocumentPreviewSheet applicant={applicant} docType={rawDoc} mode="print" />
    </>
  )
}