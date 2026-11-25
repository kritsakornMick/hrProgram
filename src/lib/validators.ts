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

/** ตัวเลขจำนวนเต็มไม่ติดลบ (ว่างได้) เก็บเป็น string ในฟอร์ม แปลงด้วย toInt ตอนบันทึก */
export const optionalInteger = (max = 1_000_000) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d+$/.test(v), "กรุณากรอกเป็นตัวเลขจำนวนเต็ม")
    .refine((v) => v === "" || Number(v) <= max, `ต้องไม่เกิน ${max.toLocaleString("th-TH")}`)

/**
 * ตัวเลขมีทศนิยมได้ไม่ติดลบ (ว่างได้) ใส่ลูกน้ำคั่นหลักพันได้ เช่น 15,000.50
 * intDigits/decimals ให้ตรงกับ @db.Decimal(p, s) ใน schema.prisma (intDigits = p - s)
 */
export const optionalDecimal = (intDigits: number, decimals: number) =>
  z
    .string()
    .trim()
    .refine(
      (v) => v === "" || new RegExp(`^\\d{1,${intDigits}}(\\.\\d{1,${decimals}})?$`).test(v.replaceAll(",", "")),
      decimals > 0 ? `กรุณากรอกเป็นตัวเลข (ทศนิยมไม่เกิน ${decimals} ตำแหน่ง)` : "กรุณากรอกเป็นตัวเลข",
    )

/** วันที่จากช่อง <input type="date"> (YYYY-MM-DD, ว่างได้) */
export const optionalDate = z
  .string()
  .trim()
  .refine((v) => v === "" || (/^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))), "วันที่ไม่ถูกต้อง")

/** วันที่บังคับกรอก */
export const requiredDate = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `กรุณาเลือก${label}`)
    .refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)), "วันที่ไม่ถูกต้อง")

/** เบอร์โทร (ว่างได้) ใช้ได้เฉพาะตัวเลข ขีด เว้นวรรค วงเล็บ + และลูกน้ำ (หลายเบอร์) */
export const optionalPhone = z
  .string()
  .trim()
  .max(50, "ยาวได้ไม่เกิน 50 ตัวอักษร")
  .refine((v) => /^[\d\s\-+(),]*$/.test(v), "เบอร์โทรใช้ได้เฉพาะตัวเลข")

/** แปลง string จากฟอร์มเป็นจำนวนเต็ม (ว่าง = null) */
export function toInt(value: string): number | null {
  return value.trim() === "" ? null : Number(value)
}

/** แปลง string จากฟอร์มเป็นทศนิยมสำหรับ Prisma Decimal (ว่าง = null) ส่งเป็น string เพื่อไม่ให้เพี้ยน */
export function toDecimal(value: string): string | null {
  const v = value.replaceAll(",", "").trim()
  return v === "" ? null : v
}

/** แปลงช่องข้อความว่างเป็น null ก่อนบันทึกลงฐานข้อมูล */
export function emptyToNull<T extends Record<string, unknown>>(data: T) {
  return Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, typeof v === "string" && v.trim() === "" ? null : v]),
  ) as { [K in keyof T]: T[K] extends string ? string | null : T[K] }
}
