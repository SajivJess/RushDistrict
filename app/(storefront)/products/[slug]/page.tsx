import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronRight, Gift } from "lucide-react"
import { canSize, formatPrice, freeDeliveryNote, getProduct, localDeliveryFee, products } from "@/data/catalogue"
import { ProductGrid } from "@/components/vault/catalogue"
import { LaunchPrice, ProductImage } from "@/components/vault/can-photo"
import { ProductActions } from "@/components/vault/shopping"

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = getProduct(slug)
  return { title: product?.name, description: product?.description }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product = getProduct(slug)
  if (!product) notFound()
  const related = products.filter((item) => item.slug !== slug)

  return (
    <div className="container content-page">
      <nav aria-label="Breadcrumb" className="breadcrumbs">
        <Link href="/products">Shop flavours</Link><ChevronRight size={14} /><span>{product.name}</span>
      </nav>
      <div className="product-detail">
        <ProductImage product={product} priority />
        <section className="product-detail-copy">
          <p className="eyebrow green"><span /> {product.series}</p>
          <h1 className="display page-title">{product.name}</h1>
          <p className="detail-price"><LaunchPrice /> <span>per can + delivery</span></p>
          <p className="solo-delivery-note">{formatPrice(localDeliveryFee)} local delivery per order. {freeDeliveryNote}</p>
          <p className="page-intro">{product.description}</p>
          <ProductActions product={product} />
          <dl className="product-specs">
            <div><dt>Size</dt><dd>{canSize}</dd></div>
            <div><dt>Condition</dt><dd>Factory-sealed can</dd></div>
          </dl>
          <p className="detail-footnote"><Gift size={18} /> A collectible comes with every order.</p>
        </section>
      </div>
      <section className="related-products">
        <h2 className="display">OTHER LAUNCH FLAVOURS</h2>
        <ProductGrid entries={related} />
      </section>
    </div>
  )
}
