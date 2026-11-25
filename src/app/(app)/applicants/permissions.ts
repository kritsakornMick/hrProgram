import type { Role } from "@/lib/permissions"

/** ผู้ที่เพิ่ม/แก้/ลบใบสมัครได้ (viewer ดูรายการได้อย่างเดียว) */
export const APPLICANT_EDITORS = ["admin", "hr"] as const satisfies readonly Role[]
