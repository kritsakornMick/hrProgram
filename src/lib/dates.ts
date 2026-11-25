import dayjs from "dayjs"
import buddhistEra from "dayjs/plugin/buddhistEra"
import utc from "dayjs/plugin/utc"
import "dayjs/locale/th"

dayjs.extend(buddhistEra)
dayjs.extend(utc)

/** 25 พ.ย. 2569 */
export function formatThaiDate(date: Date | string | null | undefined) {
  if (!date) return "-"
  return dayjs(date).locale("th").format("D MMM BBBB")
}

/** วันพุธที่ 25 พฤศจิกายน 2569 */
export function formatThaiDateLong(date: Date | string | null | undefined) {
  if (!date) return "-"
  return dayjs(date).locale("th").format("วันddddที่ D MMMM BBBB")
}

/*
 * ช่องวันที่ใน schema.prisma เป็น @db.Date (ไม่มีเวลา) Prisma รับ/คืนค่าเป็นเที่ยงคืน UTC
 * จึงต้องแปลงแบบ UTC ไม่อย่างนั้นเวลาไทย (UTC+7) จะทำให้วันที่ถอยไป 1 วันตอนบันทึก
 */

/** แปลงค่าจากช่อง <input type="date"> (YYYY-MM-DD) เป็น Date (เที่ยงคืน UTC) */
export function parseDateInput(value: string | null | undefined): Date | null {
  if (!value) return null
  const d = dayjs.utc(value)
  return d.isValid() ? d.toDate() : null
}

/** แปลง Date (จากช่อง @db.Date) เป็นค่าสำหรับช่อง <input type="date"> */
export function toDateInput(date: Date | null | undefined): string {
  return date ? dayjs.utc(date).format("YYYY-MM-DD") : ""
}
