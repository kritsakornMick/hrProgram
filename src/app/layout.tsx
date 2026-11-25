import type { Metadata } from "next"
import { IBM_Plex_Sans_Thai, Kanit } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SITE } from "@/lib/site"
import "./globals.css"

const fontSans = IBM_Plex_Sans_Thai({
  variable: "--font-sans",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
})

/** ฟอนต์หัวข้อ (class font-heading) ตามภาพดีไซน์ */
const fontHeading = Kanit({
  variable: "--font-kanit",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600"],
})

export const metadata: Metadata = {
  title: { default: SITE.systemName, template: `%s | ${SITE.systemName}` },
  description: `${SITE.systemNameEn} — ${SITE.companyName}`,
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${fontSans.variable} ${fontHeading.variable} h-full antialiased`}>
      <body className="min-h-full">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
