"use client"

import Image from "next/image"
import { Gift, Hexagon } from "lucide-react"
import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { collectibles, rarity, type Collectible } from "@/data/collectibles"

function collectibleName(item: Collectible) {
  return item.name ?? `Collectible ${String(item.number).padStart(2, "0")}`
}

function tilt(event: PointerEvent<HTMLButtonElement>) {
  if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
  const card = event.currentTarget
  const bounds = card.getBoundingClientRect()
  const x = (event.clientX - bounds.left) / bounds.width
  const y = (event.clientY - bounds.top) / bounds.height
  card.style.setProperty("--foil-x", `${x * 100}%`)
  card.style.setProperty("--foil-y", `${y * 100}%`)
  card.style.setProperty("--tilt-x", `${(0.5 - y) * 11}deg`)
  card.style.setProperty("--tilt-y", `${(x - 0.5) * 12}deg`)
}

function resetTilt(event: PointerEvent<HTMLButtonElement>) {
  for (const property of ["--foil-x", "--foil-y", "--tilt-x", "--tilt-y"]) event.currentTarget.style.removeProperty(property)
}

export function Collectibles() {
  const [selected, setSelected] = useState<Collectible | null>(null)
  const trigger = useRef<HTMLButtonElement | null>(null)
  const rail = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = rail.current
    if (!element || !("IntersectionObserver" in window)) return
    const observer = new IntersectionObserver(([entry]) => {
      element.toggleAttribute("data-motion-offscreen", !entry.isIntersecting)
    }, { rootMargin: "100px 0px" })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  function inspect(item: Collectible, event: MouseEvent<HTMLButtonElement>, duplicate: boolean) {
    trigger.current = duplicate ? null : event.currentTarget
    setSelected(item)
  }

  function galleryGroup(duplicate: boolean) {
    return (
      <ul className={`collectible-group${duplicate ? " collectible-repeat" : ""}`} aria-hidden={duplicate || undefined} aria-label={duplicate ? undefined : "Ten collectibles"}>
        {collectibles.map((item) => {
          const name = collectibleName(item)
          const number = String(item.number).padStart(2, "0")
          return (
            <li key={item.number} className={`collectible-card ${item.tier}`}>
              <button
                type="button"
                className="collectible-holo"
                tabIndex={duplicate ? -1 : undefined}
                aria-label={`View ${name}, ${rarity[item.tier]}`}
                onClick={(event) => inspect(item, event, duplicate)}
                onMouseDown={duplicate ? (event) => event.preventDefault() : undefined}
                onPointerMove={tilt}
                onPointerLeave={resetTilt}
              >
                <span className="collectible-foil" aria-hidden="true" />
                <span className="collectible-visual">
                  {item.image
                    ? <Image src={item.image} alt="" fill sizes="(max-width: 600px) 54vw, 255px" />
                    : <span className="collectible-placeholder" aria-hidden="true"><Hexagon size={62} strokeWidth={1} /><span>{number}</span></span>}
                </span>
                <span className="collectible-info"><strong>{name}</strong><span className="rarity-label">{rarity[item.tier]}</span></span>
              </button>
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <section className="collectibles-section" id="collectibles" aria-labelledby="collectibles-title">
      <div className="container">
        <div className="section-head collectibles-head">
          <div>
            <h2 className="display" id="collectibles-title">COLLECTIBLES</h2>
            <p className="page-intro">A collectible comes with every order. Discover the ten-piece set.</p>
          </div>
        </div>
        <div className="rarity-legend" aria-label="Collectible rarities">
          {Object.entries(rarity).map(([tier, label]) => <span className={`rarity-label ${tier}`} key={tier}>{label}</span>)}
          {collectibles.some((item) => !item.image) && <span className="gallery-note">Collectible photos coming soon</span>}
        </div>
        <div className="collectibles-window" ref={rail}>
          <div className="collectible-track">{galleryGroup(false)}{galleryGroup(true)}</div>
        </div>
        <div className="collection-reward" id="rewards">
          <Gift size={24} aria-hidden="true" /><strong>Collect all 10 to claim a special gift.</strong>
        </div>
      </div>
      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null) }}>
        {selected && (
          <DialogContent className={`collectible-dialog ${selected.tier}`} finalFocus={() => trigger.current}>
            {selected.image && <div className="collectible-dialog-photo"><Image src={selected.image} alt="" fill sizes="320px" /></div>}
            <span className="rarity-label">{rarity[selected.tier]}</span>
            <DialogTitle>{collectibleName(selected)}</DialogTitle>
            <DialogDescription>{selected.description ?? `Piece ${selected.number} of 10 in the Rush District set. This ${rarity[selected.tier].toLowerCase()} collectible's artwork hasn't been revealed yet.`}</DialogDescription>
          </DialogContent>
        )}
      </Dialog>
    </section>
  )
}
