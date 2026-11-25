import { z } from "zod"
import { optionalEmail, optionalText, requiredText } from "@/lib/validators"

export const customerStatusOptions = ["อยู่ในสัญญา", "หมดสัญญา"] as const

export const customerContactSchema = z.object({
  id: z.number().optional(),
  name: requiredText("ชื่อผู้ติดต่อ", 150),
  department: optionalText(150),
  phone: optionalText(50),
  email: optionalEmail,
  note: optionalText(300),
})

export const customerSchema = z.object({
  status: optionalText(50),
  name: requiredText("ชื่อหน่วยงาน", 255),
  jobName: optionalText(255),
  address: optionalText(500),
  phone: optionalText(50),
  email: optionalEmail,
  companyId: optionalText(20),
  startDate: optionalText(20),
  endDate: optionalText(20),
  contractValue: optionalText(30),
  dailyPenalty: optionalText(30),
  headcount: optionalText(20),
  reserveHeadcount: optionalText(20),
  note: optionalText(1000),
  contacts: z.array(customerContactSchema),
})

export type CustomerContactInput = z.infer<typeof customerContactSchema>
export type CustomerInput = z.infer<typeof customerSchema>

export const emptyCustomer: CustomerInput = {
  status: "อยู่ในสัญญา",
  name: "",
  jobName: "",
  address: "",
  phone: "",
  email: "",
  companyId: "",
  startDate: "",
  endDate: "",
  contractValue: "",
  dailyPenalty: "",
  headcount: "",
  reserveHeadcount: "",
  note: "",
  contacts: [],
}