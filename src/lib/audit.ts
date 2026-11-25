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

const VIEW_DEDUPE_MS = 60_000

/**
 * บันทึกการเปิดดูข้อมูลส่วนบุคคล (ใช้ในหน้าที่แสดงข้อมูลเต็ม เช่น หน้าแก้ไขใบสมัคร)
 * ถ้าคนเดิมเปิดรายการเดิมซ้ำภายใน 1 นาที (เช่น หน้าโหลดใหม่หลังกดบันทึก) นับเป็นครั้งเดียว
 */
export async function auditView(user: CurrentUser, entity: string, entityId: string | number) {
  const recent = await db.auditLog.findFirst({
    where: {
      userId: user.id,
      action: "view",
      entity,
      entityId: String(entityId),
      createdAt: { gte: new Date(Date.now() - VIEW_DEDUPE_MS) },
    },
    select: { id: true },
  })
  if (!recent) await audit(user, "view", entity, entityId)
}
