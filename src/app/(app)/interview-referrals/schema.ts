import { z } from "zod"
import { optionalText, requiredDate, requiredText } from "@/lib/validators"

/*
 * กติกาตรวจข้อมูลหนังสือส่งตัวพนักงานเพื่อเข้าสัมภาษณ์ (#9) — ใช้ทั้งในฟอร์มและใน Server Action
 * ทุกช่องเป็น string (ช่องว่าง = "") แปลงเป็นตัวเลข/วันที่/null ตอนบันทึก (ดู data.ts)
 * ข้อมูลพนักงาน (ชื่อ ที่อยู่ เลขบัตร อายุ วุฒิ โทรศัพท์) ไม่ได้กรอกที่นี่ ดึงจากใบสมัครของการสัมภาษณ์ที่เลือก
 */

/** ช่อง id ในฐานข้อมูลเป็น Int (สูงสุด 2,147,483,647) ค่าที่เกินจะทำให้ Prisma error */
const MAX_DB_INT = 2_147_483_647

function isDbId(value: string) {
  return /^\d{1,10}$/.test(value) && Number(value) > 0 && Number(value) <= MAX_DB_INT
}

export const referralSchema = z.object({
  interviewId: z.string().refine(isDbId, "กรุณาเลือกการสัมภาษณ์"),
  letterNo: optionalText(50),
  documentDate: requiredDate("วันที่ทำหนังสือ"),
  addressedTo: requiredText("เรียน (ผู้รับหนังสือ)", 200),
  issuedById: z.string().refine((v) => v === "" || isDbId(v), "กรุณาเลือกพนักงานจากรายการ"),
})

export type ReferralInput = z.infer<typeof referralSchema>

export const emptyReferral: ReferralInput = {
  interviewId: "",
  letterNo: "",
  documentDate: "",
  addressedTo: "",
  issuedById: "",
}
