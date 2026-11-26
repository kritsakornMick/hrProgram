import { z } from "zod"

export const CAR_LICENSE_TYPES = [
  "ส่วนบุคคล (ท.1 / บ.1)",
  "ทุกประเภท ชนิดที่ 2 (ท.2 / บ.2)",
  "ทุกประเภท ชนิดที่ 3 (ท.3 / บ.3)",
  "ทุกประเภท ชนิดที่ 4 (ท.4 / บ.4)",
  "ชั่วคราว (2 ปี)",
  "ตลอดชีพ",
] as const

const positiveIntString = z
  .string()
  .trim()
  .refine((val) => {
    const num = Number(val)
    return /^\d+$/.test(val) && Number.isSafeInteger(num) && num > 0 && num <= 2_147_483_647
  }, "รหัสอ้างอิงไม่ถูกต้อง")

export const documentCheckSchema = z
  .object({
    applicantId: z
      .string()
      .trim()
      .min(1, "กรุณาเลือกผู้สมัครงาน")
      .pipe(positiveIntString),
    checkedById: z
      .string()
      .trim()
      .optional()
      .default("")
      .refine((val) => {
        if (!val) return true
        const num = Number(val)
        return /^\d+$/.test(val) && Number.isSafeInteger(num) && num > 0 && num <= 2_147_483_647
      }, "รหัสผู้ตรวจไม่ถูกต้อง"),
    checkedAt: z.string().trim().min(1, "กรุณาระบุวันที่ตรวจเอกสาร"),
    hasPhoto: z.boolean().default(false),
    hasIdCard: z.boolean().default(false),
    hasHouseRegistration: z.boolean().default(false),
    hasEducationCert: z.boolean().default(false),
    hasCarLicense: z.boolean().default(false),
    carLicenseType: z.string().trim().optional().default(""),
    hasMotorcycleLicense: z.boolean().default(false),
    hasDisabilityCard: z.boolean().default(false),
    hasMilitaryDoc: z.boolean().default(false),
    hasOther: z.boolean().default(false),
    isComplete: z.boolean().default(false),
    comment: z.string().trim().optional().default(""),
  })
  .superRefine((data, ctx) => {
    if (data.hasCarLicense && !data.carLicenseType.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["carLicenseType"],
        message: "กรุณาระบุชนิดใบขับขี่รถยนต์",
      })
    }
    if (data.hasOther && !data.comment.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["comment"],
        message: "กรุณาระบุรายละเอียดเอกสารอื่นๆ ในช่องความคิดเห็น",
      })
    }
  })

export type DocumentCheckInput = z.input<typeof documentCheckSchema>
export type DocumentCheckParsed = z.output<typeof documentCheckSchema>

export function createEmptyDocumentCheck(todayIso: string): DocumentCheckInput {
  return {
    applicantId: "",
    checkedById: "",
    checkedAt: todayIso,
    hasPhoto: false,
    hasIdCard: false,
    hasHouseRegistration: false,
    hasEducationCert: false,
    hasCarLicense: false,
    carLicenseType: "",
    hasMotorcycleLicense: false,
    hasDisabilityCard: false,
    hasMilitaryDoc: false,
    hasOther: false,
    isComplete: false,
    comment: "",
  }
}