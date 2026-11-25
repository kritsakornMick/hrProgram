import { Building2 } from "lucide-react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { db } from "@/lib/db"
import { requirePageRole } from "@/lib/session"
import { CompanyForm } from "../../company-form"

export const metadata: Metadata = { title: "แก้ไขบริษัท" }

export default async function EditCompanyPage({ params }: PageProps<"/companies/[id]/edit">) {
  await requirePageRole(["admin"])
  const { id } = await params
  const company = await db.company.findUnique({ where: { id: Number(id) } })
  if (!company) notFound()

  return (
    <>
      <PageHeader icon={Building2} title="แก้ไขบริษัท" description={company.nameTh} />
      <CompanyForm
        companyId={company.id}
        defaultValues={{
          code: company.code,
          nameTh: company.nameTh,
          nameEn: company.nameEn ?? "",
          taxId: company.taxId ?? "",
          address: company.address ?? "",
          phone: company.phone ?? "",
          fax: company.fax ?? "",
          email: company.email ?? "",
        }}
      />
    </>
  )
}
