"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { ActionResult } from "@/lib/action-result"
import { audit } from "@/lib/audit"
import { db } from "@/lib/db"
import { requireRole } from "@/lib/session"
import { toApplicantData } from "./mapping"
import { APPLICANT_EDITORS } from "./permissions"
import { SAVE_MODES, schemaFor, type ApplicantInput, type SaveMode } from "./schema"

/*
 * Server Actions ของใบสมัครงาน ทำครบ 6 ขั้นตาม AGENTS.md:
 * 1. requireRole  2. safeParse  3. db.*  4. audit  5. revalidatePath  6. คืน ActionResult
 *
 * mode = "draft"  (บันทึกร่าง)     ตรวจแค่รูปแบบ + ต้องมีชื่อ
 * mode = "submit" (บันทึกใบสมัคร) ตรวจช่องบังคับครบ
 */

const modeSchema = z.enum(SAVE_MODES)

function parseInput(input: ApplicantInput, mode: SaveMode) {
  const parsedMode = modeSchema.safeParse(mode)
  // mode แปลกๆ จาก browser ให้ตรวจแบบเข้มที่สุด
  return schemaFor(parsedMode.success ? parsedMode.data : "submit").safeParse(input)
}

/** เลขบัตรห้ามซ้ำกับผู้สมัครคนอื่น (คืนข้อความ error หรือ null) */
async function findDuplicateNationalId(nationalId: string, excludeId?: number) {
  if (!nationalId) return null
  const other = await db.applicant.findFirst({
    where: { nationalId, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    select: { id: true },
  })
  return other ? `เลขบัตรประชาชนนี้มีอยู่แล้วในใบสมัครเลขที่ ${other.id}` : null
}

export async function createApplicant(
  input: ApplicantInput,
  mode: SaveMode = "submit",
): Promise<ActionResult<{ id: number }>> {
  const user = await requireRole(APPLICANT_EDITORS)
  const parsed = parseInput(input, mode)
  if (!parsed.success) {
    return { ok: false, error: "กรุณาตรวจสอบข้อมูล", fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }

  const duplicate = await findDuplicateNationalId(parsed.data.nationalId)
  if (duplicate) return { ok: false, error: duplicate, fieldErrors: { nationalId: [duplicate] } }

  const applicant = await db.applicant.create({ data: toApplicantData(parsed.data) })
  await audit(user, "create", "applicant", applicant.id, { mode })
  revalidatePath("/applicants")
  return {
    ok: true,
    data: { id: applicant.id },
    message: mode === "draft" ? `บันทึกร่างแล้ว (เลขที่ ${applicant.id})` : `บันทึกใบสมัครเลขที่ ${applicant.id} เรียบร้อย`,
  }
}

export async function updateApplicant(id: number, input: ApplicantInput, mode: SaveMode = "submit"): Promise<ActionResult> {
  const user = await requireRole(APPLICANT_EDITORS)
  const parsed = parseInput(input, mode)
  if (!parsed.success) {
    return { ok: false, error: "กรุณาตรวจสอบข้อมูล", fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }

  const exists = await db.applicant.findUnique({ where: { id }, select: { id: true } })
  if (!exists) return { ok: false, error: "ไม่พบใบสมัครนี้ อาจถูกลบไปแล้ว" }

  const duplicate = await findDuplicateNationalId(parsed.data.nationalId, id)
  if (duplicate) return { ok: false, error: duplicate, fieldErrors: { nationalId: [duplicate] } }

  await db.applicant.update({ where: { id }, data: toApplicantData(parsed.data) })
  await audit(user, "update", "applicant", id, { mode })
  revalidatePath("/applicants")
  revalidatePath(`/applicants/${id}/edit`)
  return { ok: true, message: mode === "draft" ? "บันทึกร่างแล้ว" : "บันทึกการแก้ไขเรียบร้อย" }
}

export async function deleteApplicant(id: number): Promise<ActionResult> {
  const user = await requireRole(APPLICANT_EDITORS)

  // ตรวจเอกสารแล้ว = มีประวัติต่อเนื่อง (สัมภาษณ์ สัญญา ฯลฯ) ห้ามลบ
  // (ในฐานข้อมูลตั้ง onDelete: Cascade ไว้ ถ้าลบจะหายทั้งหมด จึงต้องกันที่นี่)
  const checkCount = await db.documentCheck.count({ where: { applicantId: id } })
  if (checkCount > 0) {
    return {
      ok: false,
      error: `ลบไม่ได้ เพราะใบสมัครนี้ผ่านการตรวจเอกสารแล้ว ${checkCount} ครั้ง ต้องลบรายการตรวจเอกสารก่อน`,
    }
  }

  const deleted = await db.applicant.deleteMany({ where: { id } })
  if (deleted.count === 0) return { ok: false, error: "ไม่พบใบสมัครนี้ อาจถูกลบไปแล้ว" }

  await audit(user, "delete", "applicant", id)
  revalidatePath("/applicants")
  return { ok: true, message: "ลบใบสมัครเรียบร้อย" }
}
