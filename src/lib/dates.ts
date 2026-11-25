import dayjs from "dayjs"
import buddhistEra from "dayjs/plugin/buddhistEra"
import "dayjs/locale/th"

dayjs.extend(buddhistEra)

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

/** แปลงค่าจากช่อง <input type="date"> (YYYY-MM-DD) เป็น Date */
export function parseDateInput(value: string | null | undefined): Date | null {
  if (!value) return null
  const d = dayjs(value)
  return d.isValid() ? d.toDate() : null
}

/** แปลง Date เป็นค่าสำหรับช่อง <input type="date"> */
export function toDateInput(date: Date | null | undefined): string {
  return date ? dayjs(date).format("YYYY-MM-DD") : ""
}
