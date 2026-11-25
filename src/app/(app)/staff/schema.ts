import { z } from "zod"
import { optionalEmail, optionalNationalId, optionalText, requiredText } from "@/lib/validators"

export const STAFF_POSITIONS = [
  "ผู้จัดการฝ่ายบุคคล",
  "หัวหน้าฝ่ายบุคคล",
  "เจ้าหน้าที่ฝ่ายบุคคล",
  "เจ้าหน้าที่สรรหาว่าจ้าง",
  "เจ้าหน้าที่ฝ่ายปฏิบัติการ",
  "เจ้าหน้าที่ธุรการ",
] as const

export const STAFF_DEPARTMENTS = [
  "ฝ่ายบุคคล (HR)",
  "ฝ่ายสรรหาว่าจ้าง",
  "ฝ่ายปฏิบัติการ",
  "ฝ่ายธุรการ",
  "ฝ่ายบัญชีและการเงิน",
] as const

export const STAFF_STATUSES = ["ปฏิบัติงาน", "ทดลองงาน", "ลาออก", "พักงาน"] as const

export const BANK_NAMES = [
  "ธนาคาร กรุงเทพ จำกัด (มหาชน)",
  "ธนาคาร กสิกรไทย จำกัด (มหาชน)",
  "ธนาคาร กรุงไทย จำกัด (มหาชน)",
  "ธนาคาร ไทยพาณิชย์ จำกัด (มหาชน)",
  "ธนาคาร กรุงศรีอยุธยา จำกัด (มหาชน)",
  "ธนาคาร ทหารไทยธนชาต จำกัด (มหาชน)",
  "ธนาคาร ออมสิน",
] as const

export const BANK_ACCOUNT_TYPES = ["ออมทรัพย์", "กระแสรายวัน"] as const

/**
 * กติกาตรวจข้อมูลพนักงานบริษัท — ใช้ทั้งในฟอร์ม (ฝั่ง browser) และ Server Action (ฝั่ง server)
 */
export const staffSchema = z.object({
  code: optionalText(20),
  name: requiredText("ชื่อพนักงาน", 150),
  position: optionalText(100),
  department: optionalText(100),
  nationalId: optionalNationalId,
  address: optionalText(500),
  phone: optionalText(50),
  email: optionalEmail,
  status: optionalText(50),
  startDate: optionalText(20),
  endDate: optionalText(20),
  bankName: optionalText(100),
  bankAccountType: optionalText(50),
  bankAccountNo: optionalText(30),
  emergencyContact: optionalText(150),
  workplace: optionalText(200),
  contactPhone: optionalText(50),
  note: optionalText(500),
})

export type StaffInput = z.infer<typeof staffSchema>

export const emptyStaff: StaffInput = {
  code: "",
  name: "",
  position: "",
  department: "",
  nationalId: "",
  address: "",
  phone: "",
  email: "",
  status: "ปฏิบัติงาน",
  startDate: "",
  endDate: "",
  bankName: "",
  bankAccountType: "ออมทรัพย์",
  bankAccountNo: "",
  emergencyContact: "",
  workplace: "",
  contactPhone: "",
  note: "",
}