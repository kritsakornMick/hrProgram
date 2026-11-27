import { Pencil, Plus, Printer, Search, ShieldCheck } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { Pagination, parsePage } from "@/components/pagination"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Prisma } from "@/generated/prisma/client"
import { formatThaiDate } from "@/lib/dates"
import { db } from "@/lib/db"
import { maskNationalId } from "@/lib/pdpa"
import { hasRole } from "@/lib/permissions"
import { requireUser } from "@/lib/session"
import { DeleteGuaranteeContractButton } from "./delete-button"
import { GUARANTEE_CONTRACT_EDITORS } from "./permissions"
import { parsePositiveInt } from "./schema"

export const metadata: Metadata = { title: "สัญญาค้ำประกันบุคคลเข้าทำงาน" }

const PAGE_SIZE = 20

export default async function GuaranteeContractsPage({ searchParams }: PageProps<"/guarantee-contracts">) {
  const user = await requireUser()
  const canEdit = hasRole(user.role, GUARANTEE_CONTRACT_EDITORS)
  const { q, page: pageParam } = await searchParams
  const query = typeof q === "string" ? q.trim() : ""

  const numericId = query ? parsePositiveInt(query.replace(/^GC-0*/i, "")) : null

  const where: Prisma.GuaranteeContractWhereInput | undefined = query
    ? {
        OR: [
          ...(numericId ? [{ id: numericId }] : []),
          { guarantorName: { contains: query, mode: "insensitive" } },
          { guarantorNationalId: { contains: query } },
          { guarantorPhone: { contains: query } },
          { interview: { documentCheck: { applicant: { fullNameTh: { contains: query, mode: "insensitive" } } } } },
          { interview: { customer: { name: { contains: query, mode: "insensitive" } } } },
        ],
      }
    : undefined

  const total = await db.guaranteeContract.count({ where })
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const page = Math.min(parsePage(pageParam), totalPages)

  const records = await db.guaranteeContract.findMany({
    where,
    orderBy: [{ contractDate: { sort: "desc", nulls: "last" } }, { id: "desc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      contractDate: true,
      guarantorName: true,
      guarantorNationalId: true,
      guarantorPhone: true,
      interview: {
        select: {
          position: true,
          customer: { select: { name: true } },
          documentCheck: { select: { applicant: { select: { fullNameTh: true } } } },
        },
      },
    },
  })

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)

  return (
    <>
      <PageHeader
        icon={ShieldCheck}
        title="สัญญาค้ำประกันบุคคลเข้าทำงาน"
        description="จัดการข้อมูลสัญญาค้ำประกันและผู้ค้ำประกันบุคคลเข้าทำงาน"
        actions={
          canEdit && (
            <Link href="/guarantee-contracts/new" className={buttonVariants()}>
              <Plus />
              ทำสัญญาค้ำประกัน
            </Link>
          )
        }
      />

      <Card>
        <CardContent className="space-y-4">
          <form className="relative max-w-md">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={query}
              placeholder="ค้นหาเลขที่สัญญา ผู้ถูกค้ำ ผู้ค้ำประกัน หรือเลขบัตร"
              className="pl-8"
              aria-label="ค้นหาสัญญาค้ำประกัน"
            />
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">เลขที่สัญญา</TableHead>
                <TableHead className="hidden md:table-cell">วันที่ทำสัญญา</TableHead>
                <TableHead className="min-w-36">ผู้ถูกค้ำประกัน</TableHead>
                <TableHead className="min-w-36">ผู้ค้ำประกัน</TableHead>
                <TableHead className="hidden lg:table-cell">หน่วยงาน / ตำแหน่ง</TableHead>
                {canEdit && <TableHead className="w-8 sm:w-28" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center whitespace-normal text-muted-foreground">
                    {query ? `ไม่พบสัญญาค้ำประกันที่ตรงกับ “${query}”` : "ยังไม่มีสัญญาค้ำประกัน"}
                  </TableCell>
                </TableRow>
              )}
              {records.map((r) => {
                const applicantName = r.interview.documentCheck.applicant.fullNameTh
                const guarantorName = r.guarantorName ?? "-"
                const customer = r.interview.customer?.name
                const position = r.interview.position
                const contractNo = `GC-${String(r.id).padStart(4, "0")}`
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{contractNo}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatThaiDate(r.contractDate)}</TableCell>
                    <TableCell className="whitespace-normal">
                      {canEdit ? (
                        <Link href={`/guarantee-contracts/${r.id}/edit`} className="font-medium hover:text-primary hover:underline">
                          {applicantName}
                        </Link>
                      ) : (
                        <span className="font-medium">{applicantName}</span>
                      )}
                      <div className="text-xs text-muted-foreground">
                        <span className="md:hidden">{formatThaiDate(r.contractDate)}</span>
                        {customer && <span className="lg:hidden"> · {customer}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      <div className="font-medium">{guarantorName}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.guarantorNationalId ? maskNationalId(r.guarantorNationalId) : null}
                        {r.guarantorPhone ? ` · ${r.guarantorPhone}` : null}
                      </div>
                    </TableCell>
                    <TableCell className="hidden whitespace-normal lg:table-cell">
                      <div>{customer ?? "-"}</div>
                      {position && <div className="text-xs text-muted-foreground">{position}</div>}
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        <div className="flex flex-col items-end gap-1 sm:flex-row sm:justify-end">
                          <Link
                            href={`/guarantee-contracts/${r.id}/print`}
                            // ห้าม prefetch: หน้าพิมพ์บันทึก audit "export" ตอนเปิด
                            prefetch={false}
                            target="_blank"
                            className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                            aria-label={`พิมพ์สัญญา ${contractNo}`}
                          >
                            <Printer />
                          </Link>
                          <Link
                            href={`/guarantee-contracts/${r.id}/edit`}
                            className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                            aria-label={`แก้ไขสัญญา ${contractNo}`}
                          >
                            <Pencil />
                          </Link>
                          <DeleteGuaranteeContractButton id={r.id} label={`${contractNo} (${guarantorName})`} />
                        </div>
                      </TableCell>
                    )}
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
            <Pagination page={page} totalPages={totalPages} basePath="/guarantee-contracts" searchParams={{ q: query }} />
          </div>
        </CardContent>
      </Card>
    </>
  )
}