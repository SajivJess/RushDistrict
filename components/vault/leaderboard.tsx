"use client"

import Link from "next/link"
import { ChevronDown, Trophy } from "lucide-react"
import { useState } from "react"
import { getLocality, getProduct, localities, products, type Flavour, type Locality } from "@/data/catalogue"
import { useDemoLeaderboard } from "@/lib/demo-leaderboard"

export function HeroLeaderboard() {
  const top = useDemoLeaderboard("all", "all").slice(0, 3)

  return (
    <section className="hero-leaderboard" aria-labelledby="top-buyers-title">
      <div className="hero-leaderboard-head">
        <h2 id="top-buyers-title"><Trophy size={17} aria-hidden="true" /> Top 3 buyers</h2>
        <Link href="/leaderboard" className="text-link">Full leaderboard</Link>
      </div>
      {top.length ? (
        <ol className="top-buyers-list" aria-label="Top buyers by cans ordered">
          {top.map((entry) => (
            <li key={JSON.stringify([entry.alias, entry.locality])}>
              <span className="top-buyers-rank">{entry.rank}</span>
              <strong>{entry.alias}</strong>
              <span className="top-buyers-count">{entry.cans} {entry.cans === 1 ? "can" : "cans"}</span>
            </li>
          ))}
        </ol>
      ) : <p className="top-buyers-empty">No ranked orders yet.</p>}
    </section>
  )
}

export function Leaderboard() {
  const [locality, setLocality] = useState<Locality | "all">("all")
  const [flavour, setFlavour] = useState<Flavour | "all">("all")
  const rankings = useDemoLeaderboard(locality, flavour)

  return (
    <section className="ranking-panel" aria-label="Collector rankings">
      <div className="ranking-header">
        <div className="ranking-location"><Trophy size={19} /> Ranked by cans ordered</div>
        <div className="ranking-controls">
          <label className="ranking-filter">Locality
            <span className="select-field">
              <select value={locality} onChange={(event) => setLocality(getLocality(event.target.value) ?? "all")}>
                <option value="all">All localities</option>
                {localities.map((area) => <option key={area}>{area}</option>)}
              </select>
              <ChevronDown size={16} />
            </span>
          </label>
          <label className="ranking-filter">Flavour
            <span className="select-field">
              <select value={flavour} onChange={(event) => setFlavour(getProduct(event.target.value)?.slug ?? "all")}>
                <option value="all">All flavours</option>
                {products.map((product) => <option key={product.slug} value={product.slug}>{product.name}</option>)}
              </select>
              <ChevronDown size={16} />
            </span>
          </label>
        </div>
      </div>
      <p className="ranking-note">Demo rankings use opt-in orders from this browser. Only aliases, localities and can totals appear here.</p>
      <div aria-live="polite">
        {rankings.length ? (
          <table className="ranking-table">
            <caption className="sr-only">Ranked by cans ordered</caption>
            <thead><tr><th scope="col">Rank</th><th scope="col">Collector</th><th scope="col">Locality</th><th scope="col">Cans</th></tr></thead>
            <tbody>{rankings.map((entry) => (
              <tr key={JSON.stringify([entry.alias, entry.locality])}>
                <td>{entry.rank === 1 && <Trophy size={16} aria-hidden="true" />}{entry.rank}</td>
                <th scope="row">{entry.alias}</th><td>{entry.locality}</td><td>{entry.cans}</td>
              </tr>
            ))}</tbody>
          </table>
        ) : (
          <div className="empty-state ranking-empty">
            <Trophy aria-hidden="true" />
            <h2>No ranked orders yet</h2>
            <p>Choose a locality and enter an alias at demo checkout to appear on the leaderboard.</p>
            <Link href="/products" className="button secondary">Explore the launch flavours</Link>
          </div>
        )}
      </div>
    </section>
  )
}
