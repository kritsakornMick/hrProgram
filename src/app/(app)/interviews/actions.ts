"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { ActionResult } from "@/lib/action-result"
import { audit } from "@/lib/audit"
import { db } from "@/lib/db"
import { requireRole } from "@/lib/session"
import { emptyToNull } from "@/lib/validators"
import { interviewSchema, type InterviewInput } from "./schema"

const CAN_MANAGE_INTERVIEW = ["admin", "hr"] as const

function parseInterviewPayload(data: InterviewInput) {
  const cleaned = emptyToNull({
    result: data.result,
    resultReason: data.resultReason,
    employmentStatus: data.employmentStatus,
    position: data.position,
    evaluationResult: data.evaluationResult,
    comment: data.comment,
    bankName: data.bankName,
    bankAccountNo: data.bankAccountNo,
  })

  return {
    ...cleaned,
    documentCheckId: Number.parseInt(data.documentCheckId, 10),
    customerId: data.customerId ? Number.parseInt(data.customerId, 10) : null,
    staffId: data.staffId ? Number.parseInt(data.staffId, 10) : null,
    interviewedAt: data.interviewedAt ? new Date(`${data.interviewedAt}T00:00:00.000Z`) : null,
    wageRate: data.wageRate ? Number(data.wageRate) : null,
    startDate: data.startDate ? new Date(`${data.startDate}T00:00:00.000Z`) : null,
    probationDays: data.probationDays ? Number.parseInt(data.probationDays, 10) : null,
    probationStartDate: data.probationStartDate ? new Date(`${data.probationStartDate}T00:00:00.000Z`) : null,
    probationEndDate: data.probationEndDate ? new Date(`${data.probationEndDate}T00:00:00.000Z`) : null,
    evaluatedAt: data.evaluatedAt ? new Date(`${data.evaluatedAt}T00:00:00.000Z`) : null,
  }
}

async function validateForeignKeys(
  payload: ReturnType<typeof parseInterviewPayload>,
  excludeInterviewId?: number,
): Promise<string | null> {
  const [docCheck, existingInterview, customer, staff] = await Promise.all([
    db.documentCheck.findUnique({ where: { id: payload.documentCheckId }, select: { id: true } }),
    db.interview.findFirst({
      where: {
        documentCheckId: payload.documentCheckId,
        ...(excludeInterviewId ? { id: { not: excludeInterviewId } } : {}),
      },
      select: { id: true },
    }),
    payload.customerId
      ? db.customer.findUnique({ where: { id: payload.customerId }, select: { id: true } })
      : Promise.resolve({ id: 0 }),
    payload.staffId
      ? db.staff.findUnique({ where: { id: payload.staffId }, select: { id: true } })
      : Promise.resolve({ id: 0 }),
  ])

  if (!docCheck) return "ไม่พบข้อมูลใบตรวจเอกสารสมัครงานที่เลือก"
  if (existingInterview) return "ผู้สมัครรายการนี้มีประวัติการสัมภาษณ์ในระบบแล้ว"
  if (payload.customerId && !customer) return "ไม่พบข้อมูลหน่วยงานลูกค้าที่เลือก"
  if (payload.staffId && !staff) return "ไม่พบข้อมูลพนักงานผู้สัมภาษณ์ที่เลือก"
  return null
}

export async function createInterview(input: InterviewInput): Promise<ActionResult<{ id: number }>> {
  const user = await requireRole(CAN_MANAGE_INTERVIEW)
  const parsed = interviewSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: "กรุณาตรวจสอบข้อมูล",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    }
  }

  const payload = parseInterviewPayload(parsed.data)
  const fkError = await validateForeignKeys(payload)
  if (fkError) {
    return { ok: false, error: fkError }
  }

  const interview = await db.interview.create({ data: payload })

  await audit(user, "create", "interview", interview.id)
  revalidatePath("/interviews")
  return { ok: true, data: { id: interview.id }, message: "บันทึกผลการสัมภาษณ์เรียบร้อย" }
}

export async function updateInterview(id: number, input: InterviewInput): Promise<ActionResult> {
  const user = await requireRole(CAN_MANAGE_INTERVIEW)
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, error: "รหัสข้อมูลการสัมภาษณ์ไม่ถูกต้อง" }
  }

  const parsed = interviewSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: "กรุณาตรวจสอบข้อมูล",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    }
  }

  const existing = await db.interview.findUnique({ where: { id }, select: { id: true } })
  if (!existing) {
    return { ok: false, error: "ไม่พบข้อมูลการสัมภาษณ์ที่ต้องการแก้ไข" }
  }

  const payload = parseInterviewPayload(parsed.data)
  const fkError = await validateForeignKeys(payload, id)
  if (fkError) {
    return { ok: false, error: fkError }
  }

  await db.interview.update({
    where: { id },
    data: payload,
  })

  await audit(user, "update", "interview", id)
  revalidatePath("/interviews")
  revalidatePath(`/interviews/${id}/edit`)
  return { ok: true, message: "บันทึกการแก้ไขเรียบร้อย" }
}

export async function deleteInterview(id: number): Promise<ActionResult> {
  const user = await requireRole(CAN_MANAGE_INTERVIEW)
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, error: "รหัสข้อมูลการสัมภาษณ์ไม่ถูกต้อง" }
  }

  // ใช้ Transaction เพื่อเช็กข้อมูลปลายทางและลบในรอบเดียว ป้องกัน Race Condition ที่ทำให้เอกสารปลายทางหาย
  const deleteResult = await db.$transaction(async (tx) => {
    const target = await tx.interview.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            employmentContracts: true,
            backgroundChecks: true,
            interviewReferrals: true,
            assignmentLetters: true,
            guaranteeContracts: true,
          },
        },
      },
    })

    if (!target) {
      return { ok: false as const, error: "ไม่พบข้อมูลการสัมภาษณ์ที่ต้องการลบ" }
    }

    const totalRefs =
      target._count.employmentContracts +
      target._count.backgroundChecks +
      target._count.interviewReferrals +
      target._count.assignmentLetters +
      target._count.guaranteeContracts

    if (totalRefs > 0) {
      return {
        ok: false as const,
        error: `ลบไม่ได้ เพราะมีเอกสารหรือสัญญาปลายทางเชื่อมอยู่ ${totalRefs} รายการ`,
      }
    }

    await tx.interview.delete({ where: { id } })
    return { ok: true as const }
  })

  if (!deleteResult.ok) {
    return deleteResult
  }

  await audit(user, "delete", "interview", id)
  revalidatePath("/interviews")
  return { ok: true, message: "ลบข้อมูลการสัมภาษณ์เรียบร้อย" }
}