import Link from "next/link"
import { Gift, Sticker, Truck, Video } from "lucide-react"
import { formatPrice, freeDeliveryAt, products } from "@/data/catalogue"
import { LaunchHero } from "@/components/vault/launch-hero"
import { ProductGrid } from "@/components/vault/catalogue"
import { HomePackBuilder } from "@/components/vault/pack-builder"
import { Collectibles } from "@/components/vault/collectibles"
import { OfferLoop } from "@/components/vault/offer-loop"
import { RewardsHub } from "@/components/vault/rewards-hub"
import { instagramHandle } from "@/lib/vault-config"

export default function HomePage() {
  return (
    <>
      <LaunchHero />
      <div className="service-bar">
        <div className="container service-grid">
          <div><Gift /><span>Collectible with every order</span></div>
          <div><Truck /><span>Free delivery on {formatPrice(freeDeliveryAt)}+</span></div>
          <div><Sticker /><span>Free sticker on {formatPrice(freeDeliveryAt)}+</span></div>
          <div><Video /><Link href="#community-rewards">Earn unboxing rewards</Link></div>
        </div>
      </div>
      <section className="container drop-section home-lineup" id="the-drop" aria-labelledby="drop-title">
        <div className="section-head">
          <div>
            <p className="eyebrow green"><span /> LAUNCH LINEUP</p>
            <h2 id="drop-title" className="display">THE FOUR FLAVOURS</h2>
          </div>
          <Link href="/products" className="text-link">Browse catalogue</Link>
        </div>
        <ProductGrid entries={products} />
      </section>
      <OfferLoop />
      <section className="container collection-section" id="packs" aria-labelledby="pack-title">
        <div className="section-head">
          <div>
            <h2 id="pack-title" className="display">BUILD YOUR PACK</h2>
            <p className="page-intro">Choose a pack and mix your favourites right here.</p>
          </div>
        </div>
        <HomePackBuilder />
      </section>
      <Collectibles />
      <RewardsHub instagramHandle={instagramHandle} />
    </>
  )
}
