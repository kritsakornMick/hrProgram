import { getSessionCookie } from "better-auth/cookies"
import { NextResponse, type NextRequest } from "next/server"

/**
 * ด่านแรก: ถ้าไม่มี cookie ล็อกอิน ส่งไปหน้า /login
 * (เช็คแค่ว่ามี cookie การตรวจสิทธิ์จริงทำใน requireUser / requireRole ฝั่ง server)
 */
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    const url = new URL("/login", request.url)
    if (request.nextUrl.pathname !== "/") url.searchParams.set("next", request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api/auth|login|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
