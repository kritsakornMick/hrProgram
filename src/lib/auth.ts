import "server-only"
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { nextCookies } from "better-auth/next-js"
import { admin } from "better-auth/plugins/admin"
import { db } from "@/lib/db"

/**
 * ตั้งค่าระบบล็อกอิน (Better Auth)
 * - ล็อกอินด้วยอีเมล + รหัสผ่านเท่านั้น
 * - ปิดการสมัครเอง: ผู้ดูแลระบบเป็นคนสร้างบัญชีให้
 */
export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 12, // 12 ชั่วโมง
  },
  plugins: [admin({ defaultRole: "viewer", adminRoles: ["admin"] }), nextCookies()],
})
