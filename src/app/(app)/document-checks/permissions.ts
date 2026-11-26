import type { Role } from "@/lib/permissions"

/** สิทธิ์เพิ่ม/แก้ไข/ลบแบบตรวจเอกสารสมัครงาน (viewer ดูรายการได้อย่างเดียว) */
export const DOCUMENT_CHECK_EDITORS: readonly Role[] = ["admin", "hr"]