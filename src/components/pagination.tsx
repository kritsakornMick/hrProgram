import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * ปุ่มเปลี่ยนหน้า (Server Component) — เก็บค่าค้นหาเดิมใน URL ไว้ (เช่น ?q=)
 *
 * ตัวอย่าง:
 *   <Pagination page={2} totalPages={5} basePath="/applicants" searchParams={{ q: query }} />
 */
export function Pagination({
  page,
  totalPages,
  basePath,
  searchParams = {},
}: {
  page: number
  totalPages: number
  basePath: string
  /** ค่าค้นหาอื่นที่ต้องเก็บไว้ตอนเปลี่ยนหน้า (ค่าว่างจะไม่ใส่ใน URL) */
  searchParams?: Record<string, string | undefined>
}) {
  if (totalPages <= 1) return null

  function hrefFor(target: number) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(searchParams)) {
      if (value) params.set(key, value)
    }
    if (target > 1) params.set("page", String(target))
    const qs = params.toString()
    return qs ? `${basePath}?${qs}` : basePath
  }

  const pages = pageWindow(page, totalPages)

  return (
    <nav aria-label="เปลี่ยนหน้า" className="flex flex-wrap items-center justify-center gap-1 sm:justify-end">
      <PageLink href={hrefFor(page - 1)} disabled={page <= 1} label="หน้าก่อนหน้า">
        <ChevronLeft />
        <span className="hidden sm:inline">ก่อนหน้า</span>
      </PageLink>

      {/* จอเล็ก: แสดงแค่ "หน้า x / y" */}
      <span className="px-2 text-sm text-muted-foreground sm:hidden">
        หน้า {page} / {totalPages}
      </span>

      <div className="hidden items-center gap-1 sm:flex">
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`gap-${i}`} className="px-1 text-muted-foreground">
              …
            </span>
          ) : (
            <Link
              key={p}
              href={hrefFor(p)}
              aria-current={p === page ? "page" : undefined}
              className={buttonVariants({ variant: p === page ? "default" : "outline", size: "sm" })}
            >
              {p}
            </Link>
          ),
        )}
      </div>

      <PageLink href={hrefFor(page + 1)} disabled={page >= totalPages} label="หน้าถัดไป">
        <span className="hidden sm:inline">ถัดไป</span>
        <ChevronRight />
      </PageLink>
    </nav>
  )
}

function PageLink({
  href,
  disabled,
  label,
  children,
}: {
  href: string
  disabled: boolean
  label: string
  children: React.ReactNode
}) {
  const className = buttonVariants({ variant: "outline", size: "sm" })
  if (disabled) {
    return (
      <span aria-disabled="true" aria-label={label} className={cn(className, "pointer-events-none opacity-50")}>
        {children}
      </span>
    )
  }
  return (
    <Link href={href} aria-label={label} className={className}>
      {children}
    </Link>
  )
}

/** เลขหน้าที่จะแสดง เช่น 1 … 4 5 6 … 10 */
function pageWindow(page: number, total: number): (number | "…")[] {
  const set = new Set([1, total, page - 1, page, page + 1].filter((p) => p >= 1 && p <= total))
  const sorted = [...set].sort((a, b) => a - b)
  const result: (number | "…")[] = []
  for (const p of sorted) {
    const prev = result[result.length - 1]
    if (typeof prev === "number" && p - prev > 1) result.push("…")
    result.push(p)
  }
  return result
}

/** อ่านเลขหน้าจาก searchParams (ค่าผิดหรือไม่มี = หน้า 1) */
export function parsePage(value: string | string[] | undefined) {
  const n = Number(typeof value === "string" ? value : "")
  return Number.isInteger(n) && n > 0 ? n : 1
}
