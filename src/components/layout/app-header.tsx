import { CalendarDays } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { formatThaiDateLong } from "@/lib/dates"
import { ROLE_LABELS } from "@/lib/permissions"
import type { CurrentUser } from "@/lib/session"
import { SITE } from "@/lib/site"
import { BrandLogo } from "./brand-logo"
import { UserMenu } from "./user-menu"

export function AppHeader({ user }: { user: CurrentUser }) {
  return (
    <header className="sticky top-0 z-50 flex h-(--header-height) items-center gap-3 border-b bg-card px-3 sm:px-5">
      <SidebarTrigger className="md:hidden" />
      <BrandLogo className="shrink-0" />
      <div className="hidden h-10 w-px bg-border sm:block" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-brand-green-dark sm:text-lg">
          {SITE.systemName} <span className="hidden lg:inline">({SITE.systemNameEn})</span>
        </p>
        <p className="truncate text-xs font-semibold text-brand-orange sm:text-sm">{SITE.companyName}</p>
      </div>
      <div className="hidden items-center gap-2 text-sm text-muted-foreground lg:flex">
        <CalendarDays className="size-5 text-primary" />
        {formatThaiDateLong(new Date())}
      </div>
      <UserMenu name={user.name} roleLabel={ROLE_LABELS[user.role]} />
    </header>
  )
}
