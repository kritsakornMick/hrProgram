import type { Applicant, Prisma } from "@/generated/prisma/client"
import { parseDateInput, toDateInput } from "@/lib/dates"
import { emptyToNull, toDecimal, toInt } from "@/lib/validators"
import {
  composeFullNameEn,
  composeFullNameTh,
  composeLanguageDetail,
  splitFullNameEn,
  splitFullNameTh,
  splitLanguageDetail,
} from "./compose"
import { emptyApplicant, type ApplicantInput } from "./schema"

/** แปลงข้อมูลจากฟอร์ม (string) เป็นข้อมูลสำหรับบันทึก (ตัวเลข/วันที่/null) */
export function toApplicantData(d: ApplicantInput) {
  // ช่องที่มีเฉพาะในฟอร์ม แยกออกมารวมเป็นช่องเดียวก่อนบันทึก
  const {
    titleTh,
    firstNameTh,
    lastNameTh,
    firstNameEn,
    lastNameEn,
    speakLevel,
    readLevel,
    writeLevel,
    languageDetailRaw,
    ...columns
  } = d

  return {
    ...emptyToNull(columns),
    fullNameTh: composeFullNameTh(titleTh, firstNameTh, lastNameTh),
    fullNameEn: composeFullNameEn(titleTh, firstNameEn, lastNameEn) || null,
    languageDetail:
      composeLanguageDetail({ speak: speakLevel, read: readLevel, write: writeLevel }, languageDetailRaw) || null,
    appliedAt: parseDateInput(d.appliedAt) ?? new Date(),
    expectedSalary: toDecimal(d.expectedSalary),
    idCardIssuedAt: parseDateInput(d.idCardIssuedAt),
    idCardExpiresAt: parseDateInput(d.idCardExpiresAt),
    birthDate: parseDateInput(d.birthDate),
    weightKg: toDecimal(d.weightKg),
    heightCm: toDecimal(d.heightCm),
    siblingsCount: toInt(d.siblingsCount),
    birthOrder: toInt(d.birthOrder),
    childrenCount: toInt(d.childrenCount),
    // ไม่ได้ติ๊กตั้งครรภ์ / เคยต้องโทษ / มีใบขับขี่รถยนต์ = ล้างช่องรายละเอียด
    pregnancyMonths: d.isPregnant ? toInt(d.pregnancyMonths) : null,
    criminalRecordDetail: d.hasCriminalRecord ? d.criminalRecordDetail || null : null,
    carLicenseType: d.hasCarLicense ? d.carLicenseType || null : null,
    gpa: toDecimal(d.gpa),
    thaiTypingWpm: toInt(d.thaiTypingWpm),
    englishTypingWpm: toInt(d.englishTypingWpm),
    licenseIssuedAt: parseDateInput(d.licenseIssuedAt),
    licenseExpiresAt: parseDateInput(d.licenseExpiresAt),
    lastSalary: toDecimal(d.lastSalary),
  } satisfies Prisma.ApplicantUncheckedCreateInput
}

/**
 * แปลงข้อมูลจากฐานข้อมูลเป็นค่าในฟอร์ม (ทุกช่องเป็น string ยกเว้นช่องติ๊ก)
 * null → "", Date → YYYY-MM-DD, ตัวเลข/Decimal → string
 */
export function toApplicantInput(applicant: Applicant): ApplicantInput {
  const row: Record<string, unknown> = applicant
  const fromColumns = Object.fromEntries(
    Object.keys(emptyApplicant).map((key) => {
      const value = row[key]
      if (typeof value === "boolean") return [key, value]
      if (value instanceof Date) return [key, toDateInput(value)]
      if (value === null || value === undefined) return [key, ""]
      return [key, String(value)]
    }),
  ) as ApplicantInput

  const th = splitFullNameTh(applicant.fullNameTh)
  const en = splitFullNameEn(applicant.fullNameEn)
  const lang = splitLanguageDetail(applicant.languageDetail)
  return {
    ...fromColumns,
    titleTh: th.title,
    firstNameTh: th.first,
    lastNameTh: th.last,
    firstNameEn: en.first,
    lastNameEn: en.last,
    speakLevel: lang.speak,
    readLevel: lang.read,
    writeLevel: lang.write,
    languageDetailRaw: lang.raw,
  }
}
