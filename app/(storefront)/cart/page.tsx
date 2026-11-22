import type { Metadata } from "next"
import { BagPage } from "@/components/vault/shopping"

export const metadata: Metadata = { title: "Your Bag" }

export default function CartPage() {
  return <BagPage />
}
