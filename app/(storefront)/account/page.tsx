import type { Metadata } from "next"
import { cookies } from "next/headers"
import { Account } from "@/components/vault/account"
import { accountProviders } from "@/lib/account-http"
import { accountCookie, customerProfile } from "@/lib/account-store.mjs"

export const metadata: Metadata = { title: "Account", robots: { index: false } }
export const runtime = "nodejs"

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ error?: string | string[] }> }) {
  const [jar, query] = await Promise.all([cookies(), searchParams])
  const customer = customerProfile(jar.get(accountCookie)?.value)
  return <Account
    initial={{ profile: customer?.profile ?? null, complete: customer?.complete ?? false }}
    providers={accountProviders()}
    googleError={typeof query.error === "string" ? query.error : ""}
  />
}
