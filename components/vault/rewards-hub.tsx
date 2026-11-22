"use client"

import Link from "next/link"
import { BadgeCheck, Check, Copy, Gift, Instagram, Link2, Video } from "lucide-react"
import { useEffect, useState, type FormEvent } from "react"
import { minUnboxingViews, referralCode, referralStorageKey } from "@/data/rewards.mjs"

async function rewardsRequest<T>(url: string, method: string, payload?: object) {
  const response = await fetch(url, {
    method,
    ...(payload ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) } : {}),
    cache: "no-store",
  })
  const data: T & { error?: string } = await response.json()
  if (!response.ok) throw new Error(data.error ?? "Try again in a moment.")
  return data
}

function CopyValue({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  return (
    <div className="reward-copy">
      <label className="text-field">{label}<input value={value} readOnly onFocus={(event) => event.currentTarget.select()} /></label>
      <button type="button" className="button secondary" onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setCopied(true)
          setCopyError(false)
        } catch {
          setCopyError(true)
        }
      }}>
        {copied ? <Check size={16} /> : <Copy size={16} />}{copied ? "Copied" : "Copy"}
      </button>
      {copyError && <small role="status">Select the field to copy it.</small>}
    </div>
  )
}

function UnboxingReward({ instagramHandle }: { instagramHandle: string }) {
  return (
    <div className="reward-content">
      <div>
        <Video className="reward-symbol" size={30} aria-hidden="true" />
        <h3>Share an unboxing</h3>
        <p>Post a public Rush District unboxing on Instagram and tag our store in the Reel. Once it reaches {minUnboxingViews.toLocaleString("en-IN")} views, we can review it for an unboxing coupon.</p>
      </div>
      <div className="reward-form">
        {instagramHandle ? <a className="button primary" href={`https://www.instagram.com/${instagramHandle}/`} target="_blank" rel="noopener noreferrer"><Instagram size={18} aria-hidden="true" /> Tag @{instagramHandle}</a> : <p>Tag the official Rush District Instagram account. Our profile link will appear here once it is connected.</p>}
        <p>Keep the Reel public so we can find it. If it qualifies, we&apos;ll contact you on Instagram.</p>
      </div>
    </div>
  )
}

function BuyerReferrals() {
  const [referral, setReferral] = useState<string | null>(null)
  const [account, setAccount] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const [origin, setOrigin] = useState("")

  useEffect(() => {
    let mounted = true
    rewardsRequest<{ referral: string | null; account: boolean }>("/api/rewards/referral", "GET").then((data) => {
      if (mounted) {
        setReferral(data.referral)
        setAccount(data.account)
        setOrigin(window.location.origin)
      }
    }).catch(() => {
      if (mounted) setError("Couldn’t load your referral account. Try again in a moment.")
    })
    return () => { mounted = false }
  }, [])

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    const key = new FormData(event.currentTarget).get("access-key")
    setPending(true)
    setError("")
    try {
      const data = await rewardsRequest<{ referral: string }>("/api/rewards/referral", "POST", { key })
      setReferral(data.referral)
      setOrigin(window.location.origin)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Sign-in failed.")
    } finally {
      setPending(false)
    }
  }

  async function signOut() {
    setPending(true)
    setError("")
    try {
      await rewardsRequest("/api/rewards/referral", "DELETE")
      setReferral(null)
    } catch {
      setError("Couldn’t sign out. Try again.")
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="reward-content">
      <div>
        <Link2 className="reward-symbol" size={30} aria-hidden="true" />
        <h3>Refer a friend</h3>
        <p>Referral links unlock after your first confirmed purchase. Sign in with the same email you used for the order.</p>
      </div>
      <div>
        {referral ? (
          <div className="reward-form">
            <p className="verified-buyer"><BadgeCheck size={18} /> Verified buyer</p>
            <CopyValue key={referral} label="Your referral link" value={`${origin}/?ref=${referral}`} />
            {account ? <Link className="text-link" href="/account">Manage account</Link> : <button className="button secondary" type="button" onClick={signOut} disabled={pending}>Sign out</button>}
          </div>
        ) : account ? (
          <div className="reward-form"><p>Your referral link will appear once Rush District records your first paid order.</p><Link href="/account" className="text-link">Manage account</Link></div>
        ) : (
          <form className="reward-form" onSubmit={signIn}>
            <Link href="/account" className="button primary">Sign in to your account</Link>
            <label className="text-field">Buyer access key<input type="password" name="access-key" autoComplete="off" maxLength={35} placeholder="RD-…" required /></label>
            <button className="button secondary" type="submit" disabled={pending}>{pending ? "Verifying…" : "Unlock with access key"}</button>
          </form>
        )}
        {error && <p className="error-message" role="alert">{error}</p>}
      </div>
    </div>
  )
}

export function RewardsHub({ instagramHandle }: { instagramHandle: string }) {
  const [tab, setTab] = useState<"unboxing" | "referral">("unboxing")

  useEffect(() => {
    const inbound = referralCode(new URLSearchParams(window.location.search).get("ref"))
    if (!inbound) return
    try { sessionStorage.setItem(referralStorageKey, inbound) } catch { /* Referral sharing still works when storage is unavailable. */ }
  }, [])

  return (
    <section className="container community-rewards" id="community-rewards" aria-labelledby="community-title">
      <div className="section-head">
        <div><p className="eyebrow green"><span /> RUSH DISTRICT REWARDS</p><h2 className="display" id="community-title">SHARE THE RUSH</h2></div>
      </div>
      <div className="reward-hub">
        <div className="reward-tabs" role="group" aria-label="Reward options">
          <button type="button" aria-pressed={tab === "unboxing"} onClick={() => setTab("unboxing")}><Gift size={20} /> Unboxing coupons</button>
          <button type="button" aria-pressed={tab === "referral"} onClick={() => setTab("referral")}><Link2 size={20} /> Verified referrals</button>
        </div>
        <div hidden={tab !== "unboxing"}><UnboxingReward instagramHandle={instagramHandle} /></div>
        <div hidden={tab !== "referral"}>{tab === "referral" && <BuyerReferrals />}</div>
      </div>
    </section>
  )
}
