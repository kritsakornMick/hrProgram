import { z } from "zod"
import {
  optionalDate,
  optionalDecimal,
  optionalInteger,
  optionalNationalId,
  optionalPhone,
  optionalText,
  requiredDate,
} from "@/lib/validators"

/*
 * กติกาตรวจข้อมูลใบสมัครงาน — ใช้ทั้งในฟอร์ม (ฝั่ง browser) และใน Server Action (ฝั่ง server)
 * - ช่องข้อความ/ตัวเลข/วันที่ เป็น string (ช่องว่าง = "") แปลงเป็นตัวเลข/วันที่/null ตอนบันทึก (ดู mapping.ts)
 * - ช่องติ๊กเป็น boolean
 * - ชื่อและระดับภาษาแยกช่องในฟอร์ม แต่รวมเป็นช่องเดียวตอนบันทึก (ดู compose.ts)
 * - ความยาว/ทศนิยมของตัวเลขให้ตรงกับ @db.Decimal ใน prisma/schema.prisma
 * - เลขบัตรห้ามซ้ำ ตรวจใน Server Action (ต้องดูฐานข้อมูล)
 *
 * มี 2 ระดับ:
 * - applicantDraftSchema : "บันทึกร่าง" ตรวจแค่รูปแบบข้อมูล + ต้องมีชื่อ
 * - applicantSchema      : "บันทึกใบสมัคร" ตรวจช่องบังคับครบตาม REQUIRED_FIELDS
 */
const applicantObject = z.object({
  // --- ตำแหน่งที่สมัคร ---
  appliedAt: requiredDate("วันที่สมัคร"),
  position: optionalText(),
  expectedSalary: optionalDecimal(10, 2),

  // --- ชื่อ (รวมเป็น fullNameTh / fullNameEn ตอนบันทึก) ---
  titleTh: optionalText(30),
  firstNameTh: optionalText(100),
  lastNameTh: optionalText(100),
  firstNameEn: optionalText(100),
  lastNameEn: optionalText(100),

  // --- ข้อมูลพื้นฐาน ---
  nationalId: optionalNationalId,
  idCardIssuedAt: optionalDate,
  idCardExpiresAt: optionalDate,
  birthDate: optionalDate,
  weightKg: optionalDecimal(4, 1),
  heightCm: optionalDecimal(4, 1),
  ethnicity: optionalText(100),
  nationality: optionalText(100),
  religion: optionalText(100),

  // --- ที่อยู่และการติดต่อ ---
  addressNo: optionalText(50),
  moo: optionalText(50),
  road: optionalText(),
  subdistrict: optionalText(),
  district: optionalText(),
  province: optionalText(),
  homePhone: optionalPhone,
  mobilePhone: optionalPhone,
  livingWith: optionalText(),
  residencePhone: optionalPhone,

  // --- ข้อมูลส่วนตัว / ครอบครัว ---
  fatherName: optionalText(),
  fatherOccupation: optionalText(),
  motherName: optionalText(),
  motherOccupation: optionalText(),
  siblingsCount: optionalInteger(50),
  birthOrder: optionalInteger(50),
  maritalStatus: optionalText(100),
  spouseName: optionalText(),
  spousePhone: optionalPhone,
  childrenCount: optionalInteger(50),
  isPregnant: z.boolean(),
  pregnancyMonths: optionalInteger(10),
  militaryStatus: optionalText(100),
  hasCriminalRecord: z.boolean(),
  criminalRecordDetail: optionalText(500),

  // --- การศึกษาและความสามารถ ---
  educationLevel: optionalText(100),
  lastInstitution: optionalText(),
  institutionProvince: optionalText(),
  gpa: optionalDecimal(1, 2).refine((v) => v === "" || Number(v) <= 4, "เกรดเฉลี่ยต้องไม่เกิน 4.00"),
  major: optionalText(),
  graduationYear: z
    .string()
    .trim()
    .refine((v) => v === "" || /^25\d{2}$/.test(v), "กรอกปี พ.ศ. 4 หลัก เช่น 2565"),
  languageSkills: optionalText(),
  /** ระดับภาษา พูด/อ่าน/เขียน (รวมเป็น languageDetail ตอนบันทึก) */
  speakLevel: optionalText(30),
  readLevel: optionalText(30),
  writeLevel: optionalText(30),
  /** ค่า languageDetail เดิมที่อ่านรูปแบบไม่ออก (ไม่แสดงในฟอร์ม เก็บไว้ไม่ให้ข้อมูลหาย) */
  languageDetailRaw: optionalText(),
  thaiTypingWpm: optionalInteger(300),
  englishTypingWpm: optionalInteger(300),
  canUseWord: z.boolean(),
  canUseExcel: z.boolean(),
  canUsePowerpoint: z.boolean(),
  otherComputerSkills: optionalText(),
  hasMotorcycleLicense: z.boolean(),
  hasCarLicense: z.boolean(),
  carLicenseType: optionalText(100),
  licenseIssuedAt: optionalDate,
  licenseExpiresAt: optionalDate,

  // --- ประวัติการทำงานล่าสุด ---
  lastEmployer: optionalText(),
  lastPosition: optionalText(),
  lastSalary: optionalDecimal(10, 2),
  lastWorkDuration: optionalText(50),
  leavingReason: optionalText(500),

  // --- การติดต่อฉุกเฉินและอื่นๆ ---
  emergencyContactName: optionalText(),
  emergencyContactRelation: optionalText(100),
  emergencyContactPhone: optionalPhone,
  jobSource: optionalText(),

  // --- ความยินยอม PDPA (ไม่ล็อกค่าตายตัว เผื่อข้อมูลเก่าจาก Access) ---
  consentCriminalCheck: optionalText(50),
  consentHealthCheck: optionalText(50),
  consentIdentity: optionalText(50),
  consentReference: optionalText(50),
})

export type ApplicantInput = z.infer<typeof applicantObject>
type StringField = { [K in keyof ApplicantInput]: ApplicantInput[K] extends string ? K : never }[keyof ApplicantInput]

/**
 * ช่องบังคับกรอกตอน "บันทึกใบสมัคร" ตามภาพดีไซน์ที่มีเครื่องหมาย * (ยืนยันใช้ตามดีไซน์แล้ว)
 * ฟอร์มใช้รายการนี้แสดง * ด้วย ถ้าจะเพิ่ม/ลดช่องบังคับ แก้ที่นี่ที่เดียว
 * ("บันทึกร่าง" บังคับแค่ชื่อ ดู applicantDraftSchema)
 */
export const REQUIRED_FIELDS = {
  appliedAt: "กรุณาเลือกวันที่สมัคร",
  position: "กรุณาเลือกตำแหน่งงาน",
  titleTh: "กรุณาเลือกคำนำหน้าชื่อ",
  firstNameTh: "กรุณากรอกชื่อ (ไทย)",
  lastNameTh: "กรุณากรอกนามสกุล (ไทย)",
  nationalId: "กรุณากรอกเลขบัตรประชาชน",
  subdistrict: "กรุณากรอกตำบล/แขวง",
  district: "กรุณากรอกอำเภอ/เขต",
  province: "กรุณาเลือกจังหวัด",
  mobilePhone: "กรุณากรอกเบอร์มือถือ",
  educationLevel: "กรุณาเลือกระดับการศึกษา",
  emergencyContactRelation: "กรุณาเลือกความสัมพันธ์",
} satisfies Partial<Record<StringField, string>>

export function isRequiredField(name: string) {
  return name in REQUIRED_FIELDS
}

/** กติกาที่ต้องดูหลายช่องพร้อมกัน (ใช้ทั้งร่างและใบสมัครจริง) */
function checkRelatedFields(d: ApplicantInput, ctx: z.RefinementCtx) {
  // ค่าวันที่เป็น YYYY-MM-DD จึงเทียบแบบ string ได้เลย
  if (d.idCardIssuedAt && d.idCardExpiresAt && d.idCardExpiresAt <= d.idCardIssuedAt) {
    ctx.addIssue({ code: "custom", path: ["idCardExpiresAt"], message: "วันบัตรหมดอายุต้องหลังวันออกบัตร" })
  }
  if (d.licenseIssuedAt && d.licenseExpiresAt && d.licenseExpiresAt <= d.licenseIssuedAt) {
    ctx.addIssue({ code: "custom", path: ["licenseExpiresAt"], message: "วันใบขับขี่หมดอายุต้องหลังวันออกใบขับขี่" })
  }
  if (d.isPregnant && (d.pregnancyMonths === "" || Number(d.pregnancyMonths) < 1)) {
    ctx.addIssue({ code: "custom", path: ["pregnancyMonths"], message: "กรุณากรอกจำนวนเดือน (1–10)" })
  }
  if (d.hasCriminalRecord && d.criminalRecordDetail === "") {
    ctx.addIssue({ code: "custom", path: ["criminalRecordDetail"], message: "กรุณาระบุคดีที่เคยต้องโทษ" })
  }
}

/** บันทึกร่าง: ตรวจรูปแบบ + ต้องมีชื่อ */
export const applicantDraftSchema = applicantObject.superRefine((d, ctx) => {
  checkRelatedFields(d, ctx)
  if (!d.firstNameTh) ctx.addIssue({ code: "custom", path: ["firstNameTh"], message: REQUIRED_FIELDS.firstNameTh })
})

/** บันทึกใบสมัคร: ตรวจครบทุกข้อ */
export const applicantSchema = applicantObject.superRefine((d, ctx) => {
  checkRelatedFields(d, ctx)
  for (const [field, message] of Object.entries(REQUIRED_FIELDS) as [StringField, string][]) {
    if (!d[field]) ctx.addIssue({ code: "custom", path: [field], message })
  }
})

export const SAVE_MODES = ["draft", "submit"] as const
export type SaveMode = (typeof SAVE_MODES)[number]

export function schemaFor(mode: SaveMode) {
  return mode === "draft" ? applicantDraftSchema : applicantSchema
}

/** ค่าเริ่มต้นของฟอร์มเพิ่มผู้สมัคร (appliedAt ใส่วันนี้ในหน้า new/page.tsx) */
export const emptyApplicant: ApplicantInput = {
  appliedAt: "",
  position: "",
  expectedSalary: "",
  titleTh: "",
  firstNameTh: "",
  lastNameTh: "",
  firstNameEn: "",
  lastNameEn: "",
  nationalId: "",
  idCardIssuedAt: "",
  idCardExpiresAt: "",
  birthDate: "",
  weightKg: "",
  heightCm: "",
  ethnicity: "ไทย",
  nationality: "ไทย",
  religion: "",
  addressNo: "",
  moo: "",
  road: "",
  subdistrict: "",
  district: "",
  province: "",
  homePhone: "",
  mobilePhone: "",
  livingWith: "",
  residencePhone: "",
  fatherName: "",
  fatherOccupation: "",
  motherName: "",
  motherOccupation: "",
  siblingsCount: "",
  birthOrder: "",
  maritalStatus: "",
  spouseName: "",
  spousePhone: "",
  childrenCount: "",
  isPregnant: false,
  pregnancyMonths: "",
  militaryStatus: "",
  hasCriminalRecord: false,
  criminalRecordDetail: "",
  educationLevel: "",
  lastInstitution: "",
  institutionProvince: "",
  gpa: "",
  major: "",
  graduationYear: "",
  languageSkills: "",
  speakLevel: "",
  readLevel: "",
  writeLevel: "",
  languageDetailRaw: "",
  thaiTypingWpm: "",
  englishTypingWpm: "",
  canUseWord: false,
  canUseExcel: false,
  canUsePowerpoint: false,
  otherComputerSkills: "",
  hasMotorcycleLicense: false,
  hasCarLicense: false,
  carLicenseType: "",
  licenseIssuedAt: "",
  licenseExpiresAt: "",
  lastEmployer: "",
  lastPosition: "",
  lastSalary: "",
  lastWorkDuration: "",
  leavingReason: "",
  emergencyContactName: "",
  emergencyContactRelation: "",
  emergencyContactPhone: "",
  jobSource: "",
  consentCriminalCheck: "",
  consentHealthCheck: "",
  consentIdentity: "",
  consentReference: "",
}
