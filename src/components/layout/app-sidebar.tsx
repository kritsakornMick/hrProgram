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

/** เมนูซ้าย สร้างจาก MENU ใน src/lib/menu.ts (ไม่ต้องแก้ไฟล์นี้เวลาเพิ่มหน้า) */
export function AppSidebar() {
  const pathname = usePathname()
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Sidebar className="top-(--header-height) h-[calc(100svh-var(--header-height))]!">
      <SidebarContent className="py-3">
        <SidebarGroup>
          <SidebarMenu className="gap-1">
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                isActive={pathname === "/"}
                render={<Link href="/" />}
                className="data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground"
              >
                <Home />
                <span className="text-base">หน้าหลัก</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {MENU.map((group) => {
              const groupActive = group.items.some((i) => isActive(i.href))
              return (
                <SidebarMenuItem key={group.key}>
                  <details className="group/collapsible" open={groupActive || undefined}>
                    <summary className="list-none [&::-webkit-details-marker]:hidden">
                      <SidebarMenuButton size="lg" render={<div role="button" />}>
                        <group.icon />
                        <span className="text-base">{group.title}</span>
                        <ChevronRight className="ml-auto transition-transform group-open/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </summary>
                    <SidebarMenuSub>
                      {group.items.map((item) => (
                        <SidebarMenuSubItem key={item.href}>
                          <SidebarMenuSubButton
                            isActive={isActive(item.href)}
                            render={<Link href={item.href} />}
                            className="text-sidebar-foreground/90 data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground"
                          >
                            <span>{item.title}</span>
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
      </SidebarContent>
    </Sidebar>
  )
}
