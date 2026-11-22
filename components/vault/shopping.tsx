"use client"

import Link from "next/link"
import { Gift, Minus, Plus, ShoppingBag, Sticker, Trash2 } from "lucide-react"
import { useState } from "react"
import { useVaultCart, type CartLine } from "@/context/vault-cart"
import { countCans, formatPrice, getPack, linePrice, maxQuantity, selectionEntries, type Product } from "@/data/catalogue"
import { CanPhoto } from "@/components/vault/can-photo"

export function Quantity({ value, limit, min = 1, label, onChange }: {
  value: number; limit: number; min?: number; label: string; onChange: (value: number) => void
}) {
  return (
    <div className="quantity-control" role="group" aria-label={label}>
      <button type="button" disabled={value <= min} aria-label={`Decrease ${label.toLowerCase()}`} onClick={() => onChange(value - 1)}><Minus size={15} /></button>
      <output aria-live="polite">{value}</output>
      <button type="button" disabled={value >= limit} aria-label={`Increase ${label.toLowerCase()}`} onClick={() => onChange(value + 1)}><Plus size={15} /></button>
    </div>
  )
}

export function ProductActions({ product }: { product: Product }) {
  const { add } = useVaultCart()
  const [quantity, setQuantity] = useState(1)
  return (
    <>
      <div className="product-actions">
        <Quantity value={quantity} limit={maxQuantity} label="Quantity" onChange={setQuantity} />
        <button type="button" className="button primary" onClick={() => add(product, quantity)}>
          <ShoppingBag size={18} /> Add Solo to bag
        </button>
      </div>
      <Link className="text-link build-from-product" href={`/categories/collectors-case?flavour=${product.slug}`}>Mix this flavour into a pack</Link>
    </>
  )
}

export function lineTitle(line: CartLine) {
  if (line.pack === "duo") return "Two Solo cans"
  return line.pack === "solo" ? selectionEntries(line.selection)[0].product.name : getPack(line.pack)!.name
}

export function lineFlavours(line: CartLine) {
  return selectionEntries(line.selection).map(({ product, quantity }) => `${quantity} × ${product.name}`).join(", ")
}

export function CartLines({ compact = false, onProductSelect }: { compact?: boolean; onProductSelect?: () => void }) {
  const { items, update } = useVaultCart()
  return (
    <ul className={`cart-lines ${compact ? "compact" : ""}`}>
      {items.map((line) => {
        const firstCan = selectionEntries(line.selection)[0].product
        const title = lineTitle(line)
        const size = countCans(line.selection)
        return (
          <li className="cart-line" key={line.id}>
            <Link
              href={line.pack === "solo" || line.pack === "duo" ? `/products/${firstCan.slug}` : `/categories/${line.pack}`}
              className="cart-thumb" onClick={onProductSelect} aria-label={`View ${title}`}
            >
              <CanPhoto product={firstCan} decorative />
            </Link>
            <div className="cart-line-copy">
              <strong>{title}</strong>
              <p>{line.pack === "solo" ? "Solo · 1 can" : `${size} cans · ${lineFlavours(line)}`}</p>
              {line.message && <p className="cart-card-message">Card: {line.message}</p>}
              <Quantity value={line.quantity} limit={maxQuantity} label={`${title} quantity`} onChange={(next) => update(line.id, next)} />
            </div>
            <div className="cart-line-end">
              <strong>{formatPrice(linePrice(line))}</strong>
              <button type="button" className="icon-button" aria-label={`Remove ${title}`} onClick={() => update(line.id, 0)}><Trash2 size={17} /></button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function EmptyBag() {
  return <div className="empty-state"><ShoppingBag /><h2>Your bag is empty</h2><p>Pick a flavour or build a pack to get started.</p><Link href="/products" className="button primary">Shop flavours</Link></div>
}

export function RewardLines() {
  const { rewards } = useVaultCart()
  const { collectibles, stickers, keychains } = rewards
  if (!collectibles) return null
  return (
    <ul className="reward-list" aria-label="Included with your order">
      <li><Gift size={17} /> {collectibles} {collectibles === 1 ? "collectible" : "collectibles"} included</li>
      {stickers > 0 && <li><Sticker size={17} /> {stickers} {stickers === 1 ? "sticker" : "stickers"} included</li>}
      {keychains > 0 && <li><Gift size={17} /> {keychains} {keychains === 1 ? "keychain" : "keychains"} included</li>}
    </ul>
  )
}

export function BagPage() {
  const { count, subtotal } = useVaultCart()
  return (
    <section className="container content-page">
      <h1 className="display page-title">YOUR BAG</h1>
      {count ? (
        <div className="checkout-layout">
          <CartLines />
          <aside className="summary-panel">
            <h2>Order summary</h2>
            <dl><div className="summary-total"><dt>Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div></dl>
            <RewardLines />
            <p>Delivery calculated at checkout.</p>
            <Link className="button primary" href="/checkout">Checkout</Link>
          </aside>
        </div>
      ) : <EmptyBag />}
    </section>
  )
}
