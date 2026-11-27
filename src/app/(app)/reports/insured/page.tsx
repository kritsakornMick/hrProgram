import { FileSpreadsheet, Search, UserRoundSearch } from "lucide-react"
import type { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { Pagination, parsePage } from "@/components/pagination"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Prisma } from "@/generated/prisma/client"
import { formatThaiDate, parseDateInput, toDateInput } from "@/lib/dates"
import { db } from "@/lib/db"
import { maskNationalId } from "@/lib/pdpa"
import { requireUser } from "@/lib/session"

export const metadata: Metadata = { title: "รายงานผู้ประกันตน" }

const PAGE_SIZE = 20

function formatAddress(applicant: {
  addressNo: string | null
  moo: string | null
  road: string | null
  subdistrict: string | null
  district: string | null
  province: string | null
}) {
  const parts: string[] = []
  if (applicant.addressNo) parts.push(`เลขที่ ${applicant.addressNo}`)
  if (applicant.moo) parts.push(`หมู่ ${applicant.moo}`)
  if (applicant.road) parts.push(`ถ.${applicant.road}`)
  if (applicant.subdistrict) parts.push(`ต.${applicant.subdistrict}`)
  if (applicant.district) parts.push(`อ.${applicant.district}`)
  if (applicant.province) parts.push(`จ.${applicant.province}`)
  return parts.length > 0 ? parts.join(" ") : "-"
}

function buildExportUrl(query: string, start: string, stop: string) {
  const params = new URLSearchParams()
  if (query) params.set("q", query)
  if (start) params.set("start", start)
  if (stop) params.set("stop", stop)
  const qs = params.toString()
  return qs ? `/reports/insured/export?${qs}` : "/reports/insured/export"
}

export default async function InsuredReportPage({ searchParams }: PageProps<"/reports/insured">) {
  await requireUser()
  const { q, start: startParam, stop: stopParam, page: pageParam } = await searchParams
  const query = typeof q === "string" ? q.trim() : ""

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

  const total = await db.interview.count({ where })
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const page = Math.min(parsePage(pageParam), totalPages)

  const records = await db.interview.findMany({
    where,
    orderBy: [{ startDate: { sort: "desc", nulls: "last" } }, { id: "desc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
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

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)
  const exportHref = buildExportUrl(query, startValue, stopValue)

  return (
    <>
      <PageHeader
        icon={UserRoundSearch}
        title="รายงานผู้ประกันตน"
        description="ตรวจสอบ ค้นหา และส่งออกข้อมูลผู้ประกันตนตามวันที่เริ่มงาน"
        actions={
          <a href={exportHref} className={buttonVariants()}>
            <FileSpreadsheet />
            Export Excel
          </a>
        }
      />

      <Card>
        <CardContent className="space-y-4">
          <form method="get" className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto] md:items-end">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={query}
                placeholder="ค้นหาชื่อ ตำแหน่ง เลขบัตร โทรศัพท์ หรือผู้ค้ำประกัน"
                className="pl-8"
                aria-label="ค้นหารายงานผู้ประกันตน"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="start" className="block text-xs text-muted-foreground">
                Start Date (วันที่เริ่มงาน)
              </label>
              <Input id="start" name="start" type="date" defaultValue={startValue} />
            </div>

            <div className="space-y-1">
              <label htmlFor="stop" className="block text-xs text-muted-foreground">
                Stop Date (ถึงวันที่)
              </label>
              <Input id="stop" name="stop" type="date" defaultValue={stopValue} />
            </div>

            <button type="submit" className={buttonVariants({ variant: "outline" })}>
              ค้นหา
            </button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ตำแหน่งงาน</TableHead>
                <TableHead>เลขบัตรประชาชน</TableHead>
                <TableHead>คำนำหน้า ชื่อ สกุล (ไทย)</TableHead>
                <TableHead>วันเกิด</TableHead>
                <TableHead>วันที่เริ่มงาน</TableHead>
                <TableHead>โทรศัพท์มือถือ</TableHead>
                <TableHead>ที่อยู่</TableHead>
                <TableHead>วุฒิการศึกษา</TableHead>
                <TableHead>ผู้ค้ำประกัน</TableHead>
                <TableHead>โทรศัพท์ผู้ค้ำ</TableHead>
                <TableHead>บัญชีธนาคาร</TableHead>
                <TableHead>หมายเลขบัญชี</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12} className="py-10 text-center whitespace-normal text-muted-foreground">
                    {query || startValue || stopValue
                      ? "ไม่พบข้อมูลผู้ประกันตนที่ตรงกับเงื่อนไขที่เลือก"
                      : "ยังไม่มีข้อมูลผู้ประกันตน"}
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
                    <TableCell>{applicant.mobilePhone ?? "-"}</TableCell>
                    <TableCell className="min-w-52 whitespace-normal">{formatAddress(applicant)}</TableCell>
                    <TableCell className="whitespace-normal">{applicant.educationLevel ?? "-"}</TableCell>
                    <TableCell className="whitespace-normal">{guarantor?.guarantorName ?? "-"}</TableCell>
                    <TableCell>{guarantor?.guarantorPhone ?? "-"}</TableCell>
                    <TableCell className="whitespace-normal">{r.bankName ?? "-"}</TableCell>
                    <TableCell>{r.bankAccountNo ?? "-"}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

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
              searchParams={{ q: query, start: startValue, stop: stopValue }}
            />
          </div>
        </CardContent>
      </Card>
    </>
  )
}