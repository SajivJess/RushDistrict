import { createHash, randomBytes } from "node:crypto"
import { NextResponse, type NextRequest } from "next/server"
import { accountCookieOptions, googleSettings } from "@/lib/account-http"
import { otpLifetime } from "@/lib/account-store.mjs"

export const runtime = "nodejs"

export function GET(request: NextRequest) {
  const config = googleSettings()
  if (!config) return NextResponse.redirect(new URL("/account?error=google-unavailable", request.url))

  const state = randomBytes(24).toString("base64url")
  const verifier = randomBytes(32).toString("base64url")
  const google = new URL("https://accounts.google.com/o/oauth2/v2/auth")
  google.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: "openid email",
    state,
    nonce: state,
    code_challenge: createHash("sha256").update(verifier).digest("base64url"),
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString()

  const response = NextResponse.redirect(google)
  response.headers.set("Cache-Control", "no-store")
  response.cookies.set("rush-google-state", state, accountCookieOptions(request, otpLifetime))
  response.cookies.set("rush-google-verifier", verifier, accountCookieOptions(request, otpLifetime))
  return response
}
