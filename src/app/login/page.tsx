import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { BrandLogo } from "@/components/layout/brand-logo"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getCurrentUser } from "@/lib/session"
import { SITE } from "@/lib/site"
import { LoginForm } from "./login-form"

export const metadata: Metadata = { title: "เข้าสู่ระบบ" }

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getCurrentUser()) redirect("/")
  const { next } = await searchParams
  const nextPath = typeof next === "string" && next.startsWith("/") ? next : "/"

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-tint-green via-background to-tint-orange p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <BrandLogo className="mx-auto h-16" />
          <CardTitle className="mt-2 text-lg">{SITE.systemName}</CardTitle>
          <CardDescription>{SITE.companyName}</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm nextPath={nextPath} />
        </CardContent>
      </Card>
    </main>
  )
}
