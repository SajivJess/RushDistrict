export const rarity = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
} as const

export type Collectible = {
  number: number
  tier: keyof typeof rarity
  name?: string
  image?: string
  description?: string
}

export const collectibles: Collectible[] = [
  { number: 1, tier: "common" },
  { number: 2, tier: "common" },
  { number: 3, tier: "common" },
  { number: 4, tier: "common" },
  { number: 5, tier: "common" },
  { number: 6, tier: "uncommon" },
  { number: 7, tier: "uncommon" },
  { number: 8, tier: "uncommon" },
  { number: 9, tier: "rare" },
  { number: 10, tier: "rare" },
]
