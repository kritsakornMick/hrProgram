import { UsersRound } from "lucide-react"
import type { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { requirePageRole } from "@/lib/session"
import { emptyStaff } from "../schema"
import { StaffForm } from "../staff-form"

export const metadata: Metadata = { title: "เพิ่มพนักงาน HR" }

export default async function NewStaffPage() {
  await requirePageRole(["admin", "hr"])
  return (
    <>
      <PageHeader icon={UsersRound} title="เพิ่มพนักงาน HR" description="จัดการข้อมูลพนักงานบริษัทและฝ่ายบุคคล" />
      <StaffForm defaultValues={emptyStaff} />
    </>
  )
}