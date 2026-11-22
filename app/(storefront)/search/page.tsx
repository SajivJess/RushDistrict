import type { Metadata } from "next"
import { Catalogue } from "@/components/vault/catalogue"

export const metadata: Metadata = { title: "Search" }

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const { q } = await searchParams
  const query = typeof q === "string" ? q.slice(0, 120) : ""
  return (
    <section className="container content-page">
      <h1 className="display page-title">SEARCH THE VAULT</h1>
      <p className="page-intro">Find one of the four launch flavours.</p>
      <Catalogue key={query} initialQuery={query} />
    </section>
  )
}
