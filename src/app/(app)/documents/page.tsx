import { FolderOpen } from "lucide-react"
import type { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { auditView } from "@/lib/audit"
import { db } from "@/lib/db"
import { DOCUMENT_TYPES } from "@/lib/menu"
import { requirePageRole } from "@/lib/session"
import type { DocumentTypeName, FullApplicantDocumentData } from "./document-templates"
import { DocumentsWorkspace } from "./documents-workspace"

export const metadata: Metadata = { title: "พิมพ์เอกสาร (12 แบบ)" }

function isValidDocType(value: string | undefined): value is DocumentTypeName {
  return Boolean(value && (DOCUMENT_TYPES as readonly string[]).includes(value))
}

export default async function DocumentsPage({ searchParams }: PageProps<"/documents">) {
  const user = await requirePageRole(["admin", "hr", "viewer"])
  const resolvedSearch = await searchParams
  const rawApplicantId = typeof resolvedSearch.applicantId === "string" ? resolvedSearch.applicantId : undefined
  const rawDoc = typeof resolvedSearch.doc === "string" ? resolvedSearch.doc : undefined
  const initialDocType: DocumentTypeName = isValidDocType(rawDoc) ? rawDoc : DOCUMENT_TYPES[0]

  const parsedApplicantId = rawApplicantId && /^\d+$/.test(rawApplicantId) ? Number.parseInt(rawApplicantId, 10) : null

  const applicantsList = await db.applicant.findMany({
    where: { isDraft: false },
    select: {
      id: true,
      fullNameTh: true,
      position: true,
      appliedAt: true,
      documentChecks: {
        orderBy: { id: "desc" },
        take: 1,
        select: {
          interviews: {
            orderBy: { id: "desc" },
            take: 1,
            select: { interviewedAt: true },
          },
        },
      },
    },
    orderBy: { id: "desc" },
  })

  const selectorOptions = applicantsList.map((app) => {
    const latestInterview = app.documentChecks[0]?.interviews[0]
    return {
      id: app.id,
      fullNameTh: app.fullNameTh,
      position: app.position,
      appliedAtIso: app.appliedAt.toISOString().slice(0, 10),
      interviewedAtIso: latestInterview?.interviewedAt ? latestInterview.interviewedAt.toISOString().slice(0, 10) : null,
      hasInterview: Boolean(latestInterview),
    }
  })

  let selectedApplicantData: FullApplicantDocumentData | null = null

  if (parsedApplicantId && parsedApplicantId > 0) {
    const [applicant, defaultCompany] = await Promise.all([
      db.applicant.findUnique({
        where: { id: parsedApplicantId },
        include: {
          documentChecks: {
            orderBy: { id: "desc" },
            take: 1,
            include: {
              checkedBy: { select: { name: true } },
              interviews: {
                orderBy: { id: "desc" },
                take: 1,
                include: {
                  customer: {
                    include: {
                      company: true,
                    },
                  },
                  staff: { select: { name: true } },
                  employmentContracts: { orderBy: { id: "desc" }, take: 1 },
                  backgroundChecks: { orderBy: { id: "desc" }, take: 1 },
                  interviewReferrals: {
                    orderBy: { id: "desc" },
                    take: 1,
                    include: { issuedBy: { select: { name: true } } },
                  },
                  assignmentLetters: {
                    orderBy: { id: "desc" },
                    take: 1,
                    include: { issuedBy: { select: { name: true } } },
                  },
                  guaranteeContracts: { orderBy: { id: "desc" }, take: 1 },
                },
              },
            },
          },
        },
      }),
      db.company.findFirst({
        orderBy: { id: "asc" },
        select: { nameTh: true, address: true, phone: true, taxId: true },
      }),
    ])

    if (applicant) {
      // เอกสารแนบท้ายใบสมัครแสดงเลขบัตรประชาชนและเลขบัญชีธนาคาร ต้องบันทึก auditView (PDPA)
      await auditView(user, "applicant", applicant.id)

      const docCheck = applicant.documentChecks[0] ?? null
      const interview = docCheck?.interviews[0] ?? null

      selectedApplicantData = {
        id: applicant.id,
        appliedAt: applicant.appliedAt,
        position: applicant.position,
        expectedSalary: applicant.expectedSalary ? String(applicant.expectedSalary) : null,
        fullNameTh: applicant.fullNameTh,
        fullNameEn: applicant.fullNameEn,
        nationalId: applicant.nationalId,
        idCardIssuedAt: applicant.idCardIssuedAt,
        idCardExpiresAt: applicant.idCardExpiresAt,
        birthDate: applicant.birthDate,
        weightKg: applicant.weightKg ? String(applicant.weightKg) : null,
        heightCm: applicant.heightCm ? String(applicant.heightCm) : null,
        ethnicity: applicant.ethnicity,
        nationality: applicant.nationality,
        religion: applicant.religion,
        addressNo: applicant.addressNo,
        moo: applicant.moo,
        road: applicant.road,
        subdistrict: applicant.subdistrict,
        district: applicant.district,
        province: applicant.province,
        homePhone: applicant.homePhone,
        mobilePhone: applicant.mobilePhone,
        maritalStatus: applicant.maritalStatus,
        spouseName: applicant.spouseName,
        militaryStatus: applicant.militaryStatus,
        educationLevel: applicant.educationLevel,
        lastInstitution: applicant.lastInstitution,
        major: applicant.major,
        gpa: applicant.gpa ? String(applicant.gpa) : null,
        graduationYear: applicant.graduationYear,
        lastEmployer: applicant.lastEmployer,
        lastPosition: applicant.lastPosition,
        lastSalary: applicant.lastSalary ? String(applicant.lastSalary) : null,
        leavingReason: applicant.leavingReason,
        emergencyContactName: applicant.emergencyContactName,
        emergencyContactRelation: applicant.emergencyContactRelation,
        emergencyContactPhone: applicant.emergencyContactPhone,
        hasCriminalRecord: applicant.hasCriminalRecord,
        criminalRecordDetail: applicant.criminalRecordDetail,
        consentCriminalCheck: applicant.consentCriminalCheck,
        consentHealthCheck: applicant.consentHealthCheck,
        consentIdentity: applicant.consentIdentity,
        consentReference: applicant.consentReference,
        latestDocCheck: docCheck
          ? {
              id: docCheck.id,
              checkedAt: docCheck.checkedAt,
              hasPhoto: docCheck.hasPhoto,
              hasIdCard: docCheck.hasIdCard,
              hasHouseRegistration: docCheck.hasHouseRegistration,
              hasEducationCert: docCheck.hasEducationCert,
              hasCarLicense: docCheck.hasCarLicense,
              carLicenseType: docCheck.carLicenseType,
              hasMotorcycleLicense: docCheck.hasMotorcycleLicense,
              hasDisabilityCard: docCheck.hasDisabilityCard,
              hasMilitaryDoc: docCheck.hasMilitaryDoc,
              hasOther: docCheck.hasOther,
              isComplete: docCheck.isComplete,
              comment: docCheck.comment,
              checkedByName: docCheck.checkedBy?.name ?? null,
            }
          : null,
        latestInterview: interview
          ? {
              id: interview.id,
              interviewedAt: interview.interviewedAt,
              result: interview.result,
              employmentStatus: interview.employmentStatus,
              wageRate: interview.wageRate ? String(interview.wageRate) : null,
              position: interview.position,
              startDate: interview.startDate,
              probationStartDate: interview.probationStartDate,
              probationEndDate: interview.probationEndDate,
              probationDays: interview.probationDays,
              bankName: interview.bankName,
              bankAccountNo: interview.bankAccountNo,
              customerName: interview.customer?.name ?? null,
              customerJobName: interview.customer?.jobName ?? null,
              customerAddress: interview.customer?.address ?? null,
              companyNameTh: interview.customer?.company?.nameTh ?? null,
              companyAddress: interview.customer?.company?.address ?? null,
              companyPhone: interview.customer?.company?.phone ?? null,
              companyTaxId: interview.customer?.company?.taxId ?? null,
              interviewerName: interview.staff?.name ?? null,
              employmentContract: interview.employmentContracts[0]
                ? {
                    id: interview.employmentContracts[0].id,
                    contractDate: interview.employmentContracts[0].contractDate,
                  }
                : null,
              backgroundCheck: interview.backgroundChecks[0] ?? null,
              interviewReferral: interview.interviewReferrals[0]
                ? {
                    id: interview.interviewReferrals[0].id,
                    letterNo: interview.interviewReferrals[0].letterNo,
                    documentDate: interview.interviewReferrals[0].documentDate,
                    addressedTo: interview.interviewReferrals[0].addressedTo,
                    issuedByName: interview.interviewReferrals[0].issuedBy?.name ?? null,
                  }
                : null,
              assignmentLetter: interview.assignmentLetters[0]
                ? {
                    id: interview.assignmentLetters[0].id,
                    letterNo: interview.assignmentLetters[0].letterNo,
                    documentDate: interview.assignmentLetters[0].documentDate,
                    addressedTo: interview.assignmentLetters[0].addressedTo,
                    issuedByName: interview.assignmentLetters[0].issuedBy?.name ?? null,
                  }
                : null,
              guaranteeContract: interview.guaranteeContracts[0] ?? null,
            }
          : null,
        defaultCompany,
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <PageHeader icon={FolderOpen} title="พิมพ์เอกสาร (12 แบบ)" description="เอกสารแนบท้ายใบสมัคร" />
      </div>
      <DocumentsWorkspace
        applicants={selectorOptions}
        selectedApplicant={selectedApplicantData}
        initialDocType={initialDocType}
      />
    </div>
  )
}