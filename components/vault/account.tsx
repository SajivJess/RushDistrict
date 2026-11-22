"use client"

import Link from "next/link"
import { BadgeCheck, KeyRound, LogIn, Mail, MapPin } from "lucide-react"
import { useState, type FormEvent } from "react"
import { localities } from "@/data/catalogue"

export type AccountProfile = {
  email: string
  name: string
  phone: string
  address: string
  locality: string
  postcode: string
}

type AccountState = { profile: AccountProfile | null; complete: boolean }
type Providers = { email: boolean; google: boolean }

const googleMessages: Record<string, string> = {
  "google-unavailable": "Google sign-in hasn’t been connected yet.",
  "google-retry": "Google sign-in couldn’t finish. Try again or use email.",
  "verify-email": "Use an email code to verify ownership of this address.",
}

function AccountSteps({ step }: { step: 0 | 1 | 2 }) {
  return (
    <ol className="account-steps" aria-label="Account setup progress">
      {["Email", "Verify", "Delivery"].map((label, index) => (
        <li key={label} aria-current={index === step ? "step" : undefined} data-completed={index < step || undefined}>{label}</li>
      ))}
    </ol>
  )
}

async function accountRequest<T>(method: string, payload?: object) {
  const response = await fetch("/api/account", {
    method,
    headers: payload ? { "Content-Type": "application/json" } : undefined,
    body: payload ? JSON.stringify(payload) : undefined,
    cache: "no-store",
  })
  const data: T & { error?: string } = await response.json()
  if (!response.ok) throw new Error(data.error ?? "Your account request couldn’t be completed.")
  return data
}

export function Account({ initial, providers, googleError }: { initial: AccountState; providers: Providers; googleError: string }) {
  const [account, setAccount] = useState(initial)
  const [mode, setMode] = useState<"create" | "sign-in">("create")
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [code, setCode] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(googleMessages[googleError] ?? "")
  const [status, setStatus] = useState("")

  async function requestCode() {
    if (pending) return
    setPending(true)
    setError("")
    setStatus("")
    try {
      const response = await accountRequest<{ email: string }>("POST", { action: "request-otp", email })
      setEmail(response.email)
      setSent(true)
      setCode("")
      setStatus("Code sent. Check your inbox.")
    } catch (error) {
      setError(error instanceof Error ? error.message : "We couldn’t send the code.")
    } finally {
      setPending(false)
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    setPending(true)
    setError("")
    setStatus("")
    try {
      const result = await accountRequest<AccountState>("POST", { action: "verify-otp", code })
      setAccount(result)
      setStatus(result.complete ? "You’re signed in." : "")
    } catch (error) {
      setError(error instanceof Error ? error.message : "We couldn’t verify the code.")
    } finally {
      setPending(false)
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    const form = new FormData(event.currentTarget)
    setPending(true)
    setError("")
    setStatus("")
    try {
      const result = await accountRequest<AccountState>("POST", { ...Object.fromEntries(form), action: "save-profile" })
      setAccount(result)
      setStatus("Your delivery details are saved.")
    } catch (error) {
      setError(error instanceof Error ? error.message : "We couldn’t save your profile.")
    } finally {
      setPending(false)
    }
  }

  async function signOut() {
    if (pending) return
    setPending(true)
    setError("")
    setStatus("")
    try {
      setAccount(await accountRequest<AccountState>("DELETE"))
      setSent(false)
      setEmail("")
      setCode("")
      setMode("sign-in")
    } catch (error) {
      setError(error instanceof Error ? error.message : "We couldn’t sign you out.")
    } finally {
      setPending(false)
    }
  }

  const profile = account.profile

  return (
    <section className="container content-page account-page">
      <h1 className="display page-title">{profile ? "YOUR ACCOUNT" : "RUSH DISTRICT ACCOUNT"}</h1>
      <div className="account-panel">
        {profile ? (
          <>
            <div className="account-panel-intro">
              <span className="account-icon"><MapPin size={22} aria-hidden="true" /></span>
              <h2>{account.complete ? "Delivery profile" : "Complete your profile"}</h2>
              {account.complete
                ? <p>Save the details you want to use at checkout.</p>
                : <><p>Add your name, mobile number and delivery address to save them for checkout.</p><AccountSteps step={2} /></>}
              <div className="account-identity"><BadgeCheck size={18} aria-hidden="true" /><span>{profile.email}</span><span>Email verified</span></div>
              <button type="button" className="button secondary" onClick={signOut} disabled={pending}>Sign out</button>
            </div>
            <form className="account-form account-reveal" onSubmit={saveProfile} key={profile.email}>
              <div className="form-grid">
                <label className="field-wide">Full name<input name="name" autoComplete="name" defaultValue={profile.name} maxLength={100} required /></label>
                <label>Mobile number<input type="tel" name="phone" autoComplete="tel-national" defaultValue={profile.phone} pattern="[6-9][0-9]{9}" title="Enter a 10-digit Indian mobile number." required /></label>
                <label>PIN code<input name="postcode" autoComplete="postal-code" defaultValue={profile.postcode} inputMode="numeric" pattern="[1-9][0-9]{5}" maxLength={6} required /></label>
                <label className="field-wide">Street address<input name="address" autoComplete="street-address" defaultValue={profile.address} maxLength={180} required /></label>
                <label className="field-wide">Locality
                  <span className="select-field account-select">
                    <select name="locality" defaultValue={profile.locality} autoComplete="address-level2" required>
                      <option value="" disabled>Choose a locality</option>
                      {localities.map((locality) => <option key={locality}>{locality}</option>)}
                    </select>
                  </span>
                </label>
              </div>
              <button className="button primary" type="submit" disabled={pending}>{pending ? "Saving…" : "Save delivery details"}</button>
              {account.complete && <Link className="text-link" href="/#community-rewards">Visit rewards</Link>}
            </form>
          </>
        ) : (
          <>
            <div className="account-panel-intro">
              <span className="account-icon">{sent ? <KeyRound size={22} aria-hidden="true" /> : <LogIn size={22} aria-hidden="true" />}</span>
              <h2>{sent ? "Verify your email" : mode === "create" ? "Create an account" : "Sign in"}</h2>
              <p>{sent ? <>Enter the six-digit code sent to <strong>{email}</strong>.</> : "Keep your delivery details ready and sign in to your buyer rewards. Your name, mobile and address are gathered after verification."}</p>
              <AccountSteps step={sent ? 1 : 0} />
              {sent
                ? <button type="button" className="button secondary" disabled={pending} onClick={() => { setSent(false); setCode(""); setError(""); setStatus("") }}>Change email</button>
                : <div className="filter-tabs" role="group" aria-label="Account options">
                    <button type="button" aria-pressed={mode === "create"} disabled={pending} onClick={() => setMode("create")}>Create account</button>
                    <button type="button" aria-pressed={mode === "sign-in"} disabled={pending} onClick={() => setMode("sign-in")}>Sign in</button>
                  </div>}
            </div>
            <div className="account-methods">
              {sent ? (
                <form className="account-form account-reveal" onSubmit={verifyCode}>
                  <label className="text-field">Verification code
                    <span className="otp-field">
                      <span className="otp-slots" aria-hidden="true">{Array.from({ length: 6 }, (_, index) => <span key={index} data-active={index === code.length || undefined}>{code[index] ?? ""}</span>)}</span>
                      <input className="otp-input" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} required />
                    </span>
                  </label>
                  <div className="account-actions">
                    <button type="submit" className="button primary" disabled={pending || code.length !== 6}>{pending ? "Verifying…" : "Verify and continue"}</button>
                    <button type="button" className="button secondary" disabled={pending} onClick={requestCode}>Send another code</button>
                  </div>
                </form>
              ) : (
                <>
                  <form className="account-form" onSubmit={(event) => { event.preventDefault(); void requestCode() }}>
                    <label className="text-field">Email address<input type="email" autoComplete="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></label>
                    <button type="submit" className="button primary" disabled={!providers.email || pending}><Mail size={17} aria-hidden="true" /> {pending ? "Sending…" : "Send verification code"}</button>
                  </form>
                  <div className="account-divider"><span>or</span></div>
                  {providers.google
                    ? <a className="button secondary google-account-button" href="/api/account/google">Continue with Google</a>
                    : <button type="button" className="button secondary google-account-button" disabled>Continue with Google</button>}
                  {!providers.email && !providers.google && <p className="account-note">Account sign-in will be available when Google or store email is connected.</p>}
                  {providers.email !== providers.google && <p className="account-note">{providers.email ? "Google sign-in" : "Email verification"} will be available once connected.</p>}
                </>
              )}
            </div>
          </>
        )}
        {status && <p className="account-feedback" role="status">{status}</p>}
        {error && <p className="error-message account-feedback" role="alert">{error}</p>}
      </div>
    </section>
  )
}
