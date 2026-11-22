import { countCans, freeDeliveryAt, getLocality, getPack, getProduct, localDeliveryFee, maxQuantity, packIsComplete, packPrice, type BagPack, type Selection } from "@/data/catalogue"
import { availableCoupon, validReferral } from "@/lib/rewards-store.mjs"

export const runtime = "nodejs"

function lineSubtotal(value: unknown) {
  if (!value || typeof value !== "object") return 0
  const { pack, selection, quantity } = value as Record<string, unknown>
  const id: BagPack | undefined = pack === "duo" ? pack : typeof pack === "string" ? getPack(pack)?.id : undefined
  if (!id || typeof quantity !== "number" || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > maxQuantity) return 0
  if (!selection || typeof selection !== "object" || Array.isArray(selection)) return 0
  const valid = Object.entries(selection).every(([slug, units]) => (
    getProduct(slug) && typeof units === "number" && Number.isSafeInteger(units) && units >= 0 && units <= maxQuantity
  ))
  if (!valid) return 0
  const cans = countCans(selection as Selection)
  return packIsComplete(id, cans) ? packPrice(id, cans) * quantity : 0
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null)
  if (!body || typeof body !== "object") return Response.json({ error: "Enter a delivery address and try again." }, { status: 400 })
  const { locality, postcode, lines, coupon, referral } = body as Record<string, unknown>

  if (typeof locality !== "string" || !getLocality(locality) || typeof postcode !== "string" || !/^629[0-9]{3}$/.test(postcode)) {
    return Response.json({ error: "Choose a supported locality and enter its delivery PIN code." }, { status: 422 })
  }

  const amounts = Array.isArray(lines) ? lines.map(lineSubtotal) : []
  if (!amounts.length || amounts.some((value) => value === 0)) {
    return Response.json({ error: "Check the packs in your cart before continuing." }, { status: 400 })
  }

  const subtotal = amounts.reduce((sum, value) => sum + value, 0)
  if (!Number.isSafeInteger(subtotal + localDeliveryFee)) return Response.json({ error: "Check the quantities in your cart." }, { status: 400 })
  const reward = typeof coupon === "string" && coupon.trim() ? availableCoupon(coupon) : null
  if (typeof coupon === "string" && coupon.trim() && !reward) {
    return Response.json({ error: "This coupon is invalid or has already been redeemed." }, { status: 422 })
  }
  const discount = reward ? Math.min(reward.discount, subtotal) : 0
  const delivery = subtotal < freeDeliveryAt ? localDeliveryFee : 0
  return Response.json({ subtotal, delivery, discount, total: subtotal - discount + delivery, coupon: reward?.code, referral: validReferral(referral) }, { headers: { "Cache-Control": "no-store" } })
}
