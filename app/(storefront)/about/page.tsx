import type { Metadata } from "next"
import Link from "next/link"
import { whatsappNumber } from "@/lib/vault-config"
import { formatPrice, freeDeliveryAt } from "@/data/catalogue"

export const metadata: Metadata = { title: "About" }

export default function AboutPage() {
  return (
    <div className="container content-page">
      <h1 className="display page-title">ABOUT RUSH DISTRICT</h1>
      <p className="page-intro">An independent Monster Energy retailer with four flavours, custom packs and collectibles included with orders.</p>
      <div className="about-grid">
        <section><h2>Choose your pack</h2><p>Order a Solo, build a Collectors Case or personalise a three- or five-can Gift Box.</p><Link href="/#packs" className="text-link">Browse packs</Link></section>
        <section id="delivery"><h2>Local delivery and rewards</h2><p>See delivery options after entering your address at checkout. Orders of {formatPrice(freeDeliveryAt)} or more get free local delivery and a sticker. A collectible comes with every order.</p></section>
        <section id="contact"><h2>Contact and ordering</h2>{whatsappNumber ? <p>Chat with the shop on <a className="text-link" href={`https://wa.me/${whatsappNumber}`}>WhatsApp</a>.</p> : <p>WhatsApp ordering will be available when the store’s business number is connected.</p>}</section>
      </div>
    </div>
  )
}
