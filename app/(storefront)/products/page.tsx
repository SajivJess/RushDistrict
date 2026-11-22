import type { Metadata } from "next"
import { Catalogue } from "@/components/vault/catalogue"
import { PackLinks } from "@/components/vault/pack-preview"
import { freeDeliveryNote, soloDeliveryPrice } from "@/data/catalogue"

export const metadata: Metadata = { title: "Shop Flavours" }

export default function ProductsPage() {
  return (
    <section className="container content-page">
      <h1 className="display page-title">SHOP FLAVOURS</h1>
      <p className="page-intro">Four 500 ml Monster flavours. A single can is {soloDeliveryPrice}. {freeDeliveryNote}</p>
      <Catalogue />
      <div className="more-packs">
        <h2 className="display">BUILD YOUR PACK</h2>
        <PackLinks />
        <p className="pack-art-caption">Packaging illustrations. Flavours vary with your selection.</p>
      </div>
    </section>
  )
}
