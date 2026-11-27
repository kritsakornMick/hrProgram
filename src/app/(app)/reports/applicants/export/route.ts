import ExcelJS from "exceljs"
import { audit } from "@/lib/audit"
import { requirePageRole } from "@/lib/session"
import {
  buildApplicantReportWhere,
  getApplicantReportRows,
  parseApplicantReportFilters,
  toApplicantReportValues,
} from "../data"

export const runtime = "nodejs"

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
      { error: filters.errors.join("、") },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    )
  }

  const rows = await getApplicantReportRows(buildApplicantReportWhere(filters))
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet("รายงานผู้สมัคร")

  worksheet.columns = [
    { header: "ตำแหน่งงาน", key: "position", width: 22 },
    { header: "เลขบัตรประชาชน", key: "nationalId", width: 20, style: { numFmt: "@" } },
    { header: "คำนำหน้า-ชื่อ-สกุล (ไทย)", key: "fullNameTh", width: 30 },
    { header: "วันเกิด", key: "birthDate", width: 20 },
    { header: "วันที่เริ่มงาน", key: "startDate", width: 20 },
    { header: "โทรศัพท์มือถือ", key: "mobilePhone", width: 18 },
    { header: "ที่อยู่", key: "address", width: 48 },
    { header: "วุฒิการศึกษา", key: "educationLevel", width: 20 },
    { header: "ผู้ค้ำประกัน", key: "guarantorName", width: 30 },
    { header: "โทรศัพท์ผู้ค้ำประกัน", key: "guarantorPhone", width: 20 },
    { header: "บัญชีธนาคาร", key: "bankName", width: 22 },
    { header: "หมายเลขบัญชี", key: "bankAccountNo", width: 22, style: { numFmt: "@" } },
  ]
  worksheet.getRow(1).font = { bold: true }
  worksheet.views = [{ state: "frozen", ySplit: 1 }]
  worksheet.autoFilter = { from: "A1", to: "L1" }
  worksheet.addRows(rows.map(toApplicantReportValues))

  const file = new Uint8Array(await workbook.xlsx.writeBuffer())
  await audit(user, "export", "applicant_report", undefined, {
    from: filters.from || null,
    to: filters.to || null,
    rowCount: rows.length,
  })

  return new Response(file, {
    headers: {
      "Cache-Control": "no-store, private",
      "Content-Disposition": 'attachment; filename="applicants-report.xlsx"',
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
