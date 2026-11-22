"use client"

import Link from "next/link"
import { Box, Check, Gift, Package, ShoppingBag } from "lucide-react"
import { useState } from "react"
import { countCans, formatPrice, freeDeliveryNote, getPack, giftBoxOptions, maxQuantity, packs, packPrice, products, soloDeliveryPrice, type Flavour, type GiftBoxSize, type Pack, type Selection } from "@/data/catalogue"
import { useVaultCart } from "@/context/vault-cart"
import { CanPhoto } from "@/components/vault/can-photo"
import { PackPreview } from "@/components/vault/pack-preview"
import { Quantity } from "@/components/vault/shopping"

const icons = { solo: Package, "collectors-case": Box, "gift-box": Gift }

export function HomePackBuilder() {
  const [selected, setSelected] = useState<Pack>("solo")

  return (
    <>
      <div className="pack-links pack-picker" role="group" aria-label="Choose a pack">
        {packs.map((pack) => (
          <button type="button" className="pack-link" key={pack.id} aria-pressed={selected === pack.id} aria-controls={`home-pack-${pack.id}`} onClick={() => setSelected(pack.id)}>
            <PackPreview pack={pack} />
          </button>
        ))}
      </div>
      <p className="pack-art-caption">Packaging illustrations. Choose your flavours below.</p>
      {packs.map((pack) => (
        <div className="home-pack-config" key={pack.id} id={`home-pack-${pack.id}`} hidden={selected !== pack.id}>
          <PackBuilder pack={pack.id} />
        </div>
      ))}
    </>
  )
}

export function PackBuilder({ pack, initialFlavour }: { pack: Pack; initialFlavour?: Flavour }) {
  const { addPack } = useVaultCart()
  const definition = getPack(pack)!
  const [selection, setSelection] = useState<Selection>(initialFlavour ? { [initialFlavour]: 1 } : {})
  const [giftSize, setGiftSize] = useState<GiftBoxSize>(giftBoxOptions[0].cans)
  const [message, setMessage] = useState("")
  const size = countCans(selection)
  const target = pack === "solo" ? 1 : pack === "gift-box" ? giftSize : 3
  const limit = pack === "collectors-case" ? maxQuantity : target
  const complete = pack === "collectors-case" ? size >= target : size === target
  const unitPrice = packPrice(pack, pack === "gift-box" ? giftSize : size)
  const Icon = icons[pack]

  function changeSize(next: GiftBoxSize) {
    setGiftSize(next)
    if (size > next) setSelection({})
  }

  return (
    <div className="pack-builder">
      <div className="builder-flavours">
        {pack === "gift-box" && (
          <div className="builder-size">
            <h2>Choose a box size</h2>
            <div className="filter-tabs" role="group" aria-label="Gift box size">
              {giftBoxOptions.map(({ cans, price }) => (
                <button key={cans} type="button" aria-pressed={giftSize === cans} onClick={() => changeSize(cans)}>{cans} cans · {formatPrice(price)}</button>
              ))}
            </div>
          </div>
        )}
        <h2>Choose your {pack === "solo" ? "flavour" : "flavours"}</h2>
        <div className="builder-options">
          {products.map((product) => {
            const quantity = selection[product.slug] ?? 0
            return (
              <div key={product.slug} className={`builder-option ${quantity ? "is-selected" : ""}`}>
                <div className="builder-photo" style={{ backgroundColor: `${product.accent}24` }}><CanPhoto product={product} decorative /></div>
                <div className="builder-flavour-copy"><strong>{product.name}</strong><span>{pack === "gift-box" ? "Included in box" : `${formatPrice(packPrice(pack, 1))} per can`}</span></div>
                {pack === "solo"
                  ? <button type="button" className="button secondary builder-select" aria-pressed={quantity === 1} onClick={() => setSelection({ [product.slug]: 1 })}>{quantity ? "Selected" : "Select"}</button>
                  : <Quantity label={`${product.name} cans`} value={quantity} min={0} limit={quantity + limit - size} onChange={(next) => setSelection({ ...selection, [product.slug]: next })} />}
              </div>
            )
          })}
        </div>
        {pack === "gift-box" && (
          <label className="text-field gift-card-field">
            Custom text card <span>Optional · up to 180 characters</span>
            <textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={180} rows={3} placeholder="Write a message for the recipient" />
          </label>
        )}
      </div>
      <aside className="summary-panel builder-summary">
        <Icon className="builder-icon" size={30} />
        <h2>{definition.name}</h2>
        <p>{definition.description}</p>
        <ul>{definition.perks.map((perk) => <li key={perk}><Check size={16} />{perk}</li>)}</ul>
        <div className="builder-total">
          <span aria-live="polite">{size} {size === 1 ? "can" : "cans"} selected</span>
          <strong>{formatPrice(unitPrice)}</strong>
        </div>
        {pack === "solo" && <p className="solo-delivery-note">{soloDeliveryPrice} per order. {freeDeliveryNote}</p>}
        <button type="button" className="button primary" disabled={!complete} onClick={() => addPack(pack, selection, message)}>
          <ShoppingBag size={18} /> {complete ? "Add to bag" : `Choose ${target - size} more`}
        </button>
        <Link className="button secondary" href="/cart">View bag</Link>
      </aside>
    </div>
  )
}
