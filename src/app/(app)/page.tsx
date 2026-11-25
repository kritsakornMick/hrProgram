import {
  CalendarClock,
  FileClock,
  FilePlus2,
  Hourglass,
  Search,
  UserPlus,
  UsersRound,
} from "lucide-react"
import { MenuGroupCard } from "@/components/dashboard/menu-group-card"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { StatCard } from "@/components/dashboard/stat-card"
import { TaskList } from "@/components/dashboard/task-list"
import { getDashboardStats } from "@/lib/dashboard"
import { MENU } from "@/lib/menu"
import { requireUser } from "@/lib/session"
import { SITE } from "@/lib/site"

export default async function DashboardPage() {
  const user = await requireUser()
  const stats = await getDashboardStats()
  const groups = MENU.filter((g) => g.key !== "settings")

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_290px]">
      <div className="min-w-0 space-y-6">
        <div className="flex items-center gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-tint-green text-primary sm:size-16">
            <UsersRound className="size-8 sm:size-10" strokeWidth={2.25} />
          </span>
          <div className="min-w-0">
            <h1 className="font-heading text-xl font-semibold text-brand-green-dark sm:text-3xl">ระบบบริหารงานบุคคล (HR)</h1>
            <p className="font-heading text-foreground/80">
              สวัสดีคุณ{user.name} ยินดีต้อนรับสู่{SITE.systemName} {SITE.companyName}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          <StatCard icon={UserPlus} label="ผู้สมัครใหม่ (เดือนนี้)" value={stats.newApplicants} unit="คน" tone="green" />
          <StatCard icon={FileClock} label="เอกสารรอตรวจ" value={stats.pendingDocumentChecks} unit="รายการ" tone="orange" />
          <StatCard icon={CalendarClock} label="นัดสัมภาษณ์วันนี้" value={stats.interviewsToday} unit="คน" tone="blue" />
          <StatCard icon={Hourglass} label="ใกล้ครบทดลองงาน" value={stats.probationEndingSoon} unit="คน" tone="purple" />
          <StatCard icon={FileClock} label="สัญญาลูกค้าใกล้หมด" value={stats.contractsEndingSoon} unit="สัญญา" tone="pink" />
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,12.5rem),1fr))] gap-4">
          {groups.map((g) => (
            <MenuGroupCard key={g.key} group={g} />
          ))}
        </div>
      </div>

      <aside className="space-y-6">
        <TaskList
          tasks={[
            { label: "เอกสารสมัครงานรอตรวจสอบ", count: stats.pendingDocumentChecks, href: "/document-checks" },
            { label: "นัดสัมภาษณ์งานวันนี้", count: stats.interviewsToday, href: "/interviews" },
            { label: "ทดลองงานใกล้ครบกำหนด", count: stats.probationEndingSoon, href: "/interviews" },
            { label: "สัญญาลูกค้าใกล้หมดอายุ", count: stats.contractsEndingSoon, href: "/customers" },
          ]}
        />
        <QuickActions
          actions={[
            { label: "เพิ่มผู้สมัครใหม่", href: "/applicants", icon: UserPlus },
            { label: "สร้างใบสมัครงาน", href: "/applicants", icon: FilePlus2 },
            { label: "ค้นหาผู้สมัคร", href: "/applicants", icon: Search },
          ]}
        />
      </aside>
    </div>
  )
}
