"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { MENU } from "@/lib/menu"

/** เมนูที่เลือกอยู่: พื้นส้มไล่สี + เงา */
const ACTIVE = "data-active:bg-linear-to-r data-active:from-brand-orange data-active:to-brand-orange-dark data-active:text-sidebar-primary-foreground data-active:shadow-md"

/** เมนูซ้าย สร้างจาก MENU ใน src/lib/menu.ts (ไม่ต้องแก้ไฟล์นี้เวลาเพิ่มหน้า) */
export function AppSidebar() {
  const pathname = usePathname()
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Sidebar
      variant="floating"
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]! p-3 pr-0 *:data-[slot=sidebar-inner]:overflow-hidden *:data-[slot=sidebar-inner]:rounded-3xl *:data-[slot=sidebar-inner]:bg-linear-to-b *:data-[slot=sidebar-inner]:from-brand-green-dark *:data-[slot=sidebar-inner]:to-sidebar *:data-[slot=sidebar-inner]:shadow-lg *:data-[slot=sidebar-inner]:ring-0"
    >
      <SidebarContent className="relative py-4">
        <SidebarGroup className="relative z-10 px-3">
          <SidebarMenu className="gap-1.5">
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                isActive={pathname === "/"}
                render={<Link href="/" />}
                className={`rounded-xl px-3 [&_svg]:size-6 ${ACTIVE}`}
              >
                <Home />
                <span className="font-heading text-base">หน้าหลัก</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {MENU.map((group) => {
              const groupActive = group.items.some((i) => isActive(i.href))
              return (
                <SidebarMenuItem key={group.key}>
                  <details className="group/collapsible" open={groupActive || undefined}>
                    <summary className="list-none [&::-webkit-details-marker]:hidden">
                      <SidebarMenuButton
                        size="lg"
                        render={<div role="button" />}
                        className="h-auto min-h-12 rounded-xl px-3 py-2 [&_svg]:size-6 [&>span:last-child]:whitespace-normal"
                      >
                        <group.icon />
                        <span className="flex-1 font-heading text-base leading-snug">{group.title}</span>
                        <ChevronRight className="size-4! opacity-80 transition-transform group-open/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </summary>
                    <SidebarMenuSub className="my-1 border-sidebar-border">
                      {group.items.map((item) => (
                        <SidebarMenuSubItem key={item.href}>
                          <SidebarMenuSubButton
                            isActive={isActive(item.href)}
                            render={<Link href={item.href} />}
                            className={`h-auto min-h-8 rounded-lg py-1.5 text-sidebar-foreground/90 ${ACTIVE}`}
                          >
                            <span className="whitespace-normal">{item.title}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </details>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarWave />
      </SidebarContent>
    </Sidebar>
  )
}

/** ลายคลื่นส้ม-เขียวด้านล่างเมนู (ตกแต่งอย่างเดียว) */
function SidebarWave() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 256 200"
      preserveAspectRatio="none"
      className="pointer-events-none mt-auto h-40 w-full shrink-0"
    >
      <path d="M0 70 C70 30 160 30 256 0 L256 200 L0 200 Z" className="fill-brand-orange" />
      <path d="M0 92 C80 54 170 52 256 22 L256 200 L0 200 Z" className="fill-sidebar-foreground opacity-90" />
      <path d="M0 110 C90 74 180 70 256 44 L256 200 L0 200 Z" className="fill-primary" />
      <path d="M0 150 C90 116 180 108 256 86 L256 200 L0 200 Z" className="fill-brand-green-dark opacity-70" />
    </svg>
  )
}
