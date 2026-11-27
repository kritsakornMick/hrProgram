import { AppHeader } from "@/components/layout/app-header"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { requireUser } from "@/lib/session"

/** กรอบของทุกหน้าหลังล็อกอิน: header ด้านบน + เมนูซ้าย + เนื้อหา */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser()

  return (
    <div className="[--header-height:4.25rem] sm:[--header-height:5rem] lg:[--header-height:6rem]">
      <SidebarProvider className="flex flex-col">
        <AppHeader user={user} />
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset className="bg-background">
            <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">{children}</div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  )
}
