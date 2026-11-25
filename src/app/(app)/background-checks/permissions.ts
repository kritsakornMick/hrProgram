import type { Role } from "@/lib/permissions"

/** ผู้ที่เพิ่ม/แก้/ลบ/พิมพ์หนังสือมอบอำนาจได้ (viewer ดูรายการได้อย่างเดียว) */
export const BACKGROUND_CHECK_EDITORS = ["admin", "hr"] as const satisfies readonly Role[]
