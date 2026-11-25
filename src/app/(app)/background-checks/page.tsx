import { IdCard, Pencil, Plus, Printer, Search } from "lucide-react"
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
import { hasRole } from "@/lib/permissions"
import { requireUser } from "@/lib/session"
import { DeleteBackgroundCheckButton } from "./delete-background-check-button"
import { BACKGROUND_CHECK_EDITORS } from "./permissions"

export const metadata: Metadata = { title: "มอบอำนาจและตรวจประวัติ" }

const PAGE_SIZE = 20

/**
 * หน้ารายการหนังสือมอบอำนาจและตรวจประวัติ (#11)
 * - ค้นหาด้วยชื่อผู้มอบอำนาจ (ผู้สมัคร) ผู้รับมอบอำนาจ หรือหน่วยงาน (?q=) แบ่งหน้าละ 20 (?page=)
 * - admin/hr เพิ่ม/แก้/ลบ/พิมพ์ได้ viewer ดูรายการอย่างเดียว
 */
export default async function BackgroundChecksPage({ searchParams }: PageProps<"/background-checks">) {
  const user = await requireUser()
  const canEdit = hasRole(user.role, BACKGROUND_CHECK_EDITORS)
  const { q, page: pageParam } = await searchParams
  const query = typeof q === "string" ? q.trim() : ""

  const where: Prisma.BackgroundCheckAuthorizationWhereInput | undefined = query
    ? {
        OR: [
          { granteeName: { contains: query, mode: "insensitive" } },
          { interview: { documentCheck: { applicant: { fullNameTh: { contains: query, mode: "insensitive" } } } } },
          { interview: { customer: { name: { contains: query, mode: "insensitive" } } } },
        ],
      }
    : undefined

  const total = await db.backgroundCheckAuthorization.count({ where })
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const page = Math.min(parsePage(pageParam), totalPages)

  const records = await db.backgroundCheckAuthorization.findMany({
    where,
    orderBy: [{ documentDate: { sort: "desc", nulls: "last" } }, { id: "desc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      documentDate: true,
      granteeName: true,
      interview: {
        select: {
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
        icon={IdCard}
        title="มอบอำนาจและตรวจประวัติ"
        description="หนังสือมอบอำนาจและหนังสือยินยอมให้ตรวจประวัติอาชญากรรม"
        actions={
          canEdit && (
            <Link href="/background-checks/new" className={buttonVariants()}>
              <Plus />
              ทำหนังสือใหม่
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
              placeholder="ค้นหาชื่อผู้มอบ ผู้รับมอบ หรือหน่วยงาน แล้วกด Enter"
              className="pl-8"
              aria-label="ค้นหาหนังสือมอบอำนาจ"
            />
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">เลขที่</TableHead>
                <TableHead className="hidden md:table-cell">วันที่ทำหนังสือ</TableHead>
                <TableHead className="min-w-32">ผู้มอบอำนาจ</TableHead>
                <TableHead className="hidden lg:table-cell">ผู้รับมอบอำนาจ</TableHead>
                <TableHead className="hidden xl:table-cell">หน่วยงาน</TableHead>
                {canEdit && <TableHead className="w-8 sm:w-28" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center whitespace-normal text-muted-foreground">
                    {query ? `ไม่พบหนังสือที่ตรงกับ “${query}”` : "ยังไม่มีหนังสือมอบอำนาจ"}
                  </TableCell>
                </TableRow>
              )}
              {records.map((r) => {
                const grantor = r.interview.documentCheck.applicant.fullNameTh
                const customer = r.interview.customer?.name
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.id}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatThaiDate(r.documentDate)}</TableCell>
                    <TableCell className="whitespace-normal">
                      {canEdit ? (
                        <Link href={`/background-checks/${r.id}/edit`} className="font-medium hover:text-primary hover:underline">
                          {grantor}
                        </Link>
                      ) : (
                        <span className="font-medium">{grantor}</span>
                      )}
                      {/* จอเล็กซ่อนคอลัมน์ จึงแสดงข้อมูลใต้ชื่อแทน */}
                      <div className="text-xs text-muted-foreground">
                        <span className="md:hidden">{formatThaiDate(r.documentDate)}</span>
                        {r.granteeName && <span className="lg:hidden"> · มอบให้ {r.granteeName}</span>}
                        {customer && <span className="xl:hidden"> · {customer}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="hidden whitespace-normal lg:table-cell">{r.granteeName ?? "-"}</TableCell>
                    <TableCell className="hidden whitespace-normal xl:table-cell">{customer ?? "-"}</TableCell>
                    {canEdit && (
                      <TableCell>
                        <div className="flex flex-col items-end gap-1 sm:flex-row sm:justify-end">
                          <Link
                            href={`/background-checks/${r.id}/print`}
                            // ห้าม prefetch: หน้าพิมพ์บันทึก audit "export" ตอนเปิด
                            prefetch={false}
                            target="_blank"
                            className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                            aria-label={`พิมพ์หนังสือเลขที่ ${r.id}`}
                          >
                            <Printer />
                          </Link>
                          <Link
                            href={`/background-checks/${r.id}/edit`}
                            className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                            aria-label={`แก้ไขหนังสือเลขที่ ${r.id}`}
                          >
                            <Pencil />
                          </Link>
                          <DeleteBackgroundCheckButton id={r.id} name={grantor} />
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
            <Pagination page={page} totalPages={totalPages} basePath="/background-checks" searchParams={{ q: query }} />
          </div>
        </CardContent>
      </Card>
    </>
  )
}
