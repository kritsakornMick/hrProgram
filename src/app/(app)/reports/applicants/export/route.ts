import { audit } from "@/lib/audit"
import { type CsvColumn, toCsv } from "@/lib/csv"
import { toDateInput } from "@/lib/dates"
import { requirePageRole } from "@/lib/session"
import {
  type ApplicantReportValues,
  buildApplicantReportWhere,
  getApplicantReportRows,
  parseApplicantReportFilters,
  toApplicantReportValues,
} from "../data"

/** คอลัมน์เดียวกับหน้าจอ (ตาม qry-rpt-ผู้สมัครงานทั้งหมด ใน Access) */
const COLUMNS: CsvColumn<ApplicantReportValues>[] = [
  { header: "รหัสผู้สมัคร", value: (r) => r.code },
  { header: "วันที่สมัคร", value: (r) => r.appliedAt },
  { header: "คำนำหน้า-ชื่อ-สกุล (ไทย)", value: (r) => r.fullNameTh },
  { header: "ตำแหน่งงาน", value: (r) => r.position },
  { header: "เงินเดือนที่ต้องการ (บาท)", value: (r) => r.expectedSalary },
]

/**
 * ส่งออกรายงานผู้สมัครเป็น CSV (เปิดใน Excel ได้) ตามตัวกรองเดียวกับหน้ารายงาน ทุกแถวที่ตรงเงื่อนไข
 * มีชื่อผู้สมัคร (ข้อมูลส่วนบุคคล) จึงจำกัด admin/hr และบันทึก audit "export" ทุกครั้ง
 */
export async function GET(request: Request) {
  const user = await requirePageRole(["admin", "hr"])
  const url = new URL(request.url)
  const filters = parseApplicantReportFilters({
    q: url.searchParams.get("q") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
  })

  if (filters.errors.length > 0) {
    return Response.json(
      { error: filters.errors.join(" / ") },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    )
  }

  const rows = await getApplicantReportRows(buildApplicantReportWhere(filters))
  const csv = toCsv(COLUMNS, rows.map(toApplicantReportValues))

  await audit(user, "export", "applicant_report", undefined, {
    from: filters.from || null,
    to: filters.to || null,
    rowCount: rows.length,
  })

  const filename = `applicants-report-${toDateInput(new Date())}.csv`
  return new Response(csv, {
    headers: {
      "Cache-Control": "no-store, private",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "text/csv; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
