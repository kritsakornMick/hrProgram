import type { LucideIcon } from "lucide-react"
import {
  BarChart3,
  Building2,
  ClipboardList,
  Database,
  FileCheck2,
  FileSignature,
  FileText,
  FolderOpen,
  Handshake,
  IdCard,
  Landmark,
  Send,
  Settings,
  ShieldCheck,
  UserRoundSearch,
  Users,
  UsersRound,
} from "lucide-react"

/**
 * แผนผังเมนูของระบบ (sitemap) — แหล่งเดียวที่ใช้สร้าง
 * เมนูซ้าย, กล่องเมนูบนหน้าหลัก และหน้า "กำลังพัฒนา"
 *
 * screen = เลขหน้าจอในเอกสารแผนงาน, owner = ผู้รับผิดชอบ
 * ถ้าจะเพิ่มเมนู ให้ขอ Tech Lead ก่อน
 */
export type MenuItem = {
  title: string
  href: string
  icon: LucideIcon
  screen: string
  owner: "Tech Lead" | "น้อง A" | "น้อง B"
  /** หน้านี้ทำเสร็จแล้วหรือยัง (false = แสดงหน้า "กำลังพัฒนา") */
  ready: boolean
}

export type MenuGroup = {
  key: "master" | "records" | "documents" | "reports" | "settings"
  title: string
  subtitle: string
  icon: LucideIcon
  /** สีหัวกล่องบนหน้าหลัก */
  tone: "orange" | "green"
  items: MenuItem[]
}

export const MENU: MenuGroup[] = [
  {
    key: "master",
    title: "ฐานข้อมูล",
    subtitle: "Master Data",
    icon: Database,
    tone: "orange",
    items: [
      { title: "บริษัท/องค์กร", href: "/companies", icon: Building2, screen: "#1", owner: "Tech Lead", ready: true },
      { title: "หน่วยงานลูกค้า", href: "/customers", icon: Landmark, screen: "#2", owner: "น้อง A", ready: true },
      { title: "พนักงาน HR", href: "/staff", icon: UsersRound, screen: "#3", owner: "น้อง A", ready: true },
    ],
  },
  {
    key: "records",
    title: "บันทึกข้อมูล",
    subtitle: "HR Transactions",
    icon: ClipboardList,
    tone: "green",
    items: [
      { title: "ใบสมัครงาน", href: "/applicants", icon: FileText, screen: "#4–#5", owner: "น้อง A", ready: true },
      { title: "ตรวจเอกสารสมัครงาน", href: "/document-checks", icon: FileCheck2, screen: "#6", owner: "น้อง A", ready: false },
      { title: "สัมภาษณ์งาน", href: "/interviews", icon: Handshake, screen: "#7", owner: "น้อง A", ready: false },
      { title: "มอบอำนาจและตรวจประวัติ", href: "/background-checks", icon: IdCard, screen: "#11", owner: "น้อง B", ready: false },
      { title: "หนังสือส่งตัวเพื่อเข้าสัมภาษณ์", href: "/interview-referrals", icon: Send, screen: "#9", owner: "น้อง B", ready: false },
      { title: "หนังสือส่งตัวเพื่อเข้าปฏิบัติงาน", href: "/assignment-letters", icon: FileSignature, screen: "#10", owner: "น้อง B", ready: false },
      { title: "สัญญาค้ำประกันบุคคลเข้าทำงาน", href: "/guarantee-contracts", icon: ShieldCheck, screen: "#12", owner: "น้อง B", ready: false },
    ],
  },
  {
    key: "documents",
    title: "เอกสารแนบท้ายใบสมัคร",
    subtitle: "Documents",
    icon: FolderOpen,
    tone: "orange",
    items: [
      { title: "พิมพ์เอกสาร (12 แบบ)", href: "/documents", icon: FolderOpen, screen: "#13", owner: "น้อง B", ready: false },
    ],
  },
  {
    key: "reports",
    title: "รายงาน",
    subtitle: "Reports",
    icon: BarChart3,
    tone: "green",
    items: [
      { title: "รายงานผู้สมัครทั้งหมด", href: "/reports/applicants", icon: Users, screen: "#14", owner: "น้อง B", ready: false },
      { title: "รายงานผู้ประกันตน", href: "/reports/insured", icon: UserRoundSearch, screen: "#14", owner: "น้อง B", ready: false },
    ],
  },
  {
    key: "settings",
    title: "ตั้งค่าระบบ",
    subtitle: "Settings",
    icon: Settings,
    tone: "green",
    items: [
      { title: "ผู้ใช้งานระบบ", href: "/settings/users", icon: Users, screen: "#0", owner: "Tech Lead", ready: false },
    ],
  },
]

/**
 * เอกสาร PDF 12 แบบ ตาม Report เดิมใน Access (ใช้บนหน้าหลักและหน้า #13)
 */
export const DOCUMENT_TYPES = [
  "ใบสมัครงาน",
  "สำเนาเอกสารประจำตัวพนักงาน",
  "หนังสือให้ความยินยอม",
  "หนังสือแสดงความยินยอม",
  "หนังสือแจ้งการเก็บข้อมูลส่วนบุคคล (PDPA)",
  "สัญญาจ้างงาน",
  "หนังสือรับเข้าทดลองงาน",
  "หนังสือมอบอำนาจและตรวจประวัติ",
  "หนังสือส่งตัวเพื่อเข้าสัมภาษณ์",
  "หนังสือส่งตัวเพื่อเข้าปฏิบัติงาน",
  "สัญญาค้ำประกันบุคคลเข้าทำงาน",
  "รายชื่อผู้ประกันตน",
] as const

export function findMenuItem(href: string) {
  for (const group of MENU) {
    const item = group.items.find((i) => i.href === href)
    if (item) return { group, item }
  }
  return null
}
