/*
 * สร้างไฟล์ CSV สำหรับเปิดใน Excel (ไม่ต้องใช้ library เพิ่ม)
 * - ขึ้นต้นด้วย BOM ให้ Excel อ่านภาษาไทย (UTF-8) ถูก
 * - ครอบทุกช่องด้วย "..." กันจุลภาค/ขึ้นบรรทัดใหม่ในข้อมูลทำให้คอลัมน์เลื่อน
 * - กันการแทรกสูตร (CSV injection): ค่าที่ขึ้นต้นด้วย = + - @ จะถูกนำหน้าด้วย '
 */

export type CsvColumn<T> = {
  header: string
  value: (row: T) => string | null | undefined
  /**
   * เลขที่ต้องเก็บเป็นข้อความ (เลขบัตร เลขบัญชี เบอร์โทร) ไม่ให้ Excel ตัดเลข 0 ข้างหน้า
   * หรือแปลงเป็น 1.23E+12
   */
  keepAsText?: boolean
}

const FORMULA_START = /^[=+\-@\t\r]/
/** ตัวเลขล้วน (อาจมีขีด/ช่องว่างคั่น) ปลอดภัยที่จะห่อเป็น ="..." */
const DIGITS_ONLY = /^[\d\s-]+$/

function quote(text: string) {
  return `"${text.replaceAll('"', '""')}"`
}

/** 1 ช่องใน CSV (ว่าง = "-") */
export function csvCell(value: string | null | undefined, keepAsText = false): string {
  const text = (value ?? "").replace(/\r\n|\r|\n/g, " ").trim()
  if (!text || text === "-") return quote("-")
  // ="0812345678" ทำให้ Excel แสดงเป็นข้อความ เก็บเลข 0 ข้างหน้า ใช้เฉพาะค่าที่เป็นตัวเลขล้วนเท่านั้น
  if (keepAsText && DIGITS_ONLY.test(text)) return quote(`="${text}"`)
  return quote(FORMULA_START.test(text) ? `'${text}` : text)
}

/** สร้างเนื้อหาไฟล์ CSV ทั้งไฟล์ (มี BOM และขึ้นบรรทัดแบบ CRLF ตามที่ Excel ใช้) */
export function toCsv<T>(columns: readonly CsvColumn<T>[], rows: readonly T[]): string {
  const lines = [
    columns.map((column) => csvCell(column.header)).join(","),
    ...rows.map((row) => columns.map((column) => csvCell(column.value(row), column.keepAsText)).join(",")),
  ]
  return `﻿${lines.join("\r\n")}\r\n`
}
