import Image from "next/image"
import Link from "next/link"
import { packs, packPriceLabel, type Pack } from "@/data/catalogue"

const art = {
  solo: { width: 228, height: 520 },
  "collectors-case": { width: 359, height: 570 },
  "gift-box": { width: 820, height: 630 },
} satisfies Record<Pack, { width: number; height: number }>

export function PackArt({ pack, eager = false }: { pack: Pack; eager?: boolean }) {
  return (
    <span className={`pack-art pack-art--${pack}`}>
      <Image src={`/media/pack-${pack}.webp`} {...art[pack]} alt="" unoptimized loading={eager ? "eager" : "lazy"} />
    </span>
  )
}

export function PackPreview({ pack }: { pack: (typeof packs)[number] }) {
  return (
    <>
      <PackArt pack={pack.id} />
      <span className="pack-link-copy">
        <span className="pack-link-size">{pack.size}</span>
        <strong>{pack.name}</strong>
        <span className="pack-link-description">{pack.description}</span>
        <span className="pack-link-price">{packPriceLabel[pack.id]}</span>
      </span>
    </>
  )
}

export function PackLinks({ exclude }: { exclude?: Pack }) {
  return (
    <div className="pack-links">
      {packs.filter((pack) => pack.id !== exclude).map((pack) => (
        <Link className="pack-link" href={`/categories/${pack.id}`} key={pack.id}><PackPreview pack={pack} /></Link>
      ))}
    </div>
  )
}
