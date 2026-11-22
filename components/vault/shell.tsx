"use client"

import Image from "next/image"
import Link from "next/link"
import { CanPhoto } from "@/components/vault/can-photo"
import { usePathname, useRouter } from "next/navigation"
import { Menu, Search, ShoppingBag, Truck, UserRound } from "lucide-react"
import { useEffect, useState } from "react"
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { formatPrice, freeDeliveryAt, launchPrice, matchProduct, products } from "@/data/catalogue"
import { useVaultCart } from "@/context/vault-cart"
import { CartLines } from "@/components/vault/shopping"

const nav = [
  { href: "/#home", label: "Home" },
  { href: "/#the-drop", label: "Flavours" },
  { href: "/#packs", label: "Build a Pack" },
  { href: "/#collectibles", label: "Collectibles" },
  { href: "/#community-rewards", label: "Rewards" },
  { href: "/leaderboard", label: "Leaderboard" },
]

function Wordmark({ eager = false }: { eager?: boolean }) {
  return (
    <Link href="/#home" className="wordmark" aria-label="Rush District home">
      <Image src="/media/logo-96.webp" className="wordmark-logo" width={46} height={46} unoptimized loading={eager ? "eager" : "lazy"} alt="" />
      <span>Rush <span className="wordmark-accent">District</span></span>
    </Link>
  )
}

export function VaultHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { count, subtotal } = useVaultCart()
  const [query, setQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [bagOpen, setBagOpen] = useState(false)
  const [homeLocation, setHomeLocation] = useState("/#home")
  const matches = query.trim() ? products.filter((product) => matchProduct(product, query)).slice(0, 5) : []

  useEffect(() => {
    if (pathname !== "/") return
    const sections = nav.flatMap(({ href }) => {
      if (!href.startsWith("/#")) return []
      const section = document.getElementById(href.slice(2))
      return section ? [{ href, section }] : []
    })
    let frame = 0
    function schedule() {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const focusLine = window.innerHeight * 0.46
        const current = sections.findLast(({ section }) => section.getBoundingClientRect().top <= focusLine)
        setHomeLocation(current?.href ?? "/#home")
      })
    }

    schedule()
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
    }
  }, [pathname])

  function currentNav(href: string) {
    if (pathname === "/" && href === homeLocation) return href === "/#home" ? "page" : "location"
    return pathname !== "/" && pathname === href ? "page" : undefined
  }

  return (
    <header className="site-header">
      <div className="announcement"><Truck size={14} aria-hidden="true" /> Free local delivery + sticker on {formatPrice(freeDeliveryAt)}+</div>
      <div className="header-main">
        <div className="container header-inner">
          <div className="mobile-nav">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger className="icon-button" aria-label="Open menu"><Menu size={23} /></SheetTrigger>
              <SheetContent side="left" className="vault-sheet">
                <SheetTitle>Shop Rush District</SheetTitle>
                <SheetDescription className="sr-only">Browse packs and store information.</SheetDescription>
                <nav aria-label="Mobile navigation" className="drawer-nav">
                  {[...nav, { href: "/about", label: "About" }].map((item) => <Link key={item.href} href={item.href} aria-current={currentNav(item.href)} onClick={() => setMenuOpen(false)}>{item.label}</Link>)}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
          <Wordmark eager />
          <nav className="desktop-nav" aria-label="Main navigation">
            {nav.map((item) => <Link href={item.href} key={item.href} aria-current={currentNav(item.href)}>{item.label}</Link>)}
          </nav>
          <div className="header-tools">
            <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
              <SheetTrigger className="icon-button" aria-label="Search"><Search size={21} /></SheetTrigger>
              <SheetContent className="vault-sheet">
                <SheetTitle>Search Rush District</SheetTitle>
                <SheetDescription className="sr-only">Search by flavour or series.</SheetDescription>
                <form className="search-form" onSubmit={(event) => {
                  event.preventDefault()
                  setSearchOpen(false)
                  router.push(`/search?q=${encodeURIComponent(query.trim())}`)
                }}>
                  <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try Mango Loco" aria-label="Search products" autoFocus />
                  <button className="icon-button" type="submit" aria-label="Submit search"><Search size={20} /></button>
                </form>
                <div className="drawer-search-results" aria-live="polite">
                  {query.trim() && !matches.length && <p>No matching products.</p>}
                  {matches.map((product) => (
                    <Link key={product.slug} href={`/products/${product.slug}`} onClick={() => setSearchOpen(false)}>
                      <CanPhoto product={product} decorative />
                      <span>{product.name}<small>{formatPrice(launchPrice)}</small></span>
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
            <Link href="/account" className="icon-button account-trigger" aria-label="Account" title="Account" aria-current={currentNav("/account")}><UserRound size={20} aria-hidden="true" /></Link>
            <Sheet open={bagOpen} onOpenChange={setBagOpen}>
              <SheetTrigger className="icon-button bag-trigger" aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}>
                <ShoppingBag size={19} aria-hidden="true" /><span className="cart-label">Cart</span><span className="bag-count">{count}</span>
              </SheetTrigger>
              <SheetContent className="vault-sheet">
                <SheetTitle>Your bag <span className="drawer-count">({count})</span></SheetTitle>
                <SheetDescription className="sr-only">Review quantities and checkout.</SheetDescription>
                {count ? (
                  <>
                    <div className="drawer-items"><CartLines compact onProductSelect={() => setBagOpen(false)} /></div>
                    <div className="drawer-total">
                      <div><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
                      <Link className="button primary" href="/checkout" onClick={() => setBagOpen(false)}>Checkout</Link>
                      <Link className="button secondary" href="/cart" onClick={() => setBagOpen(false)}>View bag</Link>
                    </div>
                  </>
                ) : (
                  <div className="empty-state"><ShoppingBag /><h2>Your bag is empty</h2><Link className="button primary" href="/products" onClick={() => setBagOpen(false)}>Explore products</Link></div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}

export function VaultFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div><Wordmark /><p>Monster Energy flavours, custom packs and order rewards.</p></div>
        <div><h2>Shop</h2><Link href="/#the-drop">Launch flavours</Link><Link href="/#packs">Build a pack</Link><Link href="/#collectibles">Collectibles</Link><Link href="/#community-rewards">Rewards</Link><Link href="/leaderboard">Leaderboard</Link></div>
        <div><h2>Rush District</h2><Link href="/about">About the store</Link><Link href="/about#delivery">Delivery and packaging</Link><Link href="/about#contact">Contact</Link></div>
      </div>
      <div className="container footer-bottom"><span>© {new Date().getFullYear()} Rush District</span><span>Independent retailer. Monster Energy trademarks belong to their respective owners.</span></div>
    </footer>
  )
}
