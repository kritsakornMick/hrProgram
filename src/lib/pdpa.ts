/**
 * ซ่อนเลขบัตรประชาชนให้เหลือ 3 ตัวท้าย สำหรับแสดงในตาราง/รายการ (PDPA)
 * 1234567890123 → X-XXXX-XXXXX-12-3
 */
export function maskNationalId(value: string | null | undefined) {
  if (!value) return "-"
  const digits = value.replace(/\D/g, "")
  if (digits.length !== 13) return `${"X".repeat(Math.max(digits.length - 3, 0))}${digits.slice(-3)}`
  return `X-XXXX-XXXXX-${digits.slice(10, 12)}-${digits[12]}`
}
