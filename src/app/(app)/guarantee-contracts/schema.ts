import { z } from "zod"
import { optionalNationalId, optionalPhone, optionalText, requiredDate, requiredText } from "@/lib/validators"

export const MAX_PG_INT = 2_147_483_647

/** แปลง string เป็นจำนวนเต็มบวกของ PostgreSQL (ไม่ถูกต้อง/เกินช่วง = null) */
export function parsePositiveInt(value: unknown): number | null {
  const num = Number(value)
  if (!Number.isInteger(num) || num <= 0 || num > MAX_PG_INT) return null
  return num
}

export const guaranteeContractSchema = z.object({
  interviewId: z
    .string()
    .trim()
    .min(1, "กรุณาเลือกการสัมภาษณ์")
    .refine((v) => parsePositiveInt(v) !== null, "ข้อมูลการสัมภาษณ์ไม่ถูกต้อง"),
  contractDate: requiredDate("วันที่ทำสัญญาค้ำประกัน"),
  guarantorName: requiredText("ชื่อ-สกุล ผู้ค้ำประกัน", 200),
  guarantorAge: z
    .string()
    .trim()
    .refine((v) => v === "" || (/^\d+$/.test(v) && Number(v) >= 18 && Number(v) <= 120), "อายุต้องอยู่ระหว่าง 18-120 ปี"),
  guarantorNationalId: optionalNationalId,
  addressNo: optionalText(50),
  moo: optionalText(20),
  road: optionalText(100),
  subdistrict: optionalText(100),
  district: optionalText(100),
  province: optionalText(100),
  guarantorPhone: optionalPhone,
})

export type GuaranteeContractInput = z.infer<typeof guaranteeContractSchema>
export type GuaranteeContractParsed = z.output<typeof guaranteeContractSchema>

export function createEmptyGuaranteeContract(defaultDate: string): GuaranteeContractInput {
  return {
    interviewId: "",
    contractDate: defaultDate,
    guarantorName: "",
    guarantorAge: "",
    guarantorNationalId: "",
    addressNo: "",
    moo: "",
    road: "",
    subdistrict: "",
    district: "",
    province: "",
    guarantorPhone: "",
  }
}