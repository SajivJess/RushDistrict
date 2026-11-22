"use client"

import Link from "next/link"
import { useState } from "react"
import { ChevronDown, PackageOpen, Plus } from "lucide-react"
import { canSize, matchProduct, products, type Product } from "@/data/catalogue"
import { useVaultCart } from "@/context/vault-cart"
import { LaunchPrice, ProductImage } from "@/components/vault/can-photo"

export function ProductCard({ product }: { product: Product }) {
  const { add } = useVaultCart()
  return (
    <article className="product-card">
      <Link href={`/products/${product.slug}`} className="product-image-link" aria-label={`View ${product.name}`}>
        <ProductImage product={product} />
        <span className="product-badge badge-green">Launch offer</span>
      </Link>
      <div className="product-info">
        <p className="product-meta">{product.series} <span>·</span> {canSize}</p>
        <h3><Link href={`/products/${product.slug}`}>{product.name}</Link></h3>
        <div className="product-bottom">
          <LaunchPrice />
          <button type="button" className="add-button" aria-label={`Add ${product.name} to bag`} onClick={() => add(product)}>
            <Plus size={19} />
          </button>
        </div>
      </div>
    </article>
  )
}

export function ProductGrid({ entries }: { entries: readonly Product[] }) {
  if (!entries.length) {
    return <div className="empty-state"><PackageOpen /><h2>No flavours found</h2><p>Try a different search.</p></div>
  }
  return <div className="product-grid">{entries.map((product) => <ProductCard key={product.slug} product={product} />)}</div>
}

export function Catalogue({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery)
  const [sort, setSort] = useState("featured")
  const [filter, setFilter] = useState("all")
  const visible = products.filter((product) => (filter === "all" || product.series === filter) && matchProduct(product, query))
  if (sort === "name") visible.sort((a, b) => a.name.localeCompare(b.name))

  return (
    <>
      <div className="catalogue-toolbar">
        <div className="filter-tabs" role="group" aria-label="Filter flavours">
          <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>All flavours</button>
          <button type="button" aria-pressed={filter === "Juiced Monster"} onClick={() => setFilter("Juiced Monster")}>Juiced Monster</button>
          <button type="button" aria-pressed={filter === "Monster Energy Zero Sugar"} onClick={() => setFilter("Monster Energy Zero Sugar")}>Zero Sugar</button>
        </div>
        <div className="catalogue-controls">
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search flavours" aria-label="Search products" />
          <label className="select-field">
            <span className="sr-only">Sort flavours</span>
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="featured">Launch lineup</option>
              <option value="name">Name A–Z</option>
            </select>
            <ChevronDown size={16} />
          </label>
        </div>
      </div>
      <p className="results-count" aria-live="polite">{visible.length} {visible.length === 1 ? "flavour" : "flavours"}</p>
      <ProductGrid entries={visible} />
    </>
  )
}
