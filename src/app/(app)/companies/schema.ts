import { z } from "zod"
import { optionalEmail, optionalTaxId, optionalText, requiredText } from "@/lib/validators"

/**
 * กติกาตรวจข้อมูลบริษัท — ใช้ทั้งในฟอร์ม (ฝั่ง browser) และใน Server Action (ฝั่ง server)
 * ทุกช่องเป็น string เพื่อให้ผูกกับ <Input> ได้ตรงๆ ช่องว่างจะถูกแปลงเป็น null ตอนบันทึก
 */
export const companySchema = z.object({
  code: requiredText("รหัสบริษัท", 20),
  nameTh: requiredText("ชื่อบริษัท (ไทย)"),
  nameEn: optionalText(),
  taxId: optionalTaxId,
  address: optionalText(500),
  phone: optionalText(50),
  fax: optionalText(50),
  email: optionalEmail,
})

export type CompanyInput = z.infer<typeof companySchema>

export const emptyCompany: CompanyInput = {
  code: "",
  nameTh: "",
  nameEn: "",
  taxId: "",
  address: "",
  phone: "",
  fax: "",
  email: "",
}
