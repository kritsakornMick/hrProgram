import { Building2, Pencil, Plus, Search } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { db } from "@/lib/db"
import { requireUser } from "@/lib/session"
import { DeleteCompanyButton } from "./delete-company-button"

export const metadata: Metadata = { title: "บริษัท/องค์กร" }

/**
 * หน้าตัวอย่าง #1: หน้ารายการ (Server Component)
 * - ดึงข้อมูลด้วย db ตรงๆ ในหน้านี้ ไม่ต้องทำ API
 * - ค้นหาด้วย ?q= ใน URL (กด Enter ในช่องค้นหา)
 * - ปุ่มเพิ่ม/แก้/ลบ แสดงเฉพาะ admin (และ Server Action เช็คสิทธิ์ซ้ำอีกชั้น)
 */
export default async function CompaniesPage({ searchParams }: PageProps<"/companies">) {
  const user = await requireUser()
  const canEdit = user.role === "admin"
  const { q } = await searchParams
  const query = typeof q === "string" ? q.trim() : ""

  const companies = await db.company.findMany({
    where: query
      ? {
          OR: [
            { code: { contains: query, mode: "insensitive" } },
            { nameTh: { contains: query, mode: "insensitive" } },
            { nameEn: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { code: "asc" },
    include: { _count: { select: { customers: true } } },
  })

  return (
    <>
      <PageHeader
        icon={Building2}
        title="บริษัท/องค์กร"
        description="บริษัทในเครือที่ใช้ออกเอกสาร (หัวกระดาษ ที่อยู่ เลขผู้เสียภาษี)"
        actions={
          canEdit && (
            <Link href="/companies/new" className={buttonVariants()}>
              <Plus />
              เพิ่มบริษัท
            </Link>
          )
        }
      />

      <Card>
        <CardContent className="space-y-4">
          <form className="relative max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" defaultValue={query} placeholder="ค้นหารหัสหรือชื่อบริษัท แล้วกด Enter" className="pl-8" />
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">รหัส</TableHead>
                <TableHead>ชื่อบริษัท</TableHead>
                <TableHead className="hidden md:table-cell">เลขผู้เสียภาษี</TableHead>
                <TableHead className="hidden lg:table-cell">โทรศัพท์</TableHead>
                <TableHead className="text-right">หน่วยงานลูกค้า</TableHead>
                {canEdit && <TableHead className="w-24" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    {query ? `ไม่พบบริษัทที่ตรงกับ “${query}”` : "ยังไม่มีข้อมูลบริษัท"}
                  </TableCell>
                </TableRow>
              )}
              {companies.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.code}</TableCell>
                  <TableCell>
                    <div>{c.nameTh}</div>
                    {c.nameEn && <div className="text-xs text-muted-foreground">{c.nameEn}</div>}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{c.taxId ?? "-"}</TableCell>
                  <TableCell className="hidden lg:table-cell">{c.phone ?? "-"}</TableCell>
                  <TableCell className="text-right">{c._count.customers.toLocaleString("th-TH")}</TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      <Link
                        href={`/companies/${c.id}/edit`}
                        className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                        aria-label={`แก้ไข ${c.nameTh}`}
                      >
                        <Pencil />
                      </Link>
                      <DeleteCompanyButton id={c.id} name={c.nameTh} />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-sm text-muted-foreground">ทั้งหมด {companies.length.toLocaleString("th-TH")} บริษัท</p>
        </CardContent>
      </Card>
    </>
  )
}
