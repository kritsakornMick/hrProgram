import { Building, Pencil, Plus, Search } from "lucide-react"
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
import { DeleteCustomerButton } from "./delete-customer-button"

export const metadata: Metadata = { title: "หน่วยงานลูกค้า" }

export default async function CustomersPage({ searchParams }: PageProps<"/customers">) {
  const user = await requireUser()
  const canEdit = user.role === "admin" || user.role === "hr"
  const { q } = await searchParams
  const query = typeof q === "string" ? q.trim() : ""

  const customers = await db.customer.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { jobName: { contains: query, mode: "insensitive" } },
            { company: { nameTh: { contains: query, mode: "insensitive" } } },
          ],
        }
      : undefined,
    orderBy: { id: "asc" },
    include: {
      company: { select: { nameTh: true } },
      _count: { select: { contacts: true } },
    },
  })

  return (
    <>
      <PageHeader
        icon={Building}
        title="หน่วยงานลูกค้า"
        description="ข้อมูลหน่วยงานลูกค้าในเครือ สัญญางาน และรายชื่อผู้ติดต่อ"
        actions={
          canEdit && (
            <Link href="/customers/new" className={buttonVariants()}>
              <Plus />
              เพิ่มหน่วยงานลูกค้า
            </Link>
          )
        }
      />

      <Card>
        <CardContent className="space-y-4">
          <form className="relative max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" defaultValue={query} placeholder="ค้นหาชื่อหน่วยงาน ชื่องาน หรือบริษัท แล้วกด Enter" className="pl-8" />
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">รหัส</TableHead>
                <TableHead>ชื่อหน่วยงาน / ชื่องาน</TableHead>
                <TableHead className="hidden lg:table-cell">ภายใต้บริษัท</TableHead>
                <TableHead className="hidden md:table-cell">ระยะเวลาสัญญา</TableHead>
                <TableHead className="hidden sm:table-cell text-right">พนักงาน (หลัก/สำรอง)</TableHead>
                <TableHead>สถานะ</TableHead>
                {canEdit && <TableHead className="w-24" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canEdit ? 7 : 6} className="py-10 text-center text-muted-foreground">
                    {query ? `ไม่พบหน่วยงานลูกค้าที่ตรงกับ “${query}”` : "ยังไม่มีข้อมูลหน่วยงานลูกค้า"}
                  </TableCell>
                </TableRow>
              )}
              {customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">CUST{String(c.id).padStart(3, "0")}</TableCell>
                  <TableCell>
                    <div className="font-medium">{c.name}</div>
                    {c.jobName && <div className="text-xs text-muted-foreground">{c.jobName}</div>}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{c.company?.nameTh ?? "-"}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {c.startDate || c.endDate
                      ? `${c.startDate ? formatThaiDate(c.startDate) : "-"} ถึง ${c.endDate ? formatThaiDate(c.endDate) : "-"}`
                      : "-"}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-right">
                    {(c.headcount ?? 0).toLocaleString("th-TH")} / {(c.reserveHeadcount ?? 0).toLocaleString("th-TH")} คน
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.status === "หมดสัญญา" ? "destructive" : "secondary"}>
                      {c.status ?? "อยู่ในสัญญา"}
                    </Badge>
                  </TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      <Link
                        href={`/customers/${c.id}/edit`}
                        className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                        aria-label={`แก้ไข ${c.name}`}
                      >
                        <Pencil />
                      </Link>
                      <DeleteCustomerButton id={c.id} name={c.name} />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-sm text-muted-foreground">ทั้งหมด {customers.length.toLocaleString("th-TH")} หน่วยงาน</p>
        </CardContent>
      </Card>
    </>
  )
}