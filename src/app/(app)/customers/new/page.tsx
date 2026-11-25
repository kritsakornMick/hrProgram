import { Building } from "lucide-react"
import type { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { db } from "@/lib/db"
import { requirePageRole } from "@/lib/session"
import { CustomerForm } from "../customer-form"
import { emptyCustomer } from "../schema"

export const metadata: Metadata = { title: "เพิ่มหน่วยงานลูกค้า" }

export default async function NewCustomerPage() {
  await requirePageRole(["admin", "hr"])
  const companies = await db.company.findMany({
    select: { id: true, nameTh: true },
    orderBy: { code: "asc" },
  })

  return (
    <>
      <PageHeader icon={Building} title="เพิ่มหน่วยงานลูกค้า" description="บันทึกข้อมูลหน่วยงานลูกค้าในเครือและผู้ติดต่อ" />
      <CustomerForm companies={companies} defaultValues={emptyCustomer} />
    </>
  )
}