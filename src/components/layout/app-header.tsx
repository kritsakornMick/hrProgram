import { SidebarTrigger } from "@/components/ui/sidebar"
import { ROLE_LABELS } from "@/lib/permissions"
import type { CurrentUser } from "@/lib/session"
import { SITE } from "@/lib/site"
import { BrandLogo } from "./brand-logo"
import { HeaderClock } from "./header-clock"
import { UserMenu } from "./user-menu"

export function AppHeader({ user }: { user: CurrentUser }) {
  return (
    <header className="sticky top-0 z-50 h-(--header-height) overflow-hidden bg-card shadow-xs">
      <div className="relative z-10 flex h-full items-center gap-3 px-3 pb-2 sm:gap-5 sm:px-6">
        <SidebarTrigger className="md:hidden" />
        <BrandLogo className="h-9 shrink-0 sm:h-12 lg:h-16" />
        <div className="hidden h-12 w-px bg-border sm:block" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-sm font-semibold text-brand-green-dark sm:text-lg xl:text-2xl">
            {SITE.systemName} <span className="hidden lg:inline">({SITE.systemNameEn})</span>
          </p>
          <p className="truncate font-heading text-xs font-medium text-brand-orange sm:text-base xl:text-xl">
            {SITE.companyName}
          </p>
        </div>
        <div className="hidden lg:block">
          <HeaderClock />
        </div>
        <div className="hidden h-12 w-px bg-border lg:block" />
        <UserMenu name={user.name} roleLabel={ROLE_LABELS[user.role]} />
      </div>
      <HeaderWave />
    </header>
  )
}

/** ลายคลื่นเขียว-ส้มด้านล่าง header (ตกแต่งอย่างเดียว) */
function HeaderWave() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1440 60"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-5 w-full sm:h-7 lg:h-9"
    >
      <path d="M0 60 L0 56 C420 54 700 58 940 40 C1120 26 1280 6 1440 4 L1440 60 Z" className="fill-brand-orange" />
      <path d="M0 60 L0 58 C440 57 720 60 960 46 C1140 34 1290 16 1440 14 L1440 60 Z" className="fill-tint-green" />
      <path d="M0 60 L0 59 C460 59 740 60 980 50 C1160 42 1300 24 1440 22 L1440 60 Z" className="fill-primary" />
      <path d="M0 60 C500 60 780 60 1010 56 C1180 52 1310 38 1440 38 L1440 60 Z" className="fill-brand-green-dark" />
    </svg>
  )
}
