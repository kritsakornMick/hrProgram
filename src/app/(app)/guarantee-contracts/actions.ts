"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { ActionResult } from "@/lib/action-result"
import { audit, auditView } from "@/lib/audit"
import { db } from "@/lib/db"
import { requireRole } from "@/lib/session"
import { getGuaranteeContractParties, toGuaranteeContractData } from "./data"
import { GUARANTEE_CONTRACT_EDITORS } from "./permissions"
import { type GuaranteeContractInput, guaranteeContractSchema, parsePositiveInt } from "./schema"
import type { GuaranteeContractParties } from "./types"

const ENTITY = "guarantee_contract"

function revalidateGuaranteeContracts() {
  revalidatePath("/guarantee-contracts")
  revalidatePath("/")
}

export async function loadGuaranteeParties(interviewId: number): Promise<ActionResult<GuaranteeContractParties>> {
  const user = await requireRole(GUARANTEE_CONTRACT_EDITORS)
  if (!parsePositiveInt(interviewId)) return { ok: false, error: "ข้อมูลการสัมภาษณ์ไม่ถูกต้อง" }

  const parties = await getGuaranteeContractParties(interviewId)
  if (!parties) return { ok: false, error: "ไม่พบการสัมภาษณ์ที่เลือก อาจถูกลบไปแล้ว" }

  await auditView(user, "applicant", parties.applicantId)
  return { ok: true, data: parties }
}

export async function createGuaranteeContract(raw: GuaranteeContractInput): Promise<ActionResult<{ id: number }>> {
  const user = await requireRole(GUARANTEE_CONTRACT_EDITORS)

  const parsed = guaranteeContractSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: "กรุณาตรวจสอบข้อมูลที่กรอก", fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }

  const data = toGuaranteeContractData(parsed.data)

  const interview = await db.interview.findFirst({
    where: {
      id: data.interviewId,
      documentCheck: { applicant: { isDraft: false } },
    },
    select: { id: true },
  })
  if (!interview) {
    return {
      ok: false,
      error: "ไม่พบข้อมูลการสัมภาษณ์ที่เลือก",
      fieldErrors: { interviewId: ["กรุณาเลือกการสัมภาษณ์ใหม่"] },
    }
  }

  const created = await db.guaranteeContract.create({
    data,
    select: { id: true },
  })

  await audit(user, "create", ENTITY, created.id, {
    interviewId: data.interviewId,
    guarantorName: data.guarantorName,
  })
  revalidateGuaranteeContracts()
  return { ok: true, data: { id: created.id }, message: "บันทึกสัญญาค้ำประกันเรียบร้อยแล้ว" }
}

export async function updateGuaranteeContract(id: number, raw: GuaranteeContractInput): Promise<ActionResult> {
  const user = await requireRole(GUARANTEE_CONTRACT_EDITORS)
  if (!parsePositiveInt(id)) return { ok: false, error: "รหัสสัญญาไม่ถูกต้อง" }

  const parsed = guaranteeContractSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: "กรุณาตรวจสอบข้อมูลที่กรอก", fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }

  const data = toGuaranteeContractData(parsed.data)

  const interview = await db.interview.findFirst({
    where: {
      id: data.interviewId,
      documentCheck: { applicant: { isDraft: false } },
    },
    select: { id: true },
  })
  if (!interview) {
    return {
      ok: false,
      error: "ไม่พบข้อมูลการสัมภาษณ์ที่เลือก",
      fieldErrors: { interviewId: ["กรุณาเลือกการสัมภาษณ์ใหม่"] },
    }
  }

  const updated = await db.guaranteeContract.updateMany({
    where: { id },
    data,
  })
  if (updated.count === 0) return { ok: false, error: "ไม่พบข้อมูลสัญญาค้ำประกันที่ต้องการแก้ไข" }

  await audit(user, "update", ENTITY, id, {
    interviewId: data.interviewId,
    guarantorName: data.guarantorName,
  })
  revalidateGuaranteeContracts()
  return { ok: true, message: "บันทึกการแก้ไขสัญญาค้ำประกันเรียบร้อยแล้ว" }
}

export async function deleteGuaranteeContract(id: number): Promise<ActionResult> {
  const user = await requireRole(GUARANTEE_CONTRACT_EDITORS)
  if (!parsePositiveInt(id)) return { ok: false, error: "รหัสสัญญาไม่ถูกต้อง" }

  const { count } = await db.guaranteeContract.deleteMany({ where: { id } })
  if (count === 0) return { ok: false, error: "ไม่พบข้อมูลสัญญาค้ำประกัน (อาจถูกลบไปแล้ว)" }

  await audit(user, "delete", ENTITY, id)
  revalidateGuaranteeContracts()
  return { ok: true, message: "ลบสัญญาค้ำประกันเรียบร้อยแล้ว" }
}