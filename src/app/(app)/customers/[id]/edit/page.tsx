import { Building } from "lucide-react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { db } from "@/lib/db"
import { requirePageRole } from "@/lib/session"
import { CustomerForm } from "../../customer-form"

export const metadata: Metadata = { title: "แก้ไขหน่วยงานลูกค้า" }

function toDateInputValue(date: Date | null): string {
  if (!date) return ""
  return date.toISOString().slice(0, 10)
}

export default async function EditCustomerPage({ params }: PageProps<"/customers/[id]/edit">) {
  await requirePageRole(["admin", "hr"])
  const { id } = await params
  const customerId = Number(id)
  if (Number.isNaN(customerId)) notFound()

  const [customer, companies] = await Promise.all([
    db.customer.findUnique({
      where: { id: customerId },
      include: { contacts: { orderBy: { id: "asc" } } },
    }),
    db.company.findMany({
      select: { id: true, nameTh: true },
      orderBy: { code: "asc" },
    }),
  ])

  if (!customer) notFound()

  return (
    <>
      <PageHeader icon={Building} title="แก้ไขหน่วยงานลูกค้า" description={customer.name} />
      <CustomerForm
        customerId={customer.id}
        companies={companies}
        defaultValues={{
          status: customer.status ?? "อยู่ในสัญญา",
          name: customer.name,
          jobName: customer.jobName ?? "",
          address: customer.address ?? "",
          phone: customer.phone ?? "",
          email: customer.email ?? "",
          companyId: customer.companyId ? String(customer.companyId) : "",
          startDate: toDateInputValue(customer.startDate),
          endDate: toDateInputValue(customer.endDate),
          contractValue: customer.contractValue ? String(customer.contractValue) : "",
          dailyPenalty: customer.dailyPenalty ? String(customer.dailyPenalty) : "",
          headcount: customer.headcount !== null ? String(customer.headcount) : "",
          reserveHeadcount: customer.reserveHeadcount !== null ? String(customer.reserveHeadcount) : "",
          note: customer.note ?? "",
          contacts: customer.contacts.map((c) => ({
            id: c.id,
            name: c.name,
            department: c.department ?? "",
            phone: c.phone ?? "",
            email: c.email ?? "",
            note: c.note ?? "",
          })),
        }}
      />
    </>
  )
}