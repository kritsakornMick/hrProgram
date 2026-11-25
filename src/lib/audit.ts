import "server-only"
import { db } from "@/lib/db"
import type { CurrentUser } from "@/lib/session"

export type AuditAction = "create" | "update" | "delete" | "view" | "export"

/**
 * บันทึกประวัติการเข้าถึงข้อมูล (PDPA)
 * เรียกทุกครั้งหลังเพิ่ม/แก้/ลบข้อมูล และตอนออกเอกสารที่มีข้อมูลส่วนบุคคล
 *
 * ตัวอย่าง: await audit(user, "update", "company", company.id)
 */
export async function audit(
  user: CurrentUser,
  action: AuditAction,
  entity: string,
  entityId?: string | number,
  detail?: Record<string, unknown>,
) {
  await db.auditLog.create({
    data: {
      userId: user.id,
      action,
      entity,
      entityId: entityId === undefined ? null : String(entityId),
      detail: detail ? JSON.parse(JSON.stringify(detail)) : undefined,
    },
  })
}
