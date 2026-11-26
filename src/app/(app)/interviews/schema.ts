import { z } from "zod"

export const interviewResultOptions = ["ผ่าน", "ไม่ผ่าน", "รอพิจารณา"] as const

export const employmentStatusOptions = ["รอเริ่มงาน", "ทดลองงาน", "บรรจุ", "ไม่ผ่าน"] as const

export const evaluationResultOptions = ["ผ่าน", "ไม่ผ่าน", "รอประเมิน"] as const

export const bankOptions = [
  "ธนาคารกสิกรไทย",
  "ธนาคารไทยพาณิชย์",
  "ธนาคารกรุงเทพ",
  "ธนาคารกรุงไทย",
  "ธนาคารกรุงศรีอยุธยา",
  "ธนาคารทหารไทยธนชาต",
  "ธนาคารออมสิน",
] as const

const optionalPositiveInt = (label: string) =>
  z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || (/^\d+$/.test(val) && Number.parseInt(val, 10) > 0), {
      message: `${label}ไม่ถูกต้อง`,
    })

const optionalDateString = (label: string) =>
  z
    .string()
    .trim()
    .optional()
    .refine((val) => {
      if (!val) return true
      if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return false
      const [y, m, d] = val.split("-").map(Number)
      const date = new Date(Date.UTC(y, m - 1, d))
      return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
    }, `${label}ไม่ถูกต้อง`)

export const interviewSchema = z.object({
  documentCheckId: z
    .string()
    .trim()
    .min(1, "กรุณาเลือกผู้สมัครงาน (ใบตรวจเอกสาร)")
    .refine((val) => /^\d+$/.test(val) && Number.parseInt(val, 10) > 0, "รหัสใบตรวจเอกสารไม่ถูกต้อง"),
  companyFilterId: optionalPositiveInt("รหัสบริษัท"),
  customerId: optionalPositiveInt("รหัสหน่วยงานลูกค้า"),
  staffId: optionalPositiveInt("รหัสผู้สัมภาษณ์"),
  interviewedAt: optionalDateString("วันที่สัมภาษณ์"),
  result: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || (interviewResultOptions as readonly string[]).includes(val), "ผลการสัมภาษณ์ไม่ถูกต้อง"),
  resultReason: z.string().trim().max(500, "สาเหตุต้องไม่เกิน 500 ตัวอักษร").optional(),
  employmentStatus: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || (employmentStatusOptions as readonly string[]).includes(val), "สถานะการจ้างงานไม่ถูกต้อง"),
  wageRate: z
    .string()
    .trim()
    .optional()
    .refine((val) => {
      if (!val) return true
      const num = Number(val)
      return Number.isFinite(num) && num >= 0
    }, "อัตราค่าจ้างต้องเป็นตัวเลขที่ไม่ติดลบ"),
  position: z.string().trim().max(200, "ตำแหน่งต้องไม่เกิน 200 ตัวอักษร").optional(),
  startDate: optionalDateString("วันที่เริ่มงาน"),
  probationDays: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || (/^\d+$/.test(val) && Number.parseInt(val, 10) >= 1), "จำนวนวันทดลองงานต้องเป็นจำนวนเต็มตั้งแต่ 1 ขึ้นไป"),
  probationStartDate: optionalDateString("วันที่เริ่มทดลองงาน"),
  probationEndDate: optionalDateString("วันที่จบทดลองงาน"),
  evaluatedAt: optionalDateString("วันที่ทำการประเมิน"),
  evaluationResult: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || (evaluationResultOptions as readonly string[]).includes(val), "ผลการประเมินไม่ถูกต้อง"),
  comment: z.string().trim().max(1000, "ความคิดเห็นต้องไม่เกิน 1,000 ตัวอักษร").optional(),
  bankName: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || (bankOptions as readonly string[]).includes(val), "ชื่อธนาคารไม่ถูกต้อง"),
  bankAccountNo: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || /^[0-9-]{8,20}$/.test(val), "เลขบัญชีธนาคารต้องเป็นตัวเลข 8-20 หลัก"),
})

export type InterviewInput = z.infer<typeof interviewSchema>

export const emptyInterview: InterviewInput = {
  documentCheckId: "",
  companyFilterId: "",
  customerId: "",
  staffId: "",
  interviewedAt: "",
  result: "",
  resultReason: "",
  employmentStatus: "",
  wageRate: "",
  position: "",
  startDate: "",
  probationDays: "",
  probationStartDate: "",
  probationEndDate: "",
  evaluatedAt: "",
  evaluationResult: "",
  comment: "",
  bankName: "",
  bankAccountNo: "",
}