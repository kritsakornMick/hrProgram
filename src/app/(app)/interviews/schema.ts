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

export const interviewSchema = z.object({
  documentCheckId: z.string().trim().min(1, "กรุณาเลือกผู้สมัครงาน (ใบตรวจเอกสาร)"),
  companyFilterId: z.string().trim().optional(),
  customerId: z.string().trim().optional(),
  staffId: z.string().trim().optional(),
  interviewedAt: z.string().trim().optional(),
  result: z.string().trim().optional(),
  resultReason: z.string().trim().optional(),
  employmentStatus: z.string().trim().optional(),
  wageRate: z.string().trim().optional(),
  position: z.string().trim().optional(),
  startDate: z.string().trim().optional(),
  probationDays: z.string().trim().optional(),
  probationStartDate: z.string().trim().optional(),
  probationEndDate: z.string().trim().optional(),
  evaluatedAt: z.string().trim().optional(),
  evaluationResult: z.string().trim().optional(),
  comment: z.string().trim().optional(),
  bankName: z.string().trim().optional(),
  bankAccountNo: z.string().trim().optional(),
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