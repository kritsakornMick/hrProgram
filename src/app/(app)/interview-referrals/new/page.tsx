import dayjs from "dayjs"
import type { Metadata } from "next"
import { db } from "@/lib/db"
import { requirePageRole } from "@/lib/session"
import { getInterviewOptions, getStaffOptions } from "../data"
import { ReferralFormHeader } from "../form-header"
import { REFERRAL_EDITORS } from "../permissions"
import { ReferralForm } from "../referral-form"
import { emptyReferral } from "../schema"

export const metadata: Metadata = { title: "ทำหนังสือส่งตัวเพื่อเข้าสัมภาษณ์" }

export default async function NewReferralPage() {
  const user = await requirePageRole(REFERRAL_EDITORS)
  const [interviewOptions, staffOptions, currentStaff] = await Promise.all([
    getInterviewOptions(),
    getStaffOptions(),
    // ผู้ทำหนังสือเริ่มต้น = พนักงานที่ผูกกับบัญชีที่ล็อกอินอยู่ (ถ้ามี)
    db.staff.findUnique({ where: { userId: user.id }, select: { id: true } }),
  ])

  return (
    <>
      <ReferralFormHeader
        crumb="ทำหนังสือใหม่"
        title="หนังสือส่งตัวพนักงานเพื่อเข้าสัมภาษณ์"
        description="เลือกการสัมภาษณ์ กรอกผู้รับหนังสือ แล้วบันทึกเพื่อพิมพ์"
      />
      <ReferralForm
        defaultValues={{
          ...emptyReferral,
          documentDate: dayjs().format("YYYY-MM-DD"),
          issuedById: currentStaff ? String(currentStaff.id) : "",
        }}
        interviewOptions={interviewOptions}
        staffOptions={staffOptions}
        initialParties={null}
      />
    </>
  )
}
