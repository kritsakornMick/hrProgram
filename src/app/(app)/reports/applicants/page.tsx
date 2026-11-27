import { Download, Search, UsersRound } from "lucide-react"
import type { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { Pagination } from "@/components/pagination"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { audit } from "@/lib/audit"
import { maskNationalId } from "@/lib/pdpa"
import { requirePageRole } from "@/lib/session"
import {
  APPLICANT_REPORT_PAGE_SIZE,
  buildApplicantReportWhere,
  countApplicantReportRows,
  getApplicantReportRows,
  parseApplicantReportFilters,
  toApplicantReportValues,
} from "./data"
import type { ApplicantReportRow, ApplicantReportValues } from "./data"

export const metadata: Metadata = { title: "รายงานผู้สมัครทั้งหมด" }

const REPORT_COLUMNS = [
  { key: "position", label: "ตำแหน่งงาน" },
  { key: "nationalId", label: "เลขบัตรประชาชน" },
  { key: "fullNameTh", label: "คำนำหน้า-ชื่อ-สกุล (ไทย)" },
  { key: "birthDate", label: "วันเกิด" },
  { key: "startDate", label: "วันที่เริ่มงาน" },
  { key: "mobilePhone", label: "โทรศัพท์มือถือ" },
  { key: "address", label: "ที่อยู่" },
  { key: "educationLevel", label: "วุฒิการศึกษา" },
  { key: "guarantorName", label: "ผู้ค้ำประกัน" },
  { key: "guarantorPhone", label: "โทรศัพท์ผู้ค้ำประกัน" },
  { key: "bankName", label: "บัญชีธนาคาร" },
  { key: "bankAccountNo", label: "หมายเลขบัญชี" },
] as const satisfies readonly { key: keyof ApplicantReportValues; label: string }[]

/** ซ่อนเลขบัญชีให้เหลือ 4 ตัวท้าย (เก็บขีดคั่นไว้) เช่น 123-4-56789-0 → XXX-X-XX789-0 */
function maskBankAccount(value: string) {
  const digitCount = value.replace(/\D/g, "").length
  if (digitCount <= 4) return value
  let toHide = digitCount - 4
  return value.replace(/\d/g, (digit) => (toHide-- > 0 ? "X" : digit))
}

/**
 * ค่าที่แสดงบนหน้าจอ: ซ่อนเลขบัตรและเลขบัญชีบางส่วน (PDPA)
 * ตัวเต็มมีเฉพาะในไฟล์ Excel ที่ส่งออก (บันทึก audit "export" ทุกครั้ง)
 */
function toScreenValues(applicant: ApplicantReportRow): ApplicantReportValues {
  const values = toApplicantReportValues(applicant)
  return {
    ...values,
    nationalId: values.nationalId === "-" ? "-" : maskNationalId(values.nationalId),
    bankAccountNo: values.bankAccountNo === "-" ? "-" : maskBankAccount(values.bankAccountNo),
  }
}

export default async function ApplicantReportPage({ searchParams }: PageProps<"/reports/applicants">) {
  const user = await requirePageRole(["admin", "hr"])
  const filters = parseApplicantReportFilters(await searchParams)
  let total = 0
  let applicants: ApplicantReportRow[] = []
  let currentPage = 1

  if (filters.errors.length === 0) {
    const where = buildApplicantReportWhere(filters)
    total = await countApplicantReportRows(where)
    const totalPages = Math.max(1, Math.ceil(total / APPLICANT_REPORT_PAGE_SIZE))
    currentPage = Math.min(filters.page, totalPages)
    applicants = await getApplicantReportRows(where, currentPage)

    await audit(user, "view", "applicant_report", undefined, {
      from: filters.from || null,
      to: filters.to || null,
      rowCount: total,
    })
  }

  const totalPages = Math.max(1, Math.ceil(total / APPLICANT_REPORT_PAGE_SIZE))
  const firstResult = total === 0 ? 0 : (currentPage - 1) * APPLICANT_REPORT_PAGE_SIZE + 1
  const lastResult = Math.min(currentPage * APPLICANT_REPORT_PAGE_SIZE, total)
  const exportParams = new URLSearchParams()
  if (filters.query) exportParams.set("q", filters.query)
  if (filters.from) exportParams.set("from", filters.from)
  if (filters.to) exportParams.set("to", filters.to)
  const exportHref = `/reports/applicants/export?${exportParams.toString()}`

  return (
    <>
      <PageHeader
        icon={UsersRound}
        title="รายงานผู้สมัครทั้งหมด"
        description="ค้นหาและส่งออกรายงานผู้สมัครตามวันที่สมัคร"
      />

      <Card>
        <CardContent className="space-y-4">
          <form action="/reports/applicants" method="get" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Field>
              <FieldLabel htmlFor="applicant-report-query">ค้นหาผู้สมัคร</FieldLabel>
              <Input
                id="applicant-report-query"
                name="q"
                type="search"
                maxLength={100}
                defaultValue={filters.query}
                placeholder="ชื่อ รหัสผู้สมัคร เลขบัตร หรือเบอร์โทร"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="applicant-report-from">วันที่สมัครตั้งแต่</FieldLabel>
              <Input id="applicant-report-from" name="from" type="date" defaultValue={filters.from} />
            </Field>
            <Field>
              <FieldLabel htmlFor="applicant-report-to">ถึงวันที่</FieldLabel>
              <Input id="applicant-report-to" name="to" type="date" defaultValue={filters.to} />
            </Field>
            <div className="flex items-end">
              <button type="submit" className={buttonVariants({ size: "lg" })}>
                <Search />
                แสดงรายการ
              </button>
            </div>
          </form>

          {filters.errors.length > 0 && (
            <div role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <p>ไม่สามารถแสดงรายงานได้:</p>
              <ul className="list-inside list-disc">
                {filters.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-tint-green text-primary">
                <UsersRound className="size-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">จำนวนผู้สมัครตามเงื่อนไข</p>
                <p className="text-2xl font-bold">{total.toLocaleString("th-TH")}</p>
              </div>
            </div>
            {filters.errors.length === 0 && (
              // ใช้ <a> ธรรมดา ไม่ใช่ <Link>: Link จะ prefetch ตอนปุ่มโผล่บนจอ ทำให้ route สร้างไฟล์
              // และบันทึก audit "export" ทั้งที่ผู้ใช้ยังไม่ได้กด
              <a href={exportHref} download className={buttonVariants({ size: "lg" })}>
                <Download />
                ส่งออก Excel (CSV)
              </a>
            )}
          </div>

          {applicants.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              {filters.errors.length > 0 ? "โปรดแก้ไขตัวกรองด้านบนแล้วลองอีกครั้ง" : "ไม่พบผู้สมัครตามเงื่อนไข"}
            </div>
          ) : (
            <>
              <div className="space-y-3 2xl:hidden">
                {applicants.map((applicant) => {
                  const values = toScreenValues(applicant)
                  return (
                    <article key={applicant.id} className="rounded-lg border p-3">
                      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {REPORT_COLUMNS.map((column) => (
                          <ReportField
                            key={column.key}
                            label={column.label}
                            value={values[column.key]}
                          />
                        ))}
                      </dl>
                    </article>
                  )
                })}
              </div>

              <div className="hidden 2xl:block">
                <Table className="table-fixed">
                  <TableHeader>
                    <TableRow>
                      {REPORT_COLUMNS.map((column) => (
                        <TableHead key={column.key} className="whitespace-normal px-1 text-xs">
                          {column.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applicants.map((applicant) => {
                      const values = toScreenValues(applicant)
                      return (
                        <TableRow key={applicant.id}>
                          {REPORT_COLUMNS.map((column) => (
                            <TableCell
                              key={column.key}
                              className="max-w-40 whitespace-normal break-words px-1 py-2 align-top text-xs"
                            >
                              {values[column.key]}
                            </TableCell>
                          ))}
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {total > 0
                ? `แสดง ${firstResult.toLocaleString("th-TH")}–${lastResult.toLocaleString("th-TH")} จากทั้งหมด ${total.toLocaleString("th-TH")} รายการ`
                : "ทั้งหมด 0 รายการ"}
            </p>
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              basePath="/reports/applicants"
              searchParams={{ q: filters.query, from: filters.from, to: filters.to }}
            />
          </div>
        </CardContent>
      </Card>
    </>
  )
}

function ReportField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm">{value}</dd>
    </div>
  )
}
