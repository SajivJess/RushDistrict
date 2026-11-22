import { type NextRequest } from "next/server"
import { getLocality } from "@/data/catalogue"
import { accountCookie, closeCustomerSession, createEmailChallenge, cancelEmailChallenge, customerProfile, openCustomerAccount, otpCookie, otpLifetime, saveCustomerAddress, verifyEmailChallenge } from "@/lib/account-store.mjs"
import { accountCookieOptions, accountProviders, accountResponse, currentCustomer, setAccountSession } from "@/lib/account-http"
import { sendStoreMail, storeMailReady } from "@/lib/store-mail.mjs"
import { signOutBuyer } from "@/lib/rewards-store.mjs"

export const runtime = "nodejs"

function sessionInfo(session: string | undefined) {
  const account = customerProfile(session)
  return { profile: account?.profile ?? null, complete: account?.complete ?? false }
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function fromStore(request: NextRequest) {
  const origin = request.headers.get("origin")
  if (request.headers.get("sec-fetch-site") === "cross-site") return false
  return !origin || origin === request.nextUrl.origin || origin === process.env.RUSH_SITE_ORIGIN
}

export function GET(request: NextRequest) {
  return accountResponse({ ...sessionInfo(request.cookies.get(accountCookie)?.value), providers: accountProviders() })
}

export async function POST(request: NextRequest) {
  if (!fromStore(request)) return accountResponse({ error: "Open your account on Rush District to continue." }, 403)
  const data: unknown = await request.json().catch(() => null)
  if (!data || typeof data !== "object") return accountResponse({ error: "Please try again." }, 400)
  const input = data as Record<string, unknown>

  if (input.action === "request-otp") {
    if (!storeMailReady()) return accountResponse({ error: "Email sign-in hasn’t been connected yet." }, 503)
    const challenge = createEmailChallenge(input.email)
    if (!challenge.challenge || !challenge.code || !challenge.email) return accountResponse({ error: challenge.error }, challenge.status ?? 400)
    try {
      await sendStoreMail({
        to: challenge.email,
        subject: "Your Rush District verification code",
        text: `Your Rush District verification code is ${challenge.code}. It expires in 10 minutes. If you didn’t request it, you can ignore this email.`,
      })
    } catch {
      cancelEmailChallenge(challenge.challenge)
      return accountResponse({ error: "We couldn’t send the code. Try again in a minute." }, 503)
    }
    const response = accountResponse({ email: challenge.email })
    response.cookies.set(otpCookie, challenge.challenge, accountCookieOptions(request, otpLifetime))
    return response
  }

  if (input.action === "verify-otp") {
    const email = verifyEmailChallenge(request.cookies.get(otpCookie)?.value, input.code)
    if (!email) return accountResponse({ error: "That code is incorrect or expired. Try again or request a new one." }, 400)
    const session = openCustomerAccount(email)
    if (!session) return accountResponse({ error: "We couldn’t open your account." }, 409)
    closeCustomerSession(request.cookies.get(accountCookie)?.value)
    const response = accountResponse(sessionInfo(session))
    setAccountSession(request, response, session)
    response.cookies.delete(otpCookie)
    return response
  }

  if (input.action === "save-profile") {
    const customer = currentCustomer(request)
    if (!customer) return accountResponse({ error: "Sign in to save your details." }, 401)
    const name = text(input.name)
    const phone = text(input.phone)
    const address = text(input.address)
    const locality = getLocality(text(input.locality))
    const postcode = text(input.postcode)
    if (!name || name.length > 100 || !/^[6-9]\d{9}$/.test(phone) || !address || address.length > 180 || !locality || !/^[1-9]\d{5}$/.test(postcode)) {
      return accountResponse({ error: "Enter your full name, Indian mobile number, delivery address, locality and PIN code." }, 400)
    }
    saveCustomerAddress(customer.id, { name, phone, address, locality, postcode })
    return accountResponse(sessionInfo(request.cookies.get(accountCookie)?.value))
  }

  return accountResponse({ error: "Unknown account action." }, 400)
}

export function DELETE(request: NextRequest) {
  if (!fromStore(request)) return accountResponse({ error: "Open your account on Rush District to continue." }, 403)
  closeCustomerSession(request.cookies.get(accountCookie)?.value)
  signOutBuyer(request.cookies.get("rush-buyer")?.value)
  const response = accountResponse({ profile: null, complete: false })
  response.cookies.delete(accountCookie)
  response.cookies.delete("rush-buyer")
  return response
}
