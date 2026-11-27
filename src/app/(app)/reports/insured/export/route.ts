import { NextResponse, type NextRequest } from "next/server"
import { audit } from "@/lib/audit"
import { formatThaiDate, toDateInput } from "@/lib/dates"
import { hasRole } from "@/lib/permissions"
import { requireUser } from "@/lib/session"
import { formatAddress, INSURED_REPORT_ROLES, queryInsuredReportExport, resolveInsuredReportFilters } from "../data"

const FORMULA_PREFIX_RE = /^[=+\-@\t\r]/

function sanitizeFormulaText(value: string): string {
  const normalized = value.replaceAll("\r\n", " ").replaceAll("\n", " ")
  return FORMULA_PREFIX_RE.test(normalized) ? `'${normalized}` : normalized
}

function csvCell(value: string | null | undefined): string {
  const safeText = sanitizeFormulaText(value ?? "-")
  return `"${safeText.replaceAll('"', '""')}"`
}

function csvTextCell(value: string | null | undefined): string {
  if (!value) return csvCell("-")
  const safeText = sanitizeFormulaText(value).replaceAll('"', '""')
  return `"=""${safeText}"""`
}

export async function GET(request: NextRequest) {
  const user = await requireUser()
  if (!hasRole(user.role, INSURED_REPORT_ROLES)) {
    return NextResponse.json({ error: "คุณไม่มีสิทธิ์ส่งออกรายงานนี้" }, { status: 403 })
  }

  const { searchParams } = request.nextUrl
  const resolved = resolveInsuredReportFilters({
    q: searchParams.get("q"),
    start: searchParams.get("start"),
    stop: searchParams.get("stop"),
  })

  if (resolved.hasInvalidFilter || !resolved.hasDateRange) {
    return NextResponse.json(
      { error: resolved.warnings.join(" ") || "กรุณาเลือกช่วงวันที่เริ่มต้นและสิ้นสุดให้ถูกต้อง" },
      { status: 400 },
    )
  }

  const rows = await queryInsuredReportExport(resolved.where)

  await audit(user, "export", "insured_report", undefined, {
    q: resolved.query || undefined,
    start: resolved.startValue || undefined,
    stop: resolved.stopValue || undefined,
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
        csvCell(formatAddress(applicant)),
        csvCell(applicant.educationLevel),
        csvCell(guarantor?.guarantorName),
        csvTextCell(guarantor?.guarantorPhone),
        csvCell(r.bankName),
        csvTextCell(r.bankAccountNo),
      ].join(","),
    )
  }

  const csvContent = `\uFEFF${lines.join("\r\n")}`
  const fileDatePart = `${resolved.startValue || "start"}_${resolved.stopValue || "stop"}`
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