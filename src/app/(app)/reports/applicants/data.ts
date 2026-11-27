import "server-only"
import type { Prisma } from "@/generated/prisma/client"
import { formatThaiDate, parseDateInput, toDateInput } from "@/lib/dates"
import { db } from "@/lib/db"

/*
 * รายงานผู้สมัครทั้งหมด (#14) ตาม qry-rpt-ผู้สมัครงานทั้งหมด ใน Access
 * คอลัมน์: รหัสผู้สมัคร, วันที่สมัคร, คำนำหน้า-ชื่อ-สกุล, ตำแหน่งงาน, เงินเดือนที่ต้องการ
 * (เลขบัตร ที่อยู่ ผู้ค้ำ บัญชีธนาคาร อยู่ในรายงานผู้ประกันตน ไม่ใส่ที่นี่ ตามหลัก PDPA ใช้ข้อมูลเท่าที่จำเป็น)
 */

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
  appliedAt: true,
  fullNameTh: true,
  position: true,
  expectedSalary: true,
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
  code: string
  appliedAt: string
  fullNameTh: string
  position: string
  expectedSalary: string
}

const SALARY_FORMAT = new Intl.NumberFormat("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 })

/** รหัสผู้สมัครแบบเดียวกับหน้าอื่น เช่น APP-0012 */
export function applicantCode(id: number) {
  return `APP-${String(id).padStart(4, "0")}`
}

export function toApplicantReportValues(applicant: ApplicantReportRow): ApplicantReportValues {
  return {
    code: applicantCode(applicant.id),
    appliedAt: formatThaiDate(applicant.appliedAt),
    fullNameTh: applicant.fullNameTh,
    position: applicant.position ?? "-",
    expectedSalary: applicant.expectedSalary ? SALARY_FORMAT.format(applicant.expectedSalary.toNumber()) : "-",
  }
}
