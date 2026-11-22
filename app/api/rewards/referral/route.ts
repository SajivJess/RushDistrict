import { NextResponse, type NextRequest } from "next/server"
import { buyerReferral, referralForCustomer, sessionLifetime, signInBuyer, signOutBuyer } from "@/lib/rewards-store.mjs"
import { currentCustomer } from "@/lib/account-http"

export const runtime = "nodejs"

const cookie = "rush-buyer"

export function GET(request: NextRequest) {
  const customer = currentCustomer(request)
  return NextResponse.json(
    { referral: customer ? referralForCustomer(customer.profile.email) : buyerReferral(request.cookies.get(cookie)?.value), account: Boolean(customer) },
    { headers: { "Cache-Control": "no-store" } },
  )
}

export async function POST(request: NextRequest) {
  if (currentCustomer(request)) return NextResponse.json({ error: "Use the account connected to your confirmed purchase." }, { status: 409 })
  const input: unknown = await request.json().catch(() => null)
  const key = input && typeof input === "object" && "key" in input && typeof input.key === "string" ? input.key.trim() : ""
  const session = signInBuyer(key)
  if (!session) return NextResponse.json({ error: "Enter the private access key Rush District issued after your paid order." }, { status: 401 })
  signOutBuyer(request.cookies.get(cookie)?.value)

  const response = NextResponse.json({ referral: session.referral }, { headers: { "Cache-Control": "no-store" } })
  response.cookies.set(cookie, session.token, {
    httpOnly: true,
    sameSite: "strict",
    secure: request.nextUrl.protocol === "https:",
    path: "/",
    maxAge: sessionLifetime,
  })
  return response
}

export function DELETE(request: NextRequest) {
  signOutBuyer(request.cookies.get(cookie)?.value)
  const response = NextResponse.json({ referral: null }, { headers: { "Cache-Control": "no-store" } })
  response.cookies.delete(cookie)
  return response
}
