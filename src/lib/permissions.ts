/**
 * สิทธิ์การใช้งานตาม role
 * - admin  : ทำได้ทุกอย่าง รวมถึงข้อมูลบริษัทและผู้ใช้
 * - hr     : เพิ่ม/แก้ข้อมูลผู้สมัคร ลูกค้า และออกเอกสาร
 * - viewer : ดูอย่างเดียว
 */
export const ROLES = ["admin", "hr", "viewer"] as const
export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<Role, string> = {
  admin: "ผู้ดูแลระบบ",
  hr: "เจ้าหน้าที่ HR",
  viewer: "ดูอย่างเดียว",
}

export function toRole(value: string | null | undefined): Role {
  return ROLES.includes(value as Role) ? (value as Role) : "viewer"
}

export function hasRole(role: Role, allowed: readonly Role[]) {
  return allowed.includes(role)
}
