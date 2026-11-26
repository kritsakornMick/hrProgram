import { Handshake, Pencil, Plus, Search } from "lucide-react"
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
import { requireUser } from "@/lib/session"
import { DeleteInterviewButton } from "./delete-interview-button"

export const metadata: Metadata = { title: "สัมภาษณ์งาน" }

function getResultBadgeVariant(result: string | null) {
  if (result === "ผ่าน") return "default"
  if (result === "ไม่ผ่าน") return "destructive"
  return "secondary"
}

export default async function InterviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const user = await requireUser()
  const canManage = user.role === "admin" || user.role === "hr"
  const { q } = await searchParams
  const keyword = q?.trim() || ""

  const interviews = await db.interview.findMany({
    where: keyword
      ? {
          OR: [
            { position: { contains: keyword, mode: "insensitive" } },
            { result: { contains: keyword, mode: "insensitive" } },
            { documentCheck: { applicant: { fullNameTh: { contains: keyword, mode: "insensitive" } } } },
            { customer: { name: { contains: keyword, mode: "insensitive" } } },
          ],
        }
      : undefined,
    include: {
      documentCheck: {
        include: {
          applicant: {
            select: {
              fullNameTh: true,
              position: true,
            },
          },
        },
      },
      customer: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { id: "desc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          icon={Handshake}
          title="สัมภาษณ์งาน"
          description="บันทึกผลการสัมภาษณ์ การบรรจุเข้าหน่วยงานลูกค้า และผลการประเมินผู้สมัครงาน"
        />

        {canManage && (
          <Link href="/interviews/new" className={buttonVariants({ size: "lg" })}>
            <Plus />
            บันทึกผลการสัมภาษณ์
          </Link>
        )}
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <form method="get" className="relative max-w-md">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={keyword}
              placeholder="ค้นหาชื่อผู้สมัคร ตำแหน่ง หน่วยงาน หรือผลการสัมภาษณ์..."
              className="pl-9"
            />
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">รหัส</TableHead>
                <TableHead>ชื่อ-สกุลผู้สมัคร</TableHead>
                <TableHead>ตำแหน่ง / หน่วยงานลูกค้า</TableHead>
                <TableHead>วันที่สัมภาษณ์</TableHead>
                <TableHead>ผลการสัมภาษณ์</TableHead>
                <TableHead>สถานะการจ้างงาน</TableHead>
                {canManage && <TableHead className="w-24 text-center">จัดการ</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {interviews.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canManage ? 7 : 6} className="py-10 text-center text-muted-foreground">
                    ไม่พบข้อมูลการสัมภาษณ์งาน
                  </TableCell>
                </TableRow>
              )}

              {interviews.map((item) => {
                const applicantName = item.documentCheck.applicant.fullNameTh
                const positionLabel = item.position || item.documentCheck.applicant.position || "-"
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">INT{String(item.id).padStart(3, "0")}</TableCell>
                    <TableCell>
                      <div className="font-medium">{applicantName}</div>
                      <div className="text-xs text-muted-foreground">
                        เอกสาร DOC{String(item.documentCheckId).padStart(3, "0")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>{positionLabel}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.customer ? item.customer.name : "ยังไม่ระบุหน่วยงาน"}
                      </div>
                    </TableCell>
                    <TableCell>{item.interviewedAt ? formatThaiDate(item.interviewedAt) : "-"}</TableCell>
                    <TableCell>
                      {item.result ? (
                        <Badge variant={getResultBadgeVariant(item.result)}>{item.result}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{item.employmentStatus || "-"}</TableCell>
                    {canManage && (
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Link
                            href={`/interviews/${item.id}/edit`}
                            className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                            aria-label={`แก้ไขข้อมูลสัมภาษณ์ของ ${applicantName}`}
                          >
                            <Pencil />
                          </Link>
                          <DeleteInterviewButton interviewId={item.id} applicantName={applicantName} />
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          <div className="text-sm text-muted-foreground">ทั้งหมด {interviews.length} รายการ</div>
        </CardContent>
      </Card>
    </div>
  )
}