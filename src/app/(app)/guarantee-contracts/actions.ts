"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { ActionResult } from "@/lib/action-result"
import { audit, auditView } from "@/lib/audit"
import { parseDateInput } from "@/lib/dates"
import { db } from "@/lib/db"
import { requireRole } from "@/lib/session"
import { getGuaranteeContractParties, toGuaranteeContractData } from "./data"
import { GUARANTEE_CONTRACT_EDITORS } from "./permissions"
import { guaranteeContractSchema, type GuaranteeContractInput } from "./schema"
import type { GuaranteeContractParties } from "./types"

const ENTITY = "guarantee_contract"
const MAX_PG_INT = 2_147_483_647

async function validInterviewExists(interviewId: number, currentContractId?: number) {
  if (!Number.isInteger(interviewId) || interviewId <= 0 || interviewId > MAX_PG_INT) return false
  const found = await db.interview.findFirst({
    where: {
      id: interviewId,
      OR: [
        { documentCheck: { applicant: { isDraft: false } } },
        ...(currentContractId ? [{ guaranteeContracts: { some: { id: currentContractId } } }] : []),
      ],
    },
    select: { id: true },
  })
  return Boolean(found)
}

export async function createGuaranteeContract(input: GuaranteeContractInput): Promise<ActionResult<{ id: number }>> {
  const user = await requireRole(GUARANTEE_CONTRACT_EDITORS)
  const parsed = guaranteeContractSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "กรุณาตรวจสอบข้อมูล", fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }

  const interviewId = Number(parsed.data.interviewId)
  if (!(await validInterviewExists(interviewId))) {
    return {
      ok: false,
      error: "ไม่พบข้อมูลการสัมภาษณ์ที่เลือก หรือใบสมัครยังเป็นฉบับร่าง",
      fieldErrors: { interviewId: ["ไม่พบการสัมภาษณ์ที่เลือกหรือยังเป็นฉบับร่าง"] },
    }
  }

  const contractDate = parseDateInput(parsed.data.contractDate)
  if (!contractDate) {
    return {
      ok: false,
      error: "รูปแบบวันที่ทำสัญญาไม่ถูกต้อง",
      fieldErrors: { contractDate: ["วันที่ไม่ถูกต้อง"] },
    }
  }

  const record = await db.guaranteeContract.create({
    data: toGuaranteeContractData(parsed.data),
    select: { id: true },
  })

  await audit(user, "create", ENTITY, record.id)
  revalidatePath("/guarantee-contracts")
  return { ok: true, data: { id: record.id }, message: `บันทึกสัญญาค้ำประกันเลขที่ ${record.id} เรียบร้อย` }
}

export async function updateGuaranteeContract(id: number, input: GuaranteeContractInput): Promise<ActionResult> {
  const user = await requireRole(GUARANTEE_CONTRACT_EDITORS)
  if (!Number.isInteger(id) || id <= 0 || id > MAX_PG_INT) {
    return { ok: false, error: "รหัสสัญญาค้ำประกันไม่ถูกต้อง" }
  }

  const parsed = guaranteeContractSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "กรุณาตรวจสอบข้อมูล", fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }

  const interviewId = Number(parsed.data.interviewId)
  if (!(await validInterviewExists(interviewId, id))) {
    return {
      ok: false,
      error: "ไม่พบข้อมูลการสัมภาษณ์ที่เลือก หรือใบสมัครยังเป็นฉบับร่าง",
      fieldErrors: { interviewId: ["ไม่พบการสัมภาษณ์ที่เลือกหรือยังเป็นฉบับร่าง"] },
    }
  }

  const contractDate = parseDateInput(parsed.data.contractDate)
  if (!contractDate) {
    return {
      ok: false,
      error: "รูปแบบวันที่ทำสัญญาไม่ถูกต้อง",
      fieldErrors: { contractDate: ["วันที่ไม่ถูกต้อง"] },
    }
  }

  const updated = await db.guaranteeContract.updateMany({
    where: { id },
    data: toGuaranteeContractData(parsed.data),
  })
  if (updated.count === 0) {
    return { ok: false, error: "ไม่พบสัญญาค้ำประกันนี้ อาจถูกลบไปแล้ว" }
  }

  await audit(user, "update", ENTITY, id)
  revalidatePath("/guarantee-contracts")
  return { ok: true, message: "บันทึกการแก้ไขเรียบร้อย" }
}

export async function deleteGuaranteeContract(id: number): Promise<ActionResult> {
  const user = await requireRole(GUARANTEE_CONTRACT_EDITORS)
  if (!Number.isInteger(id) || id <= 0 || id > MAX_PG_INT) {
    return { ok: false, error: "รหัสสัญญาค้ำประกันไม่ถูกต้อง" }
  }

  const deleted = await db.guaranteeContract.deleteMany({ where: { id } })
  if (deleted.count === 0) {
    return { ok: false, error: "ไม่พบสัญญาค้ำประกันนี้ อาจถูกลบไปแล้ว" }
  }

  await audit(user, "delete", ENTITY, id)
  revalidatePath("/guarantee-contracts")
  return { ok: true, message: "ลบสัญญาค้ำประกันเรียบร้อย" }
}

export async function loadGuaranteeParties(interviewId: number): Promise<ActionResult<GuaranteeContractParties>> {
  const user = await requireRole(GUARANTEE_CONTRACT_EDITORS)
  if (!Number.isInteger(interviewId) || interviewId <= 0 || interviewId > MAX_PG_INT) {
    return { ok: false, error: "ไม่พบการสัมภาษณ์ที่เลือก" }
  }

  const parties = await getGuaranteeContractParties(interviewId)
  if (!parties) {
    return { ok: false, error: "ไม่พบการสัมภาษณ์ที่เลือก อาจถูกลบไปแล้ว" }
  }

  await auditView(user, "applicant", parties.applicantId)
  return { ok: true, data: parties }
}