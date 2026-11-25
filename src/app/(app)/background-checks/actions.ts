"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { ActionResult } from "@/lib/action-result"
import { audit, auditView } from "@/lib/audit"
import { db } from "@/lib/db"
import { requireRole } from "@/lib/session"
import { getDocumentParties, toBackgroundCheckData } from "./data"
import { BACKGROUND_CHECK_EDITORS } from "./permissions"
import { backgroundCheckSchema, type BackgroundCheckInput } from "./schema"
import type { DocumentParties } from "./types"

/*
 * Server Actions ของหนังสือมอบอำนาจและตรวจประวัติ ทำครบ 6 ขั้นตาม AGENTS.md:
 * 1. requireRole  2. safeParse  3. db.*  4. audit  5. revalidatePath  6. คืน ActionResult
 */

const ENTITY = "background_check"

/** การสัมภาษณ์ที่เลือกต้องมีอยู่จริง */
async function interviewExists(interviewId: string) {
  const found = await db.interview.findUnique({ where: { id: Number(interviewId) }, select: { id: true } })
  return Boolean(found)
}

function interviewNotFound(): ActionResult<never> {
  return {
    ok: false,
    error: "ไม่พบการสัมภาษณ์ที่เลือก อาจถูกลบไปแล้ว",
    fieldErrors: { interviewId: ["ไม่พบการสัมภาษณ์ที่เลือก"] },
  }
}

export async function createBackgroundCheck(input: BackgroundCheckInput): Promise<ActionResult<{ id: number }>> {
  const user = await requireRole(BACKGROUND_CHECK_EDITORS)
  const parsed = backgroundCheckSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "กรุณาตรวจสอบข้อมูล", fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }
  if (!(await interviewExists(parsed.data.interviewId))) return interviewNotFound()

  const record = await db.backgroundCheckAuthorization.create({
    data: toBackgroundCheckData(parsed.data),
    select: { id: true },
  })
  await audit(user, "create", ENTITY, record.id)
  revalidatePath("/background-checks")
  return { ok: true, data: { id: record.id }, message: `บันทึกหนังสือเลขที่ ${record.id} เรียบร้อย` }
}

export async function updateBackgroundCheck(id: number, input: BackgroundCheckInput): Promise<ActionResult> {
  const user = await requireRole(BACKGROUND_CHECK_EDITORS)
  const parsed = backgroundCheckSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "กรุณาตรวจสอบข้อมูล", fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }
  if (!(await interviewExists(parsed.data.interviewId))) return interviewNotFound()

  const updated = await db.backgroundCheckAuthorization.updateMany({
    where: { id },
    data: toBackgroundCheckData(parsed.data),
  })
  if (updated.count === 0) return { ok: false, error: "ไม่พบหนังสือนี้ อาจถูกลบไปแล้ว" }

  await audit(user, "update", ENTITY, id)
  revalidatePath("/background-checks")
  return { ok: true, message: "บันทึกการแก้ไขเรียบร้อย" }
}

export async function deleteBackgroundCheck(id: number): Promise<ActionResult> {
  const user = await requireRole(BACKGROUND_CHECK_EDITORS)
  const deleted = await db.backgroundCheckAuthorization.deleteMany({ where: { id } })
  if (deleted.count === 0) return { ok: false, error: "ไม่พบหนังสือนี้ อาจถูกลบไปแล้ว" }

  await audit(user, "delete", ENTITY, id)
  revalidatePath("/background-checks")
  return { ok: true, message: "ลบหนังสือเรียบร้อย" }
}

/**
 * ดึงข้อมูลผู้มอบอำนาจ (ชื่อ เลขบัตร ที่อยู่) ของการสัมภาษณ์ที่เลือก เพื่อแสดงในตัวอย่างหนังสือ
 * เป็นการเปิดดูข้อมูลส่วนบุคคลของผู้สมัคร จึงบันทึก audit "view" ด้วย (PDPA)
 */
export async function loadDocumentParties(interviewId: number): Promise<ActionResult<DocumentParties>> {
  const user = await requireRole(BACKGROUND_CHECK_EDITORS)
  if (!Number.isInteger(interviewId) || interviewId <= 0) return { ok: false, error: "ไม่พบการสัมภาษณ์ที่เลือก" }

  const parties = await getDocumentParties(interviewId)
  if (!parties) return { ok: false, error: "ไม่พบการสัมภาษณ์ที่เลือก อาจถูกลบไปแล้ว" }

  await auditView(user, "applicant", parties.applicantId)
  return { ok: true, data: parties }
}
