"use client"

import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react"
import { CanPhoto, LaunchPrice } from "@/components/vault/can-photo"
import { HeroLeaderboard } from "@/components/vault/leaderboard"
import { products } from "@/data/catalogue"

const heroSlots = ["can-main", "can-right", "can-back", "can-left"] as const

function wrapFlavour(index: number) {
  return (index + products.length) % products.length
}

function lightStage(event: PointerEvent<HTMLDivElement>) {
  if (event.pointerType !== "mouse") return
  const stage = event.currentTarget
  const bounds = stage.getBoundingClientRect()
  stage.style.setProperty("--spot-x", `${100 * (event.clientX - bounds.left) / bounds.width}%`)
  stage.style.setProperty("--spot-y", `${100 * (event.clientY - bounds.top) / bounds.height}%`)

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
  const grid = stage.querySelector<HTMLElement>(".stage-grid")
  if (!grid) return
  const size = 24
  const x = Math.floor((event.clientX - bounds.left) / size) * size
  const y = Math.floor((event.clientY - bounds.top) / size) * size
  const cell = `${x}:${y}`
  if (grid.dataset.activeCell === cell) return
  grid.dataset.activeCell = cell
  const slot = Number(grid.dataset.slot ?? 0)
  grid.dataset.slot = String((slot + 1) % grid.children.length)
  const tile = grid.children[slot] as HTMLElement
  tile.getAnimations().forEach((animation) => animation.cancel())
  tile.style.translate = `${x}px ${y}px`
  tile.animate([{ opacity: .75 }, { opacity: 0 }], { duration: 680, easing: "ease-out" })
}

export function LaunchHero() {
  const stageRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState(products.length - 1)
  const active = products[selected]

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const timer = window.setInterval(() => {
      const stage = stageRef.current
      if (!stage || document.hidden || motion.matches || stage.querySelector(":focus-visible") || document.activeElement?.matches(".active-flavour")) return
      const bounds = stage.getBoundingClientRect()
      if (bounds.bottom <= 0 || bounds.top >= window.innerHeight) return
      setSelected((index) => wrapFlavour(index + 1))
    }, 6500)
    return () => window.clearInterval(timer)
  }, [selected])

  return (
    <section className="hero launch-hero" id="home" aria-labelledby="hero-title" style={{ "--can-glow": active.accent } as CSSProperties}>
      <div className="container hero-inner">
        <div className="hero-copy">
          <h1 id="hero-title" aria-label="Find your flavour."><span aria-hidden="true" className="glitch-line" data-text="FIND YOUR">FIND YOUR</span><br /><em aria-hidden="true" className="glitch-line" data-text="FLAVOUR.">FLAVOUR.</em></h1>
          <p className="hero-description">Four Monster flavours. Build your own pack and get a collectible with every order.</p>
          <div className="hero-launch-offer">
            <p className="hero-offer-tag"><strong>Website Launch Offer</strong><span>Only 7 Days</span></p>
            <div className="hero-price"><LaunchPrice /> <span>per Solo can</span></div>
          </div>
          <div className="hero-actions">
            <Link href="#the-drop" className="button primary">Shop flavours</Link>
            <Link href="#packs" className="button secondary">Build a pack</Link>
          </div>
          <HeroLeaderboard />
        </div>
        <div className="launch-stage" ref={stageRef} onPointerMove={lightStage} onPointerLeave={(event) => {
          event.currentTarget.style.removeProperty("--spot-x")
          event.currentTarget.style.removeProperty("--spot-y")
          const grid = event.currentTarget.querySelector<HTMLElement>(".stage-grid")
          if (grid) delete grid.dataset.activeCell
        }}>
          <div className="stage-spotlight" aria-hidden="true" />
          <div className="stage-grid" aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <span className="stage-grid-cell" key={index} />)}</div>
          <div className="launch-orbit" aria-hidden="true" />
          <div className="can-carousel" aria-hidden="true">
            {products.map((product, index) => (
              <div key={product.slug} className={`showcase-can ${heroSlots[wrapFlavour(index - selected)]}`}>
                <CanPhoto product={product} decorative priority={index === products.length - 1} />
              </div>
            ))}
          </div>
          <button type="button" className="stage-arrow stage-arrow-previous" aria-label="Previous flavour" onClick={() => setSelected((index) => wrapFlavour(index - 1))}>
            <ChevronLeft size={22} aria-hidden="true" />
          </button>
          <button type="button" className="stage-arrow stage-arrow-next" aria-label="Next flavour" onClick={() => setSelected((index) => wrapFlavour(index + 1))}>
            <ChevronRight size={22} aria-hidden="true" />
          </button>
          <div className="stage-controls">
            <Link className="active-flavour" href={`/products/${active.slug}`}>{active.name}</Link>
            <div className="flavour-choices" role="group" aria-label="Preview a flavour">
              {products.map((product, index) => (
                <button type="button" key={product.slug} aria-label={`Preview ${product.name}`} title={product.name} aria-pressed={selected === index} onClick={() => setSelected(index)} style={{ "--swatch": product.accent } as CSSProperties}><span /></button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
