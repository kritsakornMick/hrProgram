import { AlertTriangle, FileSpreadsheet, Search, UserRoundSearch } from "lucide-react"
import type { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { Pagination, parsePage } from "@/components/pagination"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { auditView } from "@/lib/audit"
import { formatThaiDate } from "@/lib/dates"
import { maskNationalId } from "@/lib/pdpa"
import { hasRole } from "@/lib/permissions"
import { requirePageRole } from "@/lib/session"
import {
  formatAddress,
  INSURED_REPORT_PAGE_SIZE,
  INSURED_REPORT_ROLES,
  queryInsuredReportPage,
  resolveInsuredReportFilters,
} from "./data"

export const metadata: Metadata = { title: "รายงานผู้ประกันตน" }

function maskPhone(value: string | null | undefined): string {
  if (!value) return "-"
  const digits = value.replace(/\D/g, "")
  if (digits.length < 3) return "•••"
  return `•••-•••-${digits.slice(-3)}`
}

function maskAccountNo(value: string | null | undefined): string {
  if (!value) return "-"
  const digits = value.replace(/\D/g, "")
  if (digits.length < 4) return "••••"
  return `xxx-x-xxxxx-${digits.slice(-2)}`
}

function buildExportUrl(query: string, start: string, stop: string): string {
  const params = new URLSearchParams()
  if (query) params.set("q", query)
  if (start) params.set("start", start)
  if (stop) params.set("stop", stop)
  const qs = params.toString()
  return qs ? `/reports/insured/export?${qs}` : "/reports/insured/export"
}

export default async function InsuredReportPage({ searchParams }: PageProps<"/reports/insured">) {
  const user = await requirePageRole(INSURED_REPORT_ROLES)
  const canExport = hasRole(user.role, INSURED_REPORT_ROLES)

  const { q, start: startParam, stop: stopParam, page: pageParam } = await searchParams
  const resolved = resolveInsuredReportFilters({
    q: typeof q === "string" ? q : null,
    start: typeof startParam === "string" ? startParam : null,
    stop: typeof stopParam === "string" ? stopParam : null,
  })

  await auditView(user, "insured_report", "list")

  const { total, totalPages, page, records } = await queryInsuredReportPage(
    resolved.where,
    parsePage(pageParam),
  )

  const from = total === 0 ? 0 : (page - 1) * INSURED_REPORT_PAGE_SIZE + 1
  const to = Math.min(page * INSURED_REPORT_PAGE_SIZE, total)
  const exportHref = buildExportUrl(resolved.query, resolved.startValue, resolved.stopValue)
  const isExportReady = canExport && !resolved.hasInvalidFilter && resolved.hasDateRange && total > 0

  return (
    <div className="w-full max-w-[calc(100vw-2rem)] min-w-0 space-y-4 overflow-x-clip sm:max-w-[calc(100vw-3rem)] lg:max-w-[calc(100vw-19rem)]">
      <PageHeader
        icon={UserRoundSearch}
        title="รายงานผู้ประกันตน"
        description="ตรวจสอบ ค้นหา และส่งออกข้อมูลผู้ประกันตนที่ผ่านการสัมภาษณ์ตามช่วงวันที่เริ่มงาน"
        actions={
          canExport ? (
            isExportReady ? (
              <a href={exportHref} className={buttonVariants()}>
                <FileSpreadsheet />
                Export Excel
              </a>
            ) : (
              <span
                aria-disabled="true"
                className={buttonVariants({ className: "pointer-events-none opacity-50" })}
              >
                <FileSpreadsheet />
                Export Excel
              </span>
            )
          ) : null
        }
      />

      {resolved.warnings.length > 0 && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <ul className="space-y-1">
            {resolved.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <Card className="w-full max-w-full min-w-0 overflow-hidden">
        <CardContent className="w-full max-w-full min-w-0 space-y-4">
          <form method="get" className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto_auto] md:items-end">
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={resolved.query}
                placeholder="ค้นหาชื่อ ตำแหน่ง เลขบัตร โทรศัพท์ หรือผู้ค้ำประกัน"
                className="pl-8"
                aria-label="ค้นหารายงานผู้ประกันตน"
              />
            </div>

            <div className="min-w-0 space-y-1">
              <label htmlFor="start" className="block text-xs text-muted-foreground">
                วันที่เริ่มงาน (ตั้งแต่)
              </label>
              <Input id="start" name="start" type="date" defaultValue={resolved.startValue} />
            </div>

            <div className="min-w-0 space-y-1">
              <label htmlFor="stop" className="block text-xs text-muted-foreground">
                วันที่เริ่มงาน (ถึง)
              </label>
              <Input id="stop" name="stop" type="date" defaultValue={resolved.stopValue} />
            </div>

            <button type="submit" className={buttonVariants({ variant: "outline" })}>
              ค้นหา
            </button>
          </form>

          <div className="w-full max-w-full overflow-x-auto">
            <Table className="w-max min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-40">ตำแหน่งงาน</TableHead>
                  <TableHead className="w-40">เลขบัตรประชาชน</TableHead>
                  <TableHead className="w-48">คำนำหน้า ชื่อ สกุล (ไทย)</TableHead>
                  <TableHead className="w-32">วันเกิด</TableHead>
                  <TableHead className="w-32">วันที่เริ่มงาน</TableHead>
                  <TableHead className="w-36">โทรศัพท์มือถือ</TableHead>
                  <TableHead className="w-64">ที่อยู่</TableHead>
                  <TableHead className="w-40">วุฒิการศึกษา</TableHead>
                  <TableHead className="w-44">ผู้ค้ำประกัน</TableHead>
                  <TableHead className="w-36">โทรศัพท์ผู้ค้ำ</TableHead>
                  <TableHead className="w-40">บัญชีธนาคาร</TableHead>
                  <TableHead className="w-40">หมายเลขบัญชี</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={12} className="py-10 text-center whitespace-normal text-muted-foreground">
                      {resolved.hasInvalidFilter
                        ? "กรุณาแก้ไขช่วงวันที่ให้ถูกต้องเพื่อแสดงข้อมูล"
                        : !resolved.hasDateRange
                          ? "กรุณาเลือกวันที่เริ่มต้นและวันที่สิ้นสุดเพื่อแสดงข้อมูล"
                          : resolved.query
                            ? "ไม่พบข้อมูลผู้ประกันตนที่ตรงกับเงื่อนไขที่เลือก"
                            : "ไม่พบข้อมูลผู้ประกันตนในช่วงวันที่ที่เลือก"}
                    </TableCell>
                  </TableRow>
                )}
                {records.map((r) => {
                  const applicant = r.documentCheck.applicant
                  const guarantor = r.guaranteeContracts[0]
                  const position = r.position ?? applicant.position ?? "-"
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-normal">{position}</TableCell>
                      <TableCell>{maskNationalId(applicant.nationalId)}</TableCell>
                      <TableCell className="font-medium whitespace-normal">{applicant.fullNameTh}</TableCell>
                      <TableCell>{formatThaiDate(applicant.birthDate)}</TableCell>
                      <TableCell>{formatThaiDate(r.startDate)}</TableCell>
                      <TableCell>{maskPhone(applicant.mobilePhone)}</TableCell>
                      <TableCell className="whitespace-normal">{formatAddress(applicant)}</TableCell>
                      <TableCell className="whitespace-normal">{applicant.educationLevel ?? "-"}</TableCell>
                      <TableCell className="whitespace-normal">{guarantor?.guarantorName ?? "-"}</TableCell>
                      <TableCell>{maskPhone(guarantor?.guarantorPhone)}</TableCell>
                      <TableCell className="whitespace-normal">{r.bankName ?? "-"}</TableCell>
                      <TableCell>{maskAccountNo(r.bankAccountNo)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {total > 0
                ? `แสดง ${from.toLocaleString("th-TH")}–${to.toLocaleString("th-TH")} จากทั้งหมด ${total.toLocaleString("th-TH")} รายการ`
                : "ทั้งหมด 0 รายการ"}
            </p>
            <Pagination
              page={page}
              totalPages={totalPages}
              basePath="/reports/insured"
              searchParams={{ q: resolved.query, start: resolved.startValue, stop: resolved.stopValue }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}