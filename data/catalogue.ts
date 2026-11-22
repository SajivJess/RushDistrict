export const launchPrice = 249
export const referencePrice = 350
export const collectorsCaseCanPrice = 400
export const giftBoxOptions = [{ cans: 3, price: 999 }, { cans: 5, price: 1599 }] as const
export const canSize = "500 ml"
export const freeDeliveryAt = 499
export const localDeliveryFee = 50
export const maxQuantity = 999

export const products = [
  {
    slug: "aussie-style-lemonade", name: "Aussie Style Lemonade", series: "Juiced Monster",
    accent: "#38bde8", image: "/media/can-aussie-style-lemonade.webp",
    description: "Bright, tangy lemonade with the ocean-blue Aussie Style can artwork.",
    imageSize: [278, 673],
  },
  {
    slug: "mango-loco", name: "Mango Loco", series: "Juiced Monster",
    accent: "#159ee1", image: "/media/can-mango-loco.webp",
    description: "Juicy mango and tropical fruit in a vivid blue Día de los Muertos can.",
    imageSize: [277, 672],
  },
  {
    slug: "the-doctor", name: "The Doctor", series: "Monster Energy VR46",
    accent: "#ffca2d", image: "/media/can-the-doctor.webp",
    description: "The citrus-flavoured VR46 edition in Valentino Rossi’s signature yellow can.",
    imageSize: [294, 684],
  },
  {
    slug: "lando-norris-zero-sugar", name: "Lando Norris Zero Sugar", series: "Monster Energy Zero Sugar",
    accent: "#d6f32d", image: "/media/can-lando-norris-zero-sugar.webp",
    description: "The Lando Norris Zero Sugar edition in the unmistakable yellow and black can.",
    imageSize: [268, 681],
  },
] as const

export type Product = typeof products[number]
export type Flavour = Product["slug"]
export type Selection = Partial<Record<Flavour, number>>

export const packs = [
  { id: "solo", name: "Solo", size: "1 can", description: "One can in the flavour you choose.", perks: ["One flavour of your choice", "Collectible with your order"] },
  { id: "collectors-case", name: "Collectors Case", size: "3+ cans", description: "Special collector casing and one collectible per can.", perks: ["Special collector casing", "One collectible per can", "Sticker and free delivery"] },
  { id: "gift-box", name: "Gift Box", size: "3 or 5 cans", description: "Gift packaging with a keychain, sticker, collectible and optional message.", perks: ["Modern gift packaging", "Custom text card", "Keychain, sticker and collectible"] },
] as const

export type Pack = typeof packs[number]["id"]
export type BagPack = Pack | "duo"
export type GiftBoxSize = typeof giftBoxOptions[number]["cans"]

export const localities = ["Nagercoil City", "Marthandam", "Kanyakumari Town", "Colachel", "Thuckalay", "Other Kanyakumari area"] as const
export type Locality = typeof localities[number]

export function getLocality(value: string) {
  return localities.find((locality) => locality === value)
}

export function getPack(id: string) {
  return packs.find((pack) => pack.id === id)
}

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug)
}

export function matchProduct(product: Product, query: string) {
  const name = [product.name, product.series, product.description].join(" ").toLowerCase()
  return query.trim().toLowerCase().split(/\s+/).every((word) => name.includes(word))
}

export function selectionEntries(selection: Selection) {
  return products.flatMap((product) => {
    const quantity = selection[product.slug]
    return typeof quantity === "number" && Number.isSafeInteger(quantity) && quantity > 0 && quantity <= maxQuantity
      ? [{ product, quantity }]
      : []
  })
}

export function countCans(selection: Selection) {
  return selectionEntries(selection).reduce((total, item) => total + item.quantity, 0)
}

export function packIsComplete(pack: BagPack, count: number) {
  if (count > maxQuantity) return false
  switch (pack) {
    case "solo": return count === 1
    // Keep saved orders with the retired two-can pack valid.
    case "duo": return count === 2
    case "collectors-case": return count >= 3
    case "gift-box": return giftBoxOptions.some(({ cans }) => cans === count)
  }
}

export type PackLine = {
  pack: BagPack
  selection: Selection
  quantity: number
  message: string
}

export function packPrice(pack: BagPack, cans: number) {
  if (pack === "gift-box") return giftBoxOptions.find((option) => option.cans === cans)?.price ?? 0
  return cans * (pack === "collectors-case" ? collectorsCaseCanPrice : launchPrice)
}

export function linePrice({ pack, selection, quantity }: PackLine) {
  return packPrice(pack, countCans(selection)) * quantity
}

export function orderRewards(lines: PackLine[], subtotal: number) {
  let collectibles = 0
  let giftBoxes = 0
  for (const line of lines) {
    if (line.pack === "collectors-case") collectibles += countCans(line.selection) * line.quantity
    if (line.pack === "gift-box") giftBoxes += line.quantity
  }
  return {
    collectibles: lines.length ? Math.max(1, collectibles + giftBoxes) : 0,
    stickers: Math.max(giftBoxes, subtotal >= freeDeliveryAt ? 1 : 0),
    keychains: giftBoxes,
  }
}

export const formatPrice = new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 0,
}).format

export const soloDeliveryPrice = `${formatPrice(launchPrice)} + ${formatPrice(localDeliveryFee)} local delivery`
export const freeDeliveryNote = `Free local delivery on orders of ${formatPrice(freeDeliveryAt)} or more.`

export const packPriceLabel = {
  solo: soloDeliveryPrice,
  "collectors-case": `${formatPrice(collectorsCaseCanPrice)} per can`,
  "gift-box": giftBoxOptions.map(({ cans, price }) => `${cans} cans for ${formatPrice(price)}`).join(" / "),
} satisfies Record<Pack, string>
