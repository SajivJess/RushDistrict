"use client"

import { useMemo, useSyncExternalStore } from "react"
import { getLocality, products, selectionEntries, type Flavour, type Locality, type PackLine, type Product, type Selection } from "@/data/catalogue"

type Entry = { reference: string; alias: string; locality: Locality; cans: Selection }

const key = "can-vault-demo-rankings"
const change = "can-vault-demo-rankings-change"
let fallback: string | undefined

function getSnapshot() {
  if (fallback !== undefined) return fallback
  try { return localStorage.getItem(key) ?? "[]" } catch { return "[]" }
}

function subscribe(callback: () => void) {
  window.addEventListener(change, callback)
  window.addEventListener("storage", callback)
  return () => {
    window.removeEventListener(change, callback)
    window.removeEventListener("storage", callback)
  }
}

function readEntries(value: string): Entry[] {
  try {
    const data = JSON.parse(value)
    if (!Array.isArray(data)) return []
    return data.filter((entry) => entry && typeof entry.reference === "string" && typeof entry.alias === "string" &&
      entry.alias.trim().length > 0 && !!getLocality(entry.locality) && entry.cans && typeof entry.cans === "object")
  } catch {
    return []
  }
}

export function recordDemoOrder(reference: string, alias: string, locality: Locality, lines: PackLine[]) {
  const safeAlias = alias.trim().replace(/\s+/g, " ").slice(0, 28)
  if (!safeAlias || lines.length === 0) return
  const entries = readEntries(getSnapshot())
  if (entries.some((entry) => entry.reference === reference)) return

  const cans: Selection = {}
  for (const line of lines) {
    for (const { product, quantity } of selectionEntries(line.selection)) {
      cans[product.slug] = (cans[product.slug] ?? 0) + quantity * line.quantity
    }
  }

  const serialized = JSON.stringify([...entries, { reference, alias: safeAlias, locality, cans }])
  try {
    localStorage.setItem(key, serialized)
    fallback = undefined
  } catch {
    fallback = serialized
  }
  window.dispatchEvent(new Event(change))
}

function rankEntries(entries: Entry[], locality: Locality | "all", flavour: Flavour | "all") {
  const eligible: readonly Product[] = flavour === "all" ? products : products.filter((product) => product.slug === flavour)
  const buyers = new Map<string, { alias: string; locality: Locality; cans: number }>()
  for (const entry of entries) {
    if (locality !== "all" && entry.locality !== locality) continue
    const units = eligible.reduce<number>((total, product) => {
      const count = entry.cans[product.slug]
      return typeof count === "number" && Number.isSafeInteger(count) && count > 0 ? total + count : total
    }, 0)
    if (!units) continue
    const id = JSON.stringify([entry.locality, entry.alias.toLowerCase()])
    const previous = buyers.get(id)
    buyers.set(id, { alias: previous?.alias ?? entry.alias, locality: entry.locality, cans: (previous?.cans ?? 0) + units })
  }
  const sorted = [...buyers.values()].sort((first, second) => second.cans - first.cans || first.alias.localeCompare(second.alias))
  let rank = 0
  return sorted.map((buyer, index) => {
    if (buyer.cans !== sorted[index - 1]?.cans) rank = index + 1
    return { ...buyer, rank }
  })
}

export function useDemoLeaderboard(locality: Locality | "all", flavour: Flavour | "all") {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => "[]")
  return useMemo(() => rankEntries(readEntries(snapshot), locality, flavour), [snapshot, locality, flavour])
}
