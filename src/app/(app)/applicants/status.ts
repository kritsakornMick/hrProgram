import type { Prisma } from "@/generated/prisma/client"

/**
 * ส่วนของ query ที่ต้อง include เพื่อคำนวณสถานะผู้สมัคร
 * ใช้การตรวจเอกสารครั้งล่าสุด และการสัมภาษณ์ครั้งล่าสุดของการตรวจนั้น
 */
export const applicantStatusInclude = {
  documentChecks: {
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 1,
    select: {
      isComplete: true,
      interviews: { orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 1, select: { result: true } },
    },
  },
} satisfies Prisma.ApplicantInclude

type ApplicantWithStatus = Pick<
  Prisma.ApplicantGetPayload<{ include: typeof applicantStatusInclude }>,
  "isDraft" | "documentChecks"
>

export type ApplicantStatusTone = "draft" | "pending" | "warning" | "info" | "success" | "danger"

/**
 * สถานะของผู้สมัคร
 * - บันทึกร่าง (กรอกไม่ครบ)     → ร่าง
 * - ยังไม่ตรวจเอกสาร           → รอตรวจเอกสาร
 * - ตรวจแล้ว isComplete = false → เอกสารไม่ครบ
 * - เอกสารครบ ยังไม่สัมภาษณ์    → รอสัมภาษณ์
 * - สัมภาษณ์แล้ว               → ผลสัมภาษณ์ (ยังไม่ลงผล = "สัมภาษณ์แล้ว รอผล")
 */
export function getApplicantStatus(applicant: ApplicantWithStatus): { label: string; tone: ApplicantStatusTone } {
  if (applicant.isDraft) return { label: "ร่าง", tone: "draft" }

  const check = applicant.documentChecks[0]
  if (!check) return { label: "รอตรวจเอกสาร", tone: "pending" }
  if (!check.isComplete) return { label: "เอกสารไม่ครบ", tone: "warning" }

  const interview = check.interviews[0]
  if (!interview) return { label: "รอสัมภาษณ์", tone: "info" }

  const result = interview.result?.trim()
  if (!result) return { label: "สัมภาษณ์แล้ว รอผล", tone: "info" }
  if (result.startsWith("ไม่")) return { label: result, tone: "danger" }
  return { label: result, tone: result.includes("ผ่าน") ? "success" : "info" }
}
