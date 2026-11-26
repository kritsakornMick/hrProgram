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
    documentCheckId: Number(data.documentCheckId),
    customerId: data.customerId ? Number(data.customerId) : null,
    staffId: data.staffId ? Number(data.staffId) : null,
    interviewedAt: data.interviewedAt ? new Date(data.interviewedAt) : null,
    wageRate: data.wageRate ? Number(data.wageRate) : null,
    startDate: data.startDate ? new Date(data.startDate) : null,
    probationDays: data.probationDays ? Number.parseInt(data.probationDays, 10) : null,
    probationStartDate: data.probationStartDate ? new Date(data.probationStartDate) : null,
    probationEndDate: data.probationEndDate ? new Date(data.probationEndDate) : null,
    evaluatedAt: data.evaluatedAt ? new Date(data.evaluatedAt) : null,
  }
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
  if (!Number.isFinite(payload.documentCheckId) || payload.documentCheckId <= 0) {
    return { ok: false, error: "ข้อมูลใบตรวจเอกสารไม่ถูกต้อง" }
  }

  const interview = await db.interview.create({ data: payload })

  await audit(user, "create", "interview", interview.id)
  revalidatePath("/interviews")
  return { ok: true, data: { id: interview.id }, message: "บันทึกผลการสัมภาษณ์เรียบร้อย" }
}

export async function updateInterview(id: number, input: InterviewInput): Promise<ActionResult> {
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
  if (!Number.isFinite(payload.documentCheckId) || payload.documentCheckId <= 0) {
    return { ok: false, error: "ข้อมูลใบตรวจเอกสารไม่ถูกต้อง" }
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

  const target = await db.interview.findUnique({
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
    return { ok: false, error: "ไม่พบข้อมูลการสัมภาษณ์ที่ต้องการลบ" }
  }

  const totalRefs =
    target._count.employmentContracts +
    target._count.backgroundChecks +
    target._count.interviewReferrals +
    target._count.assignmentLetters +
    target._count.guaranteeContracts

  if (totalRefs > 0) {
    return {
      ok: false,
      error: `ลบไม่ได้ เพราะมีเอกสารหรือสัญญาปลายทางเชื่อมอยู่ ${totalRefs} รายการ`,
    }
  }

  await db.interview.delete({ where: { id } })
  await audit(user, "delete", "interview", id)
  revalidatePath("/interviews")
  return { ok: true, message: "ลบข้อมูลการสัมภาษณ์เรียบร้อย" }
}