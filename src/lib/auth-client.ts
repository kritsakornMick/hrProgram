"use client"
import { createAuthClient } from "better-auth/react"

/** ใช้ในฝั่ง browser เช่น หน้า login และปุ่มออกจากระบบ */
export const authClient = createAuthClient()
