"use client"

import Link from "next/link"
import { ChevronDown, CircleCheck, CreditCard, MessageCircle } from "lucide-react"
import { useRef, useState, type FormEvent } from "react"
import { useVaultCart } from "@/context/vault-cart"
import { formatPrice, getLocality, linePrice, localities } from "@/data/catalogue"
import { EmptyBag, RewardLines, lineFlavours, lineTitle } from "@/components/vault/shopping"
import { recordDemoOrder } from "@/lib/demo-leaderboard"
import { referralStorageKey } from "@/data/rewards.mjs"
import type { AccountProfile } from "@/components/vault/account"

const fields: { name: keyof AccountProfile; label: string; complete: string; type?: string; wide?: boolean; pattern?: string; hint?: string }[] = [
  { name: "name", label: "Full name", complete: "name", wide: true },
  { name: "email", label: "Email address", complete: "email", type: "email" },
  { name: "phone", label: "Mobile number", complete: "tel-national", type: "tel", pattern: "[6-9][0-9]{9}", hint: "Enter a 10-digit Indian mobile number." },
  { name: "address", label: "Street address", complete: "street-address", wide: true },
  { name: "postcode", label: "PIN code", complete: "postal-code", pattern: "[1-9][0-9]{5}", hint: "Enter a six-digit Indian PIN code." },
]

type DeliveryQuote = { subtotal: number; delivery: number; total: number; discount: number; coupon?: string; referral?: string | null }

export function Checkout({ whatsappNumber, profile }: { whatsappNumber: string; profile: AccountProfile | null }) {
  const { items, count, subtotal, clear } = useVaultCart()
  const [area, setArea] = useState(profile?.locality ?? "")
  const [showAlias, setShowAlias] = useState(false)
  const [confirmation, setConfirmation] = useState<{ reference: string; total: number; ranked: boolean } | null>(null)
  const [quoted, setQuoted] = useState<{ cart: string; quote: DeliveryQuote } | null>(null)
  const [pending, setPending] = useState(false)
  const [quoteError, setQuoteError] = useState("")
  const request = useRef<AbortController | null>(null)
  const submitted = useRef(false)
  const cart = JSON.stringify(items.map(({ id, quantity }) => [id, quantity]))
  const quote = quoted?.cart === cart ? quoted.quote : null
  const whatsappMessage = [
    "Hi Rush District, I would like to order:",
    ...items.map((line) => `${line.quantity} × ${lineTitle(line)} (${lineFlavours(line)} per pack)${line.message ? ` — Card: ${line.message}` : ""}`),
    ...(area ? [`Delivery locality: ${area}`] : []),
    ...(quote?.referral ? [`Referral: ${quote.referral}`] : []),
    ...(quote?.coupon ? [`Coupon: ${quote.coupon}`] : []),
    ...(quote ? [`Estimated total: ${formatPrice(quote.total)}`] : []),
  ].join("\n")
  const whatsappLink = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}` : ""

  function resetQuote() {
    request.current?.abort()
    request.current = null
    setQuoted(null)
    setPending(false)
    setQuoteError("")
  }

  async function completeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!count || submitted.current || request.current) return
    const locality = getLocality(area)
    if (!locality) return

    const data = new FormData(event.currentTarget)

    if (!quote) {
      const controller = new AbortController()
      request.current = controller
      setPending(true)
      setQuoteError("")
      try {
        let referral: string | null = null
        try { referral = sessionStorage.getItem(referralStorageKey) } catch { /* Checkout works without referral storage. */ }
        const response = await fetch("/api/delivery-quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            locality,
            postcode: String(data.get("postcode") ?? "").trim(),
            coupon: String(data.get("coupon") ?? "").trim(),
            referral,
            lines: items.map(({ pack, selection, quantity }) => ({ pack, selection, quantity })),
          }),
          signal: controller.signal,
        })
        const result: DeliveryQuote & { error?: string } = await response.json()
        if (controller.signal.aborted) return
        if (response.ok) setQuoted({ cart, quote: result })
        else setQuoteError(result.error ?? "Delivery could not be calculated. Try again.")
      } catch {
        if (!controller.signal.aborted) setQuoteError("Delivery could not be calculated. Try again.")
      } finally {
        if (request.current === controller) {
          request.current = null
          setPending(false)
        }
      }
      return
    }

    const alias = String(data.get("leaderboard-alias") ?? "").trim()
    const ranked = showAlias && alias.length > 0
    const reference = `RD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
    submitted.current = true
    if (ranked) recordDemoOrder(reference, alias, locality, items)
    setConfirmation({ reference, total: quote.total, ranked })
    clear()
    window.scrollTo({ top: 0 })
  }

  if (confirmation) {
    return (
      <section className="container content-page confirmation" aria-live="polite">
        <CircleCheck />
        <h1 className="display page-title">DEMO ORDER COMPLETE</h1>
        <p>Reference <strong>{confirmation.reference}</strong> · {formatPrice(confirmation.total)}</p>
        <p className="page-intro">This order was simulated. {confirmation.ranked ? "Your alias and can totals were added to this browser’s leaderboard." : "Your bag has been cleared."}</p>
        <div className="confirmation-actions">
          <Link href="/products" className="button primary">Continue shopping</Link>
          {confirmation.ranked && <Link href="/leaderboard" className="button secondary">View leaderboard</Link>}
        </div>
      </section>
    )
  }

  return (
    <section className="container content-page">
      <Link className="breadcrumb" href="/cart">Back to your bag</Link>
      <h1 className="display page-title">CHECKOUT</h1>
      {count ? (
        <>
          <p className="checkout-notice">Demo checkout. Use sample delivery details to try it.</p>
          <div className="checkout-layout">
            <form id="checkout-form" onSubmit={completeOrder}>
              <fieldset className="form-group" onChange={resetQuote}>
                <legend>Delivery address</legend>
                <div className="form-grid">
                  {fields.map((field) => (
                    <label key={field.name} className={field.wide ? "field-wide" : undefined}>
                      {field.label}
                      <input name={field.name} type={field.type ?? "text"} autoComplete={field.complete} defaultValue={profile?.[field.name]} pattern={field.pattern} title={field.hint} maxLength={field.name === "address" ? 180 : field.name === "email" ? 254 : 100} required />
                    </label>
                  ))}
                  <label>Locality
                    <span className="select-field">
                      <select name="locality" value={area} onChange={(event) => setArea(event.target.value)} required>
                        <option value="" disabled>Choose a locality</option>
                        {localities.map((locality) => <option key={locality}>{locality}</option>)}
                      </select>
                      <ChevronDown size={16} />
                    </span>
                  </label>
                  <label>District<input value="Kanyakumari" readOnly /></label>
                  <label>State<input value="Tamil Nadu" readOnly /></label>
                </div>
              </fieldset>
              <fieldset className="form-group">
                <legend>Collector leaderboard</legend>
                <label className="option-row"><span><input type="checkbox" checked={showAlias} onChange={(event) => setShowAlias(event.target.checked)} /> Count my cans on the demo leaderboard</span></label>
                {showAlias && <label className="text-field">Collector alias<input name="leaderboard-alias" placeholder="Choose a nickname" autoComplete="off" maxLength={28} pattern=".*\S.*" required /></label>}
                <p className="checkout-help">The leaderboard uses your alias and delivery locality. Street addresses and contact details stay private.</p>
              </fieldset>
              <details className="checkout-coupon">
                <summary>Have a coupon?</summary>
                <label className="text-field">Coupon code<input name="coupon" autoComplete="off" maxLength={18} onChange={resetQuote} /></label>
              </details>
              {quote && <fieldset className="form-group">
                <legend>Payment</legend>
                <div className="option-row"><span><CreditCard size={18} /> Simulated payment</span><strong>Demo</strong></div>
              </fieldset>}
            </form>
            <aside className="summary-panel">
              <h2>Order summary</h2>
              <ul className="summary-products">{items.map((line) => (
                <li key={line.id}><span>{line.quantity} × {lineTitle(line)}
                  {line.pack !== "solo" && <small>{lineFlavours(line)}</small>}
                  {line.message && <small>Card: {line.message}</small>}
                </span><span>{formatPrice(linePrice(line))}</span></li>
              ))}</ul>
              <dl aria-live="polite">
                <div><dt>Subtotal</dt><dd>{formatPrice(quote?.subtotal ?? subtotal)}</dd></div>
                {quote && <>
                  {quote.discount > 0 && <div><dt>Unboxing coupon</dt><dd>−{formatPrice(quote.discount)}</dd></div>}
                  <div><dt>Delivery</dt><dd>{quote.delivery ? formatPrice(quote.delivery) : "Free"}</dd></div>
                  <div className="summary-total"><dt>Total</dt><dd>{formatPrice(quote.total)}</dd></div>
                </>}
              </dl>
              <RewardLines />
              {quote?.referral && <p>Verified referral applied.</p>}
              {!quote && <p>Enter your delivery address to see the total.</p>}
              {quoteError && <p className="error-message" role="alert">{quoteError}</p>}
              <button className="button primary" type="submit" form="checkout-form" disabled={pending}>
                {pending ? "Calculating delivery…" : quote ? "Place demo order" : "Continue to payment"}
              </button>
              {whatsappLink && <a className="button secondary" href={whatsappLink} target="_blank" rel="noreferrer"><MessageCircle size={18} /> Order on WhatsApp</a>}
            </aside>
          </div>
        </>
      ) : <EmptyBag />}
    </section>
  )
}
