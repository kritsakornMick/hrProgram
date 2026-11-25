"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { Prisma } from "@/generated/prisma/client"
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
 * mode = "draft"  (บันทึกร่าง)     ตรวจแค่รูปแบบ + ต้องมีชื่อ  → isDraft = true
 * mode = "submit" (บันทึกใบสมัคร) ตรวจช่องบังคับครบ          → isDraft = false
 * ใบที่ "บันทึกใบสมัคร" แล้ว กลับไปเป็นร่างไม่ได้ (กันช่องบังคับถูกลบทิ้ง)
 */

const modeSchema = z.enum(SAVE_MODES)

/** mode แปลกๆ จาก browser ให้ตรวจแบบเข้มที่สุด */
function parseMode(mode: unknown): SaveMode {
  const parsed = modeSchema.safeParse(mode)
  return parsed.success ? parsed.data : "submit"
}

function duplicateNationalIdError(otherId?: number): ActionResult<never> {
  const message = otherId
    ? `เลขบัตรประชาชนนี้มีอยู่แล้วในใบสมัครเลขที่ ${otherId}`
    : "เลขบัตรประชาชนนี้มีอยู่แล้วในใบสมัครอื่น"
  return { ok: false, error: message, fieldErrors: { nationalId: [message] } }
}

/** เลขบัตรซ้ำกับผู้สมัครคนอื่นไหม (คืนเลขที่ใบสมัครที่ซ้ำ) — ฐานข้อมูลมี @unique กันอีกชั้น */
async function findDuplicateNationalId(nationalId: string, excludeId?: number) {
  if (!nationalId) return undefined
  const other = await db.applicant.findFirst({
    where: { nationalId, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    select: { id: true },
  })
  return other?.id
}

/** บันทึกพร้อมกันสองคนด้วยเลขบัตรเดียวกัน: ตัวที่สองจะชน @unique ในฐานข้อมูล */
function isUniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
}

export async function createApplicant(
  input: ApplicantInput,
  mode: SaveMode = "submit",
): Promise<ActionResult<{ id: number }>> {
  const user = await requireRole(APPLICANT_EDITORS)
  const saveMode = parseMode(mode)
  const parsed = schemaFor(saveMode).safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "กรุณาตรวจสอบข้อมูล", fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }

  const duplicateId = await findDuplicateNationalId(parsed.data.nationalId)
  if (duplicateId) return duplicateNationalIdError(duplicateId)

  let applicant: { id: number }
  try {
    applicant = await db.applicant.create({
      data: { ...toApplicantData(parsed.data), isDraft: saveMode === "draft" },
      select: { id: true },
    })
  } catch (error) {
    if (isUniqueViolation(error)) return duplicateNationalIdError()
    throw error
  }

  await audit(user, "create", "applicant", applicant.id, { mode: saveMode })
  revalidatePath("/applicants")
  return {
    ok: true,
    data: { id: applicant.id },
    message:
      saveMode === "draft" ? `บันทึกร่างแล้ว (เลขที่ ${applicant.id})` : `บันทึกใบสมัครเลขที่ ${applicant.id} เรียบร้อย`,
  }
}

export async function updateApplicant(id: number, input: ApplicantInput, mode: SaveMode = "submit"): Promise<ActionResult> {
  const user = await requireRole(APPLICANT_EDITORS)

  const existing = await db.applicant.findUnique({ where: { id }, select: { isDraft: true } })
  if (!existing) return { ok: false, error: "ไม่พบใบสมัครนี้ อาจถูกลบไปแล้ว" }

  // ใบที่บันทึกใบสมัครแล้ว ต้องตรวจครบทุกครั้ง (บันทึกเป็นร่างไม่ได้)
  const saveMode = existing.isDraft ? parseMode(mode) : "submit"
  const parsed = schemaFor(saveMode).safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "กรุณาตรวจสอบข้อมูล", fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }

  const duplicateId = await findDuplicateNationalId(parsed.data.nationalId, id)
  if (duplicateId) return duplicateNationalIdError(duplicateId)

  try {
    await db.applicant.update({
      where: { id },
      data: { ...toApplicantData(parsed.data), isDraft: saveMode === "draft" },
    })
  } catch (error) {
    if (isUniqueViolation(error)) return duplicateNationalIdError()
    throw error
  }

  await audit(user, "update", "applicant", id, { mode: saveMode })
  revalidatePath("/applicants")
  return { ok: true, message: saveMode === "draft" ? "บันทึกร่างแล้ว" : "บันทึกการแก้ไขเรียบร้อย" }
}

export async function deleteApplicant(id: number): Promise<ActionResult> {
  const user = await requireRole(APPLICANT_EDITORS)

  // ตรวจเอกสารแล้ว = มีประวัติต่อเนื่อง (สัมภาษณ์ สัญญา ฯลฯ) ห้ามลบ
  // ในฐานข้อมูลตั้ง onDelete: Cascade ไว้ จึงใส่เงื่อนไข "ไม่มีการตรวจเอกสาร" ไว้ในคำสั่งลบเลย
  // (คำสั่งเดียว ไม่มีช่องว่างให้มีคนบันทึกตรวจเอกสารแทรกระหว่างเช็คกับลบ)
  const deleted = await db.applicant.deleteMany({ where: { id, documentChecks: { none: {} } } })

  if (deleted.count === 0) {
    const checkCount = await db.documentCheck.count({ where: { applicantId: id } })
    if (checkCount > 0) {
      return {
        ok: false,
        error: `ลบไม่ได้ เพราะใบสมัครนี้ผ่านการตรวจเอกสารแล้ว ${checkCount} ครั้ง ต้องลบรายการตรวจเอกสารก่อน`,
      }
    }
    return { ok: false, error: "ไม่พบใบสมัครนี้ อาจถูกลบไปแล้ว" }
  }

  await audit(user, "delete", "applicant", id)
  revalidatePath("/applicants")
  return { ok: true, message: "ลบใบสมัครเรียบร้อย" }
}
