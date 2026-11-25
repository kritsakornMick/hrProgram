import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // ระบบนี้ทุกหน้าต้องล็อกอิน (ข้อมูลเปลี่ยนตามผู้ใช้) จึงไม่เปิด cacheComponents
  // หน้าที่อ่าน cookie/session จะ render ตอนมี request ทุกครั้ง ซึ่งเข้าใจง่ายกว่าสำหรับทีม
  cacheComponents: false,
  output: "standalone",
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
}

export default nextConfig
