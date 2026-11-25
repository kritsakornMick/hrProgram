import "server-only"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { cache } from "react"
import { auth } from "@/lib/auth"
import { hasRole, toRole, type Role } from "@/lib/permissions"

export type CurrentUser = {
  id: string
  name: string
  email: string
  role: Role
}

/** ดึงผู้ใช้ที่ล็อกอินอยู่ (null ถ้ายังไม่ล็อกอิน) */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return null
  const { id, name, email, role } = session.user as typeof session.user & { role?: string | null }
  return { id, name, email, role: toRole(role) }
})

/** ใช้ในหน้าเว็บ: ถ้ายังไม่ล็อกอิน ส่งไปหน้า /login */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  return user
}

/**
 * ใช้ในหน้าเว็บ (page.tsx) ที่จำกัดสิทธิ์: ถ้าไม่มีสิทธิ์ ส่งไปหน้า /no-access
 * ตัวอย่าง: await requirePageRole(["admin"])
 */
export async function requirePageRole(allowed: readonly Role[]): Promise<CurrentUser> {
  const user = await requireUser()
  if (!hasRole(user.role, allowed)) redirect("/no-access")
  return user
}

/**
 * ใช้ใน Server Action ทุกตัวที่แก้ข้อมูล
 * ตัวอย่าง: const user = await requireRole(["admin", "hr"])
 */
export async function requireRole(allowed: readonly Role[]): Promise<CurrentUser> {
  const user = await requireUser()
  if (!hasRole(user.role, allowed)) {
    throw new Error("คุณไม่มีสิทธิ์ทำรายการนี้")
  }
  return user
}
