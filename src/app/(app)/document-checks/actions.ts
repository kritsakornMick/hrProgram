"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { ActionResult } from "@/lib/action-result"
import { audit } from "@/lib/audit"
import { parseDateInput } from "@/lib/dates"
import { db } from "@/lib/db"
import { requireRole } from "@/lib/session"
import { emptyToNull } from "@/lib/validators"
import { documentCheckSchema, type DocumentCheckInput, type DocumentCheckParsed } from "./schema"

const DOCUMENT_CHECK_EDITORS = ["admin", "hr"] as const
const ENTITY = "document_check"

function toDbData(parsed: DocumentCheckParsed) {
  const normalized = emptyToNull({
    carLicenseType: parsed.hasCarLicense ? parsed.carLicenseType : "",
    comment: parsed.comment,
  })

  return {
    applicantId: Number(parsed.applicantId),
    checkedById: parsed.checkedById ? Number(parsed.checkedById) : null,
    checkedAt: parseDateInput(parsed.checkedAt),
    hasPhoto: parsed.hasPhoto,
    hasIdCard: parsed.hasIdCard,
    hasHouseRegistration: parsed.hasHouseRegistration,
    hasEducationCert: parsed.hasEducationCert,
    hasCarLicense: parsed.hasCarLicense,
    carLicenseType: normalized.carLicenseType,
    hasMotorcycleLicense: parsed.hasMotorcycleLicense,
    hasDisabilityCard: parsed.hasDisabilityCard,
    hasMilitaryDoc: parsed.hasMilitaryDoc,
    hasOther: parsed.hasOther,
    isComplete: parsed.isComplete,
    comment: normalized.comment,
  }
}

export async function createDocumentCheck(input: DocumentCheckInput): Promise<ActionResult<{ id: number }>> {
  const user = await requireRole(DOCUMENT_CHECK_EDITORS)
  const parsed = documentCheckSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "กรุณาตรวจสอบข้อมูล", fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }

  const applicantId = Number(parsed.data.applicantId)
  const applicant = await db.applicant.findUnique({ where: { id: applicantId }, select: { id: true } })
  if (!applicant) {
    return {
      ok: false,
      error: "ไม่พบข้อมูลผู้สมัครที่เลือก",
      fieldErrors: { applicantId: ["ไม่พบผู้สมัครในระบบ"] },
    }
  }

  if (parsed.data.checkedById) {
    const staff = await db.staff.findUnique({ where: { id: Number(parsed.data.checkedById) }, select: { id: true } })
    if (!staff) {
      return {
        ok: false,
        error: "ไม่พบข้อมูลพนักงานผู้ตรวจที่เลือก",
        fieldErrors: { checkedById: ["ไม่พบพนักงานในระบบ"] },
      }
    }
  }

  const checkedAt = parseDateInput(parsed.data.checkedAt)
  if (!checkedAt) {
    return {
      ok: false,
      error: "รูปแบบวันที่ตรวจเอกสารไม่ถูกต้อง",
      fieldErrors: { checkedAt: ["วันที่ไม่ถูกต้อง"] },
    }
  }

  const record = await db.documentCheck.create({
    data: toDbData(parsed.data),
    select: { id: true },
  })

  await audit(user, "create", ENTITY, record.id)
  revalidatePath("/document-checks")
  return { ok: true, data: { id: record.id }, message: `บันทึกแบบตรวจเอกสารเลขที่ ${record.id} เรียบร้อย` }
}

export async function updateDocumentCheck(id: number, input: DocumentCheckInput): Promise<ActionResult> {
  const user = await requireRole(DOCUMENT_CHECK_EDITORS)
  const parsed = documentCheckSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "กรุณาตรวจสอบข้อมูล", fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }

  const applicant = await db.applicant.findUnique({
    where: { id: Number(parsed.data.applicantId) },
    select: { id: true },
  })
  if (!applicant) {
    return {
      ok: false,
      error: "ไม่พบข้อมูลผู้สมัครที่เลือก",
      fieldErrors: { applicantId: ["ไม่พบผู้สมัครในระบบ"] },
    }
  }

  if (parsed.data.checkedById) {
    const staff = await db.staff.findUnique({ where: { id: Number(parsed.data.checkedById) }, select: { id: true } })
    if (!staff) {
      return {
        ok: false,
        error: "ไม่พบข้อมูลพนักงานผู้ตรวจที่เลือก",
        fieldErrors: { checkedById: ["ไม่พบพนักงานในระบบ"] },
      }
    }
  }

  const checkedAt = parseDateInput(parsed.data.checkedAt)
  if (!checkedAt) {
    return {
      ok: false,
      error: "รูปแบบวันที่ตรวจเอกสารไม่ถูกต้อง",
      fieldErrors: { checkedAt: ["วันที่ไม่ถูกต้อง"] },
    }
  }

  const updated = await db.documentCheck.updateMany({
    where: { id },
    data: toDbData(parsed.data),
  })
  if (updated.count === 0) {
    return { ok: false, error: "ไม่พบแบบตรวจเอกสารนี้ อาจถูกลบไปแล้ว" }
  }

  await audit(user, "update", ENTITY, id)
  revalidatePath("/document-checks")
  return { ok: true, message: "บันทึกการแก้ไขเรียบร้อย" }
}

export async function deleteDocumentCheck(id: number): Promise<ActionResult> {
  const user = await requireRole(DOCUMENT_CHECK_EDITORS)

  const existing = await db.documentCheck.findUnique({
    where: { id },
    include: { _count: { select: { interviews: true } } },
  })
  if (!existing) {
    return { ok: false, error: "ไม่พบแบบตรวจเอกสารนี้ อาจถูกลบไปแล้ว" }
  }

  if (existing._count.interviews > 0) {
    return {
      ok: false,
      error: `ลบไม่ได้ เพราะมีข้อมูลการสัมภาษณ์งานเชื่อมโยงอยู่ ${existing._count.interviews} รายการ`,
    }
  }

  await db.documentCheck.delete({ where: { id } })
  await audit(user, "delete", ENTITY, id)
  revalidatePath("/document-checks")
  return { ok: true, message: "ลบแบบตรวจเอกสารเรียบร้อย" }
}