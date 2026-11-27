import type { Role } from "@/lib/permissions"

/** ผู้ที่เพิ่ม/แก้/ลบ/พิมพ์หนังสือส่งตัวได้ (viewer ดูรายการได้อย่างเดียว) */
export const REFERRAL_EDITORS = ["admin", "hr"] as const satisfies readonly Role[]
