import "server-only"
import type { Prisma } from "@/generated/prisma/client"
import { formatThaiDate, parseDateInput, toDateInput } from "@/lib/dates"
import { db } from "@/lib/db"

export const APPLICANT_REPORT_PAGE_SIZE = 20

export type ApplicantReportSearchParams = {
  q?: string | string[]
  from?: string | string[]
  to?: string | string[]
  page?: string | string[]
}

export type ApplicantReportFilters = {
  query: string
  from: string
  to: string
  fromDate: Date | null
  toDate: Date | null
  page: number
  errors: string[]
}

const applicantReportSelect = {
  id: true,
  position: true,
  nationalId: true,
  fullNameTh: true,
  birthDate: true,
  mobilePhone: true,
  addressNo: true,
  moo: true,
  road: true,
  subdistrict: true,
  district: true,
  province: true,
  educationLevel: true,
  documentChecks: {
    orderBy: { id: "desc" },
    take: 1,
    select: {
      interviews: {
        orderBy: { id: "desc" },
        take: 1,
        select: {
          startDate: true,
          bankName: true,
          bankAccountNo: true,
          guaranteeContracts: {
            orderBy: { id: "desc" },
            take: 1,
            select: {
              guarantorName: true,
              guarantorPhone: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.ApplicantSelect

function getSingleValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : ""
}

function parseDate(value: string, label: string, errors: string[]) {
  if (!value) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    errors.push(`รูปแบบ${label}ไม่ถูกต้อง`)
    return null
  }

  const date = parseDateInput(value)
  if (!date || toDateInput(date) !== value) {
    errors.push(`${label}ไม่ถูกต้อง`)
    return null
  }

  return date
}

export function parseApplicantReportFilters(params: ApplicantReportSearchParams): ApplicantReportFilters {
  const query = getSingleValue(params.q).trim()
  const from = getSingleValue(params.from)
  const to = getSingleValue(params.to)
  const pageValue = Number(getSingleValue(params.page))
  const page = Number.isSafeInteger(pageValue) && pageValue > 0 ? pageValue : 1
  const errors: string[] = []

  if (query.length > 100) errors.push("คำค้นหาต้องไม่เกิน 100 ตัวอักษร")

  const fromDate = parseDate(from, "วันที่เริ่มต้น", errors)
  const toDate = parseDate(to, "วันที่สิ้นสุด", errors)

  if (fromDate && toDate && fromDate > toDate) {
    errors.push("วันที่เริ่มต้นต้องไม่อยู่หลังวันที่สิ้นสุด")
  }

  return { query, from, to, fromDate, toDate, page, errors }
}

export function buildApplicantReportWhere(filters: ApplicantReportFilters): Prisma.ApplicantWhereInput {
  const normalizedQuery = filters.query.replace(/[\s-]/g, "")
  const applicantCode = /^app-0*(\d+)$/i.exec(filters.query)
  const numericIdValue = applicantCode?.[1] ?? normalizedQuery
  const numericId = /^\d+$/.test(numericIdValue) ? Number(numericIdValue) : null
  const canSearchById = numericId !== null && Number.isSafeInteger(numericId) && numericId > 0 && numericId <= 2_147_483_647

  return {
    isDraft: false,
    ...(filters.fromDate || filters.toDate
      ? {
          appliedAt: {
            ...(filters.fromDate ? { gte: filters.fromDate } : {}),
            ...(filters.toDate ? { lte: filters.toDate } : {}),
          },
        }
      : {}),
    ...(filters.query
      ? {
          OR: [
            { fullNameTh: { contains: filters.query, mode: "insensitive" as const } },
            { fullNameEn: { contains: filters.query, mode: "insensitive" as const } },
            { position: { contains: filters.query, mode: "insensitive" as const } },
            ...(normalizedQuery ? [{ nationalId: { contains: normalizedQuery } }, { mobilePhone: { contains: normalizedQuery } }] : []),
            ...(canSearchById ? [{ id: numericId }] : []),
          ],
        }
      : {}),
  }
}

export async function getApplicantReportRows(where: Prisma.ApplicantWhereInput, page?: number) {
  return db.applicant.findMany({
    where,
    orderBy: [{ appliedAt: "desc" }, { id: "desc" }],
    ...(page
      ? {
          skip: (page - 1) * APPLICANT_REPORT_PAGE_SIZE,
          take: APPLICANT_REPORT_PAGE_SIZE,
        }
      : {}),
    select: applicantReportSelect,
  })
}

export async function countApplicantReportRows(where: Prisma.ApplicantWhereInput) {
  return db.applicant.count({ where })
}

export type ApplicantReportRow = Awaited<ReturnType<typeof getApplicantReportRows>>[number]

export type ApplicantReportValues = {
  position: string
  nationalId: string
  fullNameTh: string
  birthDate: string
  startDate: string
  mobilePhone: string
  address: string
  educationLevel: string
  guarantorName: string
  guarantorPhone: string
  bankName: string
  bankAccountNo: string
}

export function toApplicantReportValues(applicant: ApplicantReportRow): ApplicantReportValues {
  const interview = applicant.documentChecks[0]?.interviews[0]
  const guarantor = interview?.guaranteeContracts[0]
  const address = [
    applicant.addressNo,
    applicant.moo ? `หมู่ ${applicant.moo}` : null,
    applicant.road ? `ถนน${applicant.road}` : null,
    applicant.subdistrict ? `ต.${applicant.subdistrict}` : null,
    applicant.district ? `อ.${applicant.district}` : null,
    applicant.province ? `จ.${applicant.province}` : null,
  ]
    .filter((part): part is string => Boolean(part?.trim()))
    .join(" ")

  return {
    position: applicant.position ?? "-",
    nationalId: applicant.nationalId ?? "-",
    fullNameTh: applicant.fullNameTh,
    birthDate: formatThaiDate(applicant.birthDate),
    startDate: formatThaiDate(interview?.startDate),
    mobilePhone: applicant.mobilePhone ?? "-",
    address: address || "-",
    educationLevel: applicant.educationLevel ?? "-",
    guarantorName: guarantor?.guarantorName ?? "-",
    guarantorPhone: guarantor?.guarantorPhone ?? "-",
    bankName: interview?.bankName ?? "-",
    bankAccountNo: interview?.bankAccountNo ?? "-",
  }
}
