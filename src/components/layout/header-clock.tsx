"use client"

import { CalendarDays } from "lucide-react"
import { useSyncExternalStore } from "react"
import { formatThaiDateLong } from "@/lib/dates"

const MINUTE = 60_000

/** แจ้งทุก 15 วินาที ค่าเปลี่ยนจริงเฉพาะตอนขึ้นนาทีใหม่ */
function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 15_000)
  return () => clearInterval(id)
}
const getMinute = () => Math.floor(Date.now() / MINUTE)
const getServerMinute = () => null

/** วันที่และเวลาบน header (ใช้เวลาของเครื่องผู้ใช้ จึงแสดงหลังโหลดหน้าเสร็จ) */
export function HeaderClock() {
  const minute = useSyncExternalStore(subscribe, getMinute, getServerMinute)
  const now = minute === null ? null : new Date(minute * MINUTE)

  return (
    <div className="flex items-center gap-3">
      <span className="flex size-11 items-center justify-center rounded-xl bg-tint-green text-primary">
        <CalendarDays className="size-6" />
      </span>
      <div className="min-w-44 leading-snug">
        <p className="font-heading font-medium text-foreground">{now ? formatThaiDateLong(now) : " "}</p>
        <p className="text-sm text-muted-foreground">
          {now ? `เวลา ${now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.` : " "}
        </p>
      </div>
    </div>
  )
}
