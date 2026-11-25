import { Pencil, Plus, Search, UsersRound } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { db } from "@/lib/db"
import { requireUser } from "@/lib/session"
import { DeleteStaffButton } from "./delete-staff-button"

export const metadata: Metadata = { title: "พนักงาน HR" }

export default async function StaffPage({ searchParams }: PageProps<"/staff">) {
  const user = await requireUser()
  const canEdit = user.role === "admin" || user.role === "hr"
  const { q } = await searchParams
  const query = typeof q === "string" ? q.trim() : ""

  const staffList = await db.staff.findMany({
    where: query
      ? {
          OR: [
            { code: { contains: query, mode: "insensitive" } },
            { name: { contains: query, mode: "insensitive" } },
            { position: { contains: query, mode: "insensitive" } },
            { department: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: [{ code: "asc" }, { id: "asc" }],
  })

  return (
    <>
      <PageHeader
        icon={UsersRound}
        title="พนักงาน HR"
        description="จัดการข้อมูลพนักงานฝ่ายบุคคล ผู้ตรวจสอบเอกสาร และผู้สัมภาษณ์งาน"
        actions={
          canEdit && (
            <Link href="/staff/new" className={buttonVariants()}>
              <Plus />
              เพิ่มพนักงาน HR
            </Link>
          )
        }
      />

      <Card>
        <CardContent className="space-y-4">
          <form className="relative max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" defaultValue={query} placeholder="ค้นหารหัส ชื่อ หรือตำแหน่ง แล้วกด Enter" className="pl-8" />
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">รหัส</TableHead>
                <TableHead>ชื่อพนักงาน</TableHead>
                <TableHead className="hidden md:table-cell">ตำแหน่ง / หน่วยงาน</TableHead>
                <TableHead className="hidden lg:table-cell">โทรศัพท์</TableHead>
                <TableHead>สถานะ</TableHead>
                {canEdit && <TableHead className="w-24" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    {query ? `ไม่พบพนักงานที่ตรงกับ “${query}”` : "ยังไม่มีข้อมูลพนักงาน HR"}
                  </TableCell>
                </TableRow>
              )}
              {staffList.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.code ?? "-"}</TableCell>
                  <TableCell>
                    <div>{s.name}</div>
                    {s.email && <div className="text-xs text-muted-foreground">{s.email}</div>}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div>{s.position ?? "-"}</div>
                    {s.department && <div className="text-xs text-muted-foreground">{s.department}</div>}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{s.phone ?? "-"}</TableCell>
                  <TableCell>
                    {s.status ? (
                      <Badge variant={s.status === "ลาออก" ? "destructive" : "secondary"}>{s.status}</Badge>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      <Link
                        href={`/staff/${s.id}/edit`}
                        className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                        aria-label={`แก้ไข ${s.name}`}
                      >
                        <Pencil />
                      </Link>
                      <DeleteStaffButton id={s.id} name={s.name} />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-sm text-muted-foreground">ทั้งหมด {staffList.length.toLocaleString("th-TH")} คน</p>
        </CardContent>
      </Card>
    </>
  )
}