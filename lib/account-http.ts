import { NextResponse, type NextRequest } from "next/server"
import { accountCookie, customerProfile } from "@/lib/account-store.mjs"
import { sessionLifetime } from "@/lib/rewards-store.mjs"
import { storeMailReady } from "@/lib/store-mail.mjs"

export function googleSettings() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const site = process.env.RUSH_SITE_ORIGIN
  if (!clientId || !clientSecret || !site) return null

  try {
    const origin = new URL(site)
    if (origin.protocol !== "https:" && !(origin.protocol === "http:" && ["localhost", "127.0.0.1"].includes(origin.hostname))) return null
    return { clientId, clientSecret, origin: origin.origin, redirectUri: new URL("/api/account/google/callback", origin).href }
  } catch {
    return null
  }
}

export function accountProviders() {
  return { email: storeMailReady(), google: Boolean(googleSettings()) }
}

export function currentCustomer(request: NextRequest) {
  return customerProfile(request.cookies.get(accountCookie)?.value)
}

export function accountCookieOptions(request: NextRequest, maxAge: number) {
  const secure = request.nextUrl.protocol === "https:" || process.env.RUSH_SITE_ORIGIN?.startsWith("https:") === true
  return { httpOnly: true, sameSite: "lax" as const, secure, path: "/", maxAge }
}

export function setAccountSession(request: NextRequest, response: NextResponse, session: string) {
  response.cookies.set(accountCookie, session, accountCookieOptions(request, sessionLifetime))
}

export function accountResponse(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } })
}
