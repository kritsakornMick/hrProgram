import { z } from "zod"
import { optionalInteger, optionalNationalId, optionalPhone, optionalText, requiredDate, requiredText } from "@/lib/validators"

const MAX_PG_INT = 2_147_483_647

const positiveIntString = z
  .string()
  .trim()
  .refine((val) => {
    const num = Number(val)
    return /^\d+$/.test(val) && Number.isSafeInteger(num) && num > 0 && num <= MAX_PG_INT
  }, "รหัสการสัมภาษณ์ไม่ถูกต้อง")

export const guaranteeContractSchema = z.object({
  interviewId: z
    .string()
    .trim()
    .min(1, "กรุณาเลือกการสัมภาษณ์ (ผู้ถูกค้ำประกัน)")
    .pipe(positiveIntString),
  contractDate: requiredDate("วันที่ทำสัญญาค้ำประกัน"),
  guarantorName: requiredText("ชื่อ-สกุล ผู้ค้ำประกัน", 200),
  guarantorAge: optionalInteger(120),
  guarantorNationalId: optionalNationalId,
  addressNo: optionalText(50),
  moo: optionalText(20),
  road: optionalText(100),
  subdistrict: optionalText(100),
  district: optionalText(100),
  province: optionalText(100),
  guarantorPhone: optionalPhone,
})

export type GuaranteeContractInput = z.input<typeof guaranteeContractSchema>
export type GuaranteeContractParsed = z.output<typeof guaranteeContractSchema>

export function createEmptyGuaranteeContract(todayIso: string): GuaranteeContractInput {
  return {
    interviewId: "",
    contractDate: todayIso,
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