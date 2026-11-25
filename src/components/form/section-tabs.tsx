"use client"

import type { LucideIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export type SectionTab = {
  /** ใช้เป็น key */
  id: string
  label: string
  icon: LucideIcon
  /** id ของ <FormSection> ที่อยู่ใต้แท็บนี้ (กดแท็บจะกระโดดไปหมวดแรก) */
  sections: readonly string[]
}

/**
 * แถบแท็บติดด้านบนของฟอร์มยาว: กดแล้วกระโดดไปหมวดนั้น และไฮไลต์แท็บตามหมวดที่กำลังดูอยู่
 * (ทุกหมวดยังแสดงในหน้าเดียว ไม่ได้ซ่อน เพื่อให้กรอกต่อเนื่องและ error ไม่ถูกซ่อน)
 *
 * ประกาศ tabs ไว้นอก component (ค่าคงที่) เพื่อไม่ให้ effect ทำงานซ้ำทุกครั้งที่ render
 */
export function SectionTabs({ tabs, label = "หมวดของฟอร์ม" }: { tabs: readonly SectionTab[]; label?: string }) {
  const [active, setActive] = useState(tabs[0]?.id)

  useEffect(() => {
    const sectionIds = tabs.flatMap((t) => t.sections)
    const visible = new Map<string, boolean>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) visible.set(entry.target.id, entry.isIntersecting)
        const current = sectionIds.find((id) => visible.get(id))
        const tab = tabs.find((t) => current && t.sections.includes(current))
        if (tab) setActive(tab.id)
      },
      // นับเฉพาะหมวดที่อยู่ช่วงบนของจอ (ใต้ header + แถบแท็บ)
      { rootMargin: "-150px 0px -55% 0px" },
    )
    for (const id of sectionIds) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [tabs])

  return (
    <nav
      aria-label={label}
      className="sticky top-(--header-height) z-20 -mx-4 bg-background/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6"
    >
      <ul className="flex gap-1 overflow-x-auto rounded-xl border bg-card p-1 shadow-xs">
        {tabs.map((tab) => {
          const isActive = tab.id === active
          return (
            <li key={tab.id} className="min-w-max flex-1">
              <a
                href={`#${tab.sections[0]}`}
                onClick={() => setActive(tab.id)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground hover:bg-secondary [&_svg]:text-muted-foreground",
                )}
              >
                <tab.icon className="size-4.5 shrink-0" />
                {tab.label}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
