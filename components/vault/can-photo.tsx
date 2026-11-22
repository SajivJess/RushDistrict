import type { CSSProperties } from "react"
import { formatPrice, launchPrice, referencePrice, type Product } from "@/data/catalogue"

export function CanPhoto({ product, decorative = false, priority = false }: { product: Product; decorative?: boolean; priority?: boolean }) {
  const [width, height] = product.imageSize

  return (
    <span className="can-photo" style={{ aspectRatio: `${width} / ${height}` }}>
      {/* These pre-cropped WebP files are shared across the hero, catalogue, and bag. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={product.image} width={width} height={height} alt={decorative ? "" : product.name} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} draggable={false} />
    </span>
  )
}

export function ProductImage({ product, priority = false }: { product: Product; priority?: boolean }) {
  return (
    <div className="product-visual product-render" style={{ "--product-accent": product.accent } as CSSProperties}>
      <CanPhoto product={product} priority={priority} />
    </div>
  )
}

export function LaunchPrice({ className = "" }: { className?: string }) {
  return (
    <span className={`launch-price ${className}`}>
      <del aria-label={`Reference price ${formatPrice(referencePrice)}`}>{formatPrice(referencePrice)}</del>
      <strong aria-label={`Launch price ${formatPrice(launchPrice)}`}>{formatPrice(launchPrice)}</strong>
    </span>
  )
}
