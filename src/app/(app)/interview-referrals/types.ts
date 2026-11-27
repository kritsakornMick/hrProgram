/**
 * ข้อมูลที่ดึงมาจากการสัมภาษณ์ที่เลือก ใช้เติมในหนังสือส่งตัว (ไม่ได้กรอกในฟอร์มนี้)
 * วันที่เป็น string YYYY-MM-DD (ว่าง = "") ส่งข้าม server → browser ได้ตรงๆ
 */
export type ReferralParties = {
  interviewId: number
  applicantId: number
  /** พนักงานที่ส่งตัว = ผู้สมัคร */
  employee: {
    fullName: string
    /** ที่อยู่ต่อกันเป็นบรรทัดเดียว */
    address: string
    nationalId: string
    birthDate: string
    educationLevel: string
    phone: string
  }
  /** ตำแหน่งที่ส่งไปสัมภาษณ์ (ตำแหน่งในการสัมภาษณ์ ถ้าไม่มีใช้ตำแหน่งที่สมัคร) */
  position: string
  /** หน่วยงานลูกค้าที่ส่งตัวไป */
  customerName: string
  /** บริษัทผู้ออกหนังสือ (บริษัทที่หน่วยงานลูกค้าสังกัด) ใช้ทำหัวกระดาษ */
  company: { name: string; address: string; phone: string }
}

/** พนักงานผู้ทำหนังสือ (ลงชื่อท้ายหนังสือ) */
export type StaffOption = { value: string; label: string; name: string; position: string }
