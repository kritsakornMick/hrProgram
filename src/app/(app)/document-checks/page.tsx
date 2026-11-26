import { CheckCircle2, Clock, FileCheck2, Pencil, Plus, Search } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatThaiDate } from "@/lib/dates"
import { db } from "@/lib/db"
import { hasRole, toRole } from "@/lib/permissions"
import { requireUser } from "@/lib/session"
import { DeleteDocumentCheckButton } from "./delete-document-check-button"

export const metadata: Metadata = { title: "ตรวจเอกสารสมัครงาน" }

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
  const canEdit = hasRole(toRole(user.role), ["admin", "hr"])
  const { q } = await searchParams
  const query = typeof q === "string" ? q.trim() : ""
  const numericQuery = /^\d+$/.test(query) ? Number(query) : null

  const documentChecks = await db.documentCheck.findMany({
    where: query
      ? {
          OR: [
            ...(numericQuery ? [{ id: numericQuery }, { applicantId: numericQuery }] : []),
            { applicant: { fullNameTh: { contains: query, mode: "insensitive" } } },
            { applicant: { position: { contains: query, mode: "insensitive" } } },
            { checkedBy: { name: { contains: query, mode: "insensitive" } } },
          ],
        }
      : undefined,
    orderBy: [{ checkedAt: "desc" }, { id: "desc" }],
    include: {
      applicant: { select: { id: true, fullNameTh: true, position: true, appliedAt: true } },
      checkedBy: { select: { id: true, code: true, name: true } },
    },
  })

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
          <form className="relative max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={query}
              placeholder="ค้นหาเลขที่แบบตรวจ ชื่อผู้สมัคร หรือผู้ตรวจ"
              className="pl-8"
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

          <p className="text-sm text-muted-foreground">
            ทั้งหมด {documentChecks.length.toLocaleString("th-TH")} รายการ
          </p>
        </CardContent>
      </Card>
    </>
  )
}