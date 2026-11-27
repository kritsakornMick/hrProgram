import "server-only"
import { getDocumentParties, toBackgroundCheckInput } from "@/app/(app)/background-checks/data"
import { getReferralParties, toReferralInput } from "@/app/(app)/interview-referrals/data"
import { db } from "@/lib/db"
import { DOCUMENT_TYPES } from "@/lib/menu"
import type { DocumentTypeName, FullApplicantDocumentData } from "./document-templates"

export const MAX_INT4 = 2_147_483_647
export const APPLICANT_OPTION_LIMIT = 50

/** ตรวจเลข ID ว่าเป็นจำนวนเต็มบวกไม่เกิน INT4 ของ PostgreSQL (กัน Error 500) */
export function parseValidId(raw: string | undefined): number | null {
  if (!raw || !/^\d+$/.test(raw)) return null
  const num = Number(raw)
  if (!Number.isInteger(num) || num <= 0 || num > MAX_INT4) return null
  return num
}

export function isValidDocType(value: string | undefined): value is DocumentTypeName {
  return Boolean(value && (DOCUMENT_TYPES as readonly string[]).includes(value))
}

export type ApplicantSelectorOption = {
  id: number
  fullNameTh: string
  position: string | null
  appliedAtIso: string
  interviewedAtIso: string | null
}

/**
 * ดึงรายชื่อผู้สมัครสำหรับ Dropdown แบบจำกัดจำนวน (ไม่โหลดทั้งหมดทีเดียว)
 * กรองเฉพาะใบสมัครที่ส่งแล้ว (isDraft: false)
 */
export async function searchApplicantOptions(params: {
  q?: string
  appliedDate?: string
  interviewDate?: string
  selectedId?: number | null
}): Promise<ApplicantSelectorOption[]> {
  const q = params.q?.trim() ?? ""
  const codeMatch = /^app-0*(\d+)$/i.exec(q)
  const numericId = codeMatch ? parseValidId(codeMatch[1]) : parseValidId(q)

  const appliedRange =
    params.appliedDate && /^\d{4}-\d{2}-\d{2}$/.test(params.appliedDate)
      ? {
          gte: new Date(`${params.appliedDate}T00:00:00.000Z`),
          lte: new Date(`${params.appliedDate}T23:59:59.999Z`),
        }
      : undefined

  const interviewRange =
    params.interviewDate && /^\d{4}-\d{2}-\d{2}$/.test(params.interviewDate)
      ? {
          gte: new Date(`${params.interviewDate}T00:00:00.000Z`),
          lte: new Date(`${params.interviewDate}T23:59:59.999Z`),
        }
      : undefined

  const rows = await db.applicant.findMany({
    where: {
      isDraft: false,
      ...(appliedRange ? { appliedAt: appliedRange } : {}),
      ...(interviewRange
        ? {
            documentChecks: {
              some: {
                interviews: {
                  some: { interviewedAt: interviewRange },
                },
              },
            },
          }
        : {}),
      ...(q
        ? {
            OR: [
              { fullNameTh: { contains: q, mode: "insensitive" } },
              { position: { contains: q, mode: "insensitive" } },
              ...(numericId ? [{ id: numericId }] : []),
            ],
          }
        : {}),
    },
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
    take: APPLICANT_OPTION_LIMIT,
  })

  // กรณีเลือกผู้สมัครที่อยู่นอก 50 รายการล่าสุด ให้ดึงชื่อคนนั้นติดมาด้วยเพื่อไม่ให้ค่าใน Dropdown หาย
  if (params.selectedId && !rows.some((r) => r.id === params.selectedId)) {
    const selectedRow = await db.applicant.findFirst({
      where: { id: params.selectedId, isDraft: false },
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
    })
    if (selectedRow) {
      rows.unshift(selectedRow)
    }
  }

  return rows.map((app) => {
    const latestInterview = app.documentChecks[0]?.interviews[0]
    return {
      id: app.id,
      fullNameTh: app.fullNameTh,
      position: app.position,
      appliedAtIso: app.appliedAt.toISOString().slice(0, 10),
      interviewedAtIso: latestInterview?.interviewedAt ? latestInterview.interviewedAt.toISOString().slice(0, 10) : null,
    }
  })
}

/** ดึงข้อมูลผู้สมัคร 1 ราย (เฉพาะใบสมัครที่ส่งแล้ว isDraft: false) พร้อมข้อมูลเอกสารทั้ง 12 แบบ */
export async function getApplicantDocumentData(applicantId: number): Promise<FullApplicantDocumentData | null> {
  const [applicant, defaultCompany] = await Promise.all([
    db.applicant.findFirst({
      where: { id: applicantId, isDraft: false },
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
                  include: { issuedBy: { select: { name: true, position: true } } },
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

  if (!applicant) return null

  const docCheck = applicant.documentChecks[0] ?? null
  const interview = docCheck?.interviews[0] ?? null

  // ดึง parties จาก helper ของหน้า background-checks และ interview-referrals โดยตรง
  const [bgParties, refParties] = interview
    ? await Promise.all([getDocumentParties(interview.id), getReferralParties(interview.id)])
    : [null, null]

  const bgRow = interview?.backgroundChecks[0] ?? null
  const refRow = interview?.interviewReferrals[0] ?? null

  return {
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
          backgroundCheckDoc: bgRow
            ? {
                no: bgRow.id,
                values: toBackgroundCheckInput(bgRow),
                parties: bgParties,
              }
            : bgParties
              ? {
                  no: null,
                  values: {
                    interviewId: String(interview.id),
                    documentDate: "",
                    grantorIdIssuedBy: "",
                    granteeName: "",
                    granteeNationalId: "",
                    granteeIdIssuedBy: "",
                    granteeIdExpiresAt: "",
                    effectiveDate: "",
                    purpose: "",
                  },
                  parties: bgParties,
                }
              : null,
          interviewReferralDoc: refRow
            ? {
                no: refRow.id,
                values: toReferralInput(refRow),
                parties: refParties,
                issuer: refRow.issuedBy
                  ? { name: refRow.issuedBy.name, position: refRow.issuedBy.position ?? "" }
                  : null,
              }
            : refParties
              ? {
                  no: null,
                  values: {
                    interviewId: String(interview.id),
                    letterNo: "",
                    documentDate: "",
                    addressedTo: "",
                    issuedById: "",
                  },
                  parties: refParties,
                  issuer: null,
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