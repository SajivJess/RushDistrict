import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { freeDeliveryNote, getPack, getProduct, packs, packPriceLabel } from "@/data/catalogue"
import { PackBuilder } from "@/components/vault/pack-builder"
import { PackArt, PackLinks } from "@/components/vault/pack-preview"

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ flavour?: string | string[] }>
}

const previousRoutes: Record<string, string> = {
  imported: "/products",
  collectors: "/categories/collectors-case",
  duo: "/categories/collectors-case",
  gifts: "/categories/gift-box",
  vault: "/#rewards",
}

export function generateStaticParams() {
  return packs.map((pack) => ({ slug: pack.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const pack = getPack(slug)
  return { title: pack?.name, description: pack?.description }
}

export default async function PackPage({ params, searchParams }: Props) {
  const { slug } = await params
  if (Object.hasOwn(previousRoutes, slug)) redirect(previousRoutes[slug])
  const pack = getPack(slug)
  if (!pack) notFound()
  const { flavour } = await searchParams
  const product = typeof flavour === "string" ? getProduct(flavour) : undefined

  return (
    <section className="container content-page">
      <div className="pack-detail-intro">
        <div>
          <p className="eyebrow green"><span /> BUILD YOUR PACK</p>
          <h1 className="display page-title">{pack.name}</h1>
          <p className="page-intro">{pack.id !== "gift-box" && `${pack.size} · `}{packPriceLabel[pack.id]}</p>
          <p className="page-intro">{pack.description}</p>
          {pack.id === "solo" && <p className="solo-delivery-note">{freeDeliveryNote}</p>}
        </div>
        <figure className="pack-detail-art">
          <PackArt pack={pack.id} eager />
          <figcaption className="pack-art-caption">Packaging illustration. Choose your flavours below.</figcaption>
        </figure>
      </div>
      <PackBuilder key={`${pack.id}:${product?.slug ?? ""}`} pack={pack.id} initialFlavour={product?.slug} />
      <div className="more-packs"><h2 className="display">EXPLORE PACKS</h2><PackLinks exclude={pack.id} /></div>
    </section>
  )
}
