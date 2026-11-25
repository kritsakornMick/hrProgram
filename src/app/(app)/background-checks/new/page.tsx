import dayjs from "dayjs"
import type { Metadata } from "next"
import { requirePageRole } from "@/lib/session"
import { BackgroundCheckForm } from "../background-check-form"
import { getInterviewOptions } from "../data"
import { BackgroundCheckFormHeader } from "../form-header"
import { BACKGROUND_CHECK_EDITORS } from "../permissions"
import { emptyBackgroundCheck } from "../schema"

export const metadata: Metadata = { title: "ทำหนังสือมอบอำนาจ" }

export default async function NewBackgroundCheckPage() {
  await requirePageRole(BACKGROUND_CHECK_EDITORS)
  const interviewOptions = await getInterviewOptions()

  return (
    <>
      <BackgroundCheckFormHeader
        crumb="ทำหนังสือใหม่"
        title="หนังสือมอบอำนาจและตรวจประวัติ"
        description="เลือกการสัมภาษณ์ กรอกข้อมูลผู้รับมอบอำนาจ แล้วบันทึกเพื่อพิมพ์"
      />
      <BackgroundCheckForm
        defaultValues={{ ...emptyBackgroundCheck, documentDate: dayjs().format("YYYY-MM-DD") }}
        interviewOptions={interviewOptions}
        initialParties={null}
      />
    </>
  )
}
