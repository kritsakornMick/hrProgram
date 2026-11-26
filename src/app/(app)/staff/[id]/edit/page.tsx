import { UsersRound } from "lucide-react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { db } from "@/lib/db"
import { requirePageRole } from "@/lib/session"
import { StaffForm } from "../../staff-form"

export const metadata: Metadata = { title: "แก้ไขพนักงานบริษัท" }

function formatDateInput(date: Date | null) {
  if (!date) return ""
  return date.toISOString().slice(0, 10)
}

export default async function EditStaffPage({ params }: PageProps<"/staff/[id]/edit">) {
  await requirePageRole(["admin", "hr"])
  const { id } = await params
  const staff = await db.staff.findUnique({ where: { id: Number(id) } })
  if (!staff) notFound()

  return (
    <>
      <PageHeader icon={UsersRound} title="แก้ไขพนักงานบริษัท" description={staff.name} />
      <StaffForm
        staffId={staff.id}
        defaultValues={{
          code: staff.code ?? "",
          name: staff.name,
          position: staff.position ?? "",
          department: staff.department ?? "",
          nationalId: staff.nationalId ?? "",
          address: staff.address ?? "",
          phone: staff.phone ?? "",
          email: staff.email ?? "",
          status: staff.status ?? "ปฏิบัติงาน",
          startDate: formatDateInput(staff.startDate),
          endDate: formatDateInput(staff.endDate),
          bankName: staff.bankName ?? "",
          bankAccountType: staff.bankAccountType ?? "ออมทรัพย์",
          bankAccountNo: staff.bankAccountNo ?? "",
          emergencyContact: staff.emergencyContact ?? "",
          workplace: staff.workplace ?? "",
          contactPhone: staff.contactPhone ?? "",
          note: staff.note ?? "",
        }}
      />
    </>
  )
}