import "server-only"
import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat"
import utc from "dayjs/plugin/utc"
import type { Prisma } from "@/generated/prisma/client"
import { toDateInput } from "@/lib/dates"
import { db } from "@/lib/db"

dayjs.extend(customParseFormat)
dayjs.extend(utc)

export const INSURED_REPORT_ROLES = ["admin", "hr"] as const
export const INSURED_REPORT_PAGE_SIZE = 20

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/

export type InsuredReportFilterInput = {
  q?: string | null
  start?: string | null
  stop?: string | null
}

export type ResolvedInsuredReportFilters = {
  query: string
  startValue: string
  stopValue: string
  startDate: Date | null
  stopDate: Date | null
  hasDateRange: boolean
  hasInvalidFilter: boolean
  warnings: string[]
  where: Prisma.InterviewWhereInput
}

function parseStrictCalendarDate(raw: string): Date | null {
  const match = ISO_DATE_RE.exec(raw)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  if (month < 1 || month > 12 || day < 1 || day > 31) return null

  const monthStart = dayjs.utc(`${year}-${String(month).padStart(2, "0")}-01`, "YYYY-MM-DD", true)
  if (!monthStart.isValid() || day > monthStart.daysInMonth()) return null

  const parsed = dayjs.utc(raw, "YYYY-MM-DD", true)
  if (!parsed.isValid() || parsed.format("YYYY-MM-DD") !== raw) return null

  return parsed.toDate()
}

export function formatAddress(applicant: {
  addressNo: string | null
  moo: string | null
  road: string | null
  subdistrict: string | null
  district: string | null
  province: string | null
}): string {
  const parts: string[] = []
  if (applicant.addressNo) parts.push(`เลขที่ ${applicant.addressNo}`)
  if (applicant.moo) parts.push(`หมู่ ${applicant.moo}`)
  if (applicant.road) parts.push(`ถ.${applicant.road}`)
  if (applicant.subdistrict) parts.push(`ต.${applicant.subdistrict}`)
  if (applicant.district) parts.push(`อ.${applicant.district}`)
  if (applicant.province) parts.push(`จ.${applicant.province}`)
  return parts.length > 0 ? parts.join(" ") : "-"
}

export function resolveInsuredReportFilters(input: InsuredReportFilterInput): ResolvedInsuredReportFilters {
  const query = typeof input.q === "string" ? input.q.trim() : ""
  const rawStart = typeof input.start === "string" ? input.start.trim() : ""
  const rawStop = typeof input.stop === "string" ? input.stop.trim() : ""

  const warnings: string[] = []
  let hasInvalidFilter = false

  const parsedStart = rawStart ? parseStrictCalendarDate(rawStart) : null
  const parsedStop = rawStop ? parseStrictCalendarDate(rawStop) : null

  if (rawStart && !parsedStart) {
    warnings.push(`วันที่เริ่มต้น (${rawStart}) ไม่มีอยู่จริงในปฏิทิน กรุณาระบุวันที่ใหม่`)
    hasInvalidFilter = true
  }
  if (rawStop && !parsedStop) {
    warnings.push(`วันที่สิ้นสุด (${rawStop}) ไม่มีอยู่จริงในปฏิทิน กรุณาระบุวันที่ใหม่`)
    hasInvalidFilter = true
  }

  let startDate = parsedStart
  let stopDate = parsedStop

  if (startDate && stopDate && startDate > stopDate) {
    warnings.push("วันที่เริ่มต้นมากกว่าวันที่สิ้นสุด กรุณาเลือกช่วงวันที่ให้ถูกต้อง")
    hasInvalidFilter = true
    startDate = null
    stopDate = null
  }

  const hasDateRange = Boolean(startDate && stopDate)

  if (!hasInvalidFilter && !hasDateRange) {
    if (startDate && !stopDate) {
      warnings.push("กรุณาเลือกวันที่สิ้นสุด (Stop Date) ให้ครบช่วงวันที่")
    } else if (!startDate && stopDate) {
      warnings.push("กรุณาเลือกวันที่เริ่มต้น (Start Date) ให้ครบช่วงวันที่")
    } else {
      warnings.push("กรุณาเลือกช่วงวันที่เริ่มต้นและสิ้นสุด (Between Start Date and Stop Date) เพื่อแสดงหรือส่งออกข้อมูล")
    }
  }

  const startValue = startDate ? toDateInput(startDate) : ""
  const stopValue = stopDate ? toDateInput(stopDate) : ""

  if (hasInvalidFilter || !hasDateRange || !startDate || !stopDate) {
    return {
      query,
      startValue,
      stopValue,
      startDate: null,
      stopDate: null,
      hasDateRange: false,
      hasInvalidFilter,
      warnings,
      where: { id: -1 },
    }
  }

  const filters: Prisma.InterviewWhereInput[] = [
    { startDate: { not: null, gte: startDate, lte: stopDate } },
    { result: "ผ่าน" },
  ]

  if (query) {
    filters.push({
      OR: [
        { position: { contains: query, mode: "insensitive" } },
        { bankName: { contains: query, mode: "insensitive" } },
        { bankAccountNo: { contains: query } },
        {
          documentCheck: {
            applicant: {
              OR: [
                { fullNameTh: { contains: query, mode: "insensitive" } },
                { nationalId: { contains: query } },
                { mobilePhone: { contains: query } },
                { educationLevel: { contains: query, mode: "insensitive" } },
              ],
            },
          },
        },
        {
          guaranteeContracts: {
            some: {
              OR: [
                { guarantorName: { contains: query, mode: "insensitive" } },
                { guarantorPhone: { contains: query } },
              ],
            },
          },
        },
      ],
    })
  }

  return {
    query,
    startValue,
    stopValue,
    startDate,
    stopDate,
    hasDateRange: true,
    hasInvalidFilter: false,
    warnings,
    where: { AND: filters },
  }
}

const insuredReportSelect = {
  id: true,
  position: true,
  startDate: true,
  bankName: true,
  bankAccountNo: true,
  documentCheck: {
    select: {
      applicant: {
        select: {
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
        },
      },
    },
  },
  guaranteeContracts: {
    orderBy: { id: "desc" },
    take: 1,
    select: {
      guarantorName: true,
      guarantorPhone: true,
    },
  },
} satisfies Prisma.InterviewSelect

export type InsuredReportRow = Prisma.InterviewGetPayload<{ select: typeof insuredReportSelect }>

export async function queryInsuredReportPage(where: Prisma.InterviewWhereInput, page: number) {
  const total = await db.interview.count({ where })
  const totalPages = Math.max(1, Math.ceil(total / INSURED_REPORT_PAGE_SIZE))
  const safePage = Math.min(Math.max(1, page), totalPages)

  const records = await db.interview.findMany({
    where,
    orderBy: [{ startDate: "desc" }, { id: "desc" }],
    skip: (safePage - 1) * INSURED_REPORT_PAGE_SIZE,
    take: INSURED_REPORT_PAGE_SIZE,
    select: insuredReportSelect,
  })

  return { total, totalPages, page: safePage, records }
}

export async function queryInsuredReportExport(where: Prisma.InterviewWhereInput) {
  return db.interview.findMany({
    where,
    orderBy: [{ startDate: "desc" }, { id: "desc" }],
    select: insuredReportSelect,
  })
}