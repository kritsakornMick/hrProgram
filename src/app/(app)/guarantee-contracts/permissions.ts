import type { Role } from "@/lib/permissions"

/** สิทธิ์เพิ่ม/แก้ไข/ลบสัญญาค้ำประกันบุคคลเข้าทำงาน (viewer ดูรายการได้อย่างเดียว) */
export const GUARANTEE_CONTRACT_EDITORS: readonly Role[] = ["admin", "hr"]