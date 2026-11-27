import { NextResponse, type NextRequest } from "next/server"
import type { Prisma } from "@/generated/prisma/client"
import { audit } from "@/lib/audit"
import { formatThaiDate, parseDateInput, toDateInput } from "@/lib/dates"
import { db } from "@/lib/db"
import { requireUser } from "@/lib/session"

function csvCell(value: string | null | undefined): string {
  const text = (value ?? "-").replaceAll("\r\n", " ").replaceAll("\n", " ")
  const escaped = text.replaceAll('"', '""')
  return `"${escaped}"`
}

function csvTextCell(value: string | null | undefined): string {
  if (!value) return csvCell("-")
  const clean = value.replaceAll("\r\n", " ").replaceAll("\n", " ").replaceAll('"', '""')
  return `="${clean}"`
}

function formatAddressText(applicant: {
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

export async function GET(request: NextRequest) {
  const user = await requireUser()
  const { searchParams } = request.nextUrl

  const qParam = searchParams.get("q")
  const startParam = searchParams.get("start")
  const stopParam = searchParams.get("stop")

  const query = typeof qParam === "string" ? qParam.trim() : ""
  const parsedStart = typeof startParam === "string" ? parseDateInput(startParam) : null
  const parsedStop = typeof stopParam === "string" ? parseDateInput(stopParam) : null
  const startDate = parsedStart && parsedStop && parsedStart > parsedStop ? parsedStop : parsedStart
  const stopDate = parsedStart && parsedStop && parsedStart > parsedStop ? parsedStart : parsedStop

  const startValue = toDateInput(startDate)
  const stopValue = toDateInput(stopDate)

  const filters: Prisma.InterviewWhereInput[] = []

  if (startDate || stopDate) {
    filters.push({
      startDate: {
        ...(startDate ? { gte: startDate } : {}),
        ...(stopDate ? { lte: stopDate } : {}),
      },
    })
  }

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

  const where: Prisma.InterviewWhereInput | undefined = filters.length > 0 ? { AND: filters } : undefined

  const rows = await db.interview.findMany({
    where,
    orderBy: [{ startDate: { sort: "desc", nulls: "last" } }, { id: "desc" }],
    select: {
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
    },
  })

  await audit(user, "export", "insured_report", undefined, {
    q: query || undefined,
    start: startValue || undefined,
    stop: stopValue || undefined,
    rowCount: rows.length,
  })

  const headers = [
    "ตำแหน่งงาน",
    "เลขบัตรประชาชน",
    "คำนำหน้า ชื่อ สกุล (ไทย)",
    "วันเกิด",
    "วันที่เริ่มงาน",
    "โทรศัพท์มือถือ",
    "ที่อยู่",
    "วุฒิการศึกษา",
    "ผู้ค้ำประกัน",
    "โทรศัพท์ผู้ค้ำ",
    "บัญชีธนาคาร",
    "หมายเลขบัญชี",
  ]

  const lines = [headers.map((h) => csvCell(h)).join(",")]

  for (const r of rows) {
    const applicant = r.documentCheck.applicant
    const guarantor = r.guaranteeContracts[0]
    const position = r.position ?? applicant.position ?? "-"

    lines.push(
      [
        csvCell(position),
        csvTextCell(applicant.nationalId),
        csvCell(applicant.fullNameTh),
        csvCell(formatThaiDate(applicant.birthDate)),
        csvCell(formatThaiDate(r.startDate)),
        csvTextCell(applicant.mobilePhone),
        csvCell(formatAddressText(applicant)),
        csvCell(applicant.educationLevel),
        csvCell(guarantor?.guarantorName),
        csvTextCell(guarantor?.guarantorPhone),
        csvCell(r.bankName),
        csvTextCell(r.bankAccountNo),
      ].join(","),
    )
  }

  const csvContent = `\uFEFF${lines.join("\r\n")}`
  const fileDatePart = startValue || stopValue ? `${startValue || "start"}_${stopValue || "stop"}` : toDateInput(new Date())
  const filename = `insured-report-${fileDatePart}.csv`

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  })
}