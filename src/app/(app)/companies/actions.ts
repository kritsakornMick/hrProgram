"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { ActionResult } from "@/lib/action-result"
import { audit } from "@/lib/audit"
import { db } from "@/lib/db"
import { requireRole } from "@/lib/session"
import { emptyToNull } from "@/lib/validators"
import { companySchema, type CompanyInput } from "./schema"

/*
 * รูปแบบมาตรฐานของ Server Action (ทุกหน้าให้ทำตามนี้):
 * 1. requireRole  — เช็คสิทธิ์ก่อนทุกครั้ง
 * 2. safeParse    — ตรวจข้อมูลซ้ำฝั่ง server (ห้ามเชื่อข้อมูลจาก browser)
 * 3. db.*         — บันทึกด้วย Prisma
 * 4. audit        — บันทึกประวัติ (PDPA)
 * 5. revalidatePath — ให้หน้ารายการแสดงข้อมูลล่าสุด
 * 6. คืน ActionResult ให้หน้าเว็บแสดงข้อความ
 */

const ADMIN_ONLY = ["admin"] as const

export async function createCompany(input: CompanyInput): Promise<ActionResult<{ id: number }>> {
  const user = await requireRole(ADMIN_ONLY)
  const parsed = companySchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "กรุณาตรวจสอบข้อมูล", fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }

  const exists = await db.company.findUnique({ where: { code: parsed.data.code } })
  if (exists) return { ok: false, error: "รหัสบริษัทนี้มีอยู่แล้ว", fieldErrors: { code: ["รหัสซ้ำ"] } }

  const data = emptyToNull(parsed.data)
  const company = await db.company.create({ data: { ...data, code: parsed.data.code, nameTh: parsed.data.nameTh } })
  await audit(user, "create", "company", company.id)
  revalidatePath("/companies")
  return { ok: true, data: { id: company.id }, message: "เพิ่มบริษัทเรียบร้อย" }
}

export async function updateCompany(id: number, input: CompanyInput): Promise<ActionResult> {
  const user = await requireRole(ADMIN_ONLY)
  const parsed = companySchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "กรุณาตรวจสอบข้อมูล", fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }

  const duplicate = await db.company.findFirst({ where: { code: parsed.data.code, NOT: { id } } })
  if (duplicate) return { ok: false, error: "รหัสบริษัทนี้มีอยู่แล้ว", fieldErrors: { code: ["รหัสซ้ำ"] } }

  const data = emptyToNull(parsed.data)
  await db.company.update({ where: { id }, data: { ...data, code: parsed.data.code, nameTh: parsed.data.nameTh } })
  await audit(user, "update", "company", id)
  revalidatePath("/companies")
  return { ok: true, message: "บันทึกการแก้ไขเรียบร้อย" }
}

export async function deleteCompany(id: number): Promise<ActionResult> {
  const user = await requireRole(ADMIN_ONLY)

  const customerCount = await db.customer.count({ where: { companyId: id } })
  if (customerCount > 0) {
    return { ok: false, error: `ลบไม่ได้ เพราะมีหน่วยงานลูกค้าอยู่ภายใต้บริษัทนี้ ${customerCount} แห่ง` }
  }

  await db.company.delete({ where: { id } })
  await audit(user, "delete", "company", id)
  revalidatePath("/companies")
  return { ok: true, message: "ลบบริษัทเรียบร้อย" }
}
