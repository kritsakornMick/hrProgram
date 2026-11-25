"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { ActionResult } from "@/lib/action-result"
import { audit } from "@/lib/audit"
import { db } from "@/lib/db"
import { requireRole } from "@/lib/session"
import { emptyToNull } from "@/lib/validators"
import { customerSchema, type CustomerInput } from "./schema"

const CAN_MANAGE_CUSTOMER = ["admin", "hr"] as const

function parseCustomerPayload(data: CustomerInput) {
  const cleaned = emptyToNull({
    status: data.status,
    name: data.name,
    jobName: data.jobName,
    address: data.address,
    phone: data.phone,
    email: data.email,
    note: data.note,
  })

  return {
    ...cleaned,
    name: data.name.trim(),
    companyId: data.companyId ? Number(data.companyId) : null,
    startDate: data.startDate ? new Date(data.startDate) : null,
    endDate: data.endDate ? new Date(data.endDate) : null,
    contractValue: data.contractValue ? Number(data.contractValue) : null,
    dailyPenalty: data.dailyPenalty ? Number(data.dailyPenalty) : null,
    headcount: data.headcount ? Number.parseInt(data.headcount, 10) : null,
    reserveHeadcount: data.reserveHeadcount ? Number.parseInt(data.reserveHeadcount, 10) : null,
  }
}

export async function createCustomer(input: CustomerInput): Promise<ActionResult<{ id: number }>> {
  const user = await requireRole(CAN_MANAGE_CUSTOMER)
  const parsed = customerSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "กรุณาตรวจสอบข้อมูล", fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }

  const payload = parseCustomerPayload(parsed.data)
  const contactsData = parsed.data.contacts.map((c) => {
    const cleanContact = emptyToNull({
      name: c.name,
      department: c.department,
      phone: c.phone,
      email: c.email,
      note: c.note,
    })
    return {
      ...cleanContact,
      name: c.name.trim(),
    }
  })

  const customer = await db.customer.create({
    data: {
      ...payload,
      contacts: contactsData.length > 0 ? { create: contactsData } : undefined,
    },
  })

  await audit(user, "create", "customer", customer.id)
  revalidatePath("/customers")
  return { ok: true, data: { id: customer.id }, message: "เพิ่มหน่วยงานลูกค้าเรียบร้อย" }
}

export async function updateCustomer(id: number, input: CustomerInput): Promise<ActionResult> {
  const user = await requireRole(CAN_MANAGE_CUSTOMER)
  const parsed = customerSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "กรุณาตรวจสอบข้อมูล", fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }

  const payload = parseCustomerPayload(parsed.data)
  const contactsData = parsed.data.contacts.map((c) => {
    const cleanContact = emptyToNull({
      name: c.name,
      department: c.department,
      phone: c.phone,
      email: c.email,
      note: c.note,
    })
    return {
      ...cleanContact,
      name: c.name.trim(),
    }
  })

  await db.$transaction(async (tx) => {
    await tx.customerContact.deleteMany({ where: { customerId: id } })
    await tx.customer.update({
      where: { id },
      data: {
        ...payload,
        contacts: contactsData.length > 0 ? { create: contactsData } : undefined,
      },
    })
  })

  await audit(user, "update", "customer", id)
  revalidatePath("/customers")
  revalidatePath(`/customers/${id}/edit`)
  return { ok: true, message: "บันทึกการแก้ไขเรียบร้อย" }
}

export async function deleteCustomer(id: number): Promise<ActionResult> {
  const user = await requireRole(CAN_MANAGE_CUSTOMER)

  const interviewCount = await db.interview.count({ where: { customerId: id } })
  if (interviewCount > 0) {
    return { ok: false, error: `ลบไม่ได้ เพราะมีประวัติการสัมภาษณ์/ส่งตัวพนักงานเชื่อมอยู่ ${interviewCount} รายการ` }
  }

  await db.customer.delete({ where: { id } })
  await audit(user, "delete", "customer", id)
  revalidatePath("/customers")
  return { ok: true, message: "ลบหน่วยงานลูกค้าเรียบร้อย" }
}