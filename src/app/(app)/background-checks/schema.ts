import { z } from "zod"
import { optionalDate, optionalNationalId, optionalText, requiredDate, requiredText } from "@/lib/validators"

/*
 * กติกาตรวจข้อมูลหนังสือมอบอำนาจและตรวจประวัติ (#11) — ใช้ทั้งในฟอร์มและใน Server Action
 * ทุกช่องเป็น string (ช่องว่าง = "") แปลงเป็นตัวเลข/วันที่/null ตอนบันทึก (ดู actions.ts)
 * ข้อมูลผู้มอบอำนาจ (ชื่อ เลขบัตร ที่อยู่) ไม่ได้กรอกที่นี่ ดึงจากใบสมัครของการสัมภาษณ์ที่เลือก
 */
export const backgroundCheckSchema = z.object({
  interviewId: z.string().regex(/^\d+$/, "กรุณาเลือกการสัมภาษณ์"),
  documentDate: requiredDate("วันที่ทำหนังสือ"),
  grantorIdIssuedBy: optionalText(),
  granteeName: requiredText("ชื่อผู้รับมอบอำนาจ"),
  granteeNationalId: optionalNationalId,
  granteeIdIssuedBy: optionalText(),
  granteeIdExpiresAt: optionalDate,
  effectiveDate: optionalDate,
  purpose: optionalText(500),
})

export type BackgroundCheckInput = z.infer<typeof backgroundCheckSchema>

export const emptyBackgroundCheck: BackgroundCheckInput = {
  interviewId: "",
  documentDate: "",
  grantorIdIssuedBy: "",
  granteeName: "",
  granteeNationalId: "",
  granteeIdIssuedBy: "",
  granteeIdExpiresAt: "",
  effectiveDate: "",
  purpose: "",
}
