import { FileText, Pencil, Plus, Search } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { Pagination, parsePage } from "@/components/pagination"
import { Badge } from "@/components/ui/badge"
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
import { cn } from "@/lib/utils"
import { DeleteApplicantButton } from "./delete-applicant-button"
import { APPLICANT_EDITORS } from "./permissions"
import { applicantStatusInclude, getApplicantStatus, type ApplicantStatusTone } from "./status"

export const metadata: Metadata = { title: "ใบสมัครงาน" }

const PAGE_SIZE = 20

const STATUS_STYLES: Record<ApplicantStatusTone, string> = {
  draft: "border border-dashed border-muted-foreground/40 bg-card text-muted-foreground",
  pending: "bg-muted text-muted-foreground",
  warning: "bg-tint-orange text-brand-orange-dark",
  info: "bg-tint-blue text-foreground",
  success: "bg-tint-green text-brand-green-dark",
  danger: "bg-destructive/10 text-destructive",
}

/**
 * หน้ารายการใบสมัครงาน (#4)
 * - ค้นหาด้วยชื่อ เลขบัตร หรือเบอร์มือถือ (?q=) แบ่งหน้าละ 20 รายการ (?page=)
 * - เลขบัตรในตารางซ่อนเหลือ 3 ตัวท้าย (PDPA)
 * - admin/hr เพิ่ม/แก้/ลบได้ viewer ดูรายการอย่างเดียว
 */
export default async function ApplicantsPage({ searchParams }: PageProps<"/applicants">) {
  const user = await requireUser()
  const canEdit = hasRole(user.role, APPLICANT_EDITORS)
  const { q, page: pageParam } = await searchParams
  const query = typeof q === "string" ? q.trim() : ""
  const digits = query.replace(/[\s-]/g, "")

  const where: Prisma.ApplicantWhereInput | undefined = query
    ? {
        OR: [
          { fullNameTh: { contains: query, mode: "insensitive" } },
          { fullNameEn: { contains: query, mode: "insensitive" } },
          { mobilePhone: { contains: query } },
          // พิมพ์เลขบัตร/เบอร์โทรแบบมีขีดหรือเว้นวรรคก็ค้นเจอ
          ...(/^\d+$/.test(digits)
            ? [{ nationalId: { contains: digits } }, { mobilePhone: { contains: digits } }]
            : []),
        ],
      }
    : undefined

  const total = await db.applicant.count({ where })
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const page = Math.min(parsePage(pageParam), totalPages)

  const applicants = await db.applicant.findMany({
    where,
    orderBy: [{ appliedAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      appliedAt: true,
      fullNameTh: true,
      nationalId: true,
      position: true,
      mobilePhone: true,
      isDraft: true,
      ...applicantStatusInclude,
    },
  })

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)

  return (
    <>
      <PageHeader
        icon={FileText}
        title="ใบสมัครงาน"
        description="บันทึกและค้นหาใบสมัครงาน (Application Form)"
        actions={
          canEdit && (
            <Link href="/applicants/new" className={buttonVariants()}>
              <Plus />
              เพิ่มใบสมัคร
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
              placeholder="ค้นหาชื่อ เลขบัตร หรือเบอร์มือถือ แล้วกด Enter"
              className="pl-8"
              aria-label="ค้นหาผู้สมัคร"
            />
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">เลขที่</TableHead>
                <TableHead className="hidden lg:table-cell">วันที่สมัคร</TableHead>
                <TableHead className="min-w-32 sm:min-w-44">ชื่อ-สกุล</TableHead>
                <TableHead className="hidden xl:table-cell">ตำแหน่ง</TableHead>
                <TableHead className="hidden lg:table-cell">มือถือ</TableHead>
                <TableHead>สถานะ</TableHead>
                {canEdit && <TableHead className="w-8 sm:w-20" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {applicants.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center whitespace-normal text-muted-foreground">
                    {query ? `ไม่พบผู้สมัครที่ตรงกับ “${query}”` : "ยังไม่มีใบสมัครงาน"}
                  </TableCell>
                </TableRow>
              )}
              {applicants.map((a) => {
                const status = getApplicantStatus(a)
                return (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.id}</TableCell>
                    <TableCell className="hidden lg:table-cell">{formatThaiDate(a.appliedAt)}</TableCell>
                    <TableCell className="whitespace-normal">
                      {canEdit ? (
                        <Link href={`/applicants/${a.id}/edit`} className="font-medium hover:text-primary hover:underline">
                          {a.fullNameTh}
                        </Link>
                      ) : (
                        <span className="font-medium">{a.fullNameTh}</span>
                      )}
                      <div className="text-xs text-muted-foreground">
                        <span className="font-mono whitespace-nowrap">{maskNationalId(a.nationalId)}</span>
                        {/* จอเล็กซ่อนคอลัมน์ จึงแสดงข้อมูลสำคัญใต้ชื่อแทน */}
                        <span className="lg:hidden"> · {formatThaiDate(a.appliedAt)}</span>
                        {a.position && <span className="xl:hidden"> · {a.position}</span>}
                        {a.mobilePhone && <span className="lg:hidden"> · {a.mobilePhone}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">{a.position ?? "-"}</TableCell>
                    <TableCell className="hidden lg:table-cell">{a.mobilePhone ?? "-"}</TableCell>
                    <TableCell>
                      <Badge className={cn("h-auto whitespace-normal text-left", STATUS_STYLES[status.tone])}>{status.label}</Badge>
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        {/* จอเล็กเรียงปุ่มแนวตั้ง ไม่ให้ตารางล้นขอบ */}
                        <div className="flex flex-col items-end gap-1 sm:flex-row sm:justify-end">
                        <Link
                          href={`/applicants/${a.id}/edit`}
                          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                          aria-label={`แก้ไข ${a.fullNameTh}`}
                        >
                          <Pencil />
                        </Link>
                        <DeleteApplicantButton id={a.id} name={a.fullNameTh} />
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
            <Pagination page={page} totalPages={totalPages} basePath="/applicants" searchParams={{ q: query }} />
          </div>
        </CardContent>
      </Card>
    </>
  )
}
