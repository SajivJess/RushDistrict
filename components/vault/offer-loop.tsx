import Link from "next/link"
import { useId } from "react"

export function OfferLoop() {
  const path = useId()
  return (
    <Link href="/#the-drop" className="offer-loop" aria-label="Limited offer. Shop the launch flavours.">
      <span className="offer-track" aria-hidden="true">
        {[0, 1].map((copy) => (
          <span className="offer-group" key={copy}>
            {Array.from({ length: 8 }, (_, index) => (
              <svg key={index} width="270" height="32" viewBox="0 0 270 32">
                <path id={`${path}-${copy}-${index}`} d="M5 21 Q37 9 70 21 T135 21 T200 21 T265 21" fill="none" />
                <text textLength="244" lengthAdjust="spacing"><textPath href={`#${path}-${copy}-${index}`}>LIMITED OFFER · GRAB NOW ·</textPath></text>
              </svg>
            ))}
          </span>
        ))}
      </span>
    </Link>
  )
}
