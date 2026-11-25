"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { ActionResult } from "@/lib/action-result"
import { audit } from "@/lib/audit"
import { db } from "@/lib/db"
import { requireRole } from "@/lib/session"
import { emptyToNull } from "@/lib/validators"
import { staffSchema, type StaffInput } from "./schema"

const STAFF_EDITORS = ["admin", "hr"] as const

function toDateOrNull(value: string | null) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export async function createStaff(input: StaffInput): Promise<ActionResult<{ id: number }>> {
  const user = await requireRole(STAFF_EDITORS)
  const parsed = staffSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "กรุณาตรวจสอบข้อมูล", fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }

  const raw = emptyToNull(parsed.data)
  if (raw.code) {
    const exists = await db.staff.findUnique({ where: { code: raw.code } })
    if (exists) return { ok: false, error: "รหัสพนักงานนี้มีอยู่แล้ว", fieldErrors: { code: ["รหัสซ้ำ"] } }
  }

  const staff = await db.staff.create({
    data: {
      ...raw,
      name: parsed.data.name,
      startDate: toDateOrNull(raw.startDate),
      endDate: toDateOrNull(raw.endDate),
    },
  })

  await audit(user, "create", "staff", staff.id)
  revalidatePath("/staff")
  return { ok: true, data: { id: staff.id }, message: "เพิ่มพนักงานบริษัทเรียบร้อย" }
}

export async function updateStaff(id: number, input: StaffInput): Promise<ActionResult> {
  const user = await requireRole(STAFF_EDITORS)
  const parsed = staffSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "กรุณาตรวจสอบข้อมูล", fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }

  const raw = emptyToNull(parsed.data)
  if (raw.code) {
    const duplicate = await db.staff.findFirst({ where: { code: raw.code, NOT: { id } } })
    if (duplicate) return { ok: false, error: "รหัสพนักงานนี้มีอยู่แล้ว", fieldErrors: { code: ["รหัสซ้ำ"] } }
  }

  await db.staff.update({
    where: { id },
    data: {
      ...raw,
      name: parsed.data.name,
      startDate: toDateOrNull(raw.startDate),
      endDate: toDateOrNull(raw.endDate),
    },
  })

  await audit(user, "update", "staff", id)
  revalidatePath("/staff")
  return { ok: true, message: "บันทึกการแก้ไขเรียบร้อย" }
}

export async function deleteStaff(id: number): Promise<ActionResult> {
  const user = await requireRole(STAFF_EDITORS)

  const staff = await db.staff.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          documentChecks: true,
          interviews: true,
          interviewReferralsMade: true,
          assignmentLettersMade: true,
        },
      },
    },
  })

  if (!staff) {
    return { ok: false, error: "ไม่พบข้อมูลพนักงาน" }
  }

  const totalRelations =
    staff._count.documentChecks +
    staff._count.interviews +
    staff._count.interviewReferralsMade +
    staff._count.assignmentLettersMade

  if (totalRelations > 0) {
    return { ok: false, error: "ลบไม่ได้ เพราะพนักงานคนนี้มีประวัติการบันทึกเอกสารหรือสัมภาษณ์ในระบบแล้ว" }
  }

  await db.staff.delete({ where: { id } })
  await audit(user, "delete", "staff", id)
  revalidatePath("/staff")
  return { ok: true, message: "ลบข้อมูลพนักงานเรียบร้อย" }
}