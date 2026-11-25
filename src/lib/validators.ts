import { z } from "zod"

/** ตรวจเลขบัตรประชาชนไทย 13 หลัก (รวมหลักตรวจสอบ) */
export function isValidThaiNationalId(value: string) {
  if (!/^\d{13}$/.test(value)) return false
  let sum = 0
  for (let i = 0; i < 12; i++) sum += Number(value[i]) * (13 - i)
  return (11 - (sum % 11)) % 10 === Number(value[12])
}

/** ข้อความไม่บังคับกรอก (ว่างได้) */
export const optionalText = (max = 255) =>
  z.string().trim().max(max, `ยาวได้ไม่เกิน ${max} ตัวอักษร`)

/** ข้อความบังคับกรอก */
export const requiredText = (label: string, max = 255) =>
  z.string().trim().min(1, `กรุณากรอก${label}`).max(max, `ยาวได้ไม่เกิน ${max} ตัวอักษร`)

export const optionalEmail = z
  .string()
  .trim()
  .refine((v) => v === "" || z.email().safeParse(v).success, "รูปแบบอีเมลไม่ถูกต้อง")

export const optionalNationalId = z
  .string()
  .trim()
  .refine((v) => v === "" || isValidThaiNationalId(v), "เลขบัตรประชาชนไม่ถูกต้อง")

/** เลขผู้เสียภาษี 13 หลัก (ว่างได้) */
export const optionalTaxId = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\d{13}$/.test(v), "เลขผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก")

/** แปลงช่องข้อความว่างเป็น null ก่อนบันทึกลงฐานข้อมูล */
export function emptyToNull<T extends Record<string, unknown>>(data: T) {
  return Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, typeof v === "string" && v.trim() === "" ? null : v]),
  ) as { [K in keyof T]: T[K] extends string ? string | null : T[K] }
}
