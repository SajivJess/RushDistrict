import type { Metadata } from "next"
import { cookies } from "next/headers"
import { Checkout } from "@/components/vault/checkout"
import { accountCookie, customerProfile } from "@/lib/account-store.mjs"
import { whatsappNumber } from "@/lib/vault-config"

export const metadata: Metadata = { title: "Checkout", robots: { index: false } }

export default async function CheckoutPage() {
  const jar = await cookies()
  const customer = customerProfile(jar.get(accountCookie)?.value)
  return <Checkout whatsappNumber={whatsappNumber} profile={customer?.profile ?? null} />
}
