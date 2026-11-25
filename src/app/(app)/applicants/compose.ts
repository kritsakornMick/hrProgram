import { NAME_TITLES } from "./options"

/*
 * ฟอร์มแยกช่องให้กรอกง่าย แต่ในฐานข้อมูล (prisma/schema.prisma) เก็บรวมเป็นช่องเดียว:
 * - คำนำหน้า + ชื่อ + นามสกุล (ไทย)  → fullNameTh  เช่น "นายสมชาย ใจดี"
 * - ชื่อ + นามสกุล (อังกฤษ)          → fullNameEn  เช่น "Mr. Somchai Jaidee" (คำนำหน้า ENG เติมจากคำนำหน้าไทย)
 * - ระดับ พูด / อ่าน / เขียน          → languageDetail เช่น "พูด: ดี, อ่าน: พอใช้, เขียน: พอใช้"
 * ไฟล์นี้แปลงไป-กลับ ใช้ทั้งตอนบันทึก (actions.ts) และตอนเปิดแก้ไข (mapping.ts)
 */

// เรียงคำนำหน้ายาวก่อน ("นางสาว" ต้องเจอก่อน "นาง")
const TITLES_LONGEST_FIRST = [...NAME_TITLES].sort((a, b) => b.th.length - a.th.length)

export function composeFullNameTh(title: string, first: string, last: string) {
  return `${title.trim()}${first.trim()} ${last.trim()}`.trim()
}

export function splitFullNameTh(fullName: string | null) {
  let rest = (fullName ?? "").trim()
  const title = TITLES_LONGEST_FIRST.find((t) => rest.startsWith(t.th))?.th ?? ""
  rest = rest.slice(title.length).trim()
  const [first = "", ...lastParts] = rest.split(/\s+/)
  return { title, first, last: lastParts.join(" ") }
}

export function composeFullNameEn(titleTh: string, first: string, last: string) {
  const name = `${first.trim()} ${last.trim()}`.trim()
  if (!name) return ""
  const titleEn = NAME_TITLES.find((t) => t.th === titleTh)?.en
  return titleEn ? `${titleEn} ${name}` : name
}

export function splitFullNameEn(fullName: string | null) {
  const words = (fullName ?? "").trim().split(/\s+/).filter(Boolean)
  // ตัดคำนำหน้า ENG ออก (Mr. / Mrs. / Miss / Ms.)
  if (words.length > 1 && /^(mr|mrs|miss|ms)\.?$/i.test(words[0])) words.shift()
  const [first = "", ...lastParts] = words
  return { first, last: lastParts.join(" ") }
}

const LANGUAGE_PARTS = [
  ["speak", "พูด"],
  ["read", "อ่าน"],
  ["write", "เขียน"],
] as const

type LanguageLevels = { speak: string; read: string; write: string }

/** รวมระดับภาษา ถ้าไม่ได้เลือกเลย ใช้ค่าเดิม (raw) เพื่อไม่ให้ข้อมูลเก่าจาก Access หาย */
export function composeLanguageDetail(levels: LanguageLevels, raw: string) {
  const parts = LANGUAGE_PARTS.filter(([key]) => levels[key].trim()).map(([key, label]) => `${label}: ${levels[key].trim()}`)
  return parts.length ? parts.join(", ") : raw.trim()
}

/** แยกระดับภาษา ถ้าอ่านรูปแบบไม่ออก คืนค่าเดิมไว้ใน raw */
export function splitLanguageDetail(value: string | null): LanguageLevels & { raw: string } {
  const text = (value ?? "").trim()
  const levels = { speak: "", read: "", write: "" }
  for (const [key, label] of LANGUAGE_PARTS) {
    const match = text.match(new RegExp(`${label}\\s*:\\s*([^,]+)`))
    if (match) levels[key] = match[1].trim()
  }
  const parsed = levels.speak || levels.read || levels.write
  return { ...levels, raw: parsed ? "" : text }
}
