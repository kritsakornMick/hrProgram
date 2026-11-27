import { NextResponse, type NextRequest } from "next/server"
import { audit } from "@/lib/audit"
import { type CsvColumn, toCsv } from "@/lib/csv"
import { formatThaiDate } from "@/lib/dates"
import { hasRole } from "@/lib/permissions"
import { requireUser } from "@/lib/session"
import {
  formatAddress,
  INSURED_REPORT_ROLES,
  type InsuredReportRow,
  queryInsuredReportExport,
  resolveInsuredReportFilters,
} from "../data"

/** คอลัมน์ตาม qry-rpt-ผู้ประกันตน ใน Access (เลขบัตร/เบอร์/เลขบัญชีเก็บเป็นข้อความ ไม่ให้ Excel ตัดเลข 0) */
const COLUMNS: CsvColumn<InsuredReportRow>[] = [
  { header: "ตำแหน่งงาน", value: (r) => r.position ?? r.documentCheck.applicant.position },
  { header: "เลขบัตรประชาชน", value: (r) => r.documentCheck.applicant.nationalId, keepAsText: true },
  { header: "คำนำหน้า ชื่อ สกุล (ไทย)", value: (r) => r.documentCheck.applicant.fullNameTh },
  { header: "วันเกิด", value: (r) => formatThaiDate(r.documentCheck.applicant.birthDate) },
  { header: "วันที่เริ่มงาน", value: (r) => formatThaiDate(r.startDate) },
  { header: "โทรศัพท์มือถือ", value: (r) => r.documentCheck.applicant.mobilePhone, keepAsText: true },
  { header: "ที่อยู่", value: (r) => formatAddress(r.documentCheck.applicant) },
  { header: "วุฒิการศึกษา", value: (r) => r.documentCheck.applicant.educationLevel },
  { header: "ผู้ค้ำประกัน", value: (r) => r.guaranteeContracts[0]?.guarantorName },
  { header: "โทรศัพท์ผู้ค้ำ", value: (r) => r.guaranteeContracts[0]?.guarantorPhone, keepAsText: true },
  { header: "บัญชีธนาคาร", value: (r) => r.bankName },
  { header: "หมายเลขบัญชี", value: (r) => r.bankAccountNo, keepAsText: true },
]

/**
 * ส่งออกรายงานผู้ประกันตนเป็น CSV (เปิดใน Excel ได้) ตามช่วงวันที่เริ่มงานที่เลือก
 * มีเลขบัตรและเลขบัญชีเต็ม จึงจำกัด admin/hr และบันทึก audit "export" ทุกครั้ง
 */
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

  const filename = `insured-report-${resolved.startValue}_${resolved.stopValue}.csv`

  return new NextResponse(toCsv(COLUMNS, rows), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store, private",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
