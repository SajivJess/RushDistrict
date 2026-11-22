"use client"

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react"
import { toast } from "sonner"
import { countCans, getPack, linePrice, maxQuantity, orderRewards, packIsComplete, products, selectionEntries, type BagPack, type Pack, type PackLine, type Product, type Selection } from "@/data/catalogue"

export type CartLine = PackLine & { id: string }
type Cart = {
  items: CartLine[]
  count: number
  subtotal: number
  rewards: ReturnType<typeof orderRewards>
  add: (product: Product, quantity?: number) => void
  addPack: (pack: Pack, selection: Selection, message?: string) => boolean
  update: (id: string, quantity: number) => void
  clear: () => void
}

const key = "can-vault-bag"
const storeEvent = "can-vault-bag-change"
let fallback: string | undefined

function getSnapshot() {
  if (fallback !== undefined) return fallback
  try { return localStorage.getItem(key) ?? "[]" } catch { return "[]" }
}

function subscribe(callback: () => void) {
  window.addEventListener(storeEvent, callback)
  window.addEventListener("storage", callback)
  return () => {
    window.removeEventListener(storeEvent, callback)
    window.removeEventListener("storage", callback)
  }
}

function createLine(pack: BagPack, selection: Selection, quantity: number, message: string): CartLine {
  const entries = selectionEntries(selection).map(({ product, quantity }) => [product.slug, quantity] as const)
  const card = pack === "gift-box" ? message.trim().slice(0, 180) : ""
  return { id: JSON.stringify([pack, entries, card]), pack, selection: Object.fromEntries(entries), quantity, message: card }
}

function readLines(snapshot: string): CartLine[] {
  try {
    const saved = JSON.parse(snapshot)
    if (Array.isArray(saved)) {
      return saved.flatMap((line) => {
        if (!line || (line.pack !== "duo" && !getPack(line.pack)) || !line.selection || !packIsComplete(line.pack, countCans(line.selection))) return []
        if (!Number.isSafeInteger(line.quantity) || line.quantity < 1 || line.quantity > maxQuantity) return []
        return [createLine(line.pack, line.selection, line.quantity, typeof line.message === "string" ? line.message : "")]
      })
    }
    if (!saved || typeof saved !== "object") return []
    return products.flatMap((product) => {
      const quantity = saved[product.slug]
      return Number.isSafeInteger(quantity) && quantity > 0 && quantity <= maxQuantity
        ? [createLine("solo", { [product.slug]: 1 }, quantity, "")]
        : []
    })
  } catch {
    return []
  }
}

function writeLines(lines: CartLine[]) {
  const serialized = JSON.stringify(lines)
  try {
    localStorage.setItem(key, serialized)
    fallback = undefined
  } catch {
    fallback = serialized
  }
  window.dispatchEvent(new Event(storeEvent))
}

const CartContext = createContext<Cart | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => "[]")
  const items = useMemo(() => readLines(snapshot), [snapshot])

  function update(id: string, quantity: number) {
    if (!Number.isSafeInteger(quantity) || quantity > maxQuantity) return
    const lines = readLines(getSnapshot()).flatMap((line) => {
      if (line.id !== id) return [line]
      return quantity > 0 ? [{ ...line, quantity }] : []
    })
    writeLines(lines)
  }

  function addLine(line: CartLine, label: string) {
    const current = readLines(getSnapshot())
    const existing = current.find((item) => item.id === line.id)
    if (existing && existing.quantity + line.quantity > maxQuantity) {
      toast.info("This pack has reached its bag limit.")
      return false
    }
    if (existing) update(existing.id, existing.quantity + line.quantity)
    else writeLines([...current, line])
    toast.success(`${label} added to your bag`)
    return true
  }

  function add(product: Product, quantity = 1) {
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > maxQuantity) return
    addLine(createLine("solo", { [product.slug]: 1 }, quantity, ""), product.name)
  }

  function addPack(pack: Pack, selection: Selection, message = "") {
    const definition = getPack(pack)
    if (!definition || !packIsComplete(pack, countCans(selection))) return false
    return addLine(createLine(pack, selection, 1, message), definition.name)
  }

  const count = items.reduce((sum, line) => sum + countCans(line.selection) * line.quantity, 0)
  const subtotal = items.reduce((sum, line) => sum + linePrice(line), 0)
  const rewards = orderRewards(items, subtotal)

  return (
    <CartContext.Provider value={{ items, count, subtotal, rewards, add, addPack, update, clear: () => writeLines([]) }}>
      {children}
    </CartContext.Provider>
  )
}

export function useVaultCart() {
  const cart = useContext(CartContext)
  if (!cart) throw new Error("useVaultCart requires CartProvider")
  return cart
}
