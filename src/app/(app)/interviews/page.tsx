import { Handshake, Pencil, Plus, Search } from "lucide-react"
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
import { requireUser } from "@/lib/session"
import { DeleteInterviewButton } from "./delete-interview-button"

export const metadata: Metadata = { title: "สัมภาษณ์งาน" }

const PAGE_SIZE = 20

function getResultBadgeVariant(result: string | null) {
  if (result === "ผ่าน") return "default"
  if (result === "ไม่ผ่าน") return "destructive"
  return "secondary"
}

export default async function InterviewsPage({ searchParams }: PageProps<"/interviews">) {
  const user = await requireUser()
  const canManage = user.role === "admin" || user.role === "hr"
  const { q, page: pageParam } = await searchParams
  // ?q= ซ้ำหลายครั้งจะได้เป็น array จึงต้องเช็กว่าเป็น string ก่อน
  const keyword = typeof q === "string" ? q.trim() : ""

  const where: Prisma.InterviewWhereInput | undefined = keyword
    ? {
        OR: [
          { position: { contains: keyword, mode: "insensitive" } },
          { result: { contains: keyword, mode: "insensitive" } },
          { documentCheck: { applicant: { fullNameTh: { contains: keyword, mode: "insensitive" } } } },
          { customer: { name: { contains: keyword, mode: "insensitive" } } },
        ],
      }
    : undefined

  const total = await db.interview.count({ where })
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const page = Math.min(parsePage(pageParam), totalPages)

  const interviews = await db.interview.findMany({
    where,
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
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

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)

  return (
    <>
      <PageHeader
        icon={Handshake}
        title="สัมภาษณ์งาน"
        description="บันทึกผลการสัมภาษณ์ การบรรจุเข้าหน่วยงานลูกค้า และผลการประเมินผู้สมัครงาน"
        actions={
          canManage && (
            <Link href="/interviews/new" className={buttonVariants()}>
              <Plus />
              {/* จอมือถือใช้ข้อความสั้น ไม่ให้ปุ่มเบียดชื่อหน้า */}
              <span className="sm:hidden">เพิ่ม</span>
              <span className="hidden sm:inline">บันทึกผลการสัมภาษณ์</span>
            </Link>
          )
        }
      />

      <Card>
        <CardContent className="space-y-4">
          <form method="get" className="relative max-w-md">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={keyword}
              placeholder="ค้นหาชื่อผู้สมัคร ตำแหน่ง หน่วยงาน หรือผลการสัมภาษณ์..."
              className="pl-9"
              aria-label="ค้นหาข้อมูลการสัมภาษณ์"
            />
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-20 sm:table-cell">รหัส</TableHead>
                <TableHead className="min-w-32">ชื่อ-สกุลผู้สมัคร</TableHead>
                <TableHead className="hidden lg:table-cell">ตำแหน่ง / หน่วยงานลูกค้า</TableHead>
                <TableHead className="hidden md:table-cell">วันที่สัมภาษณ์</TableHead>
                <TableHead>ผล</TableHead>
                <TableHead className="hidden xl:table-cell">สถานะการจ้างงาน</TableHead>
                {canManage && <TableHead className="w-8 sm:w-20" />}
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
                const customerLabel = item.customer ? item.customer.name : "ยังไม่ระบุหน่วยงาน"
                const interviewedLabel = item.interviewedAt ? formatThaiDate(item.interviewedAt) : "-"
                const interviewCode = `INT${String(item.id).padStart(3, "0")}`
                return (
                  <TableRow key={item.id}>
                    <TableCell className="hidden font-medium sm:table-cell">{interviewCode}</TableCell>
                    <TableCell className="whitespace-normal">
                      <div className="font-medium">{applicantName}</div>
                      <div className="text-xs text-muted-foreground">
                        <span className="sm:hidden">{interviewCode} · </span>
                        เอกสาร DC-{String(item.documentCheckId).padStart(4, "0")}
                        {/* จอเล็กซ่อนคอลัมน์ จึงแสดงข้อมูลใต้ชื่อแทน */}
                        <span className="md:hidden"> · {interviewedLabel}</span>
                        <span className="lg:hidden"> · {positionLabel} · {customerLabel}</span>
                        {item.employmentStatus && <span className="xl:hidden"> · {item.employmentStatus}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="hidden whitespace-normal lg:table-cell">
                      <div>{positionLabel}</div>
                      <div className="text-xs text-muted-foreground">{customerLabel}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{interviewedLabel}</TableCell>
                    <TableCell>
                      {item.result ? (
                        <Badge variant={getResultBadgeVariant(item.result)}>{item.result}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">{item.employmentStatus || "-"}</TableCell>
                    {canManage && (
                      <TableCell>
                        <div className="flex flex-col items-end gap-1 sm:flex-row sm:justify-end">
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

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {total > 0
                ? `แสดง ${from.toLocaleString("th-TH")}–${to.toLocaleString("th-TH")} จากทั้งหมด ${total.toLocaleString("th-TH")} รายการ`
                : "ทั้งหมด 0 รายการ"}
            </p>
            <Pagination page={page} totalPages={totalPages} basePath="/interviews" searchParams={{ q: keyword }} />
          </div>
        </CardContent>
      </Card>
    </>
  )
}
