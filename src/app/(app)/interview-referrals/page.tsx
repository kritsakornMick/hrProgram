import { Pencil, Plus, Printer, Search, Send } from "lucide-react"
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
import { DeleteReferralButton } from "./delete-referral-button"
import { REFERRAL_EDITORS } from "./permissions"

export const metadata: Metadata = { title: "หนังสือส่งตัวเพื่อเข้าสัมภาษณ์" }

const PAGE_SIZE = 20

/**
 * หน้ารายการหนังสือส่งตัวพนักงานเพื่อเข้าสัมภาษณ์ (#9)
 * - ค้นหาด้วยชื่อพนักงาน หน่วยงาน เรียน หรือเลขที่หนังสือ (?q=) แบ่งหน้าละ 20 (?page=)
 * - admin/hr เพิ่ม/แก้/ลบ/พิมพ์ได้ viewer ดูรายการอย่างเดียว
 */
export default async function InterviewReferralsPage({ searchParams }: PageProps<"/interview-referrals">) {
  const user = await requireUser()
  const canEdit = hasRole(user.role, REFERRAL_EDITORS)
  const { q, page: pageParam } = await searchParams
  const query = typeof q === "string" ? q.trim() : ""

  const where: Prisma.InterviewReferralLetterWhereInput | undefined = query
    ? {
        OR: [
          { letterNo: { contains: query, mode: "insensitive" } },
          { addressedTo: { contains: query, mode: "insensitive" } },
          { interview: { documentCheck: { applicant: { fullNameTh: { contains: query, mode: "insensitive" } } } } },
          { interview: { customer: { name: { contains: query, mode: "insensitive" } } } },
        ],
      }
    : undefined

  const total = await db.interviewReferralLetter.count({ where })
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const page = Math.min(parsePage(pageParam), totalPages)

  const records = await db.interviewReferralLetter.findMany({
    where,
    orderBy: [{ documentDate: { sort: "desc", nulls: "last" } }, { id: "desc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      letterNo: true,
      documentDate: true,
      addressedTo: true,
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
        icon={Send}
        title="หนังสือส่งตัวเพื่อเข้าสัมภาษณ์"
        description="หนังสือขอจัดส่งพนักงานไปสัมภาษณ์ที่หน่วยงานลูกค้า"
        actions={
          canEdit && (
            <Link href="/interview-referrals/new" className={buttonVariants()}>
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
              placeholder="ค้นหาชื่อพนักงาน หน่วยงาน เรียน หรือเลขที่หนังสือ"
              className="pl-8"
              aria-label="ค้นหาหนังสือส่งตัว"
            />
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">ลำดับ</TableHead>
                <TableHead className="hidden md:table-cell">วันที่ทำหนังสือ</TableHead>
                <TableHead className="min-w-32">พนักงาน</TableHead>
                <TableHead className="hidden lg:table-cell">หน่วยงาน / ตำแหน่ง</TableHead>
                <TableHead className="hidden xl:table-cell">เรียน</TableHead>
                {canEdit && <TableHead className="w-8 sm:w-28" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center whitespace-normal text-muted-foreground">
                    {query ? `ไม่พบหนังสือที่ตรงกับ “${query}”` : "ยังไม่มีหนังสือส่งตัว"}
                  </TableCell>
                </TableRow>
              )}
              {records.map((r) => {
                const name = r.interview.documentCheck.applicant.fullNameTh
                const customer = r.interview.customer?.name
                const position = r.interview.position
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.id}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {formatThaiDate(r.documentDate)}
                      {r.letterNo && <div className="text-xs text-muted-foreground">ที่ {r.letterNo}</div>}
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      {canEdit ? (
                        <Link href={`/interview-referrals/${r.id}/edit`} className="font-medium hover:text-primary hover:underline">
                          {name}
                        </Link>
                      ) : (
                        <span className="font-medium">{name}</span>
                      )}
                      {/* จอเล็กซ่อนคอลัมน์ จึงแสดงข้อมูลใต้ชื่อแทน */}
                      <div className="text-xs text-muted-foreground">
                        <span className="md:hidden">{formatThaiDate(r.documentDate)}</span>
                        {customer && <span className="lg:hidden"> · {customer}</span>}
                        {r.addressedTo && <span className="xl:hidden"> · เรียน {r.addressedTo}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="hidden whitespace-normal lg:table-cell">
                      <div>{customer ?? "-"}</div>
                      {position && <div className="text-xs text-muted-foreground">{position}</div>}
                    </TableCell>
                    <TableCell className="hidden whitespace-normal xl:table-cell">{r.addressedTo ?? "-"}</TableCell>
                    {canEdit && (
                      <TableCell>
                        <div className="flex flex-col items-end gap-1 sm:flex-row sm:justify-end">
                          <Link
                            href={`/interview-referrals/${r.id}/print`}
                            // ห้าม prefetch: หน้าพิมพ์บันทึก audit "export" ตอนเปิด
                            prefetch={false}
                            target="_blank"
                            className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                            aria-label={`พิมพ์หนังสือลำดับที่ ${r.id}`}
                          >
                            <Printer />
                          </Link>
                          <Link
                            href={`/interview-referrals/${r.id}/edit`}
                            className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                            aria-label={`แก้ไขหนังสือลำดับที่ ${r.id}`}
                          >
                            <Pencil />
                          </Link>
                          <DeleteReferralButton id={r.id} name={name} />
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
            <Pagination page={page} totalPages={totalPages} basePath="/interview-referrals" searchParams={{ q: query }} />
          </div>
        </CardContent>
      </Card>
    </>
  )
}
