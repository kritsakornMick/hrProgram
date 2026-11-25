/**
 * ข้อมูลที่ดึงมาจากการสัมภาษณ์ที่เลือก ใช้เติมในหนังสือ (ไม่ได้กรอกในฟอร์มนี้)
 * วันที่เป็น string YYYY-MM-DD (ว่าง = "") ส่งข้าม server → browser ได้ตรงๆ
 */
export type DocumentParties = {
  interviewId: number
  applicantId: number
  /** ผู้มอบอำนาจ = ผู้สมัคร */
  grantor: {
    fullName: string
    nationalId: string
    idCardExpiresAt: string
    addressNo: string
    moo: string
    road: string
    subdistrict: string
    district: string
    province: string
    phone: string
  }
  /** หน่วยงานลูกค้าที่ผู้สมัครไปสมัคร/ถูกส่งตัวไป (ผู้ได้รับความยินยอมให้ตรวจประวัติ) */
  customer: { name: string; address: string } | null
  /** "ทำที่" ของหนังสือ */
  place: string
}
