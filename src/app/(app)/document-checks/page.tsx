import { CheckCircle2, Clock, FileCheck2, Pencil, Plus, Search } from "lucide-react"
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
import { hasRole, toRole } from "@/lib/permissions"
import { requireUser } from "@/lib/session"
import { DeleteDocumentCheckButton } from "./delete-document-check-button"
import { DOCUMENT_CHECK_EDITORS } from "./permissions"

export const metadata: Metadata = { title: "ตรวจเอกสารสมัครงาน" }

const PAGE_SIZE = 20
const MAX_PG_INT = 2_147_483_647

function countCheckedDocs(item: {
  hasPhoto: boolean
  hasIdCard: boolean
  hasHouseRegistration: boolean
  hasEducationCert: boolean
  hasCarLicense: boolean
  hasMotorcycleLicense: boolean
  hasDisabilityCard: boolean
  hasMilitaryDoc: boolean
  hasOther: boolean
}) {
  return [
    item.hasPhoto,
    item.hasIdCard,
    item.hasHouseRegistration,
    item.hasEducationCert,
    item.hasCarLicense,
    item.hasMotorcycleLicense,
    item.hasDisabilityCard,
    item.hasMilitaryDoc,
    item.hasOther,
  ].filter(Boolean).length
}

export default async function DocumentChecksPage({ searchParams }: PageProps<"/document-checks">) {
  const user = await requireUser()
  const canEdit = hasRole(toRole(user.role), DOCUMENT_CHECK_EDITORS)
  const { q, page: pageParam } = await searchParams
  const query = typeof q === "string" ? q.trim() : ""
  const digits = query.replace(/[\s-]/g, "")
  const parsedInt = /^\d+$/.test(query) ? Number(query) : null
  const numericQuery = parsedInt !== null && parsedInt > 0 && parsedInt <= MAX_PG_INT ? parsedInt : null

  const where: Prisma.DocumentCheckWhereInput | undefined = query
    ? {
        OR: [
          ...(numericQuery ? [{ id: numericQuery }, { applicantId: numericQuery }] : []),
          ...(/^\d+$/.test(digits) ? [{ applicant: { nationalId: { contains: digits } } }] : []),
          { applicant: { fullNameTh: { contains: query, mode: "insensitive" } } },
          { applicant: { position: { contains: query, mode: "insensitive" } } },
          { checkedBy: { name: { contains: query, mode: "insensitive" } } },
        ],
      }
    : undefined

  const total = await db.documentCheck.count({ where })
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const page = Math.min(parsePage(pageParam), totalPages)

  const documentChecks = await db.documentCheck.findMany({
    where,
    orderBy: [{ checkedAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: {
      applicant: { select: { id: true, fullNameTh: true, position: true, appliedAt: true } },
      checkedBy: { select: { id: true, code: true, name: true } },
    },
  })

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)

  return (
    <>
      <PageHeader
        icon={FileCheck2}
        title="ตรวจเอกสารสมัครงาน"
        description="ตรวจสอบความครบถ้วนของเอกสารประกอบการสมัครงานก่อนนัดสัมภาษณ์"
        actions={
          canEdit && (
            <Link href="/document-checks/new" className={buttonVariants()}>
              <Plus />
              เพิ่มแบบตรวจเอกสาร
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
              placeholder="ค้นหาเลขที่แบบตรวจ ชื่อผู้สมัคร เลขบัตร หรือผู้ตรวจ"
              className="pl-8"
              aria-label="ค้นหาแบบตรวจเอกสาร"
            />
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">เลขที่แบบตรวจ</TableHead>
                <TableHead>ผู้สมัครงาน</TableHead>
                <TableHead className="hidden md:table-cell">วันที่ตรวจ</TableHead>
                <TableHead className="hidden lg:table-cell">รายการที่ตรวจ</TableHead>
                <TableHead className="hidden lg:table-cell">ผู้ตรวจ</TableHead>
                <TableHead>สถานะ</TableHead>
                {canEdit && <TableHead className="w-24" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {documentChecks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canEdit ? 7 : 6} className="py-10 text-center text-muted-foreground">
                    {query ? `ไม่พบแบบตรวจเอกสารที่ตรงกับ “${query}”` : "ยังไม่มีข้อมูลการตรวจเอกสารสมัครงาน"}
                  </TableCell>
                </TableRow>
              )}
              {documentChecks.map((item) => {
                const checkedCount = countCheckedDocs(item)
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">DC-{String(item.id).padStart(4, "0")}</TableCell>
                    <TableCell>
                      <div className="font-medium">{item.applicant.fullNameTh}</div>
                      <div className="text-xs text-muted-foreground">
                        รหัสผู้สมัคร #{item.applicant.id}
                        {item.applicant.position ? ` · ตำแหน่ง ${item.applicant.position}` : ""}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{formatThaiDate(item.checkedAt)}</TableCell>
                    <TableCell className="hidden lg:table-cell">{checkedCount} / 9 รายการ</TableCell>
                    <TableCell className="hidden lg:table-cell">{item.checkedBy?.name ?? "-"}</TableCell>
                    <TableCell>
                      {item.isComplete ? (
                        <Badge className="gap-1 bg-tint-green text-primary hover:bg-tint-green">
                          <CheckCircle2 className="size-3.5" />
                          ตรวจครบแล้ว
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1 text-brand-orange">
                          <Clock className="size-3.5" />
                          ยังไม่ครบ
                        </Badge>
                      )}
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <Link
                          href={`/document-checks/${item.id}/edit`}
                          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                          aria-label={`แก้ไขแบบตรวจเอกสารเลขที่ ${item.id}`}
                        >
                          <Pencil />
                        </Link>
                        <DeleteDocumentCheckButton id={item.id} applicantName={item.applicant.fullNameTh} />
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
            <Pagination page={page} totalPages={totalPages} basePath="/document-checks" searchParams={{ q: query }} />
          </div>
        </CardContent>
      </Card>
    </>
  )
}