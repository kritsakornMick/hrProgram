import { Building2 } from "lucide-react"
import type { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { requirePageRole } from "@/lib/session"
import { CompanyForm } from "../company-form"
import { emptyCompany } from "../schema"

export const metadata: Metadata = { title: "เพิ่มบริษัท" }

export default async function NewCompanyPage() {
  await requirePageRole(["admin"])
  return (
    <>
      <PageHeader icon={Building2} title="เพิ่มบริษัท" />
      <CompanyForm defaultValues={emptyCompany} />
    </>
  )
}
