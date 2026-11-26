import { Pencil, Plus, Search, ShieldCheck } from "lucide-react"
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
import { hasRole, toRole } from "@/lib/permissions"
import { requireUser } from "@/lib/session"
import { DeleteGuaranteeContractButton } from "./delete-guarantee-contract-button"
import { GUARANTEE_CONTRACT_EDITORS } from "./permissions"

export const metadata: Metadata = { title: "สัญญาค้ำประกันบุคคลเข้าทำงาน" }

const PAGE_SIZE = 20
const MAX_PG_INT = 2_147_483_647

export default async function GuaranteeContractsPage({ searchParams }: PageProps<"/guarantee-contracts">) {
  const user = await requireUser()
  const canEdit = hasRole(toRole(user.role), GUARANTEE_CONTRACT_EDITORS)
  const { q, page: pageParam } = await searchParams
  const query = typeof q === "string" ? q.trim() : ""
  const digits = query.replace(/[\s-]/g, "")
  const parsedInt = /^\d+$/.test(query) ? Number(query) : null
  const numericQuery = parsedInt !== null && parsedInt > 0 && parsedInt <= MAX_PG_INT ? parsedInt : null

  const where: Prisma.GuaranteeContractWhereInput | undefined = query
    ? {
        OR: [
          ...(numericQuery ? [{ id: numericQuery }, { interviewId: numericQuery }] : []),
          ...(/^\d+$/.test(digits)
            ? [
                { guarantorNationalId: { contains: digits } },
                { interview: { documentCheck: { applicant: { nationalId: { contains: digits } } } } },
              ]
            : []),
          { guarantorName: { contains: query, mode: "insensitive" } },
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
          customer: { select: { name: true } },
          documentCheck: {
            select: {
              applicant: { select: { fullNameTh: true, position: true } },
            },
          },
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
        description="บันทึกและจัดการข้อมูลผู้ค้ำประกันบุคคลเข้าทำงาน"
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
              placeholder="ค้นหาเลขที่สัญญา ชื่อผู้สมัคร ผู้ค้ำ หรือเลขบัตร"
              className="pl-8"
              aria-label="ค้นหาสัญญาค้ำประกัน"
            />
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">เลขที่สัญญา</TableHead>
                <TableHead className="hidden md:table-cell">วันที่ทำสัญญา</TableHead>
                <TableHead className="min-w-36">ผู้ถูกค้ำประกัน (ผู้สมัคร)</TableHead>
                <TableHead className="min-w-36">ผู้ค้ำประกัน</TableHead>
                <TableHead className="hidden lg:table-cell">เบอร์โทรผู้ค้ำ</TableHead>
                <TableHead className="hidden xl:table-cell">หน่วยงาน</TableHead>
                {canEdit && <TableHead className="w-24" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canEdit ? 7 : 6} className="py-10 text-center whitespace-normal text-muted-foreground">
                    {query ? `ไม่พบสัญญาค้ำประกันที่ตรงกับ “${query}”` : "ยังไม่มีข้อมูลสัญญาค้ำประกันบุคคลเข้าทำงาน"}
                  </TableCell>
                </TableRow>
              )}
              {records.map((r) => {
                const applicant = r.interview.documentCheck.applicant
                const customer = r.interview.customer?.name
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">GC-{String(r.id).padStart(4, "0")}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatThaiDate(r.contractDate)}</TableCell>
                    <TableCell className="whitespace-normal">
                      {canEdit ? (
                        <Link href={`/guarantee-contracts/${r.id}/edit`} className="font-medium hover:text-primary hover:underline">
                          {applicant.fullNameTh}
                        </Link>
                      ) : (
                        <span className="font-medium">{applicant.fullNameTh}</span>
                      )}
                      <div className="text-xs text-muted-foreground">
                        <span className="md:hidden">{formatThaiDate(r.contractDate)}</span>
                        {applicant.position && <span>{r.contractDate ? ` · ${applicant.position}` : applicant.position}</span>}
                        {customer && <span className="xl:hidden"> · {customer}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      <div className="font-medium">{r.guarantorName ?? "-"}</div>
                      {r.guarantorNationalId && (
                        <div className="font-mono text-xs text-muted-foreground">{maskNationalId(r.guarantorNationalId)}</div>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{r.guarantorPhone ?? "-"}</TableCell>
                    <TableCell className="hidden whitespace-normal xl:table-cell">{customer ?? "-"}</TableCell>
                    {canEdit && (
                      <TableCell>
                        <div className="flex flex-col items-end gap-1 sm:flex-row sm:justify-end">
                          <Link
                            href={`/guarantee-contracts/${r.id}/edit`}
                            className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                            aria-label={`แก้ไขสัญญาค้ำประกันเลขที่ ${r.id}`}
                          >
                            <Pencil />
                          </Link>
                          <DeleteGuaranteeContractButton id={r.id} applicantName={applicant.fullNameTh} />
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