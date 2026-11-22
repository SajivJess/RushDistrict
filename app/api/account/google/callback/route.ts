import { OAuth2Client } from "google-auth-library"
import { NextResponse, type NextRequest } from "next/server"
import { accountCookie, closeCustomerSession, openCustomerAccount } from "@/lib/account-store.mjs"
import { googleSettings, setAccountSession } from "@/lib/account-http"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const config = googleSettings()
  function back(error?: string) {
    const target = new URL("/account", config?.origin ?? request.nextUrl.origin)
    if (error) target.searchParams.set("error", error)
    const response = NextResponse.redirect(target)
    response.headers.set("Cache-Control", "no-store")
    response.cookies.delete("rush-google-state")
    response.cookies.delete("rush-google-verifier")
    return response
  }

  if (!config) return back("google-unavailable")
  const state = request.cookies.get("rush-google-state")?.value
  const verifier = request.cookies.get("rush-google-verifier")?.value
  const code = request.nextUrl.searchParams.get("code")
  if (!state || !verifier || !code || request.nextUrl.searchParams.get("state") !== state) return back("google-retry")

  try {
    const client = new OAuth2Client(config.clientId, config.clientSecret, config.redirectUri)
    const { tokens } = await client.getToken({ code, codeVerifier: verifier, redirect_uri: config.redirectUri })
    if (!tokens.id_token) return back("google-retry")
    const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: config.clientId })
    const claims = ticket.getPayload()
    if (!claims?.email || !claims.email_verified || !claims.sub || claims.nonce !== state) return back("google-retry")
    if (!claims.email.toLowerCase().endsWith("@gmail.com") && !claims.hd) return back("verify-email")

    const session = openCustomerAccount(claims.email, claims.sub)
    if (!session) return back("verify-email")
    closeCustomerSession(request.cookies.get(accountCookie)?.value)
    const response = back()
    setAccountSession(request, response, session)
    return response
  } catch {
    return back("google-retry")
  }
}
