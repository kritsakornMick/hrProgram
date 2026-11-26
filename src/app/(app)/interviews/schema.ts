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

/** ช่อง id ในฐานข้อมูลเป็น Int (สูงสุด 2,147,483,647) ค่าที่เกินจะทำให้ Prisma error */
const MAX_DB_INT = 2_147_483_647

function isDbId(val: string) {
  if (!/^\d+$/.test(val)) return false
  const num = Number(val)
  return num > 0 && num <= MAX_DB_INT
}

const optionalPositiveInt = (label: string) =>
  z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || isDbId(val), {
      message: `${label}ไม่ถูกต้อง`,
    })

/** อัตราค่าจ้าง: ช่อง Decimal(12, 2) เก็บได้ไม่เกิน 10 หลัก + ทศนิยม 2 ตำแหน่ง */
const WAGE_PATTERN = /^\d{1,10}(\.\d{1,2})?$/

/** จำนวนวันทดลองงานสูงสุดที่ยอมให้กรอก */
export const MAX_PROBATION_DAYS = 365

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
    .refine(isDbId, "รหัสใบตรวจเอกสารไม่ถูกต้อง"),
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
    .refine(
      (val) => !val || WAGE_PATTERN.test(val),
      "ใส่ตัวเลขไม่เกิน 9,999,999,999.99 (ทศนิยม 2 ตำแหน่ง)",
    ),
  position: z.string().trim().max(200, "ตำแหน่งต้องไม่เกิน 200 ตัวอักษร").optional(),
  startDate: optionalDateString("วันที่เริ่มงาน"),
  probationDays: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || (/^\d{1,4}$/.test(val) && Number(val) >= 1 && Number(val) <= MAX_PROBATION_DAYS),
      `จำนวนวันทดลองงานต้องเป็นจำนวนเต็ม 1–${MAX_PROBATION_DAYS} วัน`,
    ),
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