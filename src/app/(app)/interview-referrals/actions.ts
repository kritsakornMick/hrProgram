"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { ActionResult } from "@/lib/action-result"
import { audit, auditView } from "@/lib/audit"
import { db } from "@/lib/db"
import { requireRole } from "@/lib/session"
import { getReferralParties, toReferralData } from "./data"
import { REFERRAL_EDITORS } from "./permissions"
import { referralSchema, type ReferralInput } from "./schema"
import type { ReferralParties } from "./types"

/*
 * Server Actions ของหนังสือส่งตัวพนักงานเพื่อเข้าสัมภาษณ์ ทำครบ 6 ขั้นตาม AGENTS.md:
 * 1. requireRole  2. safeParse  3. db.*  4. audit  5. revalidatePath  6. คืน ActionResult
 */

const ENTITY = "interview_referral"
const MAX_DB_INT = 2_147_483_647

function isValidId(id: number) {
  return Number.isInteger(id) && id > 0 && id <= MAX_DB_INT
}

/** การสัมภาษณ์และพนักงานที่เลือกต้องมีอยู่จริง (คืนข้อผิดพลาดของช่องนั้น หรือ null ถ้าผ่าน) */
async function checkReferences(data: ReferralInput): Promise<ActionResult<never> | null> {
  const [interview, staff] = await Promise.all([
    db.interview.findUnique({ where: { id: Number(data.interviewId) }, select: { id: true } }),
    data.issuedById ? db.staff.findUnique({ where: { id: Number(data.issuedById) }, select: { id: true } }) : null,
  ])
  if (!interview) {
    return {
      ok: false,
      error: "ไม่พบการสัมภาษณ์ที่เลือก อาจถูกลบไปแล้ว",
      fieldErrors: { interviewId: ["ไม่พบการสัมภาษณ์ที่เลือก"] },
    }
  }
  if (data.issuedById && !staff) {
    return {
      ok: false,
      error: "ไม่พบพนักงานที่เลือก อาจถูกลบไปแล้ว",
      fieldErrors: { issuedById: ["ไม่พบพนักงานที่เลือก"] },
    }
  }
  return null
}

export async function createReferral(input: ReferralInput): Promise<ActionResult<{ id: number }>> {
  const user = await requireRole(REFERRAL_EDITORS)
  const parsed = referralSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "กรุณาตรวจสอบข้อมูล", fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }
  const refError = await checkReferences(parsed.data)
  if (refError) return refError

  const record = await db.interviewReferralLetter.create({
    data: toReferralData(parsed.data),
    select: { id: true },
  })
  await audit(user, "create", ENTITY, record.id)
  revalidatePath("/interview-referrals")
  return { ok: true, data: { id: record.id }, message: `บันทึกหนังสือลำดับที่ ${record.id} เรียบร้อย` }
}

export async function updateReferral(id: number, input: ReferralInput): Promise<ActionResult> {
  const user = await requireRole(REFERRAL_EDITORS)
  if (!isValidId(id)) return { ok: false, error: "ไม่พบหนังสือนี้" }
  const parsed = referralSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "กรุณาตรวจสอบข้อมูล", fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }
  const refError = await checkReferences(parsed.data)
  if (refError) return refError

  // updateMany ไม่ error ถ้าหนังสือถูกลบไประหว่างแก้ (update จะเป็นหน้า 500)
  const updated = await db.interviewReferralLetter.updateMany({ where: { id }, data: toReferralData(parsed.data) })
  if (updated.count === 0) return { ok: false, error: "ไม่พบหนังสือนี้ อาจถูกลบไปแล้ว" }

  await audit(user, "update", ENTITY, id)
  revalidatePath("/interview-referrals")
  return { ok: true, message: "บันทึกการแก้ไขเรียบร้อย" }
}

export async function deleteReferral(id: number): Promise<ActionResult> {
  const user = await requireRole(REFERRAL_EDITORS)
  if (!isValidId(id)) return { ok: false, error: "ไม่พบหนังสือนี้" }
  const deleted = await db.interviewReferralLetter.deleteMany({ where: { id } })
  if (deleted.count === 0) return { ok: false, error: "ไม่พบหนังสือนี้ อาจถูกลบไปแล้ว" }

  await audit(user, "delete", ENTITY, id)
  revalidatePath("/interview-referrals")
  return { ok: true, message: "ลบหนังสือเรียบร้อย" }
}

/**
 * ดึงข้อมูลพนักงาน (ชื่อ ที่อยู่ เลขบัตร) ของการสัมภาษณ์ที่เลือก เพื่อแสดงในตัวอย่างหนังสือ
 * เป็นการเปิดดูข้อมูลส่วนบุคคลของผู้สมัคร จึงบันทึก audit "view" ด้วย (PDPA)
 */
export async function loadReferralParties(interviewId: number): Promise<ActionResult<ReferralParties>> {
  const user = await requireRole(REFERRAL_EDITORS)
  if (!isValidId(interviewId)) return { ok: false, error: "ไม่พบการสัมภาษณ์ที่เลือก" }

  const parties = await getReferralParties(interviewId)
  if (!parties) return { ok: false, error: "ไม่พบการสัมภาษณ์ที่เลือก อาจถูกลบไปแล้ว" }

  await auditView(user, "applicant", parties.applicantId)
  return { ok: true, data: parties }
}
